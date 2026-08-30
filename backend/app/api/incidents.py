from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Query
from app.models.domain import IncidentModel
from app.schemas.api_schemas import (
    IncidentResponse,
    IncidentListResponse,
    TimelineResponse
)
from app.repositories.db_repository import db

router = APIRouter(prefix="/api/v1", tags=["Incidents"])


@router.get("/incidents/nearby", response_model=IncidentListResponse)
async def get_nearby_incidents(
    latitude: float = Query(..., description="Center latitude"),
    longitude: float = Query(..., description="Center longitude"),
    radiusMeters: float = Query(500.0, description="Radius in meters")
):
    incidents = db.find_nearby_incidents(latitude, longitude, radiusMeters)
    return IncidentListResponse(success=True, count=len(incidents), incidents=incidents)


@router.get("/citizens/me/incidents", response_model=IncidentListResponse)
async def get_citizen_incidents(userId: str = Query("citizen_default", description="User ID")):
    user_complaints = db.list_complaints_by_user(userId)
    incident_ids = list(set([c.incidentId for c in user_complaints if c.incidentId]))
    incidents = [db.get_incident(iid) for iid in incident_ids if db.get_incident(iid)]
    return IncidentListResponse(success=True, count=len(incidents), incidents=incidents)


@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident_details(incident_id: str):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    complaints = db.list_complaints_by_incident(incident_id)
    return IncidentResponse(success=True, incident=incident, complaints=complaints)


@router.get("/incidents/{incident_id}/timeline", response_model=TimelineResponse)
async def get_incident_timeline(incident_id: str):
    events = db.get_timeline_for_incident(incident_id)
    return TimelineResponse(success=True, incidentId=incident_id, events=events)


@router.get("/audit/events")
async def get_all_audit_events():
    events = db.list_audit_events()
    return {"success": True, "count": len(events), "events": events}



@router.get("/incidents/{incident_id}/composed-complaint")
async def get_composed_complaint(incident_id: str):
    from app.services.complaint_composer import compose_evidence_based_complaint
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    composed_text = compose_evidence_based_complaint(incident)
    return {
        "success": True,
        "incidentId": incident_id,
        "priority": incident.priority.value,
        "impactScore": incident.impactScore,
        "composedComplaintText": composed_text,
    }


@router.get("/incidents/{incident_id}/external-case")
async def get_external_case(incident_id: str):
    case = db.get_external_case_by_incident(incident_id)
    return {
        "success": True,
        "incidentId": incident_id,
        "hasExternalCase": case is not None,
        "externalCase": case,
    }


@router.post("/incidents/{incident_id}/followups/preview")
async def preview_followup(
    incident_id: str,
    userId: str = Query("citizen_default", description="Citizen user ID")
):
    from app.services.followup_service import prepare_followup_preview
    try:
        preview = prepare_followup_preview(incident_id, userId)
        return {"success": True, "preview": preview}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class FollowupApproveRequest(BaseModel):
    authorizationId: str
    userId: str = "citizen_default"
    overrideText: Optional[str] = None


@router.post("/incidents/{incident_id}/followups/approve")
async def approve_followup(incident_id: str, request: FollowupApproveRequest):
    from app.services.followup_service import approve_and_send_followup
    try:
        result = approve_and_send_followup(
            incident_id=incident_id,
            authorization_id=request.authorizationId,
            user_id=request.userId,
            override_text=request.overrideText,
        )
        return {"success": True, "result": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

