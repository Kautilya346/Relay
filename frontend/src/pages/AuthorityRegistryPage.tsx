import React, { useState, useEffect } from 'react';
import { Building2, Globe, Lock, ExternalLink, Search, Sparkles, ShieldCheck } from 'lucide-react';
import { fetchAuthorities, discoverPortal } from '../services/api';
import type { AuthorityIntegration } from '../types';

export const AuthorityRegistryPage: React.FC = () => {
  const [authorities, setAuthorities] = useState<AuthorityIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchLocation, setSearchLocation] = useState('');
  const [searchCategory, setSearchCategory] = useState('Road & Potholes');
  const [discovering, setDiscovering] = useState(false);
  const [discoveredResult, setDiscoveredResult] = useState<any>(null);

  useEffect(() => {
    fetchAuthorities()
      .then((data) => setAuthorities(data))
      .finally(() => setLoading(false));
  }, []);

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation.trim()) return;
    setDiscovering(true);
    setDiscoveredResult(null);
    try {
      const res = await discoverPortal(searchLocation, searchCategory);
      setDiscoveredResult(res);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: '1.75rem',
        borderBottom: '1px solid var(--border)',
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
            <Building2 size={12} />
            Jurisdiction & Authority Registry
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, letterSpacing: '-0.04em', marginBottom: '0.4rem' }}>
            Verified Civic Adapters
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 300, color: 'var(--text-secondary)', maxWidth: '560px' }}>
            Grievance actions are executed exclusively through verified municipal adapters. User-supplied arbitrary URLs are strictly forbidden by architectural policy.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, marginLeft: '2rem' }}>
          <div style={{ padding: '0.75rem 1rem', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1 }}>{authorities.length}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>Integrations</div>
          </div>
          <div style={{ padding: '0.75rem 1rem', border: '1px solid var(--priority-normal-border)', background: 'var(--priority-normal-bg)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--priority-normal)' }}>100%</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--priority-normal)', marginTop: '0.2rem' }}>Verified</div>
          </div>
        </div>
      </div>

      {/* Search Grounding */}
      <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={13} color="var(--text-secondary)" />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, letterSpacing: '-0.02em' }}>
              Live Google Search Grounding
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: 'var(--text-xs)', color: 'var(--priority-normal)', fontWeight: 400 }}>
            <ShieldCheck size={11} />
            Domain Guardrail Active (.gov.in / .nic.in)
          </div>
        </div>

        <form onSubmit={handleDiscover} style={{ padding: '1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }}>
          <input
            type="text"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder="City, Municipal Ward, or District..."
            className="form-input"
          />
          <select value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} className="form-select form-input">
            <option>Road & Potholes</option>
            <option>Sanitation & Garbage</option>
            <option>Water & Sewage</option>
            <option>Street Lighting</option>
            <option>Public Transport</option>
          </select>
          <button type="submit" disabled={discovering || !searchLocation.trim()} className="btn btn-dark" style={{ opacity: discovering || !searchLocation.trim() ? 0.5 : 1 }}>
            <Search size={13} />
            {discovering ? 'Searching…' : 'Discover'}
          </button>
        </form>

        {discoveredResult && (
          <div style={{
            margin: '0 1.25rem 1rem',
            padding: '1rem',
            border: '1px solid var(--priority-priority-border)',
            background: 'var(--priority-priority-bg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400 }}>{discoveredResult.authorityName}</span>
                  <span className={discoveredResult.isVerifiedGovDomain ? 'badge badge-normal' : 'badge badge-critical'}>
                    {discoveredResult.isVerifiedGovDomain ? 'Verified Gov' : 'Unverified'}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 300, color: 'var(--text-secondary)' }}>{discoveredResult.summary}</p>
              </div>
              {discoveredResult.portalUrl && (
                <a href={discoveredResult.portalUrl} target="_blank" rel="noreferrer" className="btn btn-dark btn-sm" style={{ flexShrink: 0 }}>
                  <ExternalLink size={11} /> Open Portal
                </a>
              )}
            </div>
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--priority-priority-border)', display: 'flex', gap: '1.5rem', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span>Jurisdiction: <strong style={{ color: 'var(--text-primary)', fontWeight: 400 }}>{discoveredResult.jurisdiction}</strong></span>
              <span>Domain: <strong style={{ color: 'var(--text-primary)', fontWeight: 400 }}>{discoveredResult.officialDomain}</strong></span>
              <span>Channel: <strong style={{ color: 'var(--text-primary)', fontWeight: 400 }}>{discoveredResult.suggestedChannel}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Authority Grid */}
      {loading ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          Loading verified authority integrations…
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}>
          {authorities.map((auth) => (
            <div key={auth.authority_id} style={{
              background: 'var(--surface)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400 }}>{auth.name}</span>
                    <span className={auth.verification_status === 'VERIFIED' ? 'badge badge-normal' : 'badge badge-high'}>
                      {auth.verification_status}
                    </span>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                    {auth.authority_id}
                  </span>
                </div>
                <span style={{
                  fontSize: 'var(--text-xs)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  padding: '0.15rem 0.5rem',
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                }}>
                  {auth.integration_type}
                </span>
              </div>

              {/* Domain info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid var(--border)' }}>
                <div style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>Domain</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Globe size={10} />
                    {auth.official_domain}
                  </div>
                </div>
                <div style={{ padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>Adapter</div>
                  <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>v{auth.adapter_version}</div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>Categories</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {auth.categories.map((cat) => (
                    <span key={cat} style={{
                      fontSize: '0.65rem',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      padding: '0.15rem 0.4rem',
                      color: 'var(--text-secondary)',
                    }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Lock size={10} />
                  {auth.requires_submission_approval ? 'Approval Required' : 'Auto Dispatched'}
                </div>
                {auth.portal_url && (
                  <a href={auth.portal_url} target="_blank" rel="noreferrer" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 400,
                  }}>
                    Official Portal <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
