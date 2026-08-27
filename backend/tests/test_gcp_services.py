import io
import pytest
from app.repositories.firestore_repository import FirestoreRepository
from app.services.storage_service import CloudStorageService
from app.events.pubsub_bus import CloudPubSubBus
from app.events.event_bus import StandardEvent
from app.models.domain import ComplaintModel, IncidentModel, LocationModel


def test_firestore_repository_initialization():
    repo = FirestoreRepository(project_id="test-project", database_id="(default)")
    assert repo.project_id == "test-project"
    assert repo.database_id == "(default)"


def test_cloud_storage_service_upload():
    service = CloudStorageService(bucket_name="test-evidence-bucket")
    test_bytes = b"fake-jpg-binary-data"
    url = service.upload_evidence(test_bytes, content_type="image/jpeg")
    assert url.startswith("http")
    assert "evidence" in url


@pytest.mark.asyncio
async def test_cloud_pubsub_bus_publish():
    bus = CloudPubSubBus(project_id="test-project")
    evt = StandardEvent(
        eventType="ComplaintCreated",
        entityId="cmp_test_123",
        payload={"category": "Road & Potholes", "description": "Test complaint"}
    )
    msg_id = await bus.publish(evt, topic_name="complaints-events")
    assert msg_id is not None
