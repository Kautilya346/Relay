from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.adapters import registry

router = APIRouter(prefix="/api/v1/sandbox", tags=["Authority Sandbox"])


class SandboxComplaintRequest(BaseModel):
    category: str
    description: str
    latitude: float = 26.9124
    longitude: float = 75.7873
    reporter: str = "citizen_demo"


class SandboxFollowupRequest(BaseModel):
    message: str


class SandboxResolveRequest(BaseModel):
    evidenceUrl: str = "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8"
    completionNotes: str = "Pothole filled with dense asphalt and rolled smooth."


@router.post("/complaints")
async def create_sandbox_complaint(request: SandboxComplaintRequest):
    adapter = registry.get("SANDBOX_SIMULATOR")
    if not adapter:
        raise HTTPException(status_code=500, detail="Sandbox simulator not registered")

    result = adapter.submit(request.model_dump())
    return {"success": result.success, "result": result.to_dict()}


@router.get("/complaints/{external_id}")
async def get_sandbox_complaint(external_id: str):
    adapter = registry.get("SANDBOX_SIMULATOR")
    if not adapter:
        raise HTTPException(status_code=500, detail="Sandbox simulator not registered")

    result = adapter.get_status(external_id)
    return {"success": result.success, "result": result.to_dict()}


@router.post("/complaints/{external_id}/followup")
async def send_sandbox_followup(external_id: str, request: SandboxFollowupRequest):
    adapter = registry.get("SANDBOX_SIMULATOR")
    if not adapter:
        raise HTTPException(status_code=500, detail="Sandbox simulator not registered")

    result = adapter.send_followup(external_id, request.message)
    return {"success": result.success, "result": result.to_dict()}


@router.post("/complaints/{external_id}/resolve")
async def resolve_sandbox_complaint(external_id: str, request: SandboxResolveRequest):
    adapter = registry.get("SANDBOX_SIMULATOR")
    if not adapter or not hasattr(adapter, "simulate_resolution"):
        raise HTTPException(status_code=500, detail="Sandbox simulator not available")

    result = adapter.simulate_resolution(external_id, request.evidenceUrl)
    return {"success": result.success, "result": result.to_dict()}
