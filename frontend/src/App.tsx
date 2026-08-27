import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CitizenHome } from './pages/CitizenHome';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { AgentAuditDashboard } from './pages/AgentAuditDashboard';
import { AdminPolicyPage } from './pages/AdminPolicyPage';
import { AuthorityRegistryPage } from './pages/AuthorityRegistryPage';
import { CitizenReportModal } from './components/CitizenReportModal';
import { AuthorityActionModal } from './components/AuthorityActionModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { FollowupApprovalModal } from './components/FollowupApprovalModal';
import { EvidenceComplaintModal } from './components/EvidenceComplaintModal';
import { SharedBrowserModal } from './components/SharedBrowserModal';
import { NLAssistantWidget } from './components/NLAssistantWidget';
import type { Incident, Complaint, AuditEvent, EscalationPolicyConfig, FollowupPreview } from './types';
import {
  fetchNearbyIncidents,
  previewFollowup,
} from './services/api';

// Initial fallback mock incidents for demo
const INITIAL_MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-1001',
    category: 'Road & Potholes',
    title: 'Severe Crater & Pothole Cluster on MG Road',
    summary: 'Multiple citizens reported a 6-foot wide deep crater near MG Road Metro station pillar 120 causing vehicle skids and bottleneck traffic.',
    centerLocation: { latitude: 12.9716, longitude: 77.5946 },
    radiusMeters: 100,
    geohashPrefixes: ['tdr1v'],
    firstReportedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastReportedAt: new Date().toISOString(),
    reportCount: 21,
    uniqueCitizenCount: 21,
    verifiedEvidenceCount: 6,
    severity: 4,
    safetyRisk: 4,
    persistenceScore: 30,
    densityScore: 40,
    impactScore: 82.0,
    priority: 'HIGH',
    authorityId: 'LOCAL_MUNICIPAL_WARD',
    escalationLevel: 0,
    status: 'OPEN',
    complaintIds: ['cmp_01', 'cmp_02', 'cmp_03'],
    reporterIds: ['user_01', 'user_02', 'user_03'],
    resolutionEvidenceUrls: [],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INC-1002',
    category: 'Sanitation & Garbage',
    title: 'Overflowing Commercial Garbage Heap',
    summary: 'Massive uncollected garbage pile behind Ward 80 market entrance blocking pedestrian walkway and emitting foul odor.',
    centerLocation: { latitude: 12.9725, longitude: 77.5955 },
    radiusMeters: 80,
    geohashPrefixes: ['tdr1v'],
    firstReportedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    lastReportedAt: new Date().toISOString(),
    reportCount: 14,
    uniqueCitizenCount: 14,
    verifiedEvidenceCount: 4,
    severity: 3,
    safetyRisk: 3,
    persistenceScore: 40,
    densityScore: 35,
    impactScore: 68.5,
    priority: 'PRIORITY',
    authorityId: 'ZONAL_CIVIC_DEPARTMENT',
    escalationLevel: 1,
    status: 'IN_PROGRESS',
    complaintIds: ['cmp_10'],
    reporterIds: ['user_10'],
    resolutionEvidenceUrls: [],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'INC-1003',
    category: 'Street Lighting',
    title: 'Dark Corridor - 4 Broken Street lamps',
    summary: 'Unlit 200m stretch on 10th Main Road creating severe safety risk for evening commuters and women.',
    centerLocation: { latitude: 12.9730, longitude: 77.5930 },
    radiusMeters: 150,
    geohashPrefixes: ['tdr1v'],
    firstReportedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastReportedAt: new Date().toISOString(),
    reportCount: 8,
    uniqueCitizenCount: 8,
    verifiedEvidenceCount: 2,
    severity: 3,
    safetyRisk: 4,
    persistenceScore: 50,
    densityScore: 20,
    impactScore: 54.0,
    priority: 'PRIORITY',
    authorityId: 'LOCAL_MUNICIPAL_WARD',
    escalationLevel: 0,
    status: 'OPEN',
    complaintIds: ['cmp_20'],
    reporterIds: ['user_20'],
    resolutionEvidenceUrls: [],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function App() {
  const [activeTab, setActiveTab] = useState<'citizen' | 'authority' | 'agent' | 'admin' | 'registry'>('citizen');
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_MOCK_INCIDENTS);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [policyConfig, setPolicyConfig] = useState<EscalationPolicyConfig | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [actionIncident, setActionIncident] = useState<Incident | null>(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Advanced Flow Modals
  const [followupPreviewData, setFollowupPreviewData] = useState<FollowupPreview | null>(null);
  const [evidenceModalIncidentId, setEvidenceModalIncidentId] = useState<string | null>(null);
  const [browserModalIncidentId, setBrowserModalIncidentId] = useState<string | null>(null);

  const loadBackendData = async () => {
    try {
      const data = await fetchNearbyIncidents();
      if (data && data.length > 0) {
        setIncidents(data);
        setIsBackendConnected(true);
      } else {
        setIsBackendConnected(false);
      }
    } catch {
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    loadBackendData();
    const interval = setInterval(loadBackendData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenFollowupApproval = async (incidentId: string) => {
    const preview = await previewFollowup(incidentId, 'citizen_operator');
    if (preview) {
      setFollowupPreviewData(preview);
    }
  };

  const handleComplaintSuccess = (newComplaint: Complaint) => {
    loadBackendData();
    const newEvt: AuditEvent = {
      id: `audit_${Math.random().toString(36).substring(2, 9)}`,
      eventType: 'ComplaintMatchedToIncident',
      entityId: newComplaint.incidentId || 'INC-1001',
      actorType: 'AGENT',
      actorId: 'matcher_agent',
      decision: `Complaint ${newComplaint.id} verified and grouped. Impact score recalculated.`,
      reasonCodes: ['SEMANTIC_MATCH_VERIFIED', 'IMPACT_RECALCULATED'],
      metadata: {},
      timestamp: new Date().toISOString(),
    };
    setEvents((prev) => [newEvt, ...prev]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        isBackendConnected={isBackendConnected}
      />

      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {activeTab === 'citizen' && (
          <CitizenHome
            incidents={incidents}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setIsDetailModalOpen(true);
            }}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'authority' && (
          <AuthorityDashboard
            incidents={incidents}
            onSelectIncident={(inc) => {
              setSelectedIncident(inc);
              setIsDetailModalOpen(true);
            }}
            onOpenActionModal={(inc) => {
              setActionIncident(inc);
              setIsActionModalOpen(true);
            }}
          />
        )}

        {activeTab === 'agent' && <AgentAuditDashboard events={events} />}

        {activeTab === 'registry' && <AuthorityRegistryPage />}

        {activeTab === 'admin' && (
          <AdminPolicyPage
            policyConfig={policyConfig}
            onUpdatePolicy={(cfg) => setPolicyConfig(cfg)}
          />
        )}
      </main>

      {/* Natural Language Assistant Floating Widget */}
      <NLAssistantWidget
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenFollowupModal={handleOpenFollowupApproval}
      />

      {/* Core Modals */}
      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={handleComplaintSuccess}
      />

      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      <AuthorityActionModal
        incident={actionIncident}
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onRefresh={loadBackendData}
      />

      {/* Advanced Human-in-the-Loop & Adapter Modals */}
      <FollowupApprovalModal
        preview={followupPreviewData}
        onClose={() => setFollowupPreviewData(null)}
        onApproved={loadBackendData}
      />

      <EvidenceComplaintModal
        incidentId={evidenceModalIncidentId}
        onClose={() => setEvidenceModalIncidentId(null)}
      />

      <SharedBrowserModal
        incidentId={browserModalIncidentId}
        onClose={() => setBrowserModalIncidentId(null)}
      />
    </div>
  );
}

export default App;

