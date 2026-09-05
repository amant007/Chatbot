import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Cpu,
  Clock,
  ThumbsUp,
  ShieldAlert,
  Database,
  Search,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  BarChart3,
  Server
} from 'lucide-react';
import api from '../services/api';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [traces, setTraces] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [cacheStats, setCacheStats] = useState(null);
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'traces' | 'feedback' | 'cache_security'

  // Trace search state
  const [traceSearch, setTraceSearch] = useState('');
  const [selectedTrace, setSelectedTrace] = useState(null);

  // Blacklist add form
  const [blackValue, setBlackValue] = useState('');
  const [blackType, setBlackType] = useState('ip');
  const [blackReason, setBlackReason] = useState('');

  const loadAllMetrics = async () => {
    setLoading(true);
    try {
      const [m, t, f, c, b] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminTraces(),
        api.getAdminFeedback(),
        api.getCacheStats(),
        api.getBlacklist()
      ]);
      setMetrics(m);
      setTraces(t.results || []);
      setFeedbacks(f.results || []);
      setCacheStats(c);
      setBlacklist(b.results || []);
    } catch (err) {
      console.error('Failed to load admin observability data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMetrics();
  }, []);

  const handleSearchTraces = async (e) => {
    e?.preventDefault();
    try {
      const t = await api.getAdminTraces(traceSearch);
      setTraces(t.results || []);
    } catch (err) {
      console.error('Trace search failed:', err);
    }
  };

  const handleFlushCache = async () => {
    if (window.confirm('Flush all cached queries and static responses?')) {
      try {
        await api.flushCache();
        const c = await api.getCacheStats();
        setCacheStats(c);
        alert('Cache successfully flushed.');
      } catch (err) {
        console.error('Cache flush failed:', err);
      }
    }
  };

  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    if (!blackValue.trim()) return;
    try {
      await api.addBlacklist(blackType, blackValue.trim(), blackReason || 'Admin manual block');
      setBlackValue('');
      setBlackReason('');
      const b = await api.getBlacklist();
      setBlacklist(b.results || []);
    } catch (err) {
      console.error('Failed to add blacklist entry:', err);
    }
  };

  const handleRemoveBlacklist = async (id) => {
    try {
      await api.removeBlacklist(id);
      setBlacklist(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to remove blacklist:', err);
    }
  };

  const overview = metrics?.overview || {};
  const timeSeries = metrics?.time_series || [];

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
      {/* Header & Subnav */}
      <div className="glass-panel" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={18} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Admin & Observability Control Center</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Real-time distributed tracing, latency profiling, telemetry analytics & cache management
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('overview')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <BarChart3 size={14} /> Telemetry Overview
          </button>
          <button
            className={`btn ${activeTab === 'traces' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('traces')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Clock size={14} /> Trace Inspector ({traces.length})
          </button>
          <button
            className={`btn ${activeTab === 'feedback' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('feedback')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <ThumbsUp size={14} /> Feedback Audit ({feedbacks.length})
          </button>
          <button
            className={`btn ${activeTab === 'cache_security' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('cache_security')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <ShieldAlert size={14} /> Cache & Blacklist
          </button>
          <button className="btn btn-secondary btn-icon" onClick={loadAllMetrics} title="Refresh Telemetry">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* KPI Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {/* KPI 1: Latency P95 / P50 */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>LATENCY (p50 / p95)</span>
                <Clock size={14} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {overview.p50_latency_ms || 0}ms <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {overview.p95_latency_ms || 0}ms</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Avg: {overview.avg_latency_ms || 0}ms across all endpoints
              </div>
            </div>

            {/* KPI 2: Cache Hit Rate */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>CACHE HIT RATIO</span>
                <Zap size={14} color="var(--success)" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                {overview.cache_hit_rate_pct || 0}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Sub-millisecond query responses
              </div>
            </div>

            {/* KPI 3: Token Accounting */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>TOKENS CONSUMED</span>
                <Cpu size={14} color="var(--secondary-accent)" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {(overview.total_tokens || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Prompt: {overview.prompt_tokens || 0} • Completion: {overview.completion_tokens || 0}
              </div>
            </div>

            {/* KPI 4: User Satisfaction */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>USER SATISFACTION</span>
                <ThumbsUp size={14} color="var(--warning)" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
                {overview.satisfaction_rate_pct || 100}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Avg Stars: {overview.avg_stars || 5.0} / 5.0 ({overview.total_feedback || 0} reviews)
              </div>
            </div>

            {/* KPI 5: Error Rate */}
            <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                <span>HTTP ERROR RATE</span>
                <AlertTriangle size={14} color="var(--danger)" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                {overview.error_rate_pct || 0}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {overview.total_requests || 0} total requests logged
              </div>
            </div>
          </div>

          {/* Traffic and Latency Trend Visualizer */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '14px' }}>
              Hourly Traffic & Response Latency Distribution
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              height: '140px',
              paddingTop: '20px',
              borderBottom: '1px solid var(--border-glass)'
            }}>
              {timeSeries.map((item, idx) => {
                const maxReq = Math.max(...timeSeries.map(t => t.requests), 1);
                const heightPct = Math.max((item.requests / maxReq) * 100, 8);
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {item.requests}req
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: 'var(--gradient-brand)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}></div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.time}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Design Vitals Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Active Infrastructure Nodes</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <li>• <strong>API Gateway:</strong> Django REST Framework with <code>TraceIDMiddleware</code></li>
                <li>• <strong>Caching Layer:</strong> {cacheStats?.cache_engine || 'In-Memory Cache (LocMem)'}</li>
                <li>• <strong>Persistence Store:</strong> MySQL / SQLite Database</li>
                <li>• <strong>Knowledge Index:</strong> TF-IDF Vectorizer ({overview.total_chunks || 0} Chunks in memory)</li>
              </ul>
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px' }}>Security & Telemetry Rules</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <li>• <strong>Distributed Tracing:</strong> Injected into all <code>X-Trace-ID</code> HTTP response headers</li>
                <li>• <strong>Blacklist Filter:</strong> {blacklist.length} active blocked IP/token entries</li>
                <li>• <strong>Total Active Conversations:</strong> {overview.total_conversations || 0} threads</li>
                <li>• <strong>Active Knowledge Documents:</strong> {overview.total_documents || 0} articles</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISTRIBUTED TRACE INSPECTOR */}
      {activeTab === 'traces' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Distributed Request Trace Explorer</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Search and audit microsecond latency, DB query counts, and execution status per Trace ID
              </p>
            </div>
            <form onSubmit={handleSearchTraces} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-text"
                placeholder="Search by Trace ID or Path..."
                value={traceSearch}
                onChange={(e) => setTraceSearch(e.target.value)}
                style={{ width: '280px', fontSize: '0.8rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 14px' }}>
                <Search size={14} /> Search
              </button>
            </form>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>TRACE ID</th>
                  <th style={{ padding: '10px' }}>METHOD</th>
                  <th style={{ padding: '10px' }}>PATH</th>
                  <th style={{ padding: '10px' }}>STATUS</th>
                  <th style={{ padding: '10px' }}>LATENCY</th>
                  <th style={{ padding: '10px' }}>DB QUERIES</th>
                  <th style={{ padding: '10px' }}>CACHE</th>
                  <th style={{ padding: '10px' }}>TIME</th>
                </tr>
              </thead>
              <tbody>
                {traces.map((t, idx) => (
                  <tr
                    key={t.id || idx}
                    style={{ borderBottom: '1px solid var(--border-glass)', fontFamily: 'var(--font-mono)' }}
                  >
                    <td style={{ padding: '10px', color: 'var(--primary)', fontWeight: 600 }}>
                      {t.trace_id}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>{t.method}</span>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-primary)', fontFamily: 'var(--font-main)' }}>
                      {t.path}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span className={`badge ${t.status_code < 400 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                        {t.status_code}
                      </span>
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>
                      {t.response_time_ms}ms
                    </td>
                    <td style={{ padding: '10px' }}>
                      {t.db_query_count} SQL
                    </td>
                    <td style={{ padding: '10px' }}>
                      {t.cache_hit ? (
                        <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>HIT</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>MISS</span>
                      )}
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {new Date(t.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER FEEDBACK AUDIT */}
      {activeTab === 'feedback' && (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>User Satisfaction & Feedback Telemetry</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Audit quality ratings, evaluation tags, and user remarks on chatbot answers
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                No feedback recorded yet. Test giving thumbs up/down on chat messages!
              </div>
            ) : (
              feedbacks.map((fb, idx) => (
                <div
                  key={fb.id || idx}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${fb.rating_type === 'thumbs_up' ? 'badge-success' : 'badge-warning'}`}>
                        {fb.rating_type === 'thumbs_up' ? '👍 Thumbs Up' : '👎 Thumbs Down'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                        {'★'.repeat(fb.stars)}{'☆'.repeat(5 - fb.stars)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        in "{fb.conversation_title}"
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(fb.created_at).toLocaleString()}
                    </span>
                  </div>

                  {fb.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {fb.tags.map((tag, ti) => (
                        <span key={ti} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {fb.comment && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontStyle: 'italic', background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                      "{fb.comment}"
                    </p>
                  )}

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Message Excerpt: <em>"{fb.message_content}..."</em>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CACHE & SECURITY BLACKLIST */}
      {activeTab === 'cache_security' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Cache Control */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Redis & Caching Subsystem</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Controls in-memory query response caching, cache eviction, and ping performance
            </p>

            <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Engine:</span>
                <strong>{cacheStats?.cache_engine || 'LocMemCache'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>OPERATIONAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ping Latency:</span>
                <strong>{cacheStats?.ping_latency_ms || 0.4}ms</strong>
              </div>
            </div>

            <button className="btn btn-secondary" onClick={handleFlushCache} style={{ marginTop: 'auto' }}>
              <Trash2 size={14} color="var(--danger)" /> Flush All Cached Keys
            </button>
          </div>

          {/* Blacklist Control */}
          <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="var(--danger)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Security Blacklist Gate</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Instant IP or token JTI blocklist enforced in TraceIDMiddleware
            </p>

            <form onSubmit={handleAddBlacklist} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="input-text"
                  value={blackType}
                  onChange={(e) => setBlackType(e.target.value)}
                  style={{ width: '100px', fontSize: '0.8rem' }}
                >
                  <option value="ip">IP Addr</option>
                  <option value="token">Token JTI</option>
                </select>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. 192.168.1.100 or JTI"
                  value={blackValue}
                  onChange={(e) => setBlackValue(e.target.value)}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                />
              </div>
              <input
                type="text"
                className="input-text"
                placeholder="Reason for blacklist..."
                value={blackReason}
                onChange={(e) => setBlackReason(e.target.value)}
                style={{ fontSize: '0.8rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                Add to Blacklist
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
              {blacklist.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                  <span>[{b.entry_type.toUpperCase()}] {b.value}</span>
                  <button onClick={() => handleRemoveBlacklist(b.id)} className="btn btn-ghost" style={{ padding: '2px' }}>
                    <Trash2 size={12} color="var(--danger)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
