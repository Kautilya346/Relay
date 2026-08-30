import React, { useState } from 'react';
import { ShieldAlert, X, Send, Edit3, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import type { FollowupPreview } from '../types';
import { approveFollowup } from '../services/api';

interface FollowupApprovalModalProps {
  preview: FollowupPreview | null;
  onClose: () => void;
  onApproved: () => void;
}

export const FollowupApprovalModal: React.FC<FollowupApprovalModalProps> = ({
  preview,
  onClose,
  onApproved,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [followupText, setFollowupText] = useState(preview?.followupText || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!preview) return null;

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await approveFollowup(
        preview.incidentId,
        preview.authorizationId,
        'citizen_operator',
        isEditing ? followupText : undefined
      );
      if (res && res.success) {
        onApproved();
        onClose();
      } else {
        setError('Failed to dispatch follow-up to authority adapter.');
      }
    } catch (err: any) {
      setError(err.message || 'Authorization failed');
    } finally {
      setLoading(false);
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
            <ShieldAlert style={{ width: '16px', height: '16px', color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <h2 style={{
                margin: 0, fontSize: '14px', fontWeight: 600,
                color: 'var(--text-primary)', letterSpacing: '-0.01em',
              }}>
                Human Approval Required — Follow-Up Notice
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                Consequential escalation · Incident{' '}
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{preview.incidentId}</span>
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
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Auth ID row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)',
            fontSize: '11px', color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock style={{ width: '11px', height: '11px', color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-tertiary)' }}>Auth ID:</span>
              <code style={{
                fontFamily: 'monospace', fontSize: '10.5px',
                color: 'var(--text-primary)', fontWeight: 700,
                background: 'var(--surface)', padding: '1px 6px',
                border: '1px solid var(--border-strong)',
              }}>
                {preview.authorizationId}
              </code>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              → <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{preview.targetAuthority}</span>
            </span>
          </div>

          {/* Follow-up content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-tertiary)',
              }}>
                Follow-Up Notice
              </label>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px', fontWeight: 500,
                  color: 'var(--text-secondary)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: '0',
                  textDecoration: 'underline', textDecorationColor: 'var(--border-strong)',
                }}
              >
                <Edit3 style={{ width: '11px', height: '11px' }} />
                {isEditing ? 'Done Editing' : 'Edit Text'}
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={followupText}
                onChange={(e) => setFollowupText(e.target.value)}
                rows={6}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '12px 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border-strong)',
                  outline: 'none',
                  fontSize: '12.5px', color: 'var(--text-primary)',
                  lineHeight: '1.75', fontFamily: 'inherit',
                  resize: 'vertical', borderRadius: '0',
                }}
              />
            ) : (
              <div style={{
                padding: '12px 14px',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                fontSize: '12.5px', color: 'var(--text-primary)',
                lineHeight: '1.75', whiteSpace: 'pre-line', minHeight: '100px',
                fontWeight: 400,
              }}>
                {followupText || preview.followupText}
              </div>
            )}
          </div>

          {/* Hash + Expiry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{
              padding: '8px 10px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              fontSize: '10.5px', color: 'var(--text-tertiary)',
              overflow: 'hidden',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px', fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Payload SHA-256
              </div>
              <code style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                {preview.payloadHash.substring(0, 20)}…
              </code>
            </div>
            <div style={{
              padding: '8px 10px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              fontSize: '10.5px', color: 'var(--text-tertiary)',
              textAlign: 'right',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px', fontSize: '10px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Token Expires
              </div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {new Date(preview.expiresAt).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 12px',
              background: 'var(--priority-critical-bg)',
              border: '1px solid var(--priority-critical-border)',
              fontSize: '12px', color: 'var(--priority-critical)',
            }}>
              <AlertTriangle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
              fontSize: '12px', fontWeight: 500,
              cursor: 'pointer', borderRadius: '0',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-primary)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            Don't Send
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 18px',
              background: loading ? 'var(--bg-subtle)' : 'var(--text-primary)',
              border: '1px solid transparent',
              color: loading ? 'var(--text-tertiary)' : 'var(--surface)',
              fontSize: '12px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '0', transition: 'all 0.15s',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            {loading
              ? <><Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> Dispatching…</>
              : <><Send style={{ width: '13px', height: '13px' }} /> Approve & Send</>
            }
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
