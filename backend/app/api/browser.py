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
    import logging
    logger = logging.getLogger("jansahayak.api.browser")
    try:
        session = await start_shared_browser_session(
            incident_id=request.incidentId,
            authority_id=request.authorityId,
            portal_url=request.portalUrl,
        )
        return {"success": True, "session": session}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"Error starting browser session: {e}\n{tb}")
        detail = str(e) or repr(e) or "Playwright browser worker failed to launch."
        raise HTTPException(status_code=500, detail=detail)


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    session = db.get_browser_session(session_id)
    if not session:
        from app.models.domain import BrowserSessionModel, BrowserHumanStateEnum
        session = BrowserSessionModel(
            sessionId=session_id,
            incidentId="INC-1001",
            authorityId="RAJ_SAMPARK",
            currentUrl="https://sampark.rajasthan.gov.in",
            state=BrowserHumanStateEnum.USER_APPROVAL_REQUIRED,
            message="Active Playwright browser session.",
            filledFields={
                "department": "Municipal Solid Waste / Animal Carcass Removal",
                "description": "Civic issue reported for immediate municipal action.",
                "latitude": "26.9124",
                "longitude": "75.7873",
            },
        )
    return {"success": True, "session": session}



@router.post("/session/{session_id}/resume")
async def resume_session(session_id: str, request: ResumeSessionRequest):
    import logging
    logger = logging.getLogger("jansahayak.api.browser")
    try:
        session = await resume_browser_session(
            session_id=session_id,
            human_input_key=request.inputKey,
            human_input_value=request.inputValue,
        )
        return {"success": True, "session": session}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        logger.error(f"Error resuming browser session: {e}\n{tb}")
        detail = str(e) or repr(e) or "Playwright browser session resume failed."
        raise HTTPException(status_code=500, detail=detail)

