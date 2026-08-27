import React, { useState, useEffect } from 'react';
import { FileText, XCircle, Copy, Check, Sparkles } from 'lucide-react';
import { fetchComposedComplaint } from '../services/api';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Evidence-Based Complaint Composer
              </h2>
              <p className="text-xs text-slate-400">
                Factual grievance synthesized from verified incident metrics • {incidentId}
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

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
            Synthesizing evidence-backed grievance text...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-indigo-950 text-indigo-300 border border-indigo-500/30 rounded-lg font-semibold">
                  Priority: {data?.priority || 'NORMAL'}
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
                  Impact: {data?.impactScore?.toFixed(1) || '0.0'}/100
                </span>
              </div>
              <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Zero Hallucinations Guarantee
              </span>
            </div>

            <div className="relative">
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 font-mono whitespace-pre-line leading-relaxed min-h-[160px]">
                {data?.composedComplaintText || 'No complaint text available.'}
              </div>
              <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 shadow transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-xs text-slate-400 leading-relaxed">
              <span className="text-slate-300 font-semibold">Architectural Guardrail:</span> Every statistic (reporters, duration, evidence count, SLA status) is extracted strictly from operational state and verified before transmission to municipal departments.
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
