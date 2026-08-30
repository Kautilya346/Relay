import React from 'react';
import { ShieldAlert, Users, Cpu, SlidersHorizontal, Activity, Building2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'citizen' | 'authority' | 'agent' | 'admin' | 'registry';
  setActiveTab: (tab: 'citizen' | 'authority' | 'agent' | 'admin' | 'registry') => void;
  onOpenReportModal: () => void;
  isBackendConnected: boolean;
}

const NAV_ITEMS = [
  { id: 'citizen', label: 'Citizens', icon: Users },
  { id: 'authority', label: 'Authority', icon: ShieldAlert },
  { id: 'agent', label: 'AI Audit', icon: Cpu },
  { id: 'registry', label: 'Registry', icon: Building2 },
  { id: 'admin', label: 'Policies', icon: SlidersHorizontal },
] as const;

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  isBackendConnected,
}) => {
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
      }}>

        {/* Brand */}
        <button
          onClick={() => setActiveTab('citizen')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldAlert size={15} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '1rem',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}>
            Relay
          </span>
        </button>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0 1rem',
                height: '56px',
                fontSize: 'var(--text-sm)',
                fontWeight: 300,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === id ? '2px solid var(--text-primary)' : '2px solid transparent',
                color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'color 0.12s',
                letterSpacing: '-0.01em',
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: 'var(--text-xs)',
            color: isBackendConnected ? 'var(--priority-normal)' : 'var(--priority-high)',
            fontWeight: 400,
          }}>
            <Activity size={12} />
            <span>{isBackendConnected ? 'AI Online' : 'Local Mode'}</span>
          </div>

          <button onClick={onOpenReportModal} className="btn btn-dark" style={{ fontSize: 'var(--text-xs)' }}>
            + Report Issue
          </button>
        </div>

      </div>
    </header>
  );
};
