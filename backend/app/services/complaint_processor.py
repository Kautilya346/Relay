import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple
from app.models.domain import (
    ComplaintModel,
    IncidentModel,
    LocationModel,
    EscalationModel,
    AuditEventModel,
    ComplaintStatus,
    IncidentStatus,
    ActorType,
    current_iso_timestamp
)
from app.repositories.db_repository import db
from app.services.geo_service import encode_geohash, get_geohash_prefixes
from app.services.impact_engine import calculate_impact_score, determine_priority
from app.services.policy_engine import evaluate_escalation_policy, AUTHORITY_HIERARCHY, get_department_for_category
from app.services.sla_service import calculate_initial_sla
from app.agents.classifier import classify_complaint
from app.agents.matcher import verify_incident_match
from app.events.event_bus import event_bus, StandardEvent

logger = logging.getLogger("jansahayak.service.processor")


async def process_new_complaint(complaint: ComplaintModel) -> Tuple[ComplaintModel, IncidentModel]:
    """Autonomous pipeline for complaint ingestion, classification, matching, impact recalculation, and policy evaluation."""
    logger.info(f"Processing complaint {complaint.id} for user {complaint.userId}")

    # 1. AI Classification + Severity Assessment
    classification = await classify_complaint(
        description=complaint.description,
        category_override=complaint.category,
        image_urls=complaint.imageUrls
    )

    complaint.category = classification.category
    complaint.severity = classification.severity
    complaint.safetyRisk = classification.safety_risk
    complaint.status = ComplaintStatus.CLASSIFIED

    # 2. Location Normalization & Geohash
    geohash = encode_geohash(complaint.latitude, complaint.longitude, precision=7)
    complaint.geohash = geohash
    db.save_complaint(complaint)

    # Log Audit Event for classification
    db.log_audit_event(AuditEventModel(
        id=f"audit_{uuid.uuid4().hex[:10]}",
        eventType="ComplaintClassified",
        entityId=complaint.id,
        actorType=ActorType.AGENT,
        actorId="classifier_agent",
        decision=f"Category: {complaint.category}, Severity: {complaint.severity}, SafetyRisk: {complaint.safetyRisk}",
        reasonCodes=["AI_CLASSIFICATION_SUCCESS"]
    ))

    # 3. Geographic Candidate Search (nearby incidents within 300 meters)
    nearby_incidents = db.find_nearby_incidents(
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        max_radius_meters=300.0
    )

    # 4. Semantic Similarity & Match Verification
    match_result = await verify_incident_match(complaint, nearby_incidents)

    policy = db.get_policy_config()
    target_incident: Optional[IncidentModel] = None

    if match_result.is_match and match_result.matched_incident_id:
        # ATTACH TO EXISTING INCIDENT
        target_incident = db.get_incident(match_result.matched_incident_id)
        if target_incident:
            logger.info(f"Attaching complaint {complaint.id} to existing incident {target_incident.id}")
            complaint.incidentId = target_incident.id
            complaint.status = ComplaintStatus.MATCHED
            db.save_complaint(complaint)

            # Update Incident Metrics
            if complaint.id not in target_incident.complaintIds:
                target_incident.complaintIds.append(complaint.id)
                target_incident.reportCount += 1

            if complaint.userId not in target_incident.reporterIds:
                target_incident.reporterIds.append(complaint.userId)
                target_incident.uniqueCitizenCount += 1

            if complaint.imageUrls:
                target_incident.verifiedEvidenceCount += len(complaint.imageUrls)

            target_incident.severity = max(target_incident.severity, float(complaint.severity))
            target_incident.safetyRisk = max(target_incident.safetyRisk, float(complaint.safetyRisk))
            target_incident.lastReportedAt = current_iso_timestamp()

            db.log_audit_event(AuditEventModel(
                id=f"audit_{uuid.uuid4().hex[:10]}",
                eventType="ComplaintMatchedToIncident",
                entityId=target_incident.id,
                correlationId=complaint.id,
                actorType=ActorType.AGENT,
                actorId="matcher_agent",
                decision=f"Matched to {target_incident.id} with confidence {match_result.confidence}",
                reasonCodes=["SEMANTIC_MATCH_VERIFIED"],
                metadata={"reasoning": match_result.reasoning}
            ))

    if not target_incident:
        # CREATE NEW INCIDENT
        incident_id = f"INC-10{len(db.list_all_incidents()) + 1:02d}"
        logger.info(f"Creating new incident {incident_id} for complaint {complaint.id}")


        initial_sla = calculate_initial_sla(complaint.severity, complaint.safetyRisk)

        target_incident = IncidentModel(
            id=incident_id,
            category=complaint.category,
            title=classification.title,
            summary=classification.summary,
            centerLocation=LocationModel(latitude=complaint.latitude, longitude=complaint.longitude),
            geohashPrefixes=get_geohash_prefixes(geohash, length=5),
            firstReportedAt=current_iso_timestamp(),
            lastReportedAt=current_iso_timestamp(),
            reportCount=1,
            uniqueCitizenCount=1,
            verifiedEvidenceCount=len(complaint.imageUrls),
            severity=float(complaint.severity),
            safetyRisk=float(complaint.safetyRisk),
            authorityId=AUTHORITY_HIERARCHY[0],
            escalationLevel=0,
            sla=initial_sla,
            status=IncidentStatus.OPEN,
            complaintIds=[complaint.id],
            reporterIds=[complaint.userId]
        )

        complaint.incidentId = target_incident.id
        complaint.status = ComplaintStatus.MATCHED
        db.save_complaint(complaint)
        db.save_incident(target_incident)

        dept_name = get_department_for_category(target_incident.category)
        db.log_audit_event(AuditEventModel(
            id=f"audit_{uuid.uuid4().hex[:10]}",
            eventType="NewIncidentCreated",
            entityId=target_incident.id,
            correlationId=complaint.id,
            actorType=ActorType.SYSTEM,
            actorId="processor",
            decision=f"Created incident {target_incident.id} ({target_incident.title}). Routed to {dept_name} ({target_incident.authorityId}).",
            reasonCodes=["NO_MATCHING_CANDIDATE"],
            metadata={"department": dept_name, "authorityId": target_incident.authorityId}
        ))

        # Official Submission to Verified Authority Adapter / Sandbox
        try:
            from app.adapters import registry
            from app.models.domain import ExternalCaseModel
            adapter = registry.get_verified_or_fallback(target_incident.authorityId)
            adapter_res = adapter.submit({
                "incidentId": target_incident.id,
                "category": target_incident.category,
                "description": target_incident.summary or target_incident.title,
                "latitude": target_incident.centerLocation.latitude,
                "longitude": target_incident.centerLocation.longitude,
            })

            ext_case = ExternalCaseModel(
                id=f"ext_{uuid.uuid4().hex[:8]}",
                incidentId=target_incident.id,
                authorityId=target_incident.authorityId,
                externalComplaintId=adapter_res.external_case_id or f"EXT-{target_incident.id}",
                channel="API" if not adapter_res.handoff_required else "PORTAL_HANDOFF",
                status=adapter_res.status,
                adapterVersion="1.0",
                lastResponse=adapter_res.message,
                externalUrl=adapter_res.handoff_url,
            )
            db.save_external_case(ext_case)

            db.log_audit_event(AuditEventModel(
                id=f"audit_{uuid.uuid4().hex[:10]}",
                eventType="ExternalComplaintSubmitted",
                entityId=target_incident.id,
                correlationId=ext_case.id,
                actorType=ActorType.AGENT,
                actorId="filing_agent",
                decision=f"Official case reference {ext_case.externalComplaintId} registered via {adapter.name}.",
                reasonCodes=["ADAPTER_SUBMISSION_SUCCESS"],
                metadata={
                    "externalComplaintId": ext_case.externalComplaintId,
                    "channel": ext_case.channel,
                    "portal": adapter.official_domain,
                }
            ))
        except Exception as e:
            logger.warning(f"Adapter dispatch skipped: {e}")

    # 5. Recalculate Aggregate Impact Score
    old_impact = target_incident.impactScore
    target_incident.impactScore = calculate_impact_score(target_incident, policy)
    target_incident.priority = determine_priority(target_incident.impactScore, policy)
    target_incident.updatedAt = current_iso_timestamp()

    if old_impact != target_incident.impactScore:
        db.log_audit_event(AuditEventModel(
            id=f"audit_{uuid.uuid4().hex[:10]}",
            eventType="ImpactScoreChanged",
            entityId=target_incident.id,
            actorType=ActorType.SYSTEM,
            actorId="impact_engine",
            decision=f"Impact score updated from {old_impact} to {target_incident.impactScore}",
            reasonCodes=["METRICS_RECALCULATED"]
        ))

    # 6. Evaluate Escalation Policy
    policy_eval = evaluate_escalation_policy(target_incident, policy)
    target_incident.priority = policy_eval.new_priority

    if policy_eval.should_escalate and policy_eval.target_authority_id != target_incident.authorityId:
        from_auth = target_incident.authorityId
        to_auth = policy_eval.target_authority_id

        target_incident.authorityId = to_auth
        target_incident.escalationLevel = policy_eval.new_level

        escalation_record = EscalationModel(
            id=f"esc_{uuid.uuid4().hex[:10]}",
            incidentId=target_incident.id,
            fromAuthorityId=from_auth,
            toAuthorityId=to_auth,
            trigger=policy_eval.trigger,
            reasonCodes=policy_eval.reason_codes,
            impactScore=target_incident.impactScore
        )
        db.save_escalation(escalation_record)

        db.log_audit_event(AuditEventModel(
            id=f"audit_{uuid.uuid4().hex[:10]}",
            eventType="EscalationTriggered",
            entityId=target_incident.id,
            actorType=ActorType.AGENT,
            actorId="policy_engine",
            decision=f"Escalated from {from_auth} to {to_auth} (Level {target_incident.escalationLevel})",
            reasonCodes=policy_eval.reason_codes,
            metadata={"trigger": policy_eval.trigger, "escalationId": escalation_record.id}
        ))

        # Publish Event
        await event_bus.publish(StandardEvent(
            eventType="EscalationTriggered",
            entityId=target_incident.id,
            payload={
                "incidentId": target_incident.id,
                "fromAuthorityId": from_auth,
                "toAuthorityId": to_auth,
                "impactScore": target_incident.impactScore,
                "reasonCodes": policy_eval.reason_codes
            }
        ))

    db.save_incident(target_incident)

    # Publish IncidentUpdated event
    await event_bus.publish(StandardEvent(
        eventType="IncidentUpdated",
        entityId=target_incident.id,
        payload={
            "incidentId": target_incident.id,
            "impactScore": target_incident.impactScore,
            "reportCount": target_incident.reportCount,
            "uniqueCitizenCount": target_incident.uniqueCitizenCount,
            "priority": target_incident.priority
        }
    ))

    return complaint, target_incident
