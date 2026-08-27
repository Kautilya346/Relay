import React, { useState } from 'react';
import type { Incident } from '../types';
import { X, CheckCircle, Upload, Shield, Clock } from 'lucide-react';
import {
  acknowledgeIncident,
  submitResolution,
  simulateSLABreach,
} from '../services/api';

interface AuthorityActionModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AuthorityActionModal: React.FC<AuthorityActionModalProps> = ({
  incident,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [notes, setNotes] = useState('');
  const [resolutionEvidenceUrl, setResolutionEvidenceUrl] = useState(
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600'
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen || !incident) return null;

  const handleAcknowledge = async () => {
    setLoading(true);
    await acknowledgeIncident(incident.id, incident.authorityId, notes || 'Work order created.');
    setLoading(false);
    onRefresh();
    onClose();
  };

  const handleSimulateSLA = async () => {
    setLoading(true);
    await simulateSLABreach(incident.id);
    setLoading(false);
    onRefresh();
    onClose();
  };

  const handleResolve = async () => {
    if (!notes.trim()) {
      alert('Please enter resolution completion notes for verification.');
      return;
    }
    setLoading(true);
    await submitResolution(
      incident.id,
      incident.authorityId,
      notes,
      resolutionEvidenceUrl ? [resolutionEvidenceUrl] : []
    );
    setLoading(false);
    onRefresh();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '1.75rem', border: '1px solid var(--border-glass-bright)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-priority" style={{ marginBottom: '0.25rem' }}>
              <Shield size={12} /> {incident.authorityId.replace(/_/g, ' ')}
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Authority Action Queue - {incident.id}</h2>
          </div>
          <button onClick={onClose} className="glass-button" style={{ padding: '0.4rem', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', border: '1px solid var(--border-glass)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{incident.title}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Impact Score: <strong style={{ color: 'var(--primary-accent)' }}>{incident.impactScore}</strong> | Unique Citizens: <strong>{incident.uniqueCitizenCount}</strong> | Escalation Level: <strong>L{incident.escalationLevel}</strong>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Action Notes / Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Enter work details, contractor assignment, or repair completion notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Resolution Evidence Photo URL (For AI Verification)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                value={resolutionEvidenceUrl}
                onChange={(e) => setResolutionEvidenceUrl(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.5rem', justifyContent: 'space-between' }}>
            <button
              onClick={handleSimulateSLA}
              disabled={loading}
              className="glass-button"
              style={{ color: 'var(--priority-high)', borderColor: 'rgba(245, 158, 11, 0.4)', fontSize: '0.8rem' }}
            >
              <Clock size={14} /> Simulate SLA Breach Escalation
            </button>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {incident.status === 'OPEN' && (
                <button
                  onClick={handleAcknowledge}
                  disabled={loading}
                  className="glass-button"
                  style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4' }}
                >
                  <CheckCircle size={16} /> Acknowledge Work
                </button>
              )}

              <button
                onClick={handleResolve}
                disabled={loading}
                className="glass-button btn-primary"
              >
                <Upload size={16} /> Submit & AI Verify Resolution
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
