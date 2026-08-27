import pytest
from app.models.domain import IncidentModel, LocationModel, IncidentPriority, SLAModel
from app.repositories.db_repository import db
from app.services.followup_service import prepare_followup_preview, approve_and_send_followup


def test_followup_lifecycle():
    # 1. Setup Incident
    inc = IncidentModel(
        id="INC-9999",
        category="SOLID_WASTE",
        title="Overflowing Garbage Dump",
        summary="Severe garbage dumping blocking road",
        centerLocation=LocationModel(latitude=26.9124, longitude=75.7873),
        reportCount=43,
        uniqueCitizenCount=39,
        impactScore=84.0,
        priority=IncidentPriority.HIGH,
        authorityId="SANDBOX_SIMULATOR",
        sla=SLAModel(responseDeadline="2026-08-20T10:00:00Z", resolutionDeadline="2026-08-21T10:00:00Z", status="BREACHED"),
    )
    db.save_incident(inc)

    # 2. Prepare Preview
    preview = prepare_followup_preview("INC-9999", "citizen_alice")
    assert preview["incidentId"] == "INC-9999"
    assert preview["status"] == "PENDING_APPROVAL"
    assert "URGENT FOLLOW-UP" in preview["followupText"]
    assert preview["authorizationId"].startswith("AUTH-")

    auth_id = preview["authorizationId"]

    # 3. Approve and Send
    result = approve_and_send_followup("INC-9999", auth_id, "citizen_alice")
    assert result["success"] is True
    assert result["status"] == "FOLLOWUP_SENT"

    # 4. Check Authorization Status is APPROVED (Cannot be reused)
    with pytest.raises(ValueError, match="already been APPROVED"):
        approve_and_send_followup("INC-9999", auth_id, "citizen_alice")
