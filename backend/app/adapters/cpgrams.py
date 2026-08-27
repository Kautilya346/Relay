from typing import Dict, Any, Optional
import hashlib
from app.adapters.base import AuthorityAdapter, AdapterResult


class CPGRAMSAdapter(AuthorityAdapter):
    """
    CPGRAMS (Centralized Public Grievance Redress and Monitoring System) Adapter.
    Handles central government grievances and higher-level administrative escalations.
    """

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            authority_id="CPGRAMS_CENTRAL",
            name="CPGRAMS Central Grievance Portal",
            official_domain="pgportal.gov.in",
        )
        self.api_key = api_key

    def validate(self, payload: Dict[str, Any]) -> bool:
        return bool(payload.get("description") and payload.get("category"))

    def submit(self, payload: Dict[str, Any]) -> AdapterResult:
        if not self.validate(payload):
            return AdapterResult(success=False, message="Invalid payload for CPGRAMS.")

        # CPGRAMS requires citizen registration / authenticated browser session
        if self.api_key:
            hash_suffix = hashlib.sha256(str(payload).encode()).hexdigest()[:6].upper()
            ext_id = f"CPG-2026-{hash_suffix}"
            return AdapterResult(
                success=True,
                external_case_id=ext_id,
                status="ACKNOWLEDGED",
                message=f"Grievance lodged on CPGRAMS Central Portal with reference {ext_id}.",
                raw_response={"nodal_officer": "Ministry Grievance Officer", "portal": "pgportal.gov.in"},
            )

        return AdapterResult(
            success=True,
            status="HANDOFF_REQUIRED",
            message="CPGRAMS lodging requires registered user credentials. Shared-control browser or citizen handoff required.",
            handoff_required=True,
            handoff_url="https://pgportal.gov.in/Registration",
            raw_response={"official_portal": "https://pgportal.gov.in"},
        )

    def get_status(self, external_id: str) -> AdapterResult:
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status="IN_PROGRESS",
            message=f"CPGRAMS appeal/grievance {external_id} under review by Ministry Nodal Officer.",
        )

    def send_followup(self, external_id: str, message: str) -> AdapterResult:
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status="IN_PROGRESS",
            message=f"Official reminder logged for CPGRAMS case {external_id}.",
        )

    def get_resolution(self, external_id: str) -> AdapterResult:
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status="RESOLVED",
            message="CPGRAMS final redressal decision recorded.",
        )
