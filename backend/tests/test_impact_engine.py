from app.models.domain import IncidentModel, LocationModel, EscalationPolicyConfig, IncidentPriority
from app.services.impact_engine import (
    calculate_community_score,
    calculate_impact_score,
    determine_priority
)


def test_community_score_calculation():
    score1 = calculate_community_score(unique_citizens=1, report_count=1)
    assert score1 == 17.0

    score2 = calculate_community_score(unique_citizens=6, report_count=10)
    assert score2 == 110.0 or score2 == 100.0


def test_impact_score_formula():
    policy = EscalationPolicyConfig()
    incident = IncidentModel(
        id="INC-TEST",
        category="Road & Potholes",
        centerLocation=LocationModel(latitude=12.9716, longitude=77.5946),
        uniqueCitizenCount=6,
        reportCount=21,
        severity=4.0,
        safetyRisk=4.0,
        radiusMeters=100.0
    )

    impact = calculate_impact_score(incident, policy)
    assert impact > 50.0

    priority = determine_priority(impact, policy)
    assert priority in [IncidentPriority.PRIORITY, IncidentPriority.HIGH, IncidentPriority.CRITICAL]
