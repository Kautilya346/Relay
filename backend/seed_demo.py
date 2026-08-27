import asyncio
import logging
from app.models.domain import ComplaintModel, ComplaintStatus
from app.repositories.db_repository import db
from app.services.complaint_processor import process_new_complaint
from app.services.complaint_composer import compose_evidence_based_complaint
from app.services.followup_service import prepare_followup_preview, approve_and_send_followup
from app.agents.intent_router import fallback_classify_intent
from app.api.authority import simulate_sla_breach, submit_resolution, acknowledge_incident
from app.schemas.api_schemas import AuthorityActionRequest, AuthorityResolutionRequest

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jansahayak.seed_demo")


async def run_demo_scenario():
    logger.info("=== STARTING JANSAHAYAK END-TO-END DEMO SCENARIO ===")

    # Clear existing state
    db.complaints.clear()
    db.incidents.clear()
    db.escalations.clear()
    db.audit_events.clear()
    db.external_cases.clear()
    db.authorizations.clear()

    # Step 1: Citizen reports a major civic garbage accumulation
    c1 = ComplaintModel(
        id="cmp_demo_01",
        userId="citizen_arun",
        description="Severe overflowing municipal garbage dump near Raja Park market entrance blocking road and causing health hazard.",
        category="Sanitation & Garbage",
        latitude=26.8924,
        longitude=75.8273,
        imageUrls=["https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600"]
    )
    _, inc = await process_new_complaint(c1)
    ext_case = db.get_external_case_by_incident(inc.id)
    logger.info(f"[Step 1] Citizen report filed -> Incident {inc.id} created | External Case: {ext_case.externalComplaintId if ext_case else 'N/A'}")

    # Step 2: 50+ corroborating reports cluster into INC-1001
    for bulk_idx in range(2, 45):
        c = ComplaintModel(
            id=f"cmp_demo_{bulk_idx:02d}",
            userId=f"citizen_neighbor_{bulk_idx}",
            description=f"Raja park garbage accumulation report #{bulk_idx}. Stray animals and severe stench.",
            category="Sanitation & Garbage",
            latitude=26.8924 + (bulk_idx * 0.00003),
            longitude=75.8273 + (bulk_idx * 0.00003),
            imageUrls=["https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600"] if bulk_idx % 5 == 0 else []
        )
        _, inc = await process_new_complaint(c)

    logger.info(f"[Step 2] Community clustering: 44 citizen reports aggregated into {inc.id} | Impact Score: {inc.impactScore:.1f} | Priority: {inc.priority}")

    # Step 3: Evidence-Based Complaint Composer synthesizes strict factual complaint
    composed_complaint = compose_evidence_based_complaint(inc, "near Raja Park Market Junction, Jaipur")
    logger.info(f"[Step 3] Composed Evidence-Backed Grievance Text:\n---\n{composed_complaint}\n---")

    # Step 4: Authority acknowledges incident
    await acknowledge_incident(inc.id, AuthorityActionRequest(
        authorityId=inc.authorityId,
        notes="Ward Sanitary Inspector notified for heavy dump clearing."
    ))
    logger.info(f"[Step 4] Authority '{inc.authorityId}' acknowledged case.")

    # Step 5: SLA expires / breach occurs
    await simulate_sla_breach(inc.id)
    inc = db.get_incident(inc.id)
    logger.info(f"[Step 5] SLA Breached! Incident escalated to '{inc.authorityId}' (Level {inc.escalationLevel})")

    # Step 6: Follow-up Agent prepares factual escalation & requests human approval
    preview = prepare_followup_preview(inc.id, "citizen_arun")
    auth_id = preview["authorizationId"]
    logger.info(f"[Step 6] Follow-up Agent prepared escalation preview | Auth ID: {auth_id} | Payload Hash: {preview['payloadHash'][:12]}...")

    # Step 7: Citizen approves sending follow-up
    followup_res = approve_and_send_followup(inc.id, auth_id, "citizen_arun")
    logger.info(f"[Step 7] Citizen approved follow-up -> Dispatched via adapter: {followup_res['authorityMessage']}")

    # Step 8: Natural language user intent check
    intent_res = fallback_classify_intent("What happened to my complaint INC-1001?")
    logger.info(f"[Step 8] Intent Router: Query 'What happened to my complaint INC-1001?' -> Intent: {intent_res.intent} ({intent_res.confidence})")

    # Step 9: Authority uploads resolution proof and AI verifies
    await submit_resolution(inc.id, AuthorityResolutionRequest(
        authorityId=inc.authorityId,
        resolutionNotes="Commercial waste removed by compactors; area disinfected and sealed with lime powder.",
        evidenceUrls=["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600"]
    ))

    inc = db.get_incident(inc.id)
    logger.info(f"[Step 9] Resolution proof verified by AI Verifier -> Final Status: '{inc.status}'")

    # Step 10: Print Audit Trail Summary
    timeline = db.get_timeline_for_incident(inc.id)
    logger.info(f"=== DEMO SCENARIO FINISHED: {len(timeline)} AUDIT EVENTS LOGGED ===")
    for evt in timeline[-6:]:
        logger.info(f"  [{evt.timestamp[11:19]}] {evt.eventType:26} | Actor: {evt.actorType.value:10} | {evt.decision}")


if __name__ == "__main__":
    asyncio.run(run_demo_scenario())
