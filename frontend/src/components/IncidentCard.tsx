import React from 'react';
import type { Incident } from '../types';
import { ImpactMeter } from './ImpactMeter';
import { Users, FileText, AlertTriangle, MapPin, ShieldAlert } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onSelect: (incident: Incident) => void;
  onAction?: (incident: Incident) => void;
  showActionBtn?: boolean;
}

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  PRIORITY: 'Priority',
  NORMAL: 'Normal',
};

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onSelect,
  onAction,
  showActionBtn = true,
}) => {
  const getBadgeClass = () => {
    switch (incident.priority) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'PRIORITY': return 'badge-priority';
      default: return 'badge-normal';
    }
  };

  const timeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diffMs / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
    >
      {/* Top row: badge + id + impact */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className={`badge ${getBadgeClass()}`}>
              <AlertTriangle size={9} />
              {PRIORITY_LABELS[incident.priority] ?? incident.priority}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 400 }}>
              {incident.id}
            </span>
          </div>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            padding: '0.15rem 0.4rem',
            alignSelf: 'flex-start',
          }}>
            {incident.category}
          </span>
        </div>

        <ImpactMeter score={incident.impactScore} priority={incident.priority} size={48} />
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 'var(--text-md)',
        fontWeight: 400,
        color: 'var(--text-primary)',
        lineHeight: 1.3,
        letterSpacing: '-0.02em',
      }}>
        {incident.title || `${incident.category} Incident`}
      </h3>

      {/* Summary */}
      <p style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 300,
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {incident.summary}
      </p>

      {/* Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0',
        border: '1px solid var(--border)',
      }}>
        <div style={{ padding: '0.6rem 0.75rem', borderRight: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <Users size={11} color="var(--text-tertiary)" />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Citizens</span>
          </div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 400 }}>{incident.uniqueCitizenCount}</div>
        </div>

        <div style={{ padding: '0.6rem 0.75rem', borderRight: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <FileText size={11} color="var(--text-tertiary)" />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reports</span>
          </div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 400 }}>{incident.reportCount}</div>
        </div>

        <div style={{ padding: '0.6rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <ShieldAlert size={11} color="var(--text-tertiary)" />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Escalation</span>
          </div>
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 400 }}>L{incident.escalationLevel}</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 300 }}>
          <MapPin size={11} />
          <span>{incident.authorityId.replace(/_/g, ' ')}</span>
          <span style={{ margin: '0 0.2rem' }}>·</span>
          <span>{timeAgo(incident.lastReportedAt)}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(incident); }}
            className="btn btn-sm"
          >
            View Details
          </button>
          {showActionBtn && onAction && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(incident); }}
              className="btn btn-dark btn-sm"
            >
              Take Action
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
