from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.domain import (
    ComplaintModel,
    IncidentModel,
    EscalationModel,
    AuditEventModel,
    EscalationPolicyConfig
)


class ComplaintCreateRequest(BaseModel):
    userId: str = "citizen_default"
    description: str
    category: Optional[str] = None
    latitude: float
    longitude: float
    imageUrls: List[str] = Field(default_factory=list)


class ComplaintResponse(BaseModel):
    success: bool = True
    complaint: ComplaintModel
    message: str = ""


class IncidentResponse(BaseModel):
    success: bool = True
    incident: IncidentModel
    complaints: List[ComplaintModel] = Field(default_factory=list)


class IncidentListResponse(BaseModel):
    success: bool = True
    count: int
    incidents: List[IncidentModel]


class AuthorityActionRequest(BaseModel):
    authorityId: str = "LOCAL_MUNICIPAL_WARD"
    notes: Optional[str] = None


class AuthorityAssignRequest(BaseModel):
    authorityId: str = "LOCAL_MUNICIPAL_WARD"
    assignedTo: str
    notes: Optional[str] = None


class AuthorityProgressRequest(BaseModel):
    authorityId: str = "LOCAL_MUNICIPAL_WARD"
    progressNotes: str
    status: Optional[str] = None


class AuthorityResolutionRequest(BaseModel):
    authorityId: str = "LOCAL_MUNICIPAL_WARD"
    resolutionNotes: str
    evidenceUrls: List[str] = Field(default_factory=list)


class PolicyUpdateResponse(BaseModel):
    success: bool = True
    config: EscalationPolicyConfig


class TimelineResponse(BaseModel):
    success: bool = True
    incidentId: str
    events: List[AuditEventModel]
