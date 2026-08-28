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

  const weightItems = [
    { label: 'Community Score', value: weights.communityWeight, desc: 'Driven by unique citizen report count' },
    { label: 'Severity', value: weights.severityWeight, desc: 'AI classification severity (1–5)' },
    { label: 'Safety Risk', value: weights.safetyWeight, desc: 'Harm to public safety & traffic' },
    { label: 'Persistence', value: weights.persistenceWeight, desc: 'Time active since first report' },
    { label: 'Density', value: weights.densityWeight, desc: 'Geographic concentration score' },
  ];

  const escalationRules = [
    { label: '20+ Credible Reports', desc: 'Automatically raise priority to HIGH', badge: 'badge-priority' },
    { label: '50+ Credible Reports', desc: 'Escalate authority level (+1 Supervisory)', badge: 'badge-high' },
    { label: 'Impact Score ≥ 85.0', desc: 'Immediate CRITICAL escalation to Zonal Commissioner', badge: 'badge-critical' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: '1.75rem',
        borderBottom: '1px solid var(--border)',
        marginBottom: '1.75rem',
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            marginBottom: '0.75rem',
          }}>
            <SlidersHorizontal size={12} />
            Admin Configuration
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, letterSpacing: '-0.04em', marginBottom: '0.4rem' }}>
            Policy & Threshold Engine
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--text-secondary)' }}>
            Configure impact weights and autonomous escalation triggers without redeploying.
          </p>
        </div>
        <button onClick={handleSave} className="btn btn-dark" style={{ flexShrink: 0 }}>
          {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Policy</>}
        </button>
      </div>

      {/* Formula Weights */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-tertiary)',
          marginBottom: '1rem',
        }}>
          Impact Formula Weights (Sum = 1.0)
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '0',
          border: '1px solid var(--border)',
        }}>
          {weightItems.map((w, i) => (
            <div key={w.label} style={{
              padding: '1rem',
              borderRight: i < weightItems.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 400, marginBottom: '0.35rem' }}>
                {w.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.35rem' }}>
                {w.value}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                {w.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Escalation Rules */}
      <section>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-tertiary)',
          marginBottom: '1rem',
        }}>
          Active Escalation Policies
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--border)' }}>
          {escalationRules.map((rule, i) => (
            <div key={rule.label} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {rule.label}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 300, color: 'var(--text-secondary)' }}>
                  {rule.desc}
                </div>
              </div>
              <span className={`badge ${rule.badge}`}>Active</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
