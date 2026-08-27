from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


def current_iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


class ComplaintStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    CLASSIFIED = "CLASSIFIED"
    MATCHED = "MATCHED"
    REJECTED = "REJECTED"


class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REOPENED = "REOPENED"


class IncidentPriority(str, Enum):
    NORMAL = "NORMAL"
    PRIORITY = "PRIORITY"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ActorType(str, Enum):
    SYSTEM = "SYSTEM"
    CITIZEN = "CITIZEN"
    AUTHORITY = "AUTHORITY"
    AGENT = "AGENT"


class ComplaintModel(BaseModel):
    id: str
    userId: str
    description: str
    category: str = "Unclassified"
    severity: int = 1
    safetyRisk: int = 1
    latitude: float
    longitude: float
    geohash: str = ""
    imageUrls: List[str] = Field(default_factory=list)
    credibilityScore: float = 1.0
    incidentId: Optional[str] = None
    status: ComplaintStatus = ComplaintStatus.SUBMITTED
    createdAt: str = Field(default_factory=current_iso_timestamp)
    updatedAt: str = Field(default_factory=current_iso_timestamp)


class LocationModel(BaseModel):
    latitude: float
    longitude: float


class SLAModel(BaseModel):
    responseDeadline: str
    resolutionDeadline: str
    status: str = "ON_TIME"  # ON_TIME, APPROACHING, BREACHED


class IncidentModel(BaseModel):
    id: str
    category: str
    title: str = ""
    summary: str = ""
    centerLocation: LocationModel
    radiusMeters: float = 100.0
    geohashPrefixes: List[str] = Field(default_factory=list)
    firstReportedAt: str = Field(default_factory=current_iso_timestamp)
    lastReportedAt: str = Field(default_factory=current_iso_timestamp)
    reportCount: int = 1
    uniqueCitizenCount: int = 1
    verifiedEvidenceCount: int = 0
    severity: float = 1.0
    safetyRisk: float = 1.0
    persistenceScore: float = 10.0
    densityScore: float = 10.0
    impactScore: float = 0.0
    priority: IncidentPriority = IncidentPriority.NORMAL
    authorityId: str = "LOCAL_MUNICIPAL_WARD"
    escalationLevel: int = 0
    sla: Optional[SLAModel] = None
    status: IncidentStatus = IncidentStatus.OPEN
    complaintIds: List[str] = Field(default_factory=list)
    reporterIds: List[str] = Field(default_factory=list)
    resolutionEvidenceUrls: List[str] = Field(default_factory=list)
    createdAt: str = Field(default_factory=current_iso_timestamp)
    updatedAt: str = Field(default_factory=current_iso_timestamp)


class EscalationModel(BaseModel):
    id: str
    incidentId: str
    fromAuthorityId: str
    toAuthorityId: str
    trigger: str
    reasonCodes: List[str] = Field(default_factory=list)
    impactScore: float
    createdAt: str = Field(default_factory=current_iso_timestamp)
    acknowledgedAt: Optional[str] = None
    completedAt: Optional[str] = None


class AuditEventModel(BaseModel):
    id: str
    eventType: str
    entityId: str
    correlationId: str = ""
    actorType: ActorType = ActorType.SYSTEM
    actorId: str = "system"
    decision: Optional[str] = None
    reasonCodes: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=current_iso_timestamp)


class ImpactWeights(BaseModel):
    communityWeight: float = 0.35
    severityWeight: float = 0.25
    safetyWeight: float = 0.20
    persistenceWeight: float = 0.10
    densityWeight: float = 0.10


class PriorityThresholds(BaseModel):
    normalMax: float = 49.0
    priorityMax: float = 69.0
    highMax: float = 84.0
    criticalMin: float = 85.0


class EscalationPolicyConfig(BaseModel):
    weights: ImpactWeights = Field(default_factory=ImpactWeights)
    thresholds: PriorityThresholds = Field(default_factory=PriorityThresholds)
    reportThresholdPriority: int = 20
    reportThresholdEscalate: int = 50
    immediateEscalationImpact: float = 85.0


class UserIntentEnum(str, Enum):
    REPORT_ISSUE = "REPORT_ISSUE"
    ADD_EVIDENCE = "ADD_EVIDENCE"
    CHECK_STATUS = "CHECK_STATUS"
    FOLLOW_UP = "FOLLOW_UP"
    ESCALATE = "ESCALATE"
    RESOLUTION_FEEDBACK = "RESOLUTION_FEEDBACK"


class UserIntentResponse(BaseModel):
    intent: UserIntentEnum
    confidence: float = 0.95
    entityId: Optional[str] = None
    suggestedAction: str = ""
    replyMessage: str = ""


class AuthorityIntegrationModel(BaseModel):
    authority_id: str
    name: str
    jurisdiction: Dict[str, Any] = Field(default_factory=dict)
    categories: List[str] = Field(default_factory=list)
    official_domain: str = ""
    integration_type: str = "API"  # API, BROWSER, EMAIL, HANDOFF
    verification_status: str = "VERIFIED"  # VERIFIED, SANDBOX, PENDING
    requires_user_auth: bool = False
    requires_submission_approval: bool = True
    allowed_actions: List[str] = Field(
        default_factory=lambda: ["CREATE_COMPLAINT", "CHECK_STATUS", "SEND_REMINDER"]
    )
    adapter_version: str = "1.0"
    contact_email: Optional[str] = None
    portal_url: Optional[str] = None


class ExternalCaseModel(BaseModel):
    id: str
    incidentId: str
    authorityId: str
    externalComplaintId: str
    channel: str = "SANDBOX"  # API, BROWSER, EMAIL, SANDBOX, HANDOFF
    submittedAt: str = Field(default_factory=current_iso_timestamp)
    status: str = "PENDING"  # PENDING, ACKNOWLEDGED, IN_PROGRESS, CLOSED
    adapterVersion: str = "1.0"
    lastCheckedAt: str = Field(default_factory=current_iso_timestamp)
    lastResponse: Optional[str] = None
    externalUrl: Optional[str] = None
    actionHistory: List[Dict[str, Any]] = Field(default_factory=list)


class AuthorizationModel(BaseModel):
    authorizationId: str
    userId: str
    incidentId: str
    action: str = "SEND_FOLLOWUP"  # SEND_FOLLOWUP, SUBMIT_EXTERNAL_CASE, ESCALATE
    payloadHash: str
    payloadSummary: str
    createdAt: str = Field(default_factory=current_iso_timestamp)
    expiresAt: str
    status: str = "PENDING"  # PENDING, APPROVED, REJECTED, EXPIRED


class BrowserHumanStateEnum(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    CAPTCHA_REQUIRED = "CAPTCHA_REQUIRED"
    OTP_REQUIRED = "OTP_REQUIRED"
    IDENTITY_VERIFICATION_REQUIRED = "IDENTITY_VERIFICATION_REQUIRED"
    USER_APPROVAL_REQUIRED = "USER_APPROVAL_REQUIRED"
    USER_EDIT_REQUIRED = "USER_EDIT_REQUIRED"
    RESUME = "RESUME"
    SUBMITTED = "SUBMITTED"


class BrowserSessionModel(BaseModel):
    sessionId: str
    incidentId: str
    authorityId: str
    currentUrl: str
    state: BrowserHumanStateEnum = BrowserHumanStateEnum.IDLE
    message: str = ""
    filledFields: Dict[str, str] = Field(default_factory=dict)
    referenceNumber: Optional[str] = None
    updatedAt: str = Field(default_factory=current_iso_timestamp)

