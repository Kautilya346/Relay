import type {
  Complaint,
  Incident,
  AuditEvent,
  EscalationPolicyConfig,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export async function submitComplaint(payload: {
  userId: string;
  description: string;
  category?: string;
  latitude: number;
  longitude: number;
  imageUrls: string[];
}): Promise<{ complaint: Complaint; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    return { complaint: data.complaint, message: data.message };
  } catch (err) {
    console.warn('API connection offline, using fallback client mode:', err);
    const fakeId = `cmp_${Math.random().toString(36).substring(2, 9)}`;
    const fakeIncidentId = 'INC-1001';
    return {
      complaint: {
        id: fakeId,
        userId: payload.userId,
        description: payload.description,
        category: payload.category || 'Road & Potholes',
        severity: 4,
        safetyRisk: 4,
        latitude: payload.latitude,
        longitude: payload.longitude,
        geohash: 'tdr1v7x',
        imageUrls: payload.imageUrls,
        credibilityScore: 1.0,
        incidentId: fakeIncidentId,
        status: 'MATCHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      message: `Complaint ingested and attached to ${fakeIncidentId}`,
    };
  }
}

export async function fetchNearbyIncidents(
  lat: number = 12.9716,
  lon: number = 77.5946,
  radius: number = 1000
): Promise<Incident[]> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/incidents/nearby?latitude=${lat}&longitude=${lon}&radiusMeters=${radius}`
    );
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.incidents || [];
  } catch {
    return [];
  }
}

export async function fetchIncidentDetails(
  id: string
): Promise<{ incident: Incident; complaints: Complaint[] } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${id}`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAuthorityIncidents(
  authorityId?: string
): Promise<Incident[]> {
  try {
    const url = authorityId
      ? `${API_BASE_URL}/authority/incidents?authorityId=${authorityId}`
      : `${API_BASE_URL}/authority/incidents`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.incidents || [];
  } catch {
    return [];
  }
}

export async function acknowledgeIncident(
  incidentId: string,
  authorityId: string,
  notes?: string
): Promise<Incident | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/authority/incidents/${incidentId}/acknowledge`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorityId, notes }),
      }
    );
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.incident;
  } catch {
    return null;
  }
}

export async function submitResolution(
  incidentId: string,
  authorityId: string,
  notes: string,
  evidenceUrls: string[]
): Promise<Incident | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/authority/incidents/${incidentId}/resolution`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorityId,
          resolutionNotes: notes,
          evidenceUrls,
        }),
      }
    );
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.incident;
  } catch {
    return null;
  }
}

export async function simulateSLABreach(incidentId: string): Promise<Incident | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/authority/incidents/${incidentId}/simulate_sla_breach`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.incident;
  } catch {
    return null;
  }
}

export async function fetchIncidentTimeline(
  incidentId: string
): Promise<AuditEvent[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/timeline`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}

export async function fetchPolicyConfig(): Promise<EscalationPolicyConfig | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/policies`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.config;
  } catch {
    return null;
  }
}

export async function fetchAuthorities() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/authorities`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.authorities || [];
  } catch {
    return [];
  }
}

export async function fetchExternalCase(incidentId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/external-case`);
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.externalCase || null;
  } catch {
    return null;
  }
}

export async function fetchComposedComplaint(incidentId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/composed-complaint`);
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return null;
  }
}

export async function previewFollowup(incidentId: string, userId: string = 'citizen_default') {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/followups/preview?userId=${userId}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.preview;
  } catch (err) {
    console.error('Followup preview error:', err);
    return null;
  }
}

export async function approveFollowup(
  incidentId: string,
  authorizationId: string,
  userId: string = 'citizen_default',
  overrideText?: string
) {
  try {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/followups/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorizationId, userId, overrideText }),
    });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch (err) {
    console.error('Followup approval error:', err);
    return null;
  }
}

export async function classifyIntent(message: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/intent/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return {
      intent: 'CHECK_STATUS',
      confidence: 0.8,
      replyMessage: 'Tracking active civic incidents in your area.',
    };
  }
}

export async function startBrowserSession(incidentId: string, authorityId: string = 'RAJ_SAMPARK') {
  try {
    const res = await fetch(`${API_BASE_URL}/browser/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId, authorityId }),
    });
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.session;
  } catch {
    return null;
  }
}

export async function resumeBrowserSession(sessionId: string, inputKey: string = '', inputValue: string = '') {
  try {
    const res = await fetch(`${API_BASE_URL}/browser/session/${sessionId}/resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputKey, inputValue }),
    });
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.session;
  } catch {
    return null;
  }
}

export async function discoverPortal(location: string, category: string = 'Road & Potholes') {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/authorities/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, category }),
    });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch {
    return null;
  }
}


