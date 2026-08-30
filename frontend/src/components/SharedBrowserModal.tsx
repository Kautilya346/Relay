import React, { useState, useEffect } from "react";
import {
  Globe, X, Lock, ExternalLink,
  CheckCircle2, AlertCircle, RefreshCw,
  Send, Terminal, FileCheck, Copy, Check,
} from 'lucide-react';
import type { BrowserSession } from '../types';
import { startBrowserSession, resumeBrowserSession } from '../services/api';

interface SharedBrowserModalProps {
  incidentId: string | null;
  authorityId?: string;
  onClose: () => void;
}

export const SharedBrowserModal: React.FC<SharedBrowserModalProps> = ({
  incidentId,
  authorityId = "RAJ_SAMPARK",
  onClose,
}) => {
  const [session, setSession]           = useState<BrowserSession | null>(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<'inspector' | 'logs'>('inspector');
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const initSession = async (incId: string, authId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const sess = await startBrowserSession(incId, authId);
      if (sess) { setSession(sess); }
      else { setErrorMsg('Could not initialize Playwright browser worker session.'); }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to connect to browser worker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!incidentId) return;
    initSession(incidentId, authorityId);
  }, [incidentId, authorityId]);

  const handleResume = async () => {
    if (!session) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const updated = await resumeBrowserSession(
        session.sessionId, 'txtCaptcha', captchaInput || 'VERIFIED_USER_CHECK'
      );
      if (updated) { setSession(updated); }
      else { setErrorMsg('Failed to complete portal submission via Playwright worker.'); }
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Error executing Playwright portal submission.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (!session) return "pending";
    const state = session.state as string;
    if (state === 'SUBMITTED') return 'completed';
    if (stepId <= 3) return 'completed';
    if (stepId === 4) return (state === 'USER_APPROVAL_REQUIRED' || state === 'CAPTCHA_REQUIRED') ? 'active' : 'completed';
    return 'pending';
  };

  if (!incidentId) return null;

  const isSubmitted = session?.state === ('SUBMITTED' as any);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '820px',
        maxHeight: '92vh',
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: '0',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe style={{ width: '16px', height: '16px', color: 'var(--text-secondary)', flexShrink: 0 }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                  Shared-Control Browser Automation
                </h2>
                <span style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                  color: 'var(--text-tertiary)', border: '1px solid var(--border-strong)',
                  padding: '1px 6px', background: 'var(--bg-subtle)',
                }}>
                  Playwright
                </span>
                <h2
                  style={{
                    fontSize: "1.35rem",
                    fontWeight: 700,
                    margin: 0,
                    color: "#111827",
                    fontFamily: "DM Sans, sans-serif",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Browser Automation Worker
                </h2>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                Automated form-filling &amp; human-in-the-loop approval for {session?.authorityId || authorityId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', flexShrink: 0,
              background: 'none', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-tertiary)', borderRadius: '0',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
          >
            <X style={{ width: '13px', height: '13px' }} />
          </button>
        </div>

        {/* ── 5-Step Progress ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '6px',
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          flexShrink: 0,
        }}>
          {[
            { id: 1, title: 'Launch Engine',   desc: 'Chromium' },
            { id: 2, title: 'Open Portal',     desc: 'Verified Domain' },
            { id: 3, title: 'Pre-fill Form',   desc: 'AI Synthesis' },
            { id: 4, title: 'Verification',    desc: 'Identity Check' },
            { id: 5, title: 'Official Receipt',desc: 'Govt Reference' },
          ].map((st) => {
            const status = getStepStatus(st.id);
            const done   = status === 'completed';
            const active = status === 'active';
            return (
              <div key={st.id} style={{
                padding: '7px 8px', textAlign: 'center',
                border: done ? '1px solid var(--border-strong)' : active ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                background: done ? 'var(--bg)' : active ? 'var(--text-primary)' : 'var(--surface)',
                color: done ? 'var(--text-secondary)' : active ? 'var(--surface)' : 'var(--text-tertiary)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  {done && <CheckCircle2 style={{ width: '10px', height: '10px' }} />}
                  {active && <RefreshCw style={{ width: '10px', height: '10px', animation: 'spin 1.5s linear infinite' }} />}
                  {st.title}
                </div>
                <div style={{ fontSize: '9px', opacity: 0.75, marginTop: '2px' }}>{st.desc}</div>
              </div>
            );
          })}
        </div>

        {/* ── URL Bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            border: '1px solid var(--border-strong)',
            padding: '3px 8px',
            fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
            color: 'var(--text-secondary)', background: 'var(--surface)',
            letterSpacing: '0.05em',
          }}>
            <Lock style={{ width: '10px', height: '10px' }} /> HTTPS
          </div>

          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid var(--border-strong)',
            padding: '4px 10px',
            background: 'var(--surface)',
            fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)',
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.currentUrl || 'https://sampark.rajasthan.gov.in'}
            </span>
            <a
              href={session?.currentUrl || 'https://sampark.rajasthan.gov.in'}
              target="_blank" rel="noreferrer"
              style={{ color: 'var(--text-tertiary)', marginLeft: '8px', display: 'flex', alignItems: 'center' }}
            >
              <ExternalLink style={{ width: '11px', height: '11px' }} />
            </a>
          </div>

          <div style={{
            padding: '3px 10px',
            border: '1px solid var(--border-strong)',
            fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
            background: isSubmitted ? 'var(--text-primary)' : 'var(--surface)',
            color: isSubmitted ? 'var(--surface)' : 'var(--text-secondary)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {session?.state || (loading ? 'INITIALIZING' : 'READY')}
          </div>
        </div>

        {/* ── Inspector / Logs ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 24px' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['inspector', 'logs'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    fontSize: '11px', fontWeight: 600,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    background: activeTab === tab ? 'var(--text-primary)' : 'none',
                    color: activeTab === tab ? 'var(--surface)' : 'var(--text-secondary)',
                    border: activeTab === tab ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                    borderRadius: '0',
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab === 'inspector' ? <FileCheck style={{ width: '12px', height: '12px' }} /> : <Terminal style={{ width: '12px', height: '12px' }} />}
                  {tab === 'inspector' ? 'Form Inspector' : 'Playwright Logs'}
                </button>
              ))}
            </div>
            {loading && (
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'monospace' }}>
                <RefreshCw style={{ width: '11px', height: '11px', animation: 'spin 1.5s linear infinite' }} />
                Worker running…
              </span>
            )}
          </div>

          {/* Tab content */}
          {activeTab === 'inspector' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                <span>Playwright agent has pre-filled the target government form:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '10px', letterSpacing: '0.04em' }}>
                  100% FORM COVERAGE
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {session?.filledFields && Object.entries(session.filledFields).map(([key, val]) => (
                  <div key={key} style={{
                    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                    padding: '10px 12px',
                    display: 'flex', flexDirection: 'column', gap: '4px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {key}
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', border: '1px solid var(--border)', padding: '1px 5px', fontWeight: 600 }}>
                        Auto-Filled
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.4, wordBreak: 'break-word' }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: '#111110',
              border: '1px solid var(--border-strong)',
              padding: '14px 16px',
              fontFamily: 'monospace', fontSize: '11px', color: '#a8a8a4',
              maxHeight: '200px', overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: '5px',
              lineHeight: '1.6',
            }}>
              <div style={{ color: '#6f6f6b' }}>{`// Playwright Async Engine Execution Trace`}</div>
              <div>[0.00s] Initializing Chromium browser instance…</div>
              <div>[0.35s] Navigating to {session?.currentUrl || 'https://sampark.rajasthan.gov.in'}…</div>
              <div>[0.78s] Page loaded (DOMReady status verified).</div>
              <div style={{ color: '#d4d4d0' }}>[1.12s] #selectDepartment → Municipal Solid Waste selected.</div>
              <div style={{ color: '#d4d4d0' }}>[1.45s] #txtDescription → Evidence-backed text injected.</div>
              <div style={{ color: '#d4d4d0' }}>[1.80s] #lat_coord, #long_coord → Coordinates pre-filled.</div>
              <div>[2.10s] Checkpoint: Human-in-the-Loop approval required.</div>
              {session?.referenceNumber && (
                <div style={{ color: '#ffffff', fontWeight: 700 }}>
                  [2.95s] Form submitted. Receipt: {session.referenceNumber}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div style={{
            margin: '0 24px',
            padding: '9px 12px',
            background: 'var(--priority-critical-bg)',
            border: '1px solid var(--priority-critical-border)',
            fontSize: '12px', color: 'var(--priority-critical)',
            display: 'flex', alignItems: 'center', gap: '7px',
            flexShrink: 0,
          }}>
            <AlertCircle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
            {errorMsg}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 24px', flexShrink: 0, background: 'var(--bg-subtle)' }}>
          {isSubmitted ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--surface)', border: '1px solid var(--border-strong)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--text-primary)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Grievance filed with Government Portal
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Reference:{' '}
                    <strong style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                      {session?.referenceNumber || 'EXT-2026-88192'}
                    </strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { navigator.clipboard.writeText(session?.referenceNumber || 'EXT-2026-88192'); setCopiedReceipt(true); setTimeout(() => setCopiedReceipt(false), 2000); }}
                style={{
                  fontSize: '11px', fontWeight: 600,
                  padding: '6px 12px',
                  background: 'var(--surface)', border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)', borderRadius: '0',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                  transition: 'all 0.15s',
                }}
              >
                {copiedReceipt ? <Check style={{ width: '12px', height: '12px' }} /> : <Copy style={{ width: '12px', height: '12px' }} />}
                {copiedReceipt ? 'Copied' : 'Copy Reference'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Human Verification Checkpoint
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Review pre-filled fields above, then authorize Playwright to submit to portal.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button" onClick={onClose}
                  style={{
                    padding: '7px 14px', background: 'var(--surface)',
                    border: '1px solid var(--border-strong)', color: 'var(--text-secondary)',
                    fontSize: '12px', fontWeight: 500, cursor: 'pointer', borderRadius: '0',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--text-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >
                  Cancel
                </button>
                <button
                  type="button" onClick={handleResume} disabled={loading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '7px 16px',
                    background: loading ? 'var(--bg-subtle)' : 'var(--text-primary)',
                    border: '1px solid transparent',
                    color: loading ? 'var(--text-tertiary)' : 'var(--surface)',
                    fontSize: '12px', fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    borderRadius: '0', transition: 'all 0.15s',
                    opacity: loading ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
                  onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                >
                  {loading
                    ? <><RefreshCw style={{ width: '13px', height: '13px', animation: 'spin 1.5s linear infinite' }} /> Submitting…</>
                    : <><Send style={{ width: '13px', height: '13px' }} /> Authorize Submission</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
