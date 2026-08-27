from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.agents.intent_router import classify_user_intent
from app.models.domain import UserIntentResponse

router = APIRouter(prefix="/api/v1/intent", tags=["Intent Routing"])


class IntentRequest(BaseModel):
    message: str


@router.post("/classify", response_model=UserIntentResponse)
async def classify_intent(request: IntentRequest):
    return classify_user_intent(request.message)
