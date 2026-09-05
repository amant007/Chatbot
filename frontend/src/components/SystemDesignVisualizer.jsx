import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Database,
  Server,
  Zap,
  Cpu,
  Shield,
  Activity,
  CheckCircle2,
  FileCode,
  Sparkles
} from 'lucide-react';

export default function SystemDesignVisualizer() {
  const [selectedNode, setSelectedNode] = useState('gateway');

  const nodes = {
    client: {
      title: '1. Frontend Client Layer (React 18 + Vite)',
      badge: 'Presentation Tier',
      description: 'Modern single-page application built with React, Vite, and Vanilla CSS glassmorphism. Manages conversations, optimistic streaming UI, user feedback rating widgets, and distributed trace headers.',
      tech: 'React 18, Vite, Lucide Icons, Fetch API, LocalStorage',
      flow: 'User enters query → Injects or receives X-Trace-ID → Dispatches asynchronous POST request to API Gateway.'
    },
    gateway: {
      title: '2. API Gateway & Observability Middleware',
      badge: 'Edge / Ingress Tier',
      description: 'Django REST Framework API gateway that handles routing, CORS, and distributed request lifecycle tracing. Injects unique X-Trace-ID, monitors execution time with microsecond accuracy, profiles SQL query count, and checks security blacklists.',
      tech: 'Django 5, Django REST Framework, TraceIDMiddleware, ObservabilityMiddleware',
      flow: 'Extracts / assigns trace_id → Checks IP blacklist → Times execution duration → Passes to business controllers.'
    },
    cache: {
      title: '3. Redis Caching & Security Gate',
      badge: 'In-Memory Subsystem',
      description: 'Optional Redis caching layer (with fallback to LocMemCache). Caches exact responses for identical prompts with configurable TTL (5 mins) and performs O(1) blacklist lookups for revoked JWT tokens and malicious IPs.',
      tech: 'Redis, django-redis, LocMemCache fallback',
      flow: 'Computes sha256(query) hash → If Cache Hit: returns cached result in <2ms bypassing DB → If Cache Miss: forwards to Doc QA engine.'
    },
    service: {
      title: '4. Doc QA & Static Bot Engine',
      badge: 'Intelligence Service Tier',
      description: 'Combines deterministic static rule matching with TF-IDF and N-gram cosine ranking over chunked knowledge documents. Builds grounded responses complete with source citation metadata and token consumption accounting.',
      tech: 'scikit-learn (TfidfVectorizer), NumPy, Sliding-Window Chunker',
      flow: 'Segments docs into 400-char chunks (60-char overlap) → Ranks similarity against query vector → Formats answer with citations.'
    },
    db: {
      title: '5. Persistence & Telemetry Store',
      badge: 'Data Persistence Tier',
      description: 'ACID-compliant relational database storing user credentials, conversation threads, message histories, citations, user feedback reviews, and telemetry RequestLog records.',
      tech: 'MySQL (via PyMySQL) with automatic SQLite fallback',
      flow: 'Stores conversation trees, user feedback with 5-star ratings, and writes telemetry logs for admin observability.'
    }
  };

  const active = nodes[selectedNode];

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 88px)',
      margin: '12px 16px 12px 16px',
      gap: '14px',
      overflowY: 'auto'
    }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>System Design & High-Level Architectural Flow</h2>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Interactive walkthrough: <strong>User → Frontend → API Gateway → Redis / RAG → MySQL Persistence</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Flow Stepper */}
      <div className="glass-panel" style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'client', icon: Cpu, label: 'React Frontend' },
          { id: 'gateway', icon: Server, label: 'API Gateway & Obs' },
          { id: 'cache', icon: Zap, label: 'Redis Cache' },
          { id: 'service', icon: Sparkles, label: 'Doc QA & RAG' },
          { id: 'db', icon: Database, label: 'MySQL Database' }
        ].map((step, idx) => {
          const Icon = step.icon;
          const isSel = selectedNode === step.id;
          return (
            <React.Fragment key={step.id}>
              <div
                onClick={() => setSelectedNode(step.id)}
                className="glass-panel-interactive"
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '16px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isSel ? 'var(--bg-surface-hover)' : 'var(--bg-secondary)',
                  border: isSel ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isSel ? 'var(--gradient-brand)' : 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSel ? '#ffffff' : 'var(--text-secondary)'
                }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isSel ? 'var(--primary)' : 'var(--text-primary)' }}>
                  {step.label}
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>Step {idx + 1}</span>
              </div>

              {idx < 4 && (
                <ArrowRight size={20} color="var(--border-glass-bright)" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Deep-Dive Inspection Card */}
      <div className="glass-panel animate-fade-in" style={{
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '6px' }}>{active.badge}</span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{active.title}</h3>
          </div>
          <CheckCircle2 size={24} color="var(--success)" />
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
          {active.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Technologies & Frameworks
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              {active.tech}
            </p>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Data & Execution Flow
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              {active.flow}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
