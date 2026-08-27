from typing import Dict, Any, Optional
from datetime import datetime, timezone
import random
from app.adapters.base import AuthorityAdapter, AdapterResult


class AuthoritySandboxAdapter(AuthorityAdapter):
    """
    Hackathon Authority Sandbox Simulator.
    Implements the exact same interface as production adapters for safe, deterministic end-to-end testing
    without inventing unsupported government APIs.
    """

    def __init__(self):
        super().__init__(
            authority_id="SANDBOX_SIMULATOR",
            name="JanSahayak Authority Sandbox Simulator",
            official_domain="sandbox.jansahayak.internal",
        )
        self._case_counter = 1000
        self._cases: Dict[str, Dict[str, Any]] = {}

    def validate(self, payload: Dict[str, Any]) -> bool:
        return bool(payload.get("description") and payload.get("category"))

    def submit(self, payload: Dict[str, Any]) -> AdapterResult:
        self._case_counter += 1
        ext_id = f"EXT-{self._case_counter}"
        self._cases[ext_id] = {
            "external_case_id": ext_id,
            "status": "ACKNOWLEDGED",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
            "followups": [],
            "resolution_evidence": None,
        }
        return AdapterResult(
            success=True,
            external_case_id=ext_id,
            status="ACKNOWLEDGED",
            message=f"Official case reference {ext_id} created in municipal dispatch sandbox.",
            raw_response={"reference_no": ext_id, "ward_assigned": "Ward-14", "officer": "Er. S. Sharma"},
        )

    def get_status(self, external_id: str) -> AdapterResult:
        case = self._cases.get(external_id)
        if not case:
            return AdapterResult(
                success=False,
                status="NOT_FOUND",
                message=f"Case {external_id} not found in sandbox registry.",
            )
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status=case["status"],
            message=f"Current sandbox status is {case['status']}.",
            raw_response=case,
        )

    def send_followup(self, external_id: str, message: str) -> AdapterResult:
        case = self._cases.get(external_id)
        if not case:
            case = {
                "external_case_id": external_id,
                "status": "ACKNOWLEDGED",
                "submitted_at": datetime.now(timezone.utc).isoformat(),
                "payload": {},
                "followups": [],
                "resolution_evidence": None,
            }
            self._cases[external_id] = case

        timestamp = datetime.now(timezone.utc).isoformat()
        case["followups"].append({"timestamp": timestamp, "message": message})
        case["status"] = "IN_PROGRESS"
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status="IN_PROGRESS",
            message="Factual escalation reminder delivered to authority sandbox dispatch officer.",
            raw_response={
                "authority_reply": "Inspection scheduled within 24 hours by Ward Rapid Response Team.",
                "recorded_at": timestamp,
            },
        )

    def get_resolution(self, external_id: str) -> AdapterResult:
        case = self._cases.get(external_id)
        if not case:
            return AdapterResult(success=False, message=f"Case {external_id} not found.")

        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status=case["status"],
            message="Resolution report retrieved.",
            raw_response={
                "resolution_evidence": case.get("resolution_evidence"),
                "status": case["status"],
            },
        )

    def simulate_resolution(self, external_id: str, evidence_url: str) -> AdapterResult:
        case = self._cases.get(external_id)
        if not case:
            return AdapterResult(success=False, message=f"Case {external_id} not found.")

        case["status"] = "CLOSED"
        case["resolution_evidence"] = evidence_url
        return AdapterResult(
            success=True,
            external_case_id=external_id,
            status="CLOSED",
            message="Sandbox incident marked as RESOLVED by authority officer.",
            raw_response={"evidence_url": evidence_url, "closed_at": datetime.now(timezone.utc).isoformat()},
        )
