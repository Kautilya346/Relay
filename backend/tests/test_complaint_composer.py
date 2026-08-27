import pytest
from app.models.domain import IncidentModel, LocationModel, IncidentPriority, SLAModel
from app.services.complaint_composer import compose_evidence_based_complaint


def test_composer_normal_priority():
    inc = IncidentModel(
        id="INC-1001",
        category="ROAD_DAMAGE",
        title="Pothole on Main Road",
        summary="Minor pothole near junction",
        centerLocation=LocationModel(latitude=26.9124, longitude=75.7873),
        reportCount=1,
        uniqueCitizenCount=1,
        priority=IncidentPriority.NORMAL,
    )
    text = compose_evidence_based_complaint(inc)
    assert "Civic Issue Notification: Road Damage" in text
    assert "26.9124" in text


def test_composer_critical_priority():
    inc = IncidentModel(
        id="INC-4821",
        category="ROAD_DAMAGE",
        title="Severe Crater Hazard",
        summary="Deep road collapse",
        centerLocation=LocationModel(latitude=26.9124, longitude=75.7873),
        reportCount=53,
        uniqueCitizenCount=47,
        verifiedEvidenceCount=12,
        severity=4.5,
        safetyRisk=4.8,
        impactScore=88.0,
        priority=IncidentPriority.CRITICAL,
        sla=SLAModel(responseDeadline="2026-08-20T10:00:00Z", resolutionDeadline="2026-08-21T10:00:00Z", status="BREACHED"),
    )
    text = compose_evidence_based_complaint(inc)
    assert "CRITICAL ESCALATION NOTICE: Incident INC-4821" in text
    assert "47 distinct citizen reporters" in text
    assert "53 aggregate reports" in text
    assert "12 verified supporting evidence" in text
    assert "Impact Score: 88.0/100" in text
    assert "BREACHED" in text
