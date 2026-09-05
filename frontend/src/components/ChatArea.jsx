import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  BookOpen,
  Copy,
  Check,
  Zap,
  Activity,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import FeedbackModal from './FeedbackModal';

export default function ChatArea({ initialPrompt = '', onClearInitialPrompt }) {
  const {
    messages,
    sending,
    loadingMessages,
    sendMessage,
    activeConversation
  } = useChat();

  const [inputQuery, setInputQuery] = useState(initialPrompt);
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackTargetMessage, setFeedbackTargetMessage] = useState(null);
  const [expandedCitations, setExpandedCitations] = useState({});

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputQuery(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
      textareaRef.current?.focus();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (inputQuery.trim() && !sending) {
      sendMessage(inputQuery.trim());
      setInputQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCitation = (msgId) => {
    setExpandedCitations(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const samplePrompts = [
    "What is the system design and data flow of OmniChat?",
    "How does the observability middleware trace request latency and trace IDs?",
    "Explain how the Document QA chunking and TF-IDF retrieval works.",
    "What are the benefits of Redis caching and token blacklist eviction?"
  ];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 88px)',
      margin: '12px 16px 12px 12px',
      position: 'relative'
    }}>
      {/* Message Feed Card */}
      <div className="glass-panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 'var(--radius-lg)',
        position: 'relative'
      }}>
        {/* Chat Area Header Banner */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-glass)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 10px var(--success)'
            }}></div>
            <div>
              <h2 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeConversation?.title || 'OmniChat AI Assistant'}
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Document-grounded QA • Observability Telemetry Enabled
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
              <Activity size={11} /> Flow: User → API → RAG → MySQL
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {messages.length === 0 && !loadingMessages && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 'auto',
              maxWidth: '560px',
              textAlign: 'center',
              gap: '16px',
              padding: '20px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}>
                <Bot size={36} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Welcome to OmniChat AI</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Ask any question to retrieve grounded answers from our knowledge base,
                test static rule matching, or monitor real-time distributed traces in the Admin Observability Dashboard.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Try asking:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {samplePrompts.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(p)}
                      className="glass-panel-interactive"
                      style={{
                        padding: '10px 12px',
                        fontSize: '0.78rem',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-glass)'
                      }}
                    >
                      <Sparkles size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const citations = msg.citations || [];
            const isCitationOpen = expandedCitations[msg.id];

            return (
              <div
                key={msg.id || index}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: isUser ? '75%' : '85%',
                  flexDirection: isUser ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: 'var(--radius-md)',
                  background: isUser ? 'var(--gradient-brand)' : 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: '1px solid var(--border-glass)'
                }}>
                  {isUser ? <User size={18} color="#ffffff" /> : <Bot size={18} color="var(--primary)" />}
                </div>

                {/* Message Bubble */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-lg)',
                    background: isUser
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(168, 85, 247, 0.9))'
                      : 'var(--bg-surface)',
                    color: '#ffffff',
                    backdropFilter: 'blur(12px)',
                    border: isUser ? 'none' : '1px solid var(--border-glass)',
                    boxShadow: isUser ? 'var(--shadow-sm)' : 'none',
                    lineHeight: '1.6',
                    fontSize: '0.88rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {msg.content}
                  </div>

                  {/* Citations Panel for Assistant messages */}
                  {!isUser && citations.length > 0 && (
                    <div style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      marginTop: '2px'
                    }}>
                      <div
                        onClick={() => toggleCitation(msg.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: 'var(--primary)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookOpen size={13} />
                          <span>Knowledge Sources ({citations.length} Citations)</span>
                        </div>
                        {isCitationOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>

                      {isCitationOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                          {citations.map((c, ci) => (
                            <div
                              key={ci}
                              style={{
                                padding: '8px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.74rem',
                                borderLeft: '3px solid var(--primary)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                <span>[{ci + 1}] {c.document_title}</span>
                                <span style={{ color: 'var(--secondary-accent)', fontFamily: 'var(--font-mono)' }}>
                                  Match: {Math.round((c.similarity_score || 0) * 100)}%
                                </span>
                              </div>
                              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                "{c.excerpt}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Telemetry Footer (Observability & Feedback) */}
                  {!isUser && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 4px',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)'
                    }}>
                      {/* Telemetry Metrics */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)' }}>
                        {msg.latency_ms > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Zap size={11} color="var(--warning)" /> {msg.latency_ms}ms
                          </span>
                        )}
                        {msg.cache_hit && (
                          <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>CACHE HIT</span>
                        )}
                        {msg.completion_tokens > 0 && (
                          <span>{msg.prompt_tokens + msg.completion_tokens} tokens</span>
                        )}
                        {msg.trace_id && (
                          <span title={`Trace ID: ${msg.trace_id}`} style={{ opacity: 0.7 }}>
                            [{msg.trace_id.substring(0, 10)}]
                          </span>
                        )}
                      </div>

                      {/* Action & Feedback Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          className="btn btn-ghost"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          style={{ padding: '3px 6px', height: '24px' }}
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                        </button>

                        <button
                          className="btn btn-ghost"
                          onClick={() => setFeedbackTargetMessage(msg)}
                          style={{
                            padding: '3px 6px',
                            height: '24px',
                            color: msg.feedback ? 'var(--primary)' : 'var(--text-muted)'
                          }}
                          title={msg.feedback ? 'View / Edit Feedback' : 'Give Feedback'}
                        >
                          <ThumbsUp size={12} />
                          {msg.feedback && <span style={{ marginLeft: '2px', fontWeight: 700 }}>✓</span>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking / Streaming Indicator */}
          {sending && (
            <div className="animate-fade-in" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-glass)'
              }}>
                <Bot size={18} color="var(--primary)" />
              </div>
              <div style={{
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  animation: 'pulseGlow 1s infinite'
                }}></div>
                <span>Retrieving knowledge chunks & generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer Box */}
        <div style={{
          padding: '16px 20px',
          background: 'var(--bg-glass)',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              className="input-text"
              rows={2}
              placeholder="Ask OmniChat a question, query documents, or test system design..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              style={{
                resize: 'none',
                padding: '12px 16px',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-md)',
                lineHeight: '1.4'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!inputQuery.trim() || sending}
              style={{ height: '48px', padding: '0 20px', borderRadius: 'var(--radius-md)' }}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
            <span>Grounding: TF-IDF Vector & Knowledge Base</span>
          </div>
        </div>
      </div>

      {/* User Feedback Modal */}
      {feedbackTargetMessage && (
        <FeedbackModal
          message={feedbackTargetMessage}
          isOpen={!!feedbackTargetMessage}
          onClose={() => setFeedbackTargetMessage(null)}
        />
      )}
    </div>
  );
}
