import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot } from 'lucide-react';
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
  const [history, setHistory] = useState<Array<{ type: 'user' | 'assistant'; text: string; intent?: UserIntentResponse }>>([
    { type: 'assistant', text: 'Namaste! I am Relay  AI. Ask me about your complaints, request follow-ups, or report new civic issues.' },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;
    const userText = query.trim();
    setQuery('');
    setHistory(prev => [...prev, { type: 'user', text: userText }]);
    setLoading(true);

    try {
      const intentRes: UserIntentResponse = await classifyIntent(userText);
      setHistory(prev => [...prev, { type: 'assistant', text: intentRes.replyMessage, intent: intentRes }]);
      if (intentRes.intent === 'REPORT_ISSUE') setTimeout(() => onOpenReportModal(), 1200);
      else if (intentRes.intent === 'FOLLOW_UP' && onOpenFollowupModal) setTimeout(() => onOpenFollowupModal(intentRes.entityId || 'INC-1001'), 1200);
    } catch {
      setHistory(prev => [...prev, { type: 'assistant', text: 'Could not parse your request. How else can I help?' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 200 }}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-dark"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', boxShadow: 'var(--shadow-md)' }}
        >
          <Bot size={15} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>Ask Relay  AI</span>
        </button>
      ) : (
        <div style={{
          width: '340px',
          background: 'var(--white)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          height: '400px',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={14} color="var(--text-primary)" />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400, letterSpacing: '-0.02em' }}>Relay  AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem' }}>
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {history.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '0.55rem 0.75rem',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 300,
                  lineHeight: 1.6,
                  background: msg.type === 'user' ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: msg.type === 'user' ? '#fff' : 'var(--text-primary)',
                  border: `1px solid ${msg.type === 'user' ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  {msg.text}
                  {msg.intent && (
                    <div style={{
                      marginTop: '0.4rem',
                      paddingTop: '0.4rem',
                      borderTop: `1px solid ${msg.type === 'user' ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                      fontSize: '0.65rem',
                      color: msg.type === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--text-tertiary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                      <span>Intent: {msg.intent.intent}</span>
                      <span>{(msg.intent.confidence * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '0.55rem 0.75rem',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  fontWeight: 300,
                }}>
                  Reasoning…
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts */}
          <div style={{
            padding: '0.5rem 0.75rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '0.3rem',
            overflowX: 'auto',
            background: 'var(--bg-subtle)',
          }}>
            {['Report Issue', 'Check Status', 'Follow-up'].map((label, i) => (
              <button
                key={label}
                onClick={() => setQuery(['Report a broken streetlight', 'What happened to my complaint?', 'Send a reminder for delayed repair'][i])}
                className="btn btn-sm"
                style={{ whiteSpace: 'nowrap', fontSize: '0.68rem' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.75rem',
            borderTop: '1px solid var(--border)',
          }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="form-input"
              style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: 'var(--text-xs)' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !query.trim()}
              className="btn btn-dark"
              style={{ padding: '0.4rem 0.6rem', opacity: loading || !query.trim() ? 0.4 : 1 }}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
