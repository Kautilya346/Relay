import React, { useState } from 'react';
import type { Incident } from '../types';
import { IncidentCard } from '../components/IncidentCard';
import { ShieldAlert } from 'lucide-react';

interface AuthorityDashboardProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onOpenActionModal: (inc: Incident) => void;
}

const PRIORITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'PRIORITY', 'NORMAL'];

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  incidents,
  onSelectIncident,
  onOpenActionModal,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const filtered = filterLevel === 'ALL'
    ? incidents
    : incidents.filter((i) => i.priority === filterLevel);

  const sorted = [...filtered].sort((a, b) => b.impactScore - a.impactScore);
  const criticalCount = incidents.filter((i) => i.priority === 'CRITICAL').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '2.5rem 0',
        paddingBottom: '2rem',
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem',
          }}>
            <ShieldAlert size={12} />
            Municipal Officer Workspace
          </div>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)',
            fontWeight: 300,
            letterSpacing: '-0.04em',
            marginBottom: '0.5rem',
          }}>
            Authority Action Queue
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--text-secondary)' }}>
            Incidents auto-escalate when report thresholds or SLA deadlines breach.
          </p>
        </div>

        {criticalCount > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            border: '1px solid var(--priority-critical-border)',
            background: 'var(--priority-critical-bg)',
            alignSelf: 'flex-start',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '-0.04em', color: 'var(--priority-critical)', lineHeight: 1 }}>
              {criticalCount}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--priority-critical)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Critical<br />Escalations
            </div>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: 400 }}>
          {sorted.length} item{sorted.length !== 1 ? 's' : ''} in queue
        </div>

        <div style={{ display: 'flex', gap: 0 }}>
          {PRIORITY_FILTERS.map((p) => (
            <button
              key={p}
              onClick={() => setFilterLevel(p)}
              style={{
                padding: '0.35rem 0.8rem',
                fontSize: 'var(--text-xs)',
                fontWeight: filterLevel === p ? 500 : 300,
                background: filterLevel === p ? 'var(--accent)' : 'transparent',
                color: filterLevel === p ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderLeft: p === 'ALL' ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Queue grid */}
      <div style={{ paddingTop: '1.5rem' }}>
        {sorted.length === 0 ? (
          <div style={{
            border: '1px solid var(--border)',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
          }}>
            No incidents in this queue filter.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
          }}>
            {sorted.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onSelect={onSelectIncident}
                onAction={onOpenActionModal}
                showActionBtn={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
