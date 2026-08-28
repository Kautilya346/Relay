import React from 'react';
import type { IncidentPriority } from '../types';

interface ImpactMeterProps {
  score: number;
  priority: IncidentPriority;
  size?: number;
}

export const ImpactMeter: React.FC<ImpactMeterProps> = ({ score, priority, size = 48 }) => {
  const getColor = () => {
    switch (priority) {
      case 'CRITICAL': return 'var(--priority-critical)';
      case 'HIGH': return 'var(--priority-high)';
      case 'PRIORITY': return 'var(--priority-priority)';
      default: return 'var(--priority-normal)';
    }
  };

  const strokeColor = getColor();
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <span style={{
          fontSize: size * 0.28,
          fontWeight: 400,
          color: 'var(--text-primary)',
          fontFamily: 'DM Sans, sans-serif',
          letterSpacing: '-0.02em',
        }}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
};
