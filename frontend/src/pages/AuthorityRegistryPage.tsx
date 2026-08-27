import React, { useState, useEffect } from 'react';
import { Building2, Globe, Lock, ExternalLink, Search, Sparkles, ShieldCheck } from 'lucide-react';
import { fetchAuthorities, discoverPortal } from '../services/api';
import type { AuthorityIntegration } from '../types';

export const AuthorityRegistryPage: React.FC = () => {
  const [authorities, setAuthorities] = useState<AuthorityIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Grounding State
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">
              Jurisdiction & Authority Registry
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            JanSahayak executes external grievance actions exclusively through verified municipal adapters. User-supplied arbitrary URLs are strictly forbidden by architectural policy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
            <div className="text-lg font-black text-indigo-400">{authorities.length}</div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Integrations</div>
          </div>
          <div className="px-3.5 py-2 bg-slate-950/60 border border-emerald-500/30 rounded-xl text-center">
            <div className="text-lg font-black text-emerald-400">100%</div>
            <div className="text-[10px] text-emerald-300 uppercase font-semibold">Verified</div>
          </div>
        </div>
      </div>

      {/* Google Search Grounding Discovery Bar */}
      <div className="p-5 bg-slate-900/90 border border-indigo-500/40 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Live Google Search Grounding: Discover Official Civic Portals
            </h2>
          </div>
          <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Domain Verification Guardrail Active (.gov.in / .nic.in)
          </span>
        </div>

        <form onSubmit={handleDiscover} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Enter City, Municipal Ward, or District (e.g. Jaipur, Bengaluru, Delhi MCD)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
            >
              <option value="Road & Potholes">Road & Potholes</option>
              <option value="Sanitation & Garbage">Sanitation & Garbage</option>
              <option value="Water & Sewage">Water & Sewage</option>
              <option value="Street Lighting">Street Lighting</option>
              <option value="Public Transport">Public Transport</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={discovering || !searchLocation.trim()}
              className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all shadow-lg"
            >
              <Search className="w-3.5 h-3.5" />
              {discovering ? 'Grounding...' : 'Discover'}
            </button>
          </div>
        </form>

        {/* Discovered Grounding Result */}
        {discoveredResult && (
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/50 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-100">{discoveredResult.authorityName}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      discoveredResult.isVerifiedGovDomain
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-950 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {discoveredResult.isVerifiedGovDomain ? 'VERIFIED GOV DOMAIN' : 'UNVERIFIED DOMAIN'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{discoveredResult.summary}</p>
              </div>

              {discoveredResult.portalUrl && (
                <a
                  href={discoveredResult.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-2 border-t border-indigo-900/40">
              <span>Jurisdiction: <strong className="text-slate-200">{discoveredResult.jurisdiction}</strong></span>
              <span>Official Domain: <strong className="text-slate-200">{discoveredResult.officialDomain}</strong></span>
              <span>Channel: <strong className="text-indigo-300">{discoveredResult.suggestedChannel}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Integration Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
          Loading verified authority integrations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {authorities.map((auth) => (
            <div
              key={auth.authority_id}
              className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg space-y-4 transition-all hover:shadow-indigo-500/5"
            >
              {/* Card Top */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-100">{auth.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        auth.verification_status === 'VERIFIED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {auth.verification_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{auth.authority_id}</p>
                </div>

                <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-lg">
                  {auth.integration_type}
                </span>
              </div>

              {/* Domain & Scope */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500 text-[10px] block">Official Domain</span>
                  <span className="text-slate-200 font-mono flex items-center gap-1 mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    {auth.official_domain}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Adapter Version</span>
                  <span className="text-slate-200 font-mono mt-0.5 block">v{auth.adapter_version}</span>
                </div>
              </div>

              {/* Category Coverage */}
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Handled Complaint Categories:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {auth.categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] rounded-md border border-slate-700/60"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Permissions & Security Flags */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    {auth.requires_submission_approval ? 'Approval Required' : 'Auto Dispatched'}
                  </span>
                </div>

                {auth.portal_url && (
                  <a
                    href={auth.portal_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
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
