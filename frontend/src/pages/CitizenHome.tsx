import React, { useState } from 'react';
import type { Incident } from '../types';
import { IncidentCard } from '../components/IncidentCard';
import { PlusCircle } from 'lucide-react';

interface CitizenHomeProps {
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
  onOpenReportModal: () => void;
  onOpenBrowserModal?: (incId: string) => void;
}

const CATEGORIES = ['ALL', 'Road & Potholes', 'Sanitation & Garbage', 'Water & Sewage', 'Street Lighting'];

export const CitizenHome: React.FC<CitizenHomeProps> = ({
  incidents,
  onSelectIncident,
  onOpenReportModal,
  onOpenBrowserModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredIncidents = selectedCategory === 'ALL'
    ? incidents
    : incidents.filter((i) => i.category === selectedCategory);

  const totalCitizens = incidents.reduce((acc, curr) => acc + curr.uniqueCitizenCount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Hero */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '0',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Left — text */}
        <div style={{
          padding: '3.5rem 3rem',
          borderRight: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem',
          }}>
            Autonomous Civic Taskmaster
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
            fontWeight: 300,
            lineHeight: 1.15,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            marginBottom: '1.25rem',
            maxWidth: '520px',
          }}>
            One report is a complaint.
            <br />Many reports become a{' '}
            <em style={{ fontStyle: 'normal', textDecoration: 'underline', textDecorationColor: 'var(--border-strong)', textUnderlineOffset: '4px' }}>
              community incident
            </em>.
          </h1>

          <p style={{
            fontSize: 'var(--text-base)',
            fontWeight: 300,
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: '440px',
            marginBottom: '2rem',
          }}>
            JanSahayak clusters similar complaints, calculates community impact, and enforces escalation policies directly with municipal authorities.
          </p>

          <button onClick={onOpenReportModal} className="btn btn-dark">
            <PlusCircle size={14} />
            Submit a Report
          </button>
        </div>

        {/* Right — image + stats */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Image placeholder */}
          <div style={{ flex: 1, minHeight: '240px' }}>
  <img
    src="https://images.unsplash.com/photo-1558690194-5aaa922b59b6?q=80&w=1171&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    alt="Aerial view of a busy Indian city street with civic infrastructure"
    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
  />
</div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{
              padding: '1.25rem',
              borderRight: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {incidents.length}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.3rem', fontWeight: 400 }}>
                Active Incidents
              </div>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {totalCitizens}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.3rem', fontWeight: 400 }}>
                Citizens Engaged
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--border)',
        gap: '1rem',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}>
          Active Community Incidents
        </div>
        <div style={{ display: 'flex', gap: '0' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.35rem 0.8rem',
                fontSize: 'var(--text-xs)',
                fontWeight: selectedCategory === cat ? 500 : 300,
                background: selectedCategory === cat ? 'var(--accent)' : 'transparent',
                color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderLeft: cat === 'ALL' ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'background 0.1s, color 0.1s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Incident grid */}
      <div style={{ paddingTop: '1.5rem' }}>
        {filteredIncidents.length === 0 ? (
          <div style={{
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            fontSize: 'var(--text-sm)',
          }}>
            No active incidents in this category.
            <span
              onClick={onOpenReportModal}
              style={{ color: 'var(--text-primary)', textDecoration: 'underline', cursor: 'pointer', marginLeft: '0.25rem' }}
            >
              Submit the first one.
            </span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border)',
          }}>
            {filteredIncidents.map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onSelect={onSelectIncident}
                onOpenBrowser={(i) => onOpenBrowserModal && onOpenBrowserModal(i.id)}
                showActionBtn={false}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
