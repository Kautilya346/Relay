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

  const getBadgeClass = () => {
    switch (incident.priority) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'PRIORITY': return 'badge-priority';
      default: return 'badge-normal';
    }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
      <div style={{
        width: '100%',
        maxWidth: '760px',
        maxHeight: '88vh',
        overflowY: 'auto',
        background: 'var(--white)',
        border: '1px solid var(--border-strong)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          background: 'var(--white)',
          zIndex: 1,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className={`badge ${getBadgeClass()}`}>{incident.priority}</span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{incident.id}</span>
              {externalCase && (
                <span className="badge badge-normal">
                  Case: {externalCase.externalComplaintId}
                </span>
              )}
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '0.1rem 0.4rem' }}>
                {incident.category}
              </span>
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 300, letterSpacing: '-0.04em' }}>{incident.title}</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.3rem', marginLeft: '1rem' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Action Controls */}
          {(onOpenEvidenceModal || onOpenFollowupModal || onOpenBrowserModal) && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {onOpenEvidenceModal && (
                <button onClick={() => onOpenEvidenceModal(incident.id)} className="btn btn-sm">
                  <FileText size={12} /> Evidence Composer
                </button>
              )}
              {onOpenFollowupModal && (
                <button onClick={() => onOpenFollowupModal(incident.id)} className="btn btn-sm">
                  <Send size={12} /> Follow-Up Approval
                </button>
              )}
              {onOpenBrowserModal && (
                <button onClick={() => onOpenBrowserModal(incident.id)} className="btn btn-sm">
                  <Globe size={12} /> Browser Worker
                </button>
              )}
            </div>
          )}

          {/* Impact bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0',
            border: '1px solid var(--border)',
          }}>
            {[
              { label: 'Impact Score', value: `${incident.impactScore} / 100` },
              { label: 'Citizens', value: incident.uniqueCitizenCount },
              { label: 'Reports', value: incident.reportCount },
              { label: 'Escalation', value: `L${incident.escalationLevel}` },
            ].map((item, i) => (
              <div key={item.label} style={{ padding: '0.75rem 1rem', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 300, letterSpacing: '-0.03em' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
              Incident Summary
            </div>
            <p style={{ fontSize: 'var(--text-base)', fontWeight: 300, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {incident.summary}
            </p>
          </div>

          {/* Resolution evidence */}
          {incident.resolutionEvidenceUrls.length > 0 && (
            <div style={{ padding: '1rem', border: '1px solid var(--priority-normal-border)', background: 'var(--priority-normal-bg)' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--priority-normal)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Camera size={11} /> Resolution Evidence
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {incident.resolutionEvidenceUrls.map((url, i) => (
                  <img key={i} src={url} alt="Resolution evidence" style={{ width: '100px', height: '70px', objectFit: 'cover', border: '1px solid var(--priority-normal-border)' }} />
                ))}
              </div>
            </div>
          )}

          {/* Citizen reports */}
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
              Aggregated Citizen Reports ({complaints.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--border)' }}>
              {complaints.length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 300 }}>
                  No individual reports loaded.
                </div>
              )}
              {complaints.map((cmp, i) => (
                <div key={cmp.id} style={{
                  padding: '0.75rem 1rem',
                  borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{cmp.description}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {cmp.userId} · Credibility {(cmp.credibilityScore * 100).toFixed(0)}% · Severity {cmp.severity}/5
                    </div>
                  </div>
                  {cmp.imageUrls && cmp.imageUrls[0] && (
                    <a
                      href={cmp.imageUrls[0]}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flexShrink: 0 }}
                      title="Click to view full evidence photo"
                    >
                      <img
                        src={cmp.imageUrls[0]}
                        alt="Uploaded Evidence"
                        style={{
                          width: '72px',
                          height: '52px',
                          objectFit: 'cover',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                          cursor: 'pointer',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600';
                        }}
                      />
                    </a>
                  )}

                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
