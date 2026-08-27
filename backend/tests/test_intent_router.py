import pytest
from app.agents.intent_router import fallback_classify_intent
from app.models.domain import UserIntentEnum


def test_intent_report_issue():
    res = fallback_classify_intent("Huge pothole near Gate 2 on Tonk Road causing accidents")
    assert res.intent == UserIntentEnum.REPORT_ISSUE
    assert res.confidence >= 0.90


def test_intent_check_status():
    res = fallback_classify_intent("What happened to my complaint INC-4821?")
    assert res.intent == UserIntentEnum.CHECK_STATUS
    assert res.entityId == "INC-4821"


def test_intent_follow_up():
    res = fallback_classify_intent("Send them a reminder for INC-1001, it is taking too long")
    assert res.intent == UserIntentEnum.FOLLOW_UP
    assert res.entityId == "INC-1001"


def test_intent_escalate():
    res = fallback_classify_intent("This is an emergency, escalate to commissioner")
    assert res.intent == UserIntentEnum.ESCALATE


def test_intent_resolution_feedback():
    res = fallback_classify_intent("The road was repaired and fixed today")
    assert res.intent == UserIntentEnum.RESOLUTION_FEEDBACK
