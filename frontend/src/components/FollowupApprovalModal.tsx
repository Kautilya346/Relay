import React, { useState } from "react";
import {
  ShieldAlert,
  XCircle,
  Send,
  Edit3,
  Lock,
  AlertTriangle,
} from "lucide-react";
import type { FollowupPreview } from "../types";
import { approveFollowup } from "../services/api";

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
  const [followupText, setFollowupText] = useState(preview?.followupText || "");
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
        "citizen_operator",
        isEditing ? followupText : undefined,
      );
      if (res && res.success) {
        onApproved();
        onClose();
      } else {
        setError("Failed to dispatch follow-up to authority adapter.");
      }
    } catch (err: any) {
      setError(err.message || "Authorization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
      style={{
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
        style={{
          maxWidth: "980px",
          borderRadius: "16px",
        }}
      >
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-900 text-white shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-900">
                Human Approval Required: Follow-Up
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-500">
                Consequential escalation • Incident{" "}
                <span className="font-semibold text-slate-800">
                  {preview.incidentId}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
            aria-label="Close modal"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-700" />
              <span>Cryptographic authorization:</span>
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-slate-800 border border-slate-200">
                {preview.authorizationId}
              </code>
            </div>
            <div>
              Recipient:{" "}
              <span className="font-semibold text-slate-800">
                {preview.targetAuthority}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Evidence-backed factual follow-up notice
            </label>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900"
              type="button"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {isEditing ? "Done editing" : "Edit text"}
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={followupText}
              onChange={(e) => setFollowupText(e.target.value)}
              rows={7}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          ) : (
            <div className="whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[13px] leading-7 text-slate-700">
              {followupText || preview.followupText}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] text-slate-500">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 truncate">
            <span className="text-slate-500">Payload SHA-256:</span>{" "}
            <span className="font-mono text-slate-700">
              {preview.payloadHash.substring(0, 20)}...
            </span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-right">
            <span className="text-slate-500">Expires:</span>{" "}
            <span className="font-mono text-slate-700">
              {new Date(preview.expiresAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            type="button"
          >
            Don’t send
          </button>

          <button
            onClick={handleApprove}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
          >
            <Send className="h-4 w-4" />
            {loading ? "Dispatching..." : "Approve & send to authority"}
          </button>
        </div>
      </div>
    </div>
  );
};
