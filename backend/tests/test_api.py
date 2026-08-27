import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.db_repository import db

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_complaint_ingestion_and_incident_clustering():
    # Submit first complaint
    payload1 = {
        "userId": "citizen_alice",
        "description": "Large dangerous pothole causing traffic jams near MG Road metro station",
        "category": "Road & Potholes",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "imageUrls": ["https://storage.googleapis.com/demo/pothole1.jpg"]
    }

    res1 = client.post("/api/v1/complaints", json=payload1)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["success"] is True
    incident_id = data1["complaint"]["incidentId"]
    assert incident_id is not None

    # Submit corroborating complaint nearby
    payload2 = {
        "userId": "citizen_bob",
        "description": "Deep open crater on MG Road right in front of metro pillar 120",
        "category": "Road & Potholes",
        "latitude": 12.9718,
        "longitude": 77.5948,
        "imageUrls": ["https://storage.googleapis.com/demo/pothole2.jpg"]
    }

    res2 = client.post("/api/v1/complaints", json=payload2)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["success"] is True
    # Should attach to the SAME incident!
    assert data2["complaint"]["incidentId"] == incident_id

    # Verify Incident Details
    res_inc = client.get(f"/api/v1/incidents/{incident_id}")
    assert res_inc.status_code == 200
    inc_data = res_inc.json()["incident"]
    assert inc_data["reportCount"] >= 2
    assert inc_data["uniqueCitizenCount"] >= 2
    assert inc_data["impactScore"] > 0.0



def test_authority_queue_and_resolution():
    # Fetch authority queue
    res_queue = client.get("/api/v1/authority/incidents")
    assert res_queue.status_code == 200
    queue = res_queue.json()
    assert queue["count"] >= 1
    target_inc_id = queue["incidents"][0]["id"]

    # Acknowledge incident
    res_ack = client.post(f"/api/v1/authority/incidents/{target_inc_id}/acknowledge", json={
        "authorityId": "LOCAL_MUNICIPAL_WARD",
        "notes": "Work order dispatched to field team"
    })
    assert res_ack.status_code == 200
    assert res_ack.json()["incident"]["status"] == "IN_PROGRESS"

    # Submit resolution evidence
    res_resolve = client.post(f"/api/v1/authority/incidents/{target_inc_id}/resolution", json={
        "authorityId": "LOCAL_MUNICIPAL_WARD",
        "resolutionNotes": "Pothole filled with fresh asphalt and leveled.",
        "evidenceUrls": ["https://storage.googleapis.com/demo/pothole_fixed.jpg"]
    })
    assert res_resolve.status_code == 200
    assert res_resolve.json()["incident"]["status"] in ["RESOLVED", "REOPENED"]

