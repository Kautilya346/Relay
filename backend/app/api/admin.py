from fastapi import APIRouter
from app.models.domain import EscalationPolicyConfig
from app.schemas.api_schemas import PolicyUpdateResponse
from app.repositories.db_repository import db

router = APIRouter(prefix="/api/v1/admin", tags=["Admin & Policy"])


@router.get("/policies", response_model=PolicyUpdateResponse)
async def get_policies():
    config = db.get_policy_config()
    return PolicyUpdateResponse(success=True, config=config)


@router.put("/policies", response_model=PolicyUpdateResponse)
async def update_policies(new_config: EscalationPolicyConfig):
    db.update_policy_config(new_config)
    return PolicyUpdateResponse(success=True, config=new_config)


@router.get("/authorities")
async def list_authorities():
    authorities = db.list_authorities()
    return {"success": True, "count": len(authorities), "authorities": authorities}


from pydantic import BaseModel

from app.agents.portal_discovery import discover_authority_portal, DiscoveredPortalResult


class DiscoverPortalRequest(BaseModel):
    location: str
    category: str = "Road & Potholes"


@router.post("/authorities/discover", response_model=DiscoveredPortalResult)
async def discover_portal(request: DiscoverPortalRequest):
    """Discovers official government grievance portal using Google Search Grounding with Gemini."""
    result = await discover_authority_portal(
        location_query=request.location,
        category=request.category,
    )
    return result


