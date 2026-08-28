import React from 'react';
import type { AuditEvent } from '../types';
import { Cpu, ShieldAlert, CheckCircle2, TrendingUp, AlertOctagon, User } from 'lucide-react';

interface AgentTimelineViewProps {
  events: AuditEvent[];
  incidentId?: string;
}

const EVENT_COLORS: Record<string, string> = {
  ComplaintClassified: 'var(--priority-priority)',
  ComplaintMatchedToIncident: 'var(--priority-normal)',
  NewIncidentCreated: 'var(--priority-priority)',
  ImpactScoreChanged: 'var(--priority-high)',
  EscalationTriggered: 'var(--priority-critical)',
  SLABreached: 'var(--priority-critical)',
};

export const AgentTimelineView: React.FC<AgentTimelineViewProps> = ({ events, incidentId }) => {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ComplaintClassified': return <Cpu size={13} />;
      case 'ComplaintMatchedToIncident': return <CheckCircle2 size={13} />;
      case 'NewIncidentCreated': return <ShieldAlert size={13} />;
      case 'ImpactScoreChanged': return <TrendingUp size={13} />;
      case 'EscalationTriggered':
      case 'SLABreached': return <AlertOctagon size={13} />;
      default: return <User size={13} />;
    }
  };

  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 400, letterSpacing: '-0.02em' }}>
            Agent Decision Timeline
          </h2>
          {incidentId && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              — {incidentId}
            </span>
          )}
        </div>
        <span className="badge badge-normal">
          <Cpu size={9} /> Explainable AI
        </span>
      </div>

      {events.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-sm)',
          fontWeight: 300,
        }}>
          No audit events logged yet.
          <br />
          <span style={{ fontSize: 'var(--text-xs)' }}>Submit a complaint or trigger an authority action to observe agent execution.</span>
        </div>
      ) : (
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute',
            top: '1.5rem',
            bottom: '1.5rem',
            left: 'calc(1.25rem + 12px)',
            width: '1px',
            background: 'var(--border)',
          }} />

          {events.map((evt, idx) => {
            const color = EVENT_COLORS[evt.eventType] || 'var(--text-secondary)';
            return (
              <div key={evt.id || idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                position: 'relative',
                zIndex: 1,
                paddingBottom: idx < events.length - 1 ? '0.75rem' : 0,
              }}>
                {/* Icon dot */}
                <div style={{
                  width: '26px',
                  height: '26px',
                  background: 'var(--white)',
                  border: `1px solid ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color,
                  marginTop: '2px',
                }}>
                  {getEventIcon(evt.eventType)}
                </div>

                {/* Content */}
                <div style={{
                  flex: 1,
                  border: '1px solid var(--border)',
                  padding: '0.65rem 0.9rem',
                  background: 'var(--white)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {evt.eventType}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        padding: '0.1rem 0.35rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 400,
                      }}>
                        {evt.actorType}: {evt.actorId}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                      {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 300, lineHeight: 1.5 }}>
                    {evt.decision}
                  </p>

                  {evt.reasonCodes && evt.reasonCodes.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                      {evt.reasonCodes.map((code, cIdx) => (
                        <span key={cIdx} style={{
                          fontSize: '0.62rem',
                          color: 'var(--priority-normal)',
                          background: 'var(--priority-normal-bg)',
                          border: '1px solid var(--priority-normal-border)',
                          padding: '0.1rem 0.3rem',
                          fontWeight: 400,
                        }}>
                          #{code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
