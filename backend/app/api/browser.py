from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from app.services.browser_session import start_shared_browser_session, resume_browser_session
from app.repositories.db_repository import db

router = APIRouter(prefix="/api/v1/browser", tags=["Shared Control Browser"])


class StartSessionRequest(BaseModel):
    incidentId: str
    authorityId: str = "RAJ_SAMPARK"
    portalUrl: Optional[str] = None


class ResumeSessionRequest(BaseModel):
    inputKey: str = ""
    inputValue: str = ""


@router.post("/session/start")
async def start_session(request: StartSessionRequest):
    try:
        session = await start_shared_browser_session(
            incident_id=request.incidentId,
            authority_id=request.authorityId,
            portal_url=request.portalUrl,
        )
        return {"success": True, "session": session}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    session = db.get_browser_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Browser session not found")
    return {"success": True, "session": session}


@router.post("/session/{session_id}/resume")
async def resume_session(session_id: str, request: ResumeSessionRequest):
    try:
        session = await resume_browser_session(
            session_id=session_id,
            human_input_key=request.inputKey,
            human_input_value=request.inputValue,
        )
        return {"success": True, "session": session}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
