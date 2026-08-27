from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.models.domain import IncidentModel, IncidentPriority


def calculate_persistence_days(first_reported_at: str, last_reported_at: str) -> int:
    """Calculates integer days between first report and latest report."""
    try:
        dt1 = datetime.fromisoformat(first_reported_at.replace("Z", "+00:00"))
        dt2 = datetime.fromisoformat(last_reported_at.replace("Z", "+00:00"))
        delta_days = max(1, (dt2 - dt1).days + 1)
        return delta_days
    except Exception:
        return 1


def compose_evidence_based_complaint(incident: IncidentModel, location_name: str = "") -> str:
    """
    Synthesizes an evidence-backed official complaint text.
    The complaint becomes strictly more precise and factually rigorous as priority increases,
    never hallucinating statistics or fake urgency.
    """
    loc_str = location_name or f"near coordinates ({incident.centerLocation.latitude:.4f}, {incident.centerLocation.longitude:.4f})"
    category_title = incident.category.replace("_", " ").title()
    persistence_days = calculate_persistence_days(incident.firstReportedAt, incident.lastReportedAt)

    # 1. LOW / NORMAL PRIORITY
    if incident.priority == IncidentPriority.NORMAL:
        return (
            f"Civic Issue Notification: {category_title} reported {loc_str}. "
            f"Initial summary: {incident.summary or incident.title or 'Issue requires municipal inspection.'}"
        )

    # 2. PRIORITY
    if incident.priority == IncidentPriority.PRIORITY:
        return (
            f"Priority Civic Report — {category_title} {loc_str}.\n"
            f"Community Signal: Corroborated by {incident.uniqueCitizenCount} distinct citizen reports "
            f"over a {persistence_days}-day period with {incident.verifiedEvidenceCount} uploaded evidence items. "
            f"Impact Score: {incident.impactScore:.1f}/100. Please schedule routine departmental inspection."
        )

    # 3. HIGH PRIORITY
    if incident.priority == IncidentPriority.HIGH:
        return (
            f"HIGH PRIORITY Civic Grievance — {category_title} {loc_str}.\n"
            f"{incident.uniqueCitizenCount} distinct citizens have reported this persistent {category_title.lower()} issue "
            f"over approximately {persistence_days} days. Total incident reports: {incident.reportCount}. "
            f"The issue presents a confirmed public safety concern (Impact Score: {incident.impactScore:.1f}/100). "
            f"Please prioritize inspection and immediate corrective action."
        )

    # 4. CRITICAL PRIORITY
    sla_info = ""
    if incident.sla:
        sla_info = f" The incident has a configured resolution deadline of {incident.sla.resolutionDeadline} (SLA Status: {incident.sla.status})."

    return (
        f"CRITICAL ESCALATION NOTICE: Incident {incident.id} has {incident.uniqueCitizenCount} distinct citizen reporters, "
        f"{incident.reportCount} aggregate reports, {incident.verifiedEvidenceCount} verified supporting evidence items, "
        f"and an active persistence duration of {persistence_days} days at {loc_str}.\n"
        f"Impact Score: {incident.impactScore:.1f}/100 (Severity: {incident.severity:.1f}, Safety Risk: {incident.safetyRisk:.1f})."
        f"{sla_info} Immediate supervisory intervention is requested. "
        f"Please provide current action status and expected resolution timeline."
    )
