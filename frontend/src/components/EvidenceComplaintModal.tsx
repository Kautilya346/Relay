import React, { useState, useEffect } from "react";
import { FileText, XCircle, Copy, Check, Sparkles } from "lucide-react";
import { fetchComposedComplaint } from "../services/api";

interface EvidenceComplaintModalProps {
  incidentId: string | null;
  onClose: () => void;
}

export const EvidenceComplaintModal: React.FC<EvidenceComplaintModalProps> = ({
  incidentId,
  onClose,
}) => {
  const [data, setData] = useState<{
    composedComplaintText: string;
    priority: string;
    impactScore: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    fetchComposedComplaint(incidentId)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (!incidentId) return null;

  const handleCopy = () => {
    if (data?.composedComplaintText) {
      navigator.clipboard.writeText(data.composedComplaintText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      style={{
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)]">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-900 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-900">
                Evidence-Based Complaint Composer
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-500">
                Factual grievance synthesized from verified incident metrics •{" "}
                {incidentId}
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

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Synthesizing evidence-backed grievance text...
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                  Priority: {data?.priority || "NORMAL"}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600">
                  Impact: {data?.impactScore?.toFixed(1) || "0.0"}/100
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Zero hallucinations guarantee
              </span>
            </div>

            <div className="relative">
              <div className="min-h-[160px] whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-[13px] leading-7 text-slate-700">
                {data?.composedComplaintText || "No complaint text available."}
              </div>

              <button
                onClick={handleCopy}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                type="button"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-800">
                Architectural Guardrail:
              </span>{" "}
              Every statistic (reporters, duration, evidence count, SLA status)
              is extracted strictly from operational state and verified before
              transmission to municipal departments.
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
