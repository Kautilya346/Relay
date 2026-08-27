import uuid
import logging
from typing import Dict, Any, Callable, Awaitable, List, Set
from pydantic import BaseModel, Field
from app.models.domain import current_iso_timestamp

logger = logging.getLogger("jansahayak.events")


class StandardEvent(BaseModel):
    eventId: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:10]}")
    eventType: str
    version: int = 1
    occurredAt: str = Field(default_factory=current_iso_timestamp)
    source: str = "jansahayak-api"
    entityId: str
    correlationId: str = ""
    idempotencyKey: str = ""
    payload: Dict[str, Any] = Field(default_factory=dict)


EventHandler = Callable[[StandardEvent], Awaitable[None]]


class EventBus:
    """Async event bus with idempotency tracking & subscriber registry."""

    def __init__(self):
        self._subscribers: Dict[str, List[EventHandler]] = {}
        self._processed_events: Set[str] = set()

    def subscribe(self, event_type: str, handler: EventHandler):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
        logger.info(f"Subscribed handler {handler.__name__} to event: {event_type}")

    def is_processed(self, consumer_name: str, event_id: str) -> bool:
        key = f"{consumer_name}:{event_id}"
        return key in self._processed_events

    def mark_processed(self, consumer_name: str, event_id: str):
        key = f"{consumer_name}:{event_id}"
        self._processed_events.add(key)

    async def publish(self, event: StandardEvent):
        logger.info(f"[EVENT PUBLISHED] {event.eventType} on entity {event.entityId} (id: {event.eventId})")
        handlers = self._subscribers.get(event.eventType, [])
        for handler in handlers:
            try:
                await handler(event)
            except Exception as e:
                logger.error(f"Error executing event handler {handler.__name__} for {event.eventType}: {e}", exc_info=True)


# Global singleton instance
event_bus = EventBus()
