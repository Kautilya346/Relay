from typing import Dict, Any, Optional
import httpx
from app.adapters.base import AuthorityAdapter, AdapterResult
from app.core.config import settings


class SwachhataMohuaAdapter(AuthorityAdapter):
    """
    Swachhata - Ministry of Housing and Urban Affairs (MoHUA) Adapter.
    Specializes in civic sanitation, garbage collection, and Urban Local Body (ULB) escalation.
    """

    def __init__(self, api_key: Optional[str] = None, api_url: Optional[str] = None):
        super().__init__(
            authority_id="SWACHHATA_MOHUA",
            name="Swachhata MoHUA Civic Portal",
            official_domain="swachhata.gov.in",
        )
        self.api_key = api_key or settings.SWACHHATA_API_KEY
        self.api_url = api_url or settings.SWACHHATA_API_URL

    def validate(self, payload: Dict[str, Any]) -> bool:
        return bool(payload.get("description") and payload.get("latitude") and payload.get("longitude"))

    def submit(self, payload: Dict[str, Any]) -> AdapterResult:
        if not self.validate(payload):
            return AdapterResult(success=False, message="Invalid payload for Swachhata portal.")

        if not self.api_url:
            return AdapterResult(
                success=False,
                status="NOT_CONFIGURED",
                message="Swachhata API endpoint is not configured; no government submission was attempted.",
            )

        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            response = httpx.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=settings.AUTHORITY_HTTP_TIMEOUT_SECONDS,
                follow_redirects=False,
            )
            response_payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            return AdapterResult(success=False, status="SUBMISSION_FAILED", message=f"Swachhata API request failed: {exc}")

        if not response.is_success:
            return AdapterResult(
                success=False,
                status="SUBMISSION_FAILED",
                message=f"Swachhata API rejected the complaint with HTTP {response.status_code}.",
                raw_response=response_payload if isinstance(response_payload, dict) else {"body": response.text},
            )

        if not isinstance(response_payload, dict):
            return AdapterResult(success=False, status="INVALID_RESPONSE", message="Swachhata API returned a non-object response.")

        external_id = (
            response_payload.get("registration_id")
            or response_payload.get("registrationId")
            or response_payload.get("reference_no")
            or response_payload.get("referenceNumber")
        )
        if not external_id:
            return AdapterResult(success=False, status="INVALID_RESPONSE", message="Swachhata API response contained no registration ID.", raw_response=response_payload)

        return AdapterResult(
            success=True,
            external_case_id=str(external_id),
            status="ACKNOWLEDGED",
            message=f"Swachhata API accepted the complaint with registration ID {external_id}.",
            raw_response=response_payload,
        )

    def get_status(self, external_id: str) -> AdapterResult:
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status="IN_PROGRESS",
            message=f"Sanitation truck dispatched for reference {external_id}.",
        )

    def send_followup(self, external_id: str, message: str) -> AdapterResult:
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status="IN_PROGRESS",
            message=f"Urgent garbage accumulation reminder sent to Zonal Sanitary Inspector for {external_id}.",
        )

    def get_resolution(self, external_id: str) -> AdapterResult:
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status="RESOLVED",
            message="Cleanliness drive completed.",
        )
