import logging
from typing import Dict, List, Optional, Any
from google.cloud import firestore
from app.core.config import settings
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
)
from app.services.geo_service import calculate_haversine_distance

logger = logging.getLogger("jansahayak.repository.firestore")


class FirestoreRepository:
    """Production Cloud Firestore database repository."""

    def __init__(self, project_id: Optional[str] = None, database_id: Optional[str] = None):
        self.project_id = project_id or settings.GCP_PROJECT_ID
        self.database_id = database_id or settings.FIRESTORE_DATABASE_ID
        try:
            self.client = firestore.Client(project=self.project_id, database=self.database_id)
            logger.info(f"Connected to Google Cloud Firestore [Project: {self.project_id}, DB: {self.database_id}]")
        except Exception as e:
            logger.warning(f"Could not connect to live Cloud Firestore ({e}). Using local fallback mode.")
            self.client = None

    # --- Complaint CRUD ---
    def save_complaint(self, complaint: ComplaintModel) -> ComplaintModel:
        if self.client:
            doc_ref = self.client.collection("complaints").document(complaint.id)
            doc_ref.set(complaint.model_dump())
        return complaint

    def get_complaint(self, complaint_id: str) -> Optional[ComplaintModel]:
        if not self.client:
            return None
        doc = self.client.collection("complaints").document(complaint_id).get()
        if doc.exists:
            return ComplaintModel(**doc.to_dict())
        return None

    def list_complaints_by_incident(self, incident_id: str) -> List[ComplaintModel]:
        if not self.client:
            return []
        try:
            docs = self.client.collection("complaints").where("incidentId", "==", incident_id).stream()
            return [ComplaintModel(**d.to_dict()) for d in docs]
        except Exception:
            return []

    def list_complaints_by_user(self, user_id: str) -> List[ComplaintModel]:
        if not self.client:
            return []
        try:
            docs = self.client.collection("complaints").where("userId", "==", user_id).stream()
            return [ComplaintModel(**d.to_dict()) for d in docs]
        except Exception:
            return []

    # --- Incident CRUD ---
    def save_incident(self, incident: IncidentModel) -> IncidentModel:
        if self.client:
            doc_ref = self.client.collection("incidents").document(incident.id)
            doc_ref.set(incident.model_dump())
        return incident

    def get_incident(self, incident_id: str) -> Optional[IncidentModel]:
        if not self.client:
            return None
        doc = self.client.collection("incidents").document(incident_id).get()
        if doc.exists:
            return IncidentModel(**doc.to_dict())
        return None

    def list_all_incidents(self) -> List[IncidentModel]:
        if not self.client:
            return []
        try:
            docs = self.client.collection("incidents").stream()
            return [IncidentModel(**d.to_dict()) for d in docs]
        except Exception:
            return []

    def list_active_incidents(self) -> List[IncidentModel]:
        if not self.client:
            return []
        try:
            all_docs = self.client.collection("incidents").stream()
            return [
                IncidentModel(**d.to_dict())
                for d in all_docs
                if d.to_dict().get("status") in ["OPEN", "IN_PROGRESS", "REOPENED"]
            ]
        except Exception as e:
            logger.warning(f"Error streaming active incidents from Firestore: {e}")
            return []

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
        if self.client:
            self.client.collection("escalations").document(escalation.id).set(escalation.model_dump())
        return escalation

    def get_escalations_for_incident(self, incident_id: str) -> List[EscalationModel]:
        if not self.client:
            return []
        try:
            docs = self.client.collection("escalations").where("incidentId", "==", incident_id).stream()
            return [EscalationModel(**d.to_dict()) for d in docs]
        except Exception:
            return []

    # --- External Case CRUD ---
    def save_external_case(self, external_case: ExternalCaseModel) -> ExternalCaseModel:
        if self.client:
            self.client.collection("external_cases").document(external_case.id).set(external_case.model_dump())
        return external_case

    def get_external_case(self, external_case_id: str) -> Optional[ExternalCaseModel]:
        if not self.client:
            return None
        doc = self.client.collection("external_cases").document(external_case_id).get()
        if doc.exists:
            return ExternalCaseModel(**doc.to_dict())
        return None

    def get_external_case_by_incident(self, incident_id: str) -> Optional[ExternalCaseModel]:
        if not self.client:
            return None
        try:
            docs = self.client.collection("external_cases").where("incidentId", "==", incident_id).limit(1).stream()
            for d in docs:
                return ExternalCaseModel(**d.to_dict())
        except Exception:
            pass
        return None

    def list_all_external_cases(self) -> List[ExternalCaseModel]:
        if not self.client:
            return []
        try:
            docs = self.client.collection("external_cases").stream()
            return [ExternalCaseModel(**d.to_dict()) for d in docs]
        except Exception:
            return []

    # --- Authorization CRUD ---
    def save_authorization(self, auth: AuthorizationModel) -> AuthorizationModel:
        if self.client:
            self.client.collection("authorizations").document(auth.authorizationId).set(auth.model_dump())
        return auth

    def get_authorization(self, auth_id: str) -> Optional[AuthorizationModel]:
        if not self.client:
            return None
        doc = self.client.collection("authorizations").document(auth_id).get()
        if doc.exists:
            return AuthorizationModel(**doc.to_dict())
        return None

    def _get_default_authorities(self) -> Dict[str, AuthorityIntegrationModel]:
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
        return {a.authority_id: a for a in defaults}

    # --- Authority Integrations ---
    def list_authorities(self) -> List[AuthorityIntegrationModel]:
        if not self.client:
            return list(self._get_default_authorities().values())
        try:
            docs = list(self.client.collection("authority_integrations").stream())
            if docs:
                return [AuthorityIntegrationModel(**d.to_dict()) for d in docs]
        except Exception:
            pass
        return list(self._get_default_authorities().values())

    def get_authority(self, authority_id: str) -> Optional[AuthorityIntegrationModel]:
        if not self.client:
            return self._get_default_authorities().get(authority_id)
        try:
            doc = self.client.collection("authority_integrations").document(authority_id).get()
            if doc.exists:
                return AuthorityIntegrationModel(**doc.to_dict())
        except Exception:
            pass
        return self._get_default_authorities().get(authority_id)

    # --- Browser Sessions ---
    def save_browser_session(self, session: BrowserSessionModel) -> BrowserSessionModel:
        if self.client:
            try:
                import json
                data = json.loads(session.model_dump_json())
                self.client.collection("browser_sessions").document(session.sessionId).set(data)
            except Exception as e:
                import logging
                logging.getLogger("jansahayak.firestore").warning(f"Firestore save_browser_session note: {e}")
        return session

    def get_browser_session(self, session_id: str) -> Optional[BrowserSessionModel]:
        if not self.client:
            return None
        try:
            doc = self.client.collection("browser_sessions").document(session_id).get()
            if doc.exists:
                return BrowserSessionModel(**doc.to_dict())
        except Exception:
            pass
        return None

    # --- Audit Event Log ---
    def log_audit_event(self, event: AuditEventModel):
        if self.client:
            try:
                import json
                data = json.loads(event.model_dump_json())
                self.client.collection("events").document(event.id).set(data)
            except Exception as e:
                import logging
                logging.getLogger("jansahayak.firestore").warning(f"Firestore log_audit_event note: {e}")


    def get_timeline_for_incident(self, incident_id: str) -> List[AuditEventModel]:
        if not self.client:
            return []
        try:
            docs = self.client.collection("events").where("entityId", "==", incident_id).stream()
            events = [AuditEventModel(**d.to_dict()) for d in docs]
            events.sort(key=lambda x: x.timestamp, reverse=True)
            return events
        except Exception:
            return []

    def list_audit_events(self) -> List[AuditEventModel]:
        if not self.client:
            return []
        try:
            docs = self.client.collection("events").stream()
            events = [AuditEventModel(**d.to_dict()) for d in docs]
            events.sort(key=lambda x: x.timestamp, reverse=True)
            return events
        except Exception:
            return []


    # --- Policy Config ---
    def get_policy_config(self) -> EscalationPolicyConfig:
        if self.client:
            try:
                doc = self.client.collection("policies").document("escalation_policy_default").get()
                if doc.exists:
                    return EscalationPolicyConfig(**doc.to_dict())
            except Exception:
                pass
        return EscalationPolicyConfig()

    def update_policy_config(self, config: EscalationPolicyConfig):
        if self.client:
            self.client.collection("policies").document("escalation_policy_default").set(config.model_dump())
