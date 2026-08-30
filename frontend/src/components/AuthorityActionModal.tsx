import React, { useState } from 'react';
import type { Incident } from '../types';
import { X, CheckCircle, Upload, Shield, Clock, AlertCircle, Cloud, Check, RefreshCw } from 'lucide-react';
import {
  acknowledgeIncident,
  submitResolution,
  simulateSLABreach,
  uploadEvidenceFile,
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
  const [uploadingGcp, setUploadingGcp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !incident) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGcp(true);
    try {
      const gcsUrl = await uploadEvidenceFile(file);
      if (gcsUrl) {
        setResolutionEvidenceUrl(gcsUrl);
      } else {
        alert('Could not upload evidence image to Google Cloud Storage.');
      }
    } catch {
      alert('Error uploading file to GCP.');
    } finally {
      setUploadingGcp(false);
    }
  };

  const handleAcknowledge = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await acknowledgeIncident(
        incident.id,
        incident.authorityId,
        notes.trim() || 'Work order created by municipal officer.'
      );
      onRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to acknowledge incident.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSLA = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await simulateSLABreach(incident.id);
      onRefresh();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to trigger SLA breach simulation.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await submitResolution(
        incident.id,
        incident.authorityId,
        notes.trim() || 'Resolution evidence verified & submitted by municipal officer.',
        resolutionEvidenceUrl ? [resolutionEvidenceUrl] : []
      );
      if (res) {
        onRefresh();
        onClose();
      } else {
        setErrorMsg('Resolution submission failed.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error submitting resolution.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          background: '#ffffff',
          color: '#0f172a',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
          padding: '1.75rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '1rem',
            marginBottom: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Shield size={13} color="#64748b" />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                }}
              >
                {incident.authorityId.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
              Authority Officer Action
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, marginTop: '0.2rem' }}>
              Incident Reference: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{incident.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              padding: '0.4rem',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Incident Summary Card */}
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            background: '#fafafa',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            {incident.title}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '0.75rem' }}>
            <span>Impact Score: <strong>{incident.impactScore}</strong> / 100</span>
            <span>Reports: <strong>{incident.uniqueCitizenCount}</strong></span>
            <span>Escalation Level: <strong>L{incident.escalationLevel}</strong></span>
          </div>
        </div>

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}
            >
              Action Notes / Inspection Findings
            </label>
            <textarea
              rows={3}
              placeholder="Enter resolution notes, contractor instructions, or completion findings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '0.88rem',
                lineHeight: 1.5,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}
            >
              Resolution Photo Evidence
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="url"
                  placeholder="https://... or upload below"
                  value={resolutionEvidenceUrl}
                  onChange={(e) => setResolutionEvidenceUrl(e.target.value)}
                  style={{
                    flex: 1,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                  }}
                />
                <label
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {uploadingGcp ? <Upload size={13} className="animate-spin" /> : <Cloud size={13} color="#2563eb" />}
                  <span>{uploadingGcp ? 'Uploading...' : '📁 Upload Device Image'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              </div>
              {resolutionEvidenceUrl && (resolutionEvidenceUrl.includes('storage.googleapis.com') || resolutionEvidenceUrl.includes('evidence_id')) && (
                <span style={{ fontSize: '0.74rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                  <Check size={12} /> Stored on Google Cloud Storage Bucket
                </span>
              )}
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: '0.6rem 0.8rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AlertCircle size={14} color="#dc2626" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1rem',
              borderTop: '1px solid #f1f5f9',
              marginTop: '0.5rem',
            }}
          >
            <button
              type="button"
              onClick={handleSimulateSLA}
              disabled={loading || uploadingGcp}
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#e11d48',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.5rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Clock size={13} /> Simulate SLA Breach
            </button>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {incident.status === 'OPEN' && (
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={loading || uploadingGcp}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    cursor: loading || uploadingGcp ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Acknowledging...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={13} />
                      <span>Acknowledge Work</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleResolve}
                disabled={loading || uploadingGcp}
                style={{
                  background: loading ? '#334155' : '#0f172a',
                  border: '1px solid #0f172a',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  cursor: loading || uploadingGcp ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Verifying & Resolving...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Verify & Resolve</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
