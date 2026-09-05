import React, { useState, useEffect } from 'react';
import {
  Bot,
  Layers,
  FileText,
  Activity,
  Sun,
  Moon,
  User,
  LogOut,
  LogIn,
  Radio,
  Zap,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';

export default function Header({ activeTab, setActiveTab }) {
  const { user, guestId, isAuthenticated, logout, openAuthModal } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { latestObservability } = useChat();
  const [serverLatency, setServerLatency] = useState(latestObservability?.latency_ms || 12.4);

  useEffect(() => {
    if (latestObservability?.latency_ms) {
      setServerLatency(latestObservability.latency_ms);
    }
  }, [latestObservability]);

  return (
    <header className="glass-panel" style={{
      margin: '12px 16px 0 16px',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 40,
      borderRadius: 'var(--radius-lg)'
    }}>
      {/* Brand & Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Bot size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              OmniChat AI
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>RAG & Observability</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            System Design & Doc QA Platform
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
        <button
          className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('chat')}
          style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
        >
          <Bot size={15} /> Chat
        </button>
        <button
          className={`btn ${activeTab === 'documents' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('documents')}
          style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
        >
          <FileText size={15} /> Knowledge Base
        </button>
        <button
          className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('admin')}
          style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
        >
          <Activity size={15} /> Observability Dashboard
        </button>
        <button
          className={`btn ${activeTab === 'architecture' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('architecture')}
          style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
        >
          <Layers size={15} /> System Architecture
        </button>
      </nav>

      {/* Right Controls: Telemetry, Theme, and Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Real-time Telemetry Pill */}
        <div
          title={`Trace ID: ${latestObservability?.trace_id || 'System Active'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 8px var(--success)',
            display: 'inline-block'
          }}></span>
          <Zap size={12} color="var(--warning)" />
          <span>{serverLatency}ms</span>
          {latestObservability?.cache_hit && (
            <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>CACHE</span>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ width: '34px', height: '34px' }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Auth Profile */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)'
            }}>
              <User size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{user.username}</span>
              {user.is_staff && (
                <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '1px 4px' }}>ADMIN</span>
              )}
            </div>
            <button
              className="btn btn-secondary btn-icon"
              onClick={logout}
              title="Log Out"
              style={{ width: '34px', height: '34px', color: 'var(--danger)' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Guest #{guestId ? guestId.substring(6, 12) : 'Session'}
            </span>
            <button
              className="btn btn-primary"
              onClick={() => openAuthModal('login')}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <LogIn size={14} /> Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
