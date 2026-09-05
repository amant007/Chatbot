import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  BookOpen,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import { useChat } from '../context/ChatContext';

export default function Sidebar({ onSelectTopicPrompt }) {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    startNewConversation,
    deleteConversation,
    updateConversationMeta,
    searchFilter,
    setSearchFilter
  } = useChat();

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = async (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await updateConversationMeta(convId, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleTogglePin = async (conv, e) => {
    e.stopPropagation();
    await updateConversationMeta(conv.id, { is_pinned: !conv.is_pinned });
  };

  const handleDelete = async (convId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation thread?')) {
      await deleteConversation(convId);
    }
  };

  const quickTopics = [
    { title: 'System Design Architecture', prompt: 'Explain the high-level system design and architecture of OmniChat AI.' },
    { title: 'Distributed Observability', prompt: 'How does OmniChat trace request latency and query metrics using X-Trace-ID?' },
    { title: 'Document QA & RAG Flow', prompt: 'How does the Document QA pipeline chunk, vectorize, and retrieve knowledge citations?' },
    { title: 'Redis Caching Strategy', prompt: 'What caching strategies and token blacklist eviction patterns are implemented?' }
  ];

  return (
    <aside className="glass-panel" style={{
      width: 'var(--sidebar-width)',
      height: 'calc(100vh - 88px)',
      margin: '12px 0 12px 16px',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      gap: '14px',
      borderRadius: 'var(--radius-lg)',
      zIndex: 20
    }}>
      {/* New Chat CTA */}
      <button
        className="btn btn-primary"
        onClick={startNewConversation}
        style={{ width: '100%', padding: '10px 16px' }}
      >
        <Plus size={18} /> New Conversation
      </button>

      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          className="input-text"
          placeholder="Search conversations..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{ paddingLeft: '32px', fontSize: '0.8rem', paddingRight: '24px' }}
        />
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Conversation Thread List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        paddingRight: '4px'
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 6px' }}>
          Conversations ({conversations.length})
        </div>

        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No conversations found.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Click "New Conversation" or send a query to start.</p>
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                  border: isActive ? '1px solid var(--border-glass-bright)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                className={isActive ? '' : 'glass-panel-interactive'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <MessageSquare size={15} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />

                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(conv.id, e); }}
                      autoFocus
                      className="input-text"
                      style={{ padding: '2px 6px', fontSize: '0.8rem', height: '26px' }}
                    />
                  ) : (
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {conv.title}
                    </span>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '6px' }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => handleSaveEdit(conv.id, e)}
                        className="btn btn-ghost"
                        style={{ padding: '4px', width: '22px', height: '22px' }}
                        title="Save"
                      >
                        <Check size={13} color="var(--success)" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                        className="btn btn-ghost"
                        style={{ padding: '4px', width: '22px', height: '22px' }}
                        title="Cancel"
                      >
                        <X size={13} color="var(--danger)" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => handleTogglePin(conv, e)}
                        className="btn btn-ghost"
                        style={{ padding: '4px', width: '22px', height: '22px', opacity: conv.is_pinned ? 1 : 0.4 }}
                        title={conv.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        <Pin size={12} color={conv.is_pinned ? 'var(--warning)' : 'currentColor'} />
                      </button>
                      <button
                        onClick={(e) => handleStartEdit(conv, e)}
                        className="btn btn-ghost"
                        style={{ padding: '4px', width: '22px', height: '22px', opacity: 0.5 }}
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="btn btn-ghost"
                        style={{ padding: '4px', width: '22px', height: '22px', opacity: 0.5 }}
                        title="Delete"
                      >
                        <Trash2 size={12} color="var(--danger)" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Suggested Explorations */}
      <div style={{
        padding: '12px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
          <Sparkles size={13} /> Quick Topics
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {quickTopics.map((qt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTopicPrompt(qt.prompt)}
              className="btn btn-ghost"
              style={{
                justifyContent: 'flex-start',
                padding: '6px 8px',
                fontSize: '0.74rem',
                textAlign: 'left',
                lineHeight: '1.3',
                color: 'var(--text-secondary)'
              }}
            >
              • {qt.title}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
