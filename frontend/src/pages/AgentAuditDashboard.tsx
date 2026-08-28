import React from 'react';
import type { AuditEvent } from '../types';
import { AgentTimelineView } from '../components/AgentTimelineView';
import { Cpu } from 'lucide-react';

interface AgentAuditDashboardProps {
  events: AuditEvent[];
}

export const AgentAuditDashboard: React.FC<AgentAuditDashboardProps> = ({ events }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ paddingBottom: '1.75rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-secondary)',
          marginBottom: '0.75rem',
        }}>
          <Cpu size={12} />
          Autonomous Audit & System Log
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, letterSpacing: '-0.04em', marginBottom: '0.4rem' }}>
              Agent Explainability Monitor
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--text-secondary)' }}>
              Every autonomous classification, impact score update, and policy escalation is captured immutably.
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '2rem' }}>
            <div style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1 }}>{events.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>Events Audited</div>
          </div>
        </div>
      </div>

      <AgentTimelineView events={events} />
    </div>
  );
};
