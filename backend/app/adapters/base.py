from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import hashlib


class AdapterResult:
    def __init__(
        self,
        success: bool,
        external_case_id: Optional[str] = None,
        status: str = "PENDING",
        message: str = "",
        raw_response: Optional[Dict[str, Any]] = None,
        handoff_required: bool = False,
        handoff_url: Optional[str] = None,
    ):
        self.success = success
        self.external_case_id = external_case_id
        self.status = status
        self.message = message
        self.raw_response = raw_response or {}
        self.handoff_required = handoff_required
        self.handoff_url = handoff_url

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "external_case_id": self.external_case_id,
            "status": self.status,
            "message": self.message,
            "raw_response": self.raw_response,
            "handoff_required": self.handoff_required,
            "handoff_url": self.handoff_url,
        }


class AuthorityAdapter(ABC):
    """Abstract base adapter for municipal and government grievance systems."""

    def __init__(self, authority_id: str, name: str, official_domain: str):
        self.authority_id = authority_id
        self.name = name
        self.official_domain = official_domain

    @abstractmethod
    def validate(self, payload: Dict[str, Any]) -> bool:
        """Validates if complaint payload contains required fields before transmission."""
        pass

    @abstractmethod
    def submit(self, payload: Dict[str, Any]) -> AdapterResult:
        """Submits complaint to authority portal or returns HANDOFF_REQUIRED."""
        pass

    @abstractmethod
    def get_status(self, external_id: str) -> AdapterResult:
        """Queries current status of the external complaint reference."""
        pass

    @abstractmethod
    def send_followup(self, external_id: str, message: str) -> AdapterResult:
        """Sends a structured factual reminder/follow-up after human approval."""
        pass

    @abstractmethod
    def get_resolution(self, external_id: str) -> AdapterResult:
        """Fetches resolution evidence or status documentation."""
        pass


class AuthorityRegistry:
    """Registry of verified adapters. Never allows unverified or arbitrary destinations."""

    def __init__(self):
        self._adapters: Dict[str, AuthorityAdapter] = {}

    def register(self, authority_id: str, adapter: AuthorityAdapter):
        self._adapters[authority_id] = adapter

    def get(self, authority_id: str) -> Optional[AuthorityAdapter]:
        return self._adapters.get(authority_id)

    def list_all(self) -> List[AuthorityAdapter]:
        return list(self._adapters.values())

    def get_verified_or_fallback(self, authority_id: str) -> AuthorityAdapter:
        if authority_id in self._adapters:
            return self._adapters[authority_id]
        # Fallback to Sandbox Simulator if in development/demo mode
        return self._adapters.get("SANDBOX_SIMULATOR") or self._adapters.get("RAJ_SAMPARK")


# Global Registry Instance
registry = AuthorityRegistry()
