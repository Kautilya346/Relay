import React, { useState, useEffect } from 'react';
import { FileText, X, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { fetchComposedComplaint } from '../services/api';

interface EvidenceComplaintModalProps {
  incidentId: string | null;
  onClose: () => void;
}

export const EvidenceComplaintModal: React.FC<EvidenceComplaintModalProps> = ({
  incidentId,
  onClose,
}) => {
  const [data, setData] = useState<{
    composedComplaintText: string;
    priority: string;
    impactScore: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    fetchComposedComplaint(incidentId)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (!incidentId) return null;

  const handleCopy = () => {
    if (data?.composedComplaintText) {
      navigator.clipboard.writeText(data.composedComplaintText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.45)',
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: '0',
        maxWidth: '620px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 24px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText style={{ width: '16px', height: '16px', color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <h2 style={{
                margin: 0, fontSize: '14px', fontWeight: 600,
                color: 'var(--text-primary)', letterSpacing: '-0.01em',
              }}>
                Evidence-Based Complaint Composer
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                Factual grievance synthesized from verified incident metrics · {incidentId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px',
              background: 'none', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-tertiary)',
              borderRadius: '0', flexShrink: 0,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)';
            }}
          >
            <X style={{ width: '13px', height: '13px' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px', padding: '32px 0',
              color: 'var(--text-secondary)', fontSize: '13px',
            }}>
              <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              Synthesizing evidence-backed grievance text…
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '2px 8px', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: 'var(--text-primary)', color: 'var(--surface)',
                  }}>
                    {data?.priority || 'NORMAL'}
                  </span>
                  <span style={{
                    padding: '2px 8px', fontSize: '10px', fontWeight: 500,
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                    Impact {data?.impactScore?.toFixed(1) || '0.0'}/100
                  </span>
                </div>
                <span style={{
                  fontSize: '11px', color: 'var(--text-tertiary)',
                  fontWeight: 400, fontStyle: 'italic',
                }}>
                  Zero Hallucinations Guarantee
                </span>
              </div>

              {/* Complaint text */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  padding: '14px 16px',
                  paddingRight: '68px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  fontSize: '12.5px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.75',
                  fontWeight: 400,
                  whiteSpace: 'pre-line',
                  minHeight: '130px',
                }}>
                  {data?.composedComplaintText || 'No complaint text available.'}
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-strong)',
                    color: copied ? 'var(--text-secondary)' : 'var(--text-secondary)',
                    fontSize: '11px', fontWeight: 600,
                    cursor: 'pointer', borderRadius: '0',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                >
                  {copied
                    ? <><Check style={{ width: '11px', height: '11px' }} /> Copied</>
                    : <><Copy style={{ width: '11px', height: '11px' }} /> Copy</>
                  }
                </button>
              </div>

              {/* Guardrail */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                padding: '10px 12px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6',
              }}>
                <AlertCircle style={{ width: '12px', height: '12px', color: 'var(--text-tertiary)', flexShrink: 0, marginTop: '1px' }} />
                <span>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Architectural Guardrail:</strong>{' '}
                  Every statistic (reporters, duration, evidence count, SLA status) is extracted strictly from operational state and verified before transmission to municipal departments.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px',
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
              fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', borderRadius: '0',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
