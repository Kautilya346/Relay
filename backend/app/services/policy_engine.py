import uuid
from typing import Optional, List, Tuple
from app.models.domain import (
    IncidentModel,
    EscalationModel,
    EscalationPolicyConfig,
    IncidentPriority,
    current_iso_timestamp
)

# Department Mapping per Issue Category
DEPARTMENT_MAP = {
    "Road & Potholes": "Roads & Infrastructure Department",
    "Sanitation & Garbage": "Solid Waste Management & Health Board",
    "Water & Sewage": "Water Supply & Sewerage Board",
    "Street Lighting": "Electrical Engineering & Public Lighting Dept",
    "Public Transport": "Urban Transport Authority",
    "Parks & Infrastructure": "Parks & Public Amenities Dept",
    "General Civic Issue": "General Municipal Public Works Dept"
}

# Authority Hierarchy definition (Supervisory level)
AUTHORITY_HIERARCHY = {
    0: "LOCAL_MUNICIPAL_WARD",
    1: "ZONAL_CIVIC_DEPARTMENT",
    2: "CITY_MUNICIPAL_COMMISSIONER",
    3: "STATE_URBAN_DEVELOPMENT_SECRETARY"
}


def get_department_for_category(category: str) -> str:
    """Maps issue category to responsible civic department."""
    return DEPARTMENT_MAP.get(category, "General Municipal Public Works Dept")


def get_next_authority(current_authority_id: str, current_level: int) -> Tuple[str, int]:
    """Returns the next supervisory authority in the hierarchy."""
    next_level = min(3, current_level + 1)
    next_auth = AUTHORITY_HIERARCHY.get(next_level, "STATE_URBAN_DEVELOPMENT_SECRETARY")
    return next_auth, next_level


class PolicyEvaluationResult:
    def __init__(self, should_escalate: bool, new_priority: IncidentPriority, trigger: str, reason_codes: List[str], target_authority_id: str, new_level: int):
        self.should_escalate = should_escalate
        self.new_priority = new_priority
        self.trigger = trigger
        self.reason_codes = reason_codes
        self.target_authority_id = target_authority_id
        self.new_level = new_level


def evaluate_escalation_policy(
    incident: IncidentModel,
    policy: EscalationPolicyConfig,
    force_sla_breach: bool = False
) -> PolicyEvaluationResult:
    """Evaluates escalation policies against current incident state."""
    should_escalate = False
    reason_codes = []
    trigger = "POLICY_EVALUATION"
    new_priority = incident.priority
    target_authority = incident.authorityId
    new_level = incident.escalationLevel

    # 1. Check Community Report Thresholds
    if incident.uniqueCitizenCount >= policy.reportThresholdEscalate:
        should_escalate = True
        trigger = "COMMUNITY_SIGNAL_LARGE"
        reason_codes.append("REPORT_COUNT_EXCEEDS_50")
    elif incident.uniqueCitizenCount >= policy.reportThresholdPriority:
        if new_priority in [IncidentPriority.NORMAL, IncidentPriority.PRIORITY]:
            new_priority = IncidentPriority.HIGH
            reason_codes.append("REPORT_COUNT_EXCEEDS_20")

    # 2. Check Critical Impact Threshold
    if incident.impactScore >= policy.immediateEscalationImpact:
        should_escalate = True
        trigger = "CRITICAL_IMPACT"
        new_priority = IncidentPriority.CRITICAL
        reason_codes.append("IMPACT_SCORE_EXCEEDS_85")

    # 3. Check High Safety Risk
    if incident.safetyRisk >= 4.0:
        if new_priority != IncidentPriority.CRITICAL:
            new_priority = IncidentPriority.HIGH
        reason_codes.append("HIGH_SAFETY_RISK")

    # 4. Check SLA Breach
    if force_sla_breach or (incident.sla and incident.sla.status == "BREACHED"):
        should_escalate = True
        trigger = "SLA_BREACH"
        reason_codes.append("SLA_BREACHED_NO_RESPONSE")

    # Determine authority escalation if escalation condition triggered
    if should_escalate:
        target_authority, new_level = get_next_authority(incident.authorityId, incident.escalationLevel)

    return PolicyEvaluationResult(
        should_escalate=should_escalate,
        new_priority=new_priority,
        trigger=trigger,
        reason_codes=reason_codes,
        target_authority_id=target_authority,
        new_level=new_level
    )
