import React, { useEffect, useState } from 'react';
import type { Incident, Complaint, ExternalCase } from '../types';
import { X, Camera, FileText, Send, Globe } from 'lucide-react';
import { fetchIncidentDetails, fetchExternalCase } from '../services/api';

interface IncidentDetailModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEvidenceModal?: (incidentId: string) => void;
  onOpenFollowupModal?: (incidentId: string) => void;
  onOpenBrowserModal?: (incidentId: string) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  isOpen,
  onClose,
  onOpenEvidenceModal,
  onOpenFollowupModal,
  onOpenBrowserModal,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [externalCase, setExternalCase] = useState<ExternalCase | null>(null);

  useEffect(() => {
    if (incident && isOpen) {
      fetchIncidentDetails(incident.id).then((details) => {
        if (details) setComplaints(details.complaints || []);
      });
      fetchExternalCase(incident.id).then((ext) => setExternalCase(ext));
    }
  }, [incident, isOpen]);

  if (!isOpen || !incident) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', border: '1px solid var(--border-glass-bright)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge badge-critical">{incident.priority}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 700 }}>{incident.id}</span>
              {externalCase && (
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', fontSize: '0.75rem', fontWeight: 700 }}>
                  Official Case: {externalCase.externalComplaintId}
                </span>
              )}
              <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>{incident.category}</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{incident.title}</h2>
          </div>
          <button onClick={onClose} className="glass-button" style={{ padding: '0.4rem', borderRadius: '50%' }}>
            <X size={20} />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {onOpenEvidenceModal && (
            <button
              onClick={() => onOpenEvidenceModal(incident.id)}
              className="glass-button"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(99, 102, 241, 0.4)' }}
            >
              <FileText size={14} color="#818cf8" />
              <span>Evidence Complaint Composer</span>
            </button>
          )}

          {onOpenFollowupModal && (
            <button
              onClick={() => onOpenFollowupModal(incident.id)}
              className="glass-button"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              <Send size={14} color="#fbbf24" />
              <span>Human Follow-Up Approval</span>
            </button>
          )}

          {onOpenBrowserModal && (
            <button
              onClick={() => onOpenBrowserModal(incident.id)}
              className="glass-button"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(20, 184, 166, 0.4)' }}
            >
              <Globe size={14} color="#2dd4bf" />
              <span>Shared Browser Worker</span>
            </button>
          )}
        </div>

        {/* Impact Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>DETERMINISTIC COMMUNITY IMPACT</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
              {incident.impactScore} / 100.0
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Unique Citizens</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{incident.uniqueCitizenCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Raw Reports</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{incident.reportCount}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Authority Level</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>L{incident.escalationLevel}</div>
            </div>
          </div>
        </div>

        {/* Description / Summary */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Incident Summary</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {incident.summary}
          </p>
        </div>

        {/* Resolution Evidence if resolved */}
        {incident.resolutionEvidenceUrls.length > 0 && (
          <div style={{ marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--priority-normal)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Camera size={16} /> Verified Resolution Evidence Photo
            </h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {incident.resolutionEvidenceUrls.map((url, i) => (
                <img key={i} src={url} alt="Resolution repair evidence" style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-glass-bright)' }} />
              ))}
            </div>
          </div>
        )}

        {/* Corroborating Citizen Reports */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Aggregated Citizen Reports ({complaints.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {complaints.map((cmp) => (
              <div key={cmp.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{cmp.description}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                    Reporter: {cmp.userId} | Credibility: {cmp.credibilityScore * 100}% | Severity: {cmp.severity}/5
                  </div>
                </div>
                {cmp.imageUrls && cmp.imageUrls[0] && (
                  <img src={cmp.imageUrls[0]} alt="evidence" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

