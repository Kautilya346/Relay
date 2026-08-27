import json
import logging
import uuid
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timezone
from google.cloud import pubsub_v1
from app.core.config import settings
from app.events.event_bus import StandardEvent

logger = logging.getLogger("jansahayak.events.pubsub")


class CloudPubSubBus:
    """Production Google Cloud Pub/Sub event bus."""

    def __init__(self, project_id: Optional[str] = None):
        self.project_id = project_id or settings.GCP_PROJECT_ID
        self.topic_prefix = settings.PUBSUB_TOPIC_PREFIX
        self.publisher = None
        try:
            self.publisher = pubsub_v1.PublisherClient()
            logger.info(f"Initialized Google Cloud Pub/Sub Publisher for project '{self.project_id}'")
        except Exception as e:
            logger.warning(f"Could not connect to live Cloud Pub/Sub ({e}). Using local in-memory event bus.")

    def _get_topic_path(self, topic_name: str) -> str:
        full_topic = f"{self.topic_prefix}-{topic_name}"
        return self.publisher.topic_path(self.project_id, full_topic)

    async def publish(self, event: StandardEvent, topic_name: str = "incidents-events") -> str:
        """Publishes event to Google Cloud Pub/Sub topic."""
        event_dict = event.model_dump()
        event_bytes = json.dumps(event_dict).encode("utf-8")

        if self.publisher:
            try:
                topic_path = self._get_topic_path(topic_name)
                future = self.publisher.publish(
                    topic_path,
                    data=event_bytes,
                    eventType=event.eventType,
                    entityId=event.entityId,
                    eventId=event.id,
                )
                message_id = future.result(timeout=5.0)
                logger.info(f"[GCP PUB/SUB PUBLISHED] Topic: {topic_name} | Event: {event.eventType} (ID: {message_id})")
                return message_id
            except Exception as e:
                logger.warning(f"Pub/Sub transmission skipped: {e}")

        # In-memory publish fallback
        from app.events.event_bus import event_bus
        await event_bus.publish(event)
        return event.eventId



# Singleton instance
pubsub_bus = CloudPubSubBus()
