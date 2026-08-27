from datetime import datetime, timezone
from app.models.domain import IncidentModel, IncidentPriority, EscalationPolicyConfig


def calculate_community_score(unique_citizens: int, report_count: int) -> float:
    """Derives normalized community score (0-100) from unique citizen reports."""
    # Base weight: each unique citizen adds ~15 points, extra reports add 2 points
    raw = (unique_citizens * 15.0) + (report_count * 2.0)
    return min(100.0, max(0.0, raw))


def calculate_persistence_score(first_reported_at_iso: str) -> float:
    """Calculates persistence score based on how long the incident has been active."""
    try:
        dt = datetime.fromisoformat(first_reported_at_iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        hours_active = (now - dt).total_seconds() / 3600.0
        # 1 point per hour active up to 100
        return min(100.0, max(10.0, hours_active * 2.0 + 10.0))
    except Exception:
        return 10.0


def calculate_density_score(report_count: int, radius_meters: float) -> float:
    """Calculates report density score within area."""
    if radius_meters <= 0:
        return 50.0
    density = report_count / (radius_meters / 50.0)
    return min(100.0, max(10.0, density * 20.0))


def calculate_impact_score(incident: IncidentModel, policy: EscalationPolicyConfig) -> float:
    """Calculates deterministic impact score based on weighted formula."""
    community_score = calculate_community_score(incident.uniqueCitizenCount, incident.reportCount)
    severity_score = min(100.0, incident.severity * 20.0)
    safety_score = min(100.0, incident.safetyRisk * 20.0)
    persistence_score = calculate_persistence_score(incident.firstReportedAt)
    density_score = calculate_density_score(incident.reportCount, incident.radiusMeters)

    w = policy.weights
    impact_score = (
        (w.communityWeight * community_score) +
        (w.severityWeight * severity_score) +
        (w.safetyWeight * safety_score) +
        (w.persistenceWeight * persistence_score) +
        (w.densityWeight * density_score)
    )

    return round(min(100.0, max(0.0, impact_score)), 2)


def determine_priority(impact_score: float, policy: EscalationPolicyConfig) -> IncidentPriority:
    """Maps impact score to priority level."""
    t = policy.thresholds
    if impact_score >= t.criticalMin:
        return IncidentPriority.CRITICAL
    elif impact_score >= t.priorityMax:
        return IncidentPriority.HIGH
    elif impact_score >= t.normalMax:
        return IncidentPriority.PRIORITY
    else:
        return IncidentPriority.NORMAL
