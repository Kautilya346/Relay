import pytest
from app.models.domain import IncidentModel, ComplaintModel, IncidentStatus
from app.services.dispatch_orchestrator import dispatch_orchestrator


@pytest.mark.asyncio
async def test_multi_tier_dispatch_orchestrator():
    incident = IncidentModel(
        id="INC-TEST-DISPATCH",
        category="Sanitation & Garbage",
        title="Dead animal carcass on road",
        summary="Dead dog needs immediate ULB removal",
        description="Dead dog lying on main street near ward 80",
        geohash="ttnfv30",
        centerLocation={"latitude": 26.9124, "longitude": 75.7873},
        impactScore=45.0,
        status=IncidentStatus.OPEN,
        authorityId="SWACHHATA_MOHUA",
        ward="Ward 80, Jaipur",
        corroboratingCitizenCount=3,
    )

    complaint = ComplaintModel(
        id="CMP-TEST-1",
        userId="USR-1",
        description="There is a dead dog in my locality near school entrance",
        category="Sanitation & Garbage",
        geohash="ttnfv30",
        latitude=26.9124,
        longitude=75.7873,
    )



    result = await dispatch_orchestrator.execute_multi_tier_dispatch(
        incident=incident,
        complaint=complaint,
        recipient_email="sanitation.officer@jaipurmc.org",
    )

    assert result["incidentId"] == "INC-TEST-DISPATCH"
    assert result["primaryEmailDispatch"]["success"] is True
    assert result["primaryEmailDispatch"]["externalCaseId"].startswith("MSG-EML-")
    assert "apiPortalDiscovery" in result
