import React from 'react';
import type { IncidentPriority } from '../types';

interface ImpactMeterProps {
  score: number;
  priority: IncidentPriority;
  size?: number;
}

export const ImpactMeter: React.FC<ImpactMeterProps> = ({ score, priority, size = 64 }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  const getColor = () => {
    switch (priority) {
      case 'CRITICAL': return 'var(--priority-critical)';
      case 'HIGH': return 'var(--priority-high)';
      case 'PRIORITY': return 'var(--priority-priority)';
      default: return 'var(--priority-normal)';
    }
  };

  const strokeColor = getColor();
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
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
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <span style={{ fontSize: size * 0.3, fontWeight: 800, color: '#ffffff', fontFamily: 'Outfit' }}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
};
