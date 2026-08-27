import React, { useState } from 'react';
import { Send, XCircle, Bot } from 'lucide-react';
import { classifyIntent } from '../services/api';
import type { UserIntentResponse } from '../types';

interface NLAssistantWidgetProps {
  onOpenReportModal: () => void;
  onOpenFollowupModal?: (incidentId: string) => void;
}

export const NLAssistantWidget: React.FC<NLAssistantWidgetProps> = ({
  onOpenReportModal,
  onOpenFollowupModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<
    Array<{ type: 'user' | 'assistant'; text: string; intent?: UserIntentResponse }>
  >([
    {
      type: 'assistant',
      text: 'Namaste! I am JanSahayak AI. Ask me about your complaints, request follow-ups, or report new civic issues.',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const userText = query.trim();
    setQuery('');
    setHistory((prev) => [...prev, { type: 'user', text: userText }]);
    setLoading(true);

    try {
      const intentRes: UserIntentResponse = await classifyIntent(userText);
      setHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: intentRes.replyMessage,
          intent: intentRes,
        },
      ]);

      // If intent suggests opening report modal
      if (intentRes.intent === 'REPORT_ISSUE') {
        setTimeout(() => onOpenReportModal(), 1200);
      } else if (intentRes.intent === 'FOLLOW_UP' && onOpenFollowupModal) {
        setTimeout(() => onOpenFollowupModal(intentRes.entityId || 'INC-1001'), 1200);
      }
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          text: 'I could not parse your request. How else can I assist you?',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-full shadow-2xl flex items-center gap-2.5 font-semibold text-xs transition-transform hover:scale-105 border border-indigo-400/30"
        >
          <Bot className="w-5 h-5" />
          <span>Ask JanSahayak AI</span>
        </button>
      ) : (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-84 sm:w-96 shadow-2xl overflow-hidden flex flex-col h-[420px] animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Bot className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-100">JanSahayak AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
            {history.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[82%] p-2.5 rounded-xl leading-relaxed ${
                    msg.type === 'user'
                      ? 'bg-indigo-600 text-white font-medium rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                  {msg.intent && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-700/50 text-[10px] text-indigo-300 flex items-center justify-between">
                      <span>Intent: {msg.intent.intent}</span>
                      <span>{(msg.intent.confidence * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="p-2.5 bg-slate-800/80 rounded-xl text-xs text-slate-400 animate-pulse">
                  Reasoning intent...
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[10px] text-slate-400">
            <button
              onClick={() => setQuery('Report a broken streetlight')}
              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-md whitespace-nowrap"
            >
              Report Issue
            </button>
            <button
              onClick={() => setQuery('What happened to my complaint?')}
              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-md whitespace-nowrap"
            >
              Check Status
            </button>
            <button
              onClick={() => setQuery('Send a reminder for delayed repair')}
              className="px-2 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-md whitespace-nowrap"
            >
              Follow-up
            </button>
          </div>

          {/* Input */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question or report an issue..."
              className="flex-1 bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleSend}
              disabled={loading || !query.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
