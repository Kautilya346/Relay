from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
import hashlib
import uuid
from app.repositories.db_repository import db
from app.models.domain import AuthorizationModel, AuditEventModel, ActorType
from app.adapters import registry
from app.services.complaint_composer import calculate_persistence_days


def generate_payload_hash(incident_id: str, action: str, text: str) -> str:
    content = f"{incident_id}:{action}:{text}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def prepare_followup_preview(incident_id: str, user_id: str = "citizen_user") -> Dict[str, Any]:
    incident = db.get_incident(incident_id)
    if not incident:
        raise ValueError(f"Incident {incident_id} not found.")

    external_case = db.get_external_case_by_incident(incident_id)
    ext_id = external_case.externalComplaintId if external_case else f"EXT-{incident_id}"
    persistence_days = calculate_persistence_days(incident.firstReportedAt, incident.lastReportedAt)

    # Structured follow-up text requesting actionable status
    followup_text = (
        f"URGENT FOLLOW-UP: Regarding JanSahayak Incident {incident.id} (Official Case Ref: {ext_id}) "
        f"for {incident.category.replace('_', ' ').title()} near coordinates "
        f"({incident.centerLocation.latitude:.4f}, {incident.centerLocation.longitude:.4f}).\n"
        f"Impact Score is currently {incident.impactScore:.1f}/100 with {incident.uniqueCitizenCount} distinct reporters "
        f"active over {persistence_days} days. Configured SLA status: {incident.sla.status if incident.sla else 'BREACHED'}.\n"
        f"Please provide:\n"
        f"1. Current action status\n"
        f"2. Responsible field office/team\n"
        f"3. Expected resolution completion date\n"
        f"4. Any additional citizen verification required"
    )

    action = "SEND_FOLLOWUP"
    payload_hash = generate_payload_hash(incident_id, action, followup_text)
    auth_id = f"AUTH-{uuid.uuid4().hex[:8].upper()}"
    expiry_time = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    auth_record = AuthorizationModel(
        authorizationId=auth_id,
        userId=user_id,
        incidentId=incident_id,
        action=action,
        payloadHash=payload_hash,
        payloadSummary=followup_text,
        createdAt=datetime.now(timezone.utc).isoformat(),
        expiresAt=expiry_time,
        status="PENDING",
    )
    db.save_authorization(auth_record)

    # Log audit event
    db.log_audit_event(
        AuditEventModel(
            id=f"evt_{uuid.uuid4().hex[:10]}",
            eventType="FollowupApprovalRequested",
            entityId=incident_id,
            actorType=ActorType.AGENT,
            actorId="followup_agent",
            decision=f"Prepared structured follow-up preview for authority {incident.authorityId}.",
            reasonCodes=["SLA_BREACH_DETECTED", "HUMAN_APPROVAL_REQUIRED"],
            metadata={
                "authorizationId": auth_id,
                "payloadHash": payload_hash,
                "externalCaseId": ext_id,
            },
        )
    )

    return {
        "authorizationId": auth_id,
        "incidentId": incident_id,
        "externalCaseId": ext_id,
        "targetAuthority": incident.authorityId,
        "followupText": followup_text,
        "payloadHash": payload_hash,
        "expiresAt": expiry_time,
        "status": "PENDING_APPROVAL",
    }


def approve_and_send_followup(
    incident_id: str,
    authorization_id: str,
    user_id: str,
    override_text: Optional[str] = None,
) -> Dict[str, Any]:
    incident = db.get_incident(incident_id)
    if not incident:
        raise ValueError(f"Incident {incident_id} not found.")

    auth_record = db.get_authorization(authorization_id)
    if not auth_record:
        raise ValueError(f"Authorization {authorization_id} not found.")

    if auth_record.status != "PENDING":
        raise ValueError(f"Authorization {authorization_id} has already been {auth_record.status}.")

    # Expiry verification
    now_iso = datetime.now(timezone.utc).isoformat()
    if now_iso > auth_record.expiresAt:
        auth_record.status = "EXPIRED"
        db.save_authorization(auth_record)
        raise ValueError("Authorization has expired.")

    # Mark approved
    auth_record.status = "APPROVED"
    db.save_authorization(auth_record)

    external_case = db.get_external_case_by_incident(incident_id)
    ext_id = external_case.externalComplaintId if external_case else f"EXT-{incident_id}"
    message_to_send = override_text or auth_record.payloadSummary

    # Dispatch to verified adapter (portal-based submission)
    adapter = registry.get_verified_or_fallback(incident.authorityId)
    adapter_result = adapter.send_followup(ext_id, message_to_send)

    # Always also dispatch the follow-up via the live email adapter so it reaches
    # the configured TARGET_GRIEVANCE_EMAIL regardless of which portal adapter is used.
    from app.adapters import registry as _reg
    email_adapter = _reg.get("VERIFIED_EMAIL_FALLBACK")
    email_result = None
    if email_adapter and adapter.authority_id != "VERIFIED_EMAIL_FALLBACK":
        email_result = email_adapter.send_followup(ext_id, message_to_send)
        # If the primary adapter failed but email succeeded, promote email result
        if not adapter_result.success and email_result and email_result.success:
            adapter_result = email_result



    # Update incident and external case
    if external_case:
        external_case.status = "IN_PROGRESS"
        external_case.lastCheckedAt = datetime.now(timezone.utc).isoformat()
        external_case.lastResponse = adapter_result.message
        external_case.actionHistory.append({
            "action": "FOLLOWUP_DISPATCHED",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "authorizationId": authorization_id,
            "response": adapter_result.raw_response,
        })
        db.save_external_case(external_case)

    # Log audit events
    db.log_audit_event(
        AuditEventModel(
            id=f"evt_{uuid.uuid4().hex[:10]}",
            eventType="FollowupApproved",
            entityId=incident_id,
            actorType=ActorType.CITIZEN,
            actorId=user_id,
            decision=f"Citizen approved dispatch of follow-up for incident {incident_id}.",
            reasonCodes=["CITIZEN_AUTHORIZED"],
            metadata={"authorizationId": authorization_id, "adapter": adapter.name},
        )
    )

    db.log_audit_event(
        AuditEventModel(
            id=f"evt_{uuid.uuid4().hex[:10]}",
            eventType="AuthorityResponseReceived",
            entityId=incident_id,
            actorType=ActorType.AUTHORITY,
            actorId=incident.authorityId,
            decision=adapter_result.message,
            reasonCodes=["ADAPTER_RESPONSE_PARSED"],
            metadata={"externalCaseId": ext_id, "rawResponse": adapter_result.raw_response},
        )
    )

    return {
        "success": adapter_result.success,
        "incidentId": incident_id,
        "externalCaseId": ext_id,
        "authorizationId": authorization_id,
        "status": "FOLLOWUP_SENT",
        "authorityMessage": adapter_result.message,
        "rawResponse": adapter_result.raw_response,
    }
