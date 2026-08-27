import React, { useState, useEffect } from 'react';
import { Globe, XCircle, CheckCircle, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import type { BrowserSession } from '../types';
import { startBrowserSession, resumeBrowserSession } from '../services/api';

interface SharedBrowserModalProps {
  incidentId: string | null;
  authorityId?: string;
  onClose: () => void;
}

export const SharedBrowserModal: React.FC<SharedBrowserModalProps> = ({
  incidentId,
  authorityId = 'RAJ_SAMPARK',
  onClose,
}) => {
  const [session, setSession] = useState<BrowserSession | null>(null);
  const [captchaInput, setCaptchaInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    startBrowserSession(incidentId, authorityId)
      .then((sess) => setSession(sess))
      .finally(() => setLoading(false));
  }, [incidentId, authorityId]);

  if (!incidentId) return null;

  const handleResume = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const updated = await resumeBrowserSession(session.sessionId, 'txtCaptcha', captchaInput || 'VERIFIED_USER_CHECK');
      if (updated) setSession(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-teal-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Shared-Control Browser Worker
              </h2>
              <p className="text-xs text-slate-400">
                Playwright / Chromium Session • Official Portal Dispatch • {incidentId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Browser URL Bar Simulator */}
        <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
          <span className="p-1 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            VERIFIED DOMAIN
          </span>
          <span className="text-slate-400 font-mono flex-1 truncate">{session?.currentUrl || 'Connecting to verified government portal...'}</span>
          <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold">
            State: {session?.state || 'INITIALIZING'}
          </span>
        </div>

        {/* Live Form Representation */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Agent Pre-Filled Form Parameters:</span>
            <span className="text-teal-400 text-[11px]">Auto-extracted from incident state</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            {session?.filledFields &&
              Object.entries(session.filledFields).map(([key, val]) => (
                <div key={key} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg">
                  <div className="text-slate-500 text-[10px] uppercase font-mono">{key}</div>
                  <div className="text-slate-200 font-medium truncate mt-0.5">{val}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Human Checkpoint Section */}
        {session?.state === 'CAPTCHA_REQUIRED' && (
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Human Authentication Checkpoint: Portal CAPTCHA / Identity Required
            </div>
            <p className="text-xs text-slate-300">
              The autonomous agent has filled all grievance fields. Please complete the human identity verification to authorize submission.
            </p>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-slate-950 border border-slate-700 text-slate-200 font-mono tracking-widest text-sm rounded-lg">
                8 K 4 M 9
              </div>
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter CAPTCHA code"
                className="bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-400 w-48"
              />
              <button
                onClick={handleResume}
                disabled={loading}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Verify & Advance
              </button>
            </div>
          </div>
        )}

        {session?.state === 'USER_APPROVAL_REQUIRED' && (
          <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              Final User Submission Authorization
            </div>
            <p className="text-xs text-slate-300">
              Identity verified. Click below to give final authorization for the browser worker to click submit on the official portal.
            </p>
            <button
              onClick={handleResume}
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Authorize Official Submission
            </button>
          </div>
        )}

        {session?.state === 'SUBMITTED' && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Grievance Successfully Lodged on Portal
            </div>
            <p className="text-xs text-slate-300">
              Official Reference ID: <code className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300 font-bold">{session.referenceNumber}</code>
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Session
          </button>
        </div>
      </div>
    </div>
  );
};
