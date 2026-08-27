import React, { useState } from 'react';
import type { Incident } from '../types';
import { IncidentCard } from '../components/IncidentCard';
import { Sparkles, PlusCircle } from 'lucide-react';

interface CitizenHomeProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onOpenReportModal: () => void;
}

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  incidents,
  onSelectIncident,
  onOpenReportModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredIncidents = selectedCategory === 'ALL'
    ? incidents
    : incidents.filter((i) => i.category === selectedCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{ padding: '2.5rem 2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '1px solid var(--border-glass-bright)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ maxWidth: '650px' }}>
          <span className="badge badge-normal" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={12} /> Autonomous Civic Taskmaster
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.75rem' }}>
            One report is a complaint. Many reports become a <span style={{ color: '#a855f7' }}>Community Incident</span>.
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            Report issues in your neighborhood. JanSahayak automatically clusters similar complaints, calculates community impact, and enforces escalation policies directly with municipal authorities.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onOpenReportModal} className="glass-button btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
              <PlusCircle size={18} /> Submit New Report
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--priority-normal)' }}>{incidents.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Active Incidents</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-accent)' }}>
              {incidents.reduce((acc, curr) => acc + curr.uniqueCitizenCount, 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Citizens Engaged</div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Active Community Incidents</h2>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['ALL', 'Road & Potholes', 'Sanitation & Garbage', 'Water & Sewage', 'Street Lighting'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`glass-button ${selectedCategory === cat ? 'btn-primary' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-dim)' }}>
            No active incidents found in this category. Click "+ Report Civic Issue" to create one.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {filteredIncidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onSelect={onSelectIncident}
                showActionBtn={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
