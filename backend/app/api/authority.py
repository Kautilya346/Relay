import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.domain import (
    IncidentModel,
    IncidentStatus,
    AuditEventModel,
    EscalationModel,
    ActorType,
    current_iso_timestamp
)
from app.schemas.api_schemas import (
    IncidentListResponse,
    IncidentResponse,
    AuthorityActionRequest,
    AuthorityAssignRequest,
    AuthorityProgressRequest,
    AuthorityResolutionRequest
)
from app.repositories.db_repository import db
from app.services.policy_engine import evaluate_escalation_policy, get_next_authority
from app.agents.resolution_verifier import verify_resolution_evidence
from app.events.event_bus import event_bus, StandardEvent

router = APIRouter(prefix="/api/v1/authority", tags=["Authority Workflow"])


@router.get("/incidents", response_model=IncidentListResponse)
async def get_authority_incident_queue(
    authorityId: Optional[str] = Query(None, description="Filter by authority ID")
):
    incidents = db.list_active_incidents()
    if authorityId:
        incidents = [inc for inc in incidents if inc.authorityId == authorityId]

    # Sort queue by impact score descending
    incidents.sort(key=lambda x: x.impactScore, reverse=True)
    return IncidentListResponse(success=True, count=len(incidents), incidents=incidents)


@router.post("/incidents/{incident_id}/acknowledge", response_model=IncidentResponse)
async def acknowledge_incident(incident_id: str, request: AuthorityActionRequest):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = IncidentStatus.IN_PROGRESS
    incident.updatedAt = current_iso_timestamp()
    db.save_incident(incident)

    db.log_audit_event(AuditEventModel(
        id=f"audit_{uuid.uuid4().hex[:10]}",
        eventType="AuthorityAcknowledged",
        entityId=incident.id,
        actorType=ActorType.AUTHORITY,
        actorId=request.authorityId,
        decision=f"Incident acknowledged by {request.authorityId}",
        reasonCodes=["AUTHORITY_ACKNOWLEDGED"],
        metadata={"notes": request.notes or ""}
    ))

    await event_bus.publish(StandardEvent(
        eventType="AuthorityAcknowledged",
        entityId=incident.id,
        payload={"incidentId": incident.id, "authorityId": request.authorityId}
    ))

    return IncidentResponse(success=True, incident=incident)


@router.post("/incidents/{incident_id}/assign", response_model=IncidentResponse)
async def assign_incident(incident_id: str, request: AuthorityAssignRequest):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.updatedAt = current_iso_timestamp()
    db.save_incident(incident)

    db.log_audit_event(AuditEventModel(
        id=f"audit_{uuid.uuid4().hex[:10]}",
        eventType="WorkAssigned",
        entityId=incident.id,
        actorType=ActorType.AUTHORITY,
        actorId=request.authorityId,
        decision=f"Assigned to {request.assignedTo}",
        reasonCodes=["WORK_ASSIGNED"],
        metadata={"assignedTo": request.assignedTo, "notes": request.notes or ""}
    ))

    return IncidentResponse(success=True, incident=incident)


@router.post("/incidents/{incident_id}/progress", response_model=IncidentResponse)
async def submit_progress(incident_id: str, request: AuthorityProgressRequest):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if request.status and request.status in [e.value for e in IncidentStatus]:
        incident.status = IncidentStatus(request.status)

    incident.updatedAt = current_iso_timestamp()
    db.save_incident(incident)

    db.log_audit_event(AuditEventModel(
        id=f"audit_{uuid.uuid4().hex[:10]}",
        eventType="ProgressUpdated",
        entityId=incident.id,
        actorType=ActorType.AUTHORITY,
        actorId=request.authorityId,
        decision=request.progressNotes,
        reasonCodes=["PROGRESS_UPDATE_SUBMITTED"]
    ))

    return IncidentResponse(success=True, incident=incident)


@router.post("/incidents/{incident_id}/resolution", response_model=IncidentResponse)
async def submit_resolution(incident_id: str, request: AuthorityResolutionRequest):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Add evidence URLs
    for url in request.evidenceUrls:
        if url not in incident.resolutionEvidenceUrls:
            incident.resolutionEvidenceUrls.append(url)

    # 1. AI Verification of submitted evidence
    verification = await verify_resolution_evidence(
        incident=incident,
        evidence_urls=request.evidenceUrls,
        resolution_notes=request.resolutionNotes
    )

    if verification.is_verified:
        incident.status = IncidentStatus.RESOLVED
        incident.updatedAt = current_iso_timestamp()

        db.log_audit_event(AuditEventModel(
            id=f"audit_{uuid.uuid4().hex[:10]}",
            eventType="ResolutionVerified",
            entityId=incident.id,
            actorType=ActorType.AGENT,
            actorId="resolution_verifier",
            decision=f"Resolution VERIFIED with confidence {verification.confidence}",
            reasonCodes=["AI_VERIFICATION_PASSED"],
            metadata={"reasoning": verification.reasoning, "notes": request.resolutionNotes}
        ))

        db.log_audit_event(AuditEventModel(
            id=f"audit_{uuid.uuid4().hex[:10]}",
            eventType="IncidentResolved",
            entityId=incident.id,
            actorType=ActorType.SYSTEM,
            actorId="system",
            decision=f"Incident {incident.id} RESOLVED successfully.",
            reasonCodes=["INCIDENT_CLOSED"]
        ))
    else:
        # Reopen & Trigger Escalation if evidence verification fails!
        incident.status = IncidentStatus.REOPENED
        old_auth = incident.authorityId
        new_auth, new_lvl = get_next_authority(incident.authorityId, incident.escalationLevel)
        incident.authorityId = new_auth
        incident.escalationLevel = new_lvl
        incident.updatedAt = current_iso_timestamp()

        db.log_audit_event(AuditEventModel(
            id=f"audit_{uuid.uuid4().hex[:10]}",
            eventType="ResolutionRejected",
            entityId=incident.id,
            actorType=ActorType.AGENT,
            actorId="resolution_verifier",
            decision=f"Resolution REJECTED (Confidence: {verification.confidence}). Reopening & Escalating.",
            reasonCodes=["RESOLUTION_REJECTED_BY_AI"],
            metadata={"reasoning": verification.reasoning}
        ))

    db.save_incident(incident)
    return IncidentResponse(success=True, incident=incident)


@router.post("/incidents/{incident_id}/simulate_sla_breach", response_model=IncidentResponse)
async def simulate_sla_breach(incident_id: str):
    """Simulates SLA breach for demo / test scenario to trigger autonomous escalation."""
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.sla:
        incident.sla.status = "BREACHED"

    policy = db.get_policy_config()
    policy_eval = evaluate_escalation_policy(incident, policy, force_sla_breach=True)

    if policy_eval.should_escalate and policy_eval.target_authority_id != incident.authorityId:
        from_auth = incident.authorityId
        to_auth = policy_eval.target_authority_id

        incident.authorityId = to_auth
        incident.escalationLevel = policy_eval.new_level

        escalation_record = EscalationModel(
            id=f"esc_{uuid.uuid4().hex[:10]}",
            incidentId=incident.id,
            fromAuthorityId=from_auth,
            toAuthorityId=to_auth,
            trigger="SLA_BREACH",
            reasonCodes=policy_eval.reason_codes,
            impactScore=incident.impactScore
        )
        db.save_escalation(escalation_record)

        db.log_audit_event(AuditEventModel(
            id=f"audit_{uuid.uuid4().hex[:10]}",
            eventType="SLABreached",
            entityId=incident.id,
            actorType=ActorType.SYSTEM,
            actorId="sla_taskmaster",
            decision=f"SLA breached for {incident.id}. Escalated from {from_auth} to {to_auth}",
            reasonCodes=["SLA_BREACH_TRIGGERED"],
            metadata={"escalationId": escalation_record.id}
        ))

    incident.updatedAt = current_iso_timestamp()
    db.save_incident(incident)
    return IncidentResponse(success=True, incident=incident)
