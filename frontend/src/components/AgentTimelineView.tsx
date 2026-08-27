import React from 'react';
import type { AuditEvent } from '../types';
import { Cpu, ShieldAlert, CheckCircle2, TrendingUp, AlertOctagon, User } from 'lucide-react';

interface AgentTimelineViewProps {
  events: AuditEvent[];
  incidentId?: string;
}

export const AgentTimelineView: React.FC<AgentTimelineViewProps> = ({ events, incidentId }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ComplaintClassified': return <Cpu size={16} color="#a855f7" />;
      case 'ComplaintMatchedToIncident': return <CheckCircle2 size={16} color="#06b6d4" />;
      case 'NewIncidentCreated': return <ShieldAlert size={16} color="#3b82f6" />;
      case 'ImpactScoreChanged': return <TrendingUp size={16} color="#f59e0b" />;
      case 'EscalationTriggered':
      case 'SLABreached': return <AlertOctagon size={16} color="#f43f5e" />;
      default: return <User size={16} color="#10b981" />;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            Autonomous Agent Decision & Event Timeline
          </h2>
          {incidentId && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Audit Stream for {incidentId}
            </span>
          )}
        </div>
        <span className="badge badge-normal">
          <Cpu size={12} /> Explainable AI Log
        </span>
      </div>

      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
          No audit events logged yet. Submit a complaint or trigger an authority action to observe agent execution.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
          {/* Vertical Timeline Line */}
          <div style={{ position: 'absolute', top: '15px', bottom: '15px', left: '19px', width: '2px', background: 'var(--border-glass)' }} />

          {events.map((evt, idx) => (
            <div key={evt.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(18, 24, 38, 0.95)', border: '1px solid var(--border-glass-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getEventIcon(evt.eventType)}
              </div>

              <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '0.8rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                      {evt.eventType}
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px', color: 'var(--primary-accent)' }}>
                      {evt.actorType}: {evt.actorId}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>

                <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                  {evt.decision}
                </p>

                {evt.reasonCodes && evt.reasonCodes.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {evt.reasonCodes.map((code, cIdx) => (
                      <span key={cIdx} style={{ fontSize: '0.68rem', color: 'var(--priority-normal)', background: 'rgba(16,185,129,0.1)', padding: '0.1rem 0.35rem', borderRadius: '3px', border: '1px solid rgba(16,185,129,0.2)' }}>
                        #{code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
