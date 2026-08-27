import React from 'react';
import { ShieldAlert, Users, Cpu, SlidersHorizontal, Activity, Building2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'citizen' | 'authority' | 'agent' | 'admin' | 'registry';
  setActiveTab: (tab: 'citizen' | 'authority' | 'agent' | 'admin' | 'registry') => void;
  onOpenReportModal: () => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  isBackendConnected,
}) => {
  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('citizen')}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <ShieldAlert size={24} color="#ffffff" />
          </div>
          <div>
            <h1 className="brand-title" style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>
              JanSahayak
            </h1>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.05em', fontWeight: 600 }}>
              AUTONOMOUS CIVIC TASKMASTER
            </span>
          </div>
        </div>

        {/* Portal Nav Switcher */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setActiveTab('citizen')}
            className={`glass-button ${activeTab === 'citizen' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Users size={16} /> Citizen Portal
          </button>
          <button
            onClick={() => setActiveTab('authority')}
            className={`glass-button ${activeTab === 'authority' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <ShieldAlert size={16} /> Authority Queue
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            className={`glass-button ${activeTab === 'agent' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Cpu size={16} /> Agent Timeline
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`glass-button ${activeTab === 'registry' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Building2 size={16} /> Authority Registry
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`glass-button ${activeTab === 'admin' ? 'btn-primary' : ''}`}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <SlidersHorizontal size={16} /> Admin Policies
          </button>
        </nav>

        {/* Status & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: isBackendConnected ? 'var(--priority-normal)' : 'var(--priority-high)' }}>
            <Activity size={14} className={isBackendConnected ? '' : 'pulse'} />
            <span>{isBackendConnected ? 'AI Engine Online' : 'Local Fallback'}</span>
          </div>

          <button onClick={onOpenReportModal} className="glass-button btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-md)' }}>
            + Report Civic Issue
          </button>
        </div>
      </div>
    </header>
  );
};
