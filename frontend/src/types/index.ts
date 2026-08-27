export type IncidentPriority = 'NORMAL' | 'PRIORITY' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED';
export type ComplaintStatus = 'SUBMITTED' | 'CLASSIFIED' | 'MATCHED' | 'REJECTED';
export type ActorType = 'SYSTEM' | 'CITIZEN' | 'AUTHORITY' | 'AGENT';

export interface LocationModel {
  latitude: number;
  longitude: number;
}

export interface SLAModel {
  responseDeadline: string;
  resolutionDeadline: string;
  status: 'ON_TIME' | 'APPROACHING' | 'BREACHED';
}

export interface Complaint {
  id: string;
  userId: string;
  description: string;
  category: string;
  severity: number;
  safetyRisk: number;
  latitude: number;
  longitude: number;
  geohash: string;
  imageUrls: string[];
  credibilityScore: number;
  incidentId?: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  category: string;
  title: string;
  summary: string;
  centerLocation: LocationModel;
  radiusMeters: number;
  geohashPrefixes: string[];
  firstReportedAt: string;
  lastReportedAt: string;
  reportCount: number;
  uniqueCitizenCount: number;
  verifiedEvidenceCount: number;
  severity: number;
  safetyRisk: number;
  persistenceScore: number;
  densityScore: number;
  impactScore: number;
  priority: IncidentPriority;
  authorityId: string;
  escalationLevel: number;
  sla?: SLAModel;
  status: IncidentStatus;
  complaintIds: string[];
  reporterIds: string[];
  resolutionEvidenceUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Escalation {
  id: string;
  incidentId: string;
  fromAuthorityId: string;
  toAuthorityId: string;
  trigger: string;
  reasonCodes: string[];
  impactScore: number;
  createdAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
}

export interface AuditEvent {
  id: string;
  eventType: string;
  entityId: string;
  correlationId?: string;
  actorType: ActorType;
  actorId: string;
  decision?: string;
  reasonCodes: string[];
  metadata: Record<string, any>;
  timestamp: string;
}

export interface ImpactWeights {
  communityWeight: number;
  severityWeight: number;
  safetyWeight: number;
  persistenceWeight: number;
  densityWeight: number;
}

export interface PriorityThresholds {
  normalMax: number;
  priorityMax: number;
  highMax: number;
  criticalMin: number;
}

export interface EscalationPolicyConfig {
  weights: ImpactWeights;
  thresholds: PriorityThresholds;
  reportThresholdPriority: number;
  reportThresholdEscalate: number;
  immediateEscalationImpact: number;
}

export interface AuthorityIntegration {
  authority_id: string;
  name: string;
  jurisdiction: Record<string, any>;
  categories: string[];
  official_domain: string;
  integration_type: 'API' | 'BROWSER' | 'EMAIL' | 'HANDOFF';
  verification_status: 'VERIFIED' | 'SANDBOX' | 'PENDING';
  requires_user_auth: boolean;
  requires_submission_approval: boolean;
  allowed_actions: string[];
  adapter_version: string;
  contact_email?: string;
  portal_url?: string;
}

export interface ExternalCase {
  id: string;
  incidentId: string;
  authorityId: string;
  externalComplaintId: string;
  channel: string;
  submittedAt: string;
  status: string;
  adapterVersion: string;
  lastCheckedAt: string;
  lastResponse?: string;
  externalUrl?: string;
  actionHistory?: any[];
}

export interface FollowupPreview {
  authorizationId: string;
  incidentId: string;
  externalCaseId: string;
  targetAuthority: string;
  followupText: string;
  payloadHash: string;
  expiresAt: string;
  status: string;
}

export interface UserIntentResponse {
  intent: 'REPORT_ISSUE' | 'ADD_EVIDENCE' | 'CHECK_STATUS' | 'FOLLOW_UP' | 'ESCALATE' | 'RESOLUTION_FEEDBACK';
  confidence: number;
  entityId?: string;
  suggestedAction: string;
  replyMessage: string;
}

export interface BrowserSession {
  sessionId: string;
  incidentId: string;
  authorityId: string;
  currentUrl: string;
  state: 'IDLE' | 'RUNNING' | 'CAPTCHA_REQUIRED' | 'OTP_REQUIRED' | 'IDENTITY_VERIFICATION_REQUIRED' | 'USER_APPROVAL_REQUIRED' | 'USER_EDIT_REQUIRED' | 'RESUME' | 'SUBMITTED';
  message: string;
  filledFields: Record<string, string>;
  referenceNumber?: string;
  updatedAt: string;
}

