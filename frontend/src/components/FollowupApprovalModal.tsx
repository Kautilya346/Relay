import React, { useState } from 'react';
import { ShieldAlert, XCircle, Send, Edit3, Lock, AlertTriangle } from 'lucide-react';
import type { FollowupPreview } from '../types';
import { approveFollowup } from '../services/api';

interface FollowupApprovalModalProps {
  preview: FollowupPreview | null;
  onClose: () => void;
  onApproved: () => void;
}

export const FollowupApprovalModal: React.FC<FollowupApprovalModalProps> = ({
  preview,
  onClose,
  onApproved,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [followupText, setFollowupText] = useState(preview?.followupText || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!preview) return null;

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await approveFollowup(
        preview.incidentId,
        preview.authorizationId,
        'citizen_operator',
        isEditing ? followupText : undefined
      );
      if (res && res.success) {
        onApproved();
        onClose();
      } else {
        setError('Failed to dispatch follow-up to authority adapter.');
      }
    } catch (err: any) {
      setError(err.message || 'Authorization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Human Approval Required: Follow-Up
              </h2>
              <p className="text-xs text-slate-400">
                Consequential Escalation • Incident <span className="text-indigo-400 font-semibold">{preview.incidentId}</span>
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

        {/* Security & Verification Banner */}
        <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-amber-300">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Cryptographic Authorization: <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-200">{preview.authorizationId}</code></span>
          </div>
          <div className="text-slate-400">
            Recipient: <span className="font-semibold text-slate-200">{preview.targetAuthority}</span>
          </div>
        </div>

        {/* Follow-up Factual Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Evidence-Backed Factual Follow-Up Notice:
            </label>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Done Editing' : 'Edit Text'}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={followupText}
              onChange={(e) => setFollowupText(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-300 font-mono whitespace-pre-line leading-relaxed">
              {followupText || preview.followupText}
            </div>
          )}
        </div>

        {/* Hash & Expiry Meta */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
          <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/60 truncate">
            <span className="text-slate-500">Payload SHA-256: </span>
            <code className="text-slate-300">{preview.payloadHash.substring(0, 20)}...</code>
          </div>
          <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/60 text-right">
            <span className="text-slate-500">Expires: </span>
            <span className="text-slate-300">{new Date(preview.expiresAt).toLocaleTimeString()}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Don't Send
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-900/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Dispatching...' : 'Approve & Send to Authority'}
          </button>
        </div>
      </div>
    </div>
  );
};
