import logging
from typing import Dict, Any, Optional
from app.models.domain import IncidentModel, ComplaintModel
from app.adapters.email import VerifiedInstitutionalEmailAdapter
from app.agents.portal_discovery import discover_authority_portal
from app.services.browser_session import start_shared_browser_session
from app.services.complaint_composer import compose_evidence_based_complaint

logger = logging.getLogger("jansahayak.service.dispatch_orchestrator")


class IntelligentDispatchOrchestrator:
    """
    Intelligent Multi-Tier Dispatch Orchestrator:
    1. Primary Method: Institutional Email Dispatch to official department email (.gov.in / municipal).
    2. Secondary Method: Google Search Grounding for live API/Portal discovery.
    3. Tertiary Method: Playwright Shared Browser Session for interactive web portal filling.
    """

    def __init__(self):
        self.email_adapter = VerifiedInstitutionalEmailAdapter()

    async def execute_multi_tier_dispatch(
        self,
        incident: IncidentModel,
        complaint: ComplaintModel,
        recipient_email: Optional[str] = None,
    ) -> Dict[str, Any]:
        results = {
            "incidentId": incident.id,
            "primaryEmailDispatch": None,
            "apiPortalDiscovery": None,
            "browserSession": None,
            "overallStatus": "DISPATCHED",
        }

        # 1. Primary Method: Institutional Email Dispatch
        target_email = recipient_email or f"grievance.{incident.authorityId.lower()}@municipal.gov.in"
        loc_label = getattr(incident, 'ward', None) or f"Ward Area near ({incident.centerLocation.latitude:.3f}, {incident.centerLocation.longitude:.3f})"
        composed_notice = compose_evidence_based_complaint(incident, loc_label)
        
        email_payload = {
            "incidentId": incident.id,
            "recipient_email": target_email,
            "title": incident.title,
            "category": incident.category,
            "description": composed_notice,
            "location": loc_label,
            "citizen_count": incident.uniqueCitizenCount,
        }

        email_res = self.email_adapter.submit(email_payload)
        results["primaryEmailDispatch"] = {
            "success": email_res.success,
            "externalCaseId": email_res.external_case_id,
            "message": email_res.message,
            "details": email_res.raw_response,
        }
        logger.info(f"[Primary Dispatch - Email] {email_res.message}")

        # 2. Secondary Method: Google Search Grounding for API / Portal Discovery
        try:
            discovery_res = await discover_authority_portal(
                location_query=loc_label,
                category=incident.category,
            )

            results["apiPortalDiscovery"] = {
                "authorityName": discovery_res.authorityName,
                "portalUrl": discovery_res.portalUrl,
                "isVerifiedGovDomain": discovery_res.isVerifiedGovDomain,
                "suggestedChannel": discovery_res.suggestedChannel,
                "summary": discovery_res.summary,
            }
            logger.info(f"[Secondary Dispatch - Portal Discovery] Discovered portal: {discovery_res.portalUrl}")

            # 3. Tertiary Method: Playwright Shared Browser Automation if Portal is found
            if discovery_res.portalUrl and discovery_res.suggestedChannel in ["BROWSER", "HANDOFF"]:
                try:
                    session = await start_shared_browser_session(
                        incident_id=incident.id,
                        authority_id=incident.authorityId,
                        portal_url=discovery_res.portalUrl,
                    )
                    results["browserSession"] = {
                        "sessionId": session.id,
                        "currentStep": session.current_step,
                        "human_state": session.human_state,
                        "portal_url": session.portal_url,
                    }
                    logger.info(f"[Tertiary Dispatch - Browser Automation] Initialized session {session.id} for {discovery_res.portalUrl}")
                except Exception as b_err:
                    logger.info(f"[Tertiary Dispatch] Browser session note: {b_err}")
        except Exception as e:
            logger.warning(f"Secondary/Tertiary discovery failed: {e}")

        return results



dispatch_orchestrator = IntelligentDispatchOrchestrator()
