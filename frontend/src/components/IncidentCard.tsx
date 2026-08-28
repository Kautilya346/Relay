import React from 'react';
import type { Incident } from '../types';
import { ImpactMeter } from './ImpactMeter';
import { Users, FileText, AlertTriangle, MapPin, ShieldAlert } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onSelect: (incident: Incident) => void;
  onAction?: (incident: Incident) => void;
  onOpenBrowser?: (incident: Incident) => void;
  showActionBtn?: boolean;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onSelect,
  onAction,
  onOpenBrowser,
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

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className={`badge ${getBadgeClass()}`}>
              <AlertTriangle size={12} /> {incident.priority}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              {incident.id}
            </span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.5rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
              {incident.category}
            </span>
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
            {incident.title || `${incident.category} Incident`}
          </h3>
        </div>
        <ImpactMeter score={incident.impactScore} priority={incident.priority} size={54} />
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {incident.summary}
      </p>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={14} color="var(--primary-accent)" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Unique Citizens</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{incident.uniqueCitizenCount}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FileText size={14} color="#06b6d4" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Raw Reports</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{incident.reportCount}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <ShieldAlert size={14} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Escalation Level</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>L{incident.escalationLevel}</div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-glass)', fontSize: '0.78rem', color: 'var(--text-dim)', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <MapPin size={12} />
          <span>{incident.authorityId.replace(/_/g, ' ')}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {onOpenBrowser && (
            <button
              onClick={() => onOpenBrowser(incident)}
              className="glass-button"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#2dd4bf', borderColor: 'rgba(20, 184, 166, 0.4)' }}
              title="Launch Playwright Browser Automation Worker"
            >
              🌐 Browser Worker
            </button>
          )}
          <button onClick={() => onSelect(incident)} className="glass-button" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
            View Details
          </button>
          {showActionBtn && onAction && (
            <button onClick={() => onAction(incident)} className="glass-button btn-primary" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
              Action Queue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

