import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Layers,
  CheckCircle,
  Eye,
  RefreshCw,
  Sparkles,
  Database
} from 'lucide-react';
import api from '../services/api';

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'upload' | 'test'

  // Upload state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [rawContent, setRawContent] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Test retrieval state
  const [testQuery, setTestQuery] = useState('');
  const [testTopK, setTestTopK] = useState(3);
  const [retrievalResults, setRetrievalResults] = useState(null);
  const [testingRetrieval, setTestingRetrieval] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments();
      const list = data.results || data || [];
      setDocuments(list);
      if (list.length > 0 && !selectedDoc) {
        loadDocDetails(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const loadDocDetails = async (id) => {
    try {
      const doc = await api.getDocument(id);
      setSelectedDoc(doc);
    } catch (err) {
      console.error('Failed to load document details:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title || file.name);
        formData.append('category', category);
        await api.createDocument(formData);
      } else {
        await api.createDocument({
          title: title || 'Untitled Knowledge Doc',
          category,
          raw_content: rawContent
        });
      }
      setUploadSuccess(true);
      setTitle('');
      setRawContent('');
      setFile(null);
      await fetchDocuments();
      setTimeout(() => {
        setUploadSuccess(false);
        setActiveTab('list');
      }, 1200);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload document: ' + (err.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this document and all its indexed chunks?')) {
      try {
        await api.deleteDocument(id);
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
      } catch (err) {
        console.error('Failed to delete doc:', err);
      }
    }
  };

  const handleTestRetrieval = async (e) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setTestingRetrieval(true);
    try {
      const res = await api.testRetrieval(testQuery.trim(), testTopK);
      setRetrievalResults(res);
    } catch (err) {
      console.error('Retrieval test failed:', err);
    } finally {
      setTestingRetrieval(false);
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 88px)',
      margin: '12px 16px 12px 16px',
      gap: '12px'
    }}>
      {/* Subnav & Header */}
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
            <Database size={18} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Document Knowledge Base & RAG Index</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Ingest, chunk, and rank knowledge sources for grounded question answering
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('list')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <BookOpen size={14} /> Documents ({documents.length})
          </button>
          <button
            className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('upload')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Plus size={14} /> Ingest New Doc
          </button>
          <button
            className={`btn ${activeTab === 'test' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('test')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <Sparkles size={14} /> Test Retrieval Playground
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', gap: '16px', overflow: 'hidden' }}>
        {/* TAB 1: Document List & Chunk Explorer */}
        {activeTab === 'list' && (
          <>
            {/* Left Documents List */}
            <div className="glass-panel" style={{
              width: '340px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderRadius: 'var(--radius-lg)',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Knowledge Sources
                </span>
                <button className="btn btn-ghost" onClick={fetchDocuments} style={{ padding: '4px' }}>
                  <RefreshCw size={13} />
                </button>
              </div>

              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <FileText size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p>No knowledge documents found.</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab('upload')}
                    style={{ marginTop: '12px', fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    Ingest First Document
                  </button>
                </div>
              ) : (
                documents.map(doc => {
                  const isSelected = selectedDoc?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => loadDocDetails(doc.id)}
                      className={isSelected ? '' : 'glass-panel-interactive'}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-secondary)',
                        border: isSelected ? '1px solid var(--border-glass-bright)' : '1px solid var(--border-glass)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.84rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {doc.title}
                        </h4>
                        <button
                          className="btn btn-ghost"
                          onClick={(e) => handleDelete(doc.id, e)}
                          style={{ padding: '2px 4px', height: '22px' }}
                          title="Delete Document"
                        >
                          <Trash2 size={12} color="var(--danger)" />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.62rem' }}>{doc.category}</span>
                        <span className="badge badge-primary" style={{ fontSize: '0.62rem' }}>
                          <Layers size={10} /> {doc.total_chunks} chunks
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Chunk Inspector */}
            <div className="glass-panel" style={{
              flex: 1,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-lg)',
              overflowY: 'auto'
            }}>
              {selectedDoc ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedDoc.title}</h3>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Source: {selectedDoc.source_type} • Category: {selectedDoc.category} • Total Chunks: {selectedDoc.chunks?.length || 0}
                      </p>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>INDEX ACTIVE</span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-secondary)' }}>
                      Chunked Sliding-Window Segments & Token Profiles:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedDoc.chunks?.map((chunk, idx) => (
                        <div
                          key={chunk.id || idx}
                          style={{
                            padding: '14px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-glass)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
                            <span>Chunk #{chunk.chunk_index}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                              ~{chunk.token_count} tokens
                            </span>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                            {chunk.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  Select a document to inspect its sliding-window chunk index.
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: Document Ingestion Form */}
        {activeTab === 'upload' && (
          <div className="glass-panel" style={{
            flex: 1,
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '700px',
            margin: '0 auto',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '4px' }}>Ingest Knowledge Document</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Add documentation in Markdown or upload a TXT file. The system will automatically chunk, estimate tokens, and index for TF-IDF vector retrieval.
            </p>

            {uploadSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)' }}>Document Ingested & Indexed!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sliding-window chunks generated successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Document Title
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="e.g. Distributed Caching Best Practices"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="e.g. System Design, Observability, DevOps"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Attach Text / Markdown File (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}
                  />
                </div>

                {!file && (
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      Or Paste Knowledge Content (Markdown / Plain Text)
                    </label>
                    <textarea
                      className="input-text"
                      rows={8}
                      placeholder="Paste technical documentation, system specifications, or FAQ items here..."
                      value={rawContent}
                      onChange={(e) => setRawContent(e.target.value)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('list')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={uploading || (!file && !rawContent.trim())}
                  >
                    <Upload size={15} /> {uploading ? 'Chunking & Indexing...' : 'Ingest & Index'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: Retrieval Playground */}
        {activeTab === 'test' && (
          <div className="glass-panel" style={{
            flex: 1,
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>RAG Retrieval & Cosine Similarity Playground</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Test how the TF-IDF vector ranking engine calculates similarity scores and retrieves top-k chunks for any sample prompt.
              </p>
            </div>

            <form onSubmit={handleTestRetrieval} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Test Query
                </label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="e.g. How does distributed tracing work?"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Top-K Chunks
                </label>
                <select
                  className="input-text"
                  value={testTopK}
                  onChange={(e) => setTestTopK(Number(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={testingRetrieval || !testQuery.trim()}
                style={{ height: '42px', padding: '0 18px' }}
              >
                <Search size={15} /> {testingRetrieval ? 'Searching...' : 'Calculate Similarity'}
              </button>
            </form>

            {retrievalResults && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Found {retrievalResults.match_count} Matching Chunks for query: <em>"{retrievalResults.query}"</em>
                </div>

                {retrievalResults.chunks?.map((chunk, idx) => (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${idx === 0 ? 'var(--success)' : 'var(--primary)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                        Rank #{idx + 1}: {chunk.document_title} (Chunk #{chunk.chunk_index})
                      </span>
                      <span className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                        Cosine Similarity: {(chunk.similarity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: '1.5', background: 'var(--bg-secondary)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
                      "{chunk.content}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
