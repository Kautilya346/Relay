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
    <div className="modal-overlay">
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: 'var(--white)',
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <Shield size={12} color="var(--text-tertiary)" />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {incident.authorityId.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 400, letterSpacing: '-0.03em' }}>
              Authority Action — {incident.id}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.3rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Incident summary */}
        <div style={{
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
            {incident.title}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 300 }}>
            Impact {incident.impactScore} · {incident.uniqueCitizenCount} citizens · L{incident.escalationLevel} escalation
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Action Notes / Instructions</label>
            <textarea
              rows={3}
              placeholder="Enter work details, contractor assignment, or repair completion notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="form-input form-textarea"
            />
          </div>

          <div>
            <label className="form-label">Resolution Evidence Photo URL</label>
            <input
              type="url"
              value={resolutionEvidenceUrl}
              onChange={(e) => setResolutionEvidenceUrl(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'space-between',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border)',
          }}>
            <button onClick={handleSimulateSLA} disabled={loading} className="btn btn-sm" style={{ color: 'var(--priority-high)', borderColor: 'var(--priority-high-border)' }}>
              <Clock size={12} /> Simulate SLA Breach
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {incident.status === 'OPEN' && (
                <button onClick={handleAcknowledge} disabled={loading} className="btn btn-sm">
                  <CheckCircle size={12} /> Acknowledge
                </button>
              )}
              <button onClick={handleResolve} disabled={loading} className="btn btn-dark btn-sm">
                <Upload size={12} /> Verify & Resolve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
