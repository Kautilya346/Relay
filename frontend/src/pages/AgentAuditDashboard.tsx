import React from 'react';
import type { AuditEvent } from '../types';
import { AgentTimelineView } from '../components/AgentTimelineView';
import { Cpu } from 'lucide-react';

interface AgentAuditDashboardProps {
  events: AuditEvent[];
}

export const AgentAuditDashboard: React.FC<AgentAuditDashboardProps> = ({ events }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-normal" style={{ marginBottom: '0.5rem' }}>
            <Cpu size={12} /> Autonomous Audit & System Log
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Agent Execution & Explainability Monitor</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Every autonomous classification, candidate match, impact score update, and policy escalation is captured immutably.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
            {events.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Events Audited</div>
        </div>
      </div>

      <AgentTimelineView events={events} />
    </div>
  );
};
