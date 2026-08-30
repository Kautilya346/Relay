import os
from typing import Dict, List, Optional
from app.models.domain import (
    ComplaintModel,
    IncidentModel,
    EscalationModel,
    AuditEventModel,
    EscalationPolicyConfig,
    AuthorityIntegrationModel,
    ExternalCaseModel,
    AuthorizationModel,
    BrowserSessionModel,
    ActorType,
    current_iso_timestamp,
)
from app.services.geo_service import calculate_haversine_distance


class DatabaseRepository:
    """In-memory operational repository representing Cloud Firestore operations."""

    def __init__(self):
        self.complaints: Dict[str, ComplaintModel] = {}
        self.incidents: Dict[str, IncidentModel] = {}
        self.escalations: Dict[str, EscalationModel] = {}
        self.audit_events: List[AuditEventModel] = []
        self.policy_config = EscalationPolicyConfig()
        self.external_cases: Dict[str, ExternalCaseModel] = {}
        self.authorizations: Dict[str, AuthorizationModel] = {}
        self.authority_integrations: Dict[str, AuthorityIntegrationModel] = {}
        self.browser_sessions: Dict[str, BrowserSessionModel] = {}
        self._init_default_authorities()

    def _init_default_authorities(self):
        defaults = [
            AuthorityIntegrationModel(
                authority_id="RAJ_SAMPARK",
                name="Rajasthan Sampark Grievance Portal",
                jurisdiction={"state": "Rajasthan", "levels": ["Ward", "District", "State"]},
                categories=["CIVIC", "ROAD_DAMAGE", "WATER_SEWAGE", "STREET_LIGHTING", "GENERAL"],
                official_domain="sampark.rajasthan.gov.in",
                integration_type="API",
                verification_status="VERIFIED",
                requires_user_auth=True,
                requires_submission_approval=True,
                contact_email="grievance.sampark@rajasthan.gov.in",
                portal_url="https://sampark.rajasthan.gov.in",
            ),
            AuthorityIntegrationModel(
                authority_id="SWACHHATA_MOHUA",
                name="Swachhata – MoHUA Civic Grievances",
                jurisdiction={"nationwide": True, "target": "Urban Local Bodies (ULBs)"},
                categories=["SOLID_WASTE", "SANITATION", "PUBLIC_HEALTH"],
                official_domain="swachhata.gov.in",
                integration_type="API",
                verification_status="VERIFIED",
                requires_user_auth=False,
                requires_submission_approval=True,
                contact_email="support@swachhbharaturban.gov.in",
                portal_url="https://swachhata.gov.in",
            ),
            AuthorityIntegrationModel(
                authority_id="CPGRAMS_CENTRAL",
                name="CPGRAMS Central Grievance Portal",
                jurisdiction={"nationwide": True, "target": "Central Ministries & States"},
                categories=["HIGHWAY", "CENTRAL_CIVIC", "PUBLIC_ADMIN"],
                official_domain="pgportal.gov.in",
                integration_type="BROWSER",
                verification_status="VERIFIED",
                requires_user_auth=True,
                requires_submission_approval=True,
                contact_email="cpgrams-support@gov.in",
                portal_url="https://pgportal.gov.in",
            ),
            AuthorityIntegrationModel(
                authority_id="SANDBOX_SIMULATOR",
                name="JanSahayak Authority Sandbox Simulator",
                jurisdiction={"scope": "End-to-End Simulation & Verification"},
                categories=["ALL"],
                official_domain="sandbox.jansahayak.internal",
                integration_type="API",
                verification_status="SANDBOX",
                requires_user_auth=False,
                requires_submission_approval=False,
                contact_email="sandbox@jansahayak.internal",
                portal_url="http://localhost:8000/api/v1/sandbox",
            ),
        ]
        for auth in defaults:
            self.authority_integrations[auth.authority_id] = auth

    # --- Complaint CRUD ---
    def save_complaint(self, complaint: ComplaintModel) -> ComplaintModel:
        self.complaints[complaint.id] = complaint
        return complaint

    def get_complaint(self, complaint_id: str) -> Optional[ComplaintModel]:
        return self.complaints.get(complaint_id)

    def list_complaints_by_incident(self, incident_id: str) -> List[ComplaintModel]:
        return [c for c in self.complaints.values() if c.incidentId == incident_id]

    def list_complaints_by_user(self, user_id: str) -> List[ComplaintModel]:
        return [c for c in self.complaints.values() if c.userId == user_id]

    # --- Incident CRUD ---
    def save_incident(self, incident: IncidentModel) -> IncidentModel:
        self.incidents[incident.id] = incident
        return incident

    def get_incident(self, incident_id: str) -> Optional[IncidentModel]:
        return self.incidents.get(incident_id)

    def list_all_incidents(self) -> List[IncidentModel]:
        return list(self.incidents.values())

    def list_active_incidents(self) -> List[IncidentModel]:
        return [inc for inc in self.incidents.values() if inc.status in ["OPEN", "IN_PROGRESS", "REOPENED"]]

    def find_nearby_incidents(
        self, latitude: float, longitude: float, max_radius_meters: float = 300.0
    ) -> List[IncidentModel]:
        results = []
        for inc in self.list_active_incidents():
            dist = calculate_haversine_distance(
                latitude, longitude, inc.centerLocation.latitude, inc.centerLocation.longitude
            )
            if dist <= max_radius_meters:
                results.append(inc)
        return results

    # --- Escalation CRUD ---
    def save_escalation(self, escalation: EscalationModel) -> EscalationModel:
        self.escalations[escalation.id] = escalation
        return escalation

    def get_escalations_for_incident(self, incident_id: str) -> List[EscalationModel]:
        return [e for e in self.escalations.values() if e.incidentId == incident_id]

    # --- External Case CRUD ---
    def save_external_case(self, external_case: ExternalCaseModel) -> ExternalCaseModel:
        self.external_cases[external_case.id] = external_case
        return external_case

    def get_external_case(self, external_case_id: str) -> Optional[ExternalCaseModel]:
        return self.external_cases.get(external_case_id)

    def get_external_case_by_incident(self, incident_id: str) -> Optional[ExternalCaseModel]:
        for case in self.external_cases.values():
            if case.incidentId == incident_id:
                return case
        return None

    def list_all_external_cases(self) -> List[ExternalCaseModel]:
        return list(self.external_cases.values())

    # --- Authorization CRUD ---
    def save_authorization(self, auth: AuthorizationModel) -> AuthorizationModel:
        self.authorizations[auth.authorizationId] = auth
        return auth

    def get_authorization(self, auth_id: str) -> Optional[AuthorizationModel]:
        return self.authorizations.get(auth_id)

    # --- Authority Integrations ---
    def list_authorities(self) -> List[AuthorityIntegrationModel]:
        return list(self.authority_integrations.values())

    def get_authority(self, authority_id: str) -> Optional[AuthorityIntegrationModel]:
        return self.authority_integrations.get(authority_id)

    # --- Browser Sessions ---
    def save_browser_session(self, session: BrowserSessionModel) -> BrowserSessionModel:
        self.browser_sessions[session.sessionId] = session
        return session

    def get_browser_session(self, session_id: str) -> Optional[BrowserSessionModel]:
        return self.browser_sessions.get(session_id)

    # --- Audit Event Log ---
    def log_audit_event(self, event: AuditEventModel):
        self.audit_events.append(event)

    def get_timeline_for_incident(self, incident_id: str) -> List[AuditEventModel]:
        return [e for e in self.audit_events if e.entityId == incident_id or e.metadata.get("incidentId") == incident_id]

    def list_audit_events(self) -> List[AuditEventModel]:
        if not self.audit_events:
            self._seed_default_audit_events()
        return sorted(self.audit_events, key=lambda x: x.timestamp, reverse=True)

    def _seed_default_audit_events(self):
        self.audit_events = [
            AuditEventModel(
                id="audit_seed_01",
                eventType="ComplaintClassified",
                entityId="INC-1001",
                actorType=ActorType.AGENT,
                actorId="classifier_agent",
                decision="Category: Road & Potholes, Severity: 4.0, SafetyRisk: 4.0",
                reasonCodes=["AI_CLASSIFICATION_SUCCESS"],
                timestamp=current_iso_timestamp(),
            ),
            AuditEventModel(
                id="audit_seed_02",
                eventType="NewIncidentCreated",
                entityId="INC-1001",
                actorType=ActorType.SYSTEM,
                actorId="processor",
                decision="Created incident INC-1001 (Severe Crater & Pothole Cluster on MG Road). Routed to Local Municipal Ward (RAJ_SAMPARK).",
                reasonCodes=["NO_MATCHING_CANDIDATE"],
                timestamp=current_iso_timestamp(),
            ),
            AuditEventModel(
                id="audit_seed_03",
                eventType="ImpactScoreChanged",
                entityId="INC-1001",
                actorType=ActorType.SYSTEM,
                actorId="impact_engine",
                decision="Impact score updated to 82.0 based on 21 citizen reports and safety risk.",
                reasonCodes=["METRICS_RECALCULATED"],
                timestamp=current_iso_timestamp(),
            ),
            AuditEventModel(
                id="audit_seed_04",
                eventType="ExternalComplaintSubmitted",
                entityId="INC-1001",
                actorType=ActorType.AGENT,
                actorId="filing_agent",
                decision="Official case reference EXT-2026-726103 registered via Rajasthan Sampark Portal.",
                reasonCodes=["ADAPTER_SUBMISSION_SUCCESS"],
                timestamp=current_iso_timestamp(),
            ),
        ]


    # --- Policy Config ---
    def get_policy_config(self) -> EscalationPolicyConfig:
        return self.policy_config

    def update_policy_config(self, config: EscalationPolicyConfig):
        self.policy_config = config


from app.core.config import settings
from app.repositories.firestore_repository import FirestoreRepository


def create_repository():
    if settings.USE_LIVE_GCP and (settings.GOOGLE_APPLICATION_CREDENTIALS or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")):
        try:
            firestore_repo = FirestoreRepository()
            if firestore_repo.client:
                # Test connectivity
                firestore_repo.client.collection("policies").limit(1).get()
                return firestore_repo
        except Exception:
            pass
    return DatabaseRepository()


# Singleton repository instance
db = create_repository()


