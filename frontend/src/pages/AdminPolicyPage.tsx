import React, { useState } from 'react';
import type { EscalationPolicyConfig } from '../types';
import { SlidersHorizontal, Save, Check } from 'lucide-react';

interface AdminPolicyPageProps {
  policyConfig: EscalationPolicyConfig | null;
  onUpdatePolicy: (config: EscalationPolicyConfig) => void;
}

export const AdminPolicyPage: React.FC<AdminPolicyPageProps> = ({
  policyConfig,
  onUpdatePolicy,
}) => {
  const [saved, setSaved] = useState(false);

  // Default values fallback
  const weights = policyConfig?.weights || {
    communityWeight: 0.35,
    severityWeight: 0.25,
    safetyWeight: 0.20,
    persistenceWeight: 0.10,
    densityWeight: 0.10,
  };

  const thresholds = policyConfig?.thresholds || {
    normalMax: 49.0,
    priorityMax: 69.0,
    highMax: 84.0,
    criticalMin: 85.0,
  };

  const handleSave = () => {
    onUpdatePolicy({
      weights,
      thresholds,
      reportThresholdPriority: policyConfig?.reportThresholdPriority || 20,
      reportThresholdEscalate: policyConfig?.reportThresholdEscalate || 50,
      immediateEscalationImpact: policyConfig?.immediateEscalationImpact || 85.0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="badge badge-normal" style={{ marginBottom: '0.5rem' }}>
            <SlidersHorizontal size={12} /> Admin Configuration
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Deterministic Policy & Threshold Engine</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Configure impact calculation formula weights and autonomous escalation triggers without redeploying backend code.
          </p>
        </div>

        <button onClick={handleSave} className="glass-button btn-primary" style={{ padding: '0.7rem 1.4rem' }}>
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Policy</>}
        </button>
      </div>

      {/* Formula & Weights */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
          Impact Formula Weights (Sum = 1.0)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-accent)' }}>Community Score Weight</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.3rem 0' }}>{weights.communityWeight}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Driven by unique citizen report count</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#06b6d4' }}>Severity Weight</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.3rem 0' }}>{weights.severityWeight}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>AI classification severity (1-5 scale)</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>Safety Risk Weight</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.3rem 0' }}>{weights.safetyWeight}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Harm to public safety & traffic</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a855f7' }}>Persistence Weight</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.3rem 0' }}>{weights.persistenceWeight}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Time active since first report</div>
          </div>
        </div>
      </div>

      {/* Escalation Policy Rules */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
          Configured Autonomous Escalation Policies
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>20+ Credible Unique Citizen Reports</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Action: Automatically raise priority to HIGH</div>
            </div>
            <span className="badge badge-priority">Active</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>50+ Credible Unique Citizen Reports</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Action: Escalate authority level (+1 Supervisory Authority)</div>
            </div>
            <span className="badge badge-high">Active</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>Impact Score ≥ 85.0</strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Action: Immediate CRITICAL escalation to Zonal Commissioner</div>
            </div>
            <span className="badge badge-critical">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
