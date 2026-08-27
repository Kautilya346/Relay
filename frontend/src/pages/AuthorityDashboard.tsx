import React, { useState } from 'react';
import type { Incident } from '../types';
import { IncidentCard } from '../components/IncidentCard';
import { ShieldAlert } from 'lucide-react';

interface AuthorityDashboardProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onOpenActionModal: (inc: Incident) => void;
}

export const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  incidents,
  onSelectIncident,
  onOpenActionModal,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  const filtered = filterLevel === 'ALL'
    ? incidents
    : incidents.filter((i) => i.priority === filterLevel);

  // Sort queue by impact score descending
  const sorted = [...filtered].sort((a, b) => b.impactScore - a.impactScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-priority" style={{ marginBottom: '0.5rem' }}>
            <ShieldAlert size={12} /> Municipal Officer Workspace
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Authority Action Queue & SLA Taskmaster</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Community incidents auto-escalate when report thresholds or SLA deadlines breach.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--priority-critical)' }}>
              {incidents.filter((i) => i.priority === 'CRITICAL').length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Critical Escalations</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          Queue Items ({sorted.length})
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'PRIORITY', 'NORMAL'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterLevel(p)}
              className={`glass-button ${filterLevel === p ? 'btn-primary' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Grid */}
      {sorted.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
          No incidents currently pending in this queue filter.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
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
  );
};
