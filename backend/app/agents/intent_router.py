import json
import re
from typing import Dict, Any, Optional
from google import genai
from google.genai import types
from app.core.config import settings
from app.models.domain import UserIntentEnum, UserIntentResponse


from app.core.genai_client import get_genai_client



def fallback_classify_intent(user_message: str) -> UserIntentResponse:
    lower = user_message.lower()

    # Extract any incident reference like INC-1234 or EXT-1001
    inc_match = re.search(r"\b(inc|ext)-[0-9a-zA-Z]+\b", lower, re.IGNORECASE)
    entity_id = inc_match.group(0).upper() if inc_match else None

    if any(w in lower for w in ["pothole", "garbage", "leak", "broken", "light", "dump", "dirty", "accident", "overflow", "report", "lodge"]):
        return UserIntentResponse(
            intent=UserIntentEnum.REPORT_ISSUE,
            confidence=0.92,
            entityId=entity_id,
            suggestedAction="OPEN_REPORT_MODAL",
            replyMessage="It looks like you want to report a new civic issue. I've opened the report form for you with location and evidence capture.",
        )
    elif any(w in lower for w in ["status", "what happened", "track", "progress", "update", "where is"]):
        return UserIntentResponse(
            intent=UserIntentEnum.CHECK_STATUS,
            confidence=0.94,
            entityId=entity_id,
            suggestedAction="VIEW_INCIDENT_TIMELINE",
            replyMessage=f"Retrieving real-time status and audit timeline for {entity_id or 'your reported incidents'}.",
        )
    elif any(w in lower for w in ["reminder", "follow up", "follow-up", "remind", "nudge", "taking long", "delay"]):
        return UserIntentResponse(
            intent=UserIntentEnum.FOLLOW_UP,
            confidence=0.95,
            entityId=entity_id,
            suggestedAction="OPEN_FOLLOWUP_APPROVAL",
            replyMessage="I've prepared a structured, evidence-backed follow-up for authority review. Please preview and approve sending it.",
        )
    elif any(w in lower for w in ["escalate", "commissioner", "urgent", "higher authority", "emergency"]):
        return UserIntentResponse(
            intent=UserIntentEnum.ESCALATE,
            confidence=0.91,
            entityId=entity_id,
            suggestedAction="TRIGGER_SUPERVISORY_ESCALATION",
            replyMessage="Evaluating policy engine criteria to escalate this case to the supervisory municipal authority.",
        )
    elif any(w in lower for w in ["fixed", "resolved", "repaired", "clean now", "done", "closed"]):
        return UserIntentResponse(
            intent=UserIntentEnum.RESOLUTION_FEEDBACK,
            confidence=0.93,
            entityId=entity_id,
            suggestedAction="SUBMIT_RESOLUTION_FEEDBACK",
            replyMessage="Thank you for the update. I will trigger automated AI resolution verification.",
        )
    elif any(w in lower for w in ["photo", "image", "proof", "more evidence", "additional"]):
        return UserIntentResponse(
            intent=UserIntentEnum.ADD_EVIDENCE,
            confidence=0.90,
            entityId=entity_id,
            suggestedAction="ADD_EVIDENCE_MODAL",
            replyMessage="You can attach additional photos or evidence to increase the community corroboration score.",
        )
    else:
        return UserIntentResponse(
            intent=UserIntentEnum.CHECK_STATUS,
            confidence=0.75,
            entityId=entity_id,
            suggestedAction="VIEW_DASHBOARD",
            replyMessage="JanSahayak is actively tracking active civic incidents across your ward.",
        )


def classify_user_intent(user_message: str) -> UserIntentResponse:
    """
    Classifies natural language user queries into validated intent enums.
    Uses Gemini structured reasoning when API key is available, falling back to deterministic keyword parsing.
    """
    client = get_genai_client()
    if not client:
        return fallback_classify_intent(user_message)


    prompt = f"""
You are the JanSahayak Natural Language Intent Classifier for an autonomous civic case management platform.
Classify the following user message into exactly one of these intents:
- REPORT_ISSUE: User wants to submit or describe a new civic problem (pothole, garbage, streetlight, water leak, etc.).
- ADD_EVIDENCE: User has more photos/details for an existing issue.
- CHECK_STATUS: User asks about the progress, status, or timeline of a complaint or incident.
- FOLLOW_UP: User wants to send a reminder, follow-up, or complaint about delays.
- ESCALATE: User requests urgent escalation to higher authorities.
- RESOLUTION_FEEDBACK: User reports that the problem is fixed or completed.

User Message: "{user_message}"

Respond ONLY with a JSON object adhering to this schema:
{{
  "intent": "REPORT_ISSUE | ADD_EVIDENCE | CHECK_STATUS | FOLLOW_UP | ESCALATE | RESOLUTION_FEEDBACK",
  "confidence": 0.95,
  "entityId": "INC-xxxx or null",
  "suggestedAction": "short string action",
  "replyMessage": "Helpful friendly citizen response"
}}
"""
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        data = json.loads(response.text)
        return UserIntentResponse(
            intent=UserIntentEnum(data["intent"]),
            confidence=float(data.get("confidence", 0.95)),
            entityId=data.get("entityId"),
            suggestedAction=data.get("suggestedAction", ""),
            replyMessage=data.get("replyMessage", ""),
        )
    except Exception:
        return fallback_classify_intent(user_message)
