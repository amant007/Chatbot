const API_BASE = 'http://127.0.0.1:8000/api';

// Generate lightweight UUIDv4 for distributed request tracing
function generateTraceId() {
  return 'trace-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
}

class ApiService {
  constructor() {
    this.guestId = localStorage.getItem('omnichat_guest_id') || null;
    this.token = localStorage.getItem('omnichat_token') || null;
    this.lastTraceId = null;
    this.lastResponseTime = null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('omnichat_token', token);
    } else {
      localStorage.removeItem('omnichat_token');
    }
  }

  setGuestId(guestId) {
    this.guestId = guestId;
    if (guestId) {
      localStorage.setItem('omnichat_guest_id', guestId);
    }
  }

  getHeaders(customHeaders = {}) {
    const traceId = generateTraceId();
    this.lastTraceId = traceId;

    const headers = {
      'X-Trace-ID': traceId,
      ...customHeaders
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.guestId) {
      headers['X-Guest-Session'] = this.guestId;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const startTime = performance.now();

    const headers = this.getHeaders(options.headers || {});
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const endTime = performance.now();
      this.lastResponseTime = Math.round(endTime - startTime);

      // Extract server headers
      const traceHeader = response.headers.get('X-Trace-ID');
      if (traceHeader) this.lastTraceId = traceHeader;

      const latencyHeader = response.headers.get('X-Response-Time-Ms');
      if (latencyHeader) this.lastResponseTime = parseFloat(latencyHeader);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw {
          status: response.status,
          data: errorData,
          traceId: this.lastTraceId,
          latency: this.lastResponseTime
        };
      }

      const data = await response.json();
      return {
        data,
        traceId: this.lastTraceId,
        latency: this.lastResponseTime,
        cacheStatus: response.headers.get('X-Cache-Status') || 'MISS'
      };
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth APIs
  async initGuest() {
    if (this.guestId) return { guest_id: this.guestId };
    const res = await this.request('/auth/guest/', { method: 'POST' });
    this.setGuestId(res.data.guest_id);
    return res.data;
  }

  async login(username, password) {
    const res = await this.request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        guest_session_id: this.guestId
      })
    });
    this.setToken(res.data.token);
    return res.data;
  }

  async register(username, email, password) {
    const res = await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        guest_session_id: this.guestId
      })
    });
    this.setToken(res.data.token);
    return res.data;
  }

  async getProfile() {
    const res = await this.request('/auth/profile/', { method: 'GET' });
    return res.data;
  }

  // Chat APIs
  async getConversations() {
    const res = await this.request('/chat/threads/', { method: 'GET' });
    return res.data;
  }

  async getConversation(id) {
    const res = await this.request(`/chat/threads/${id}/`, { method: 'GET' });
    return res.data;
  }

  async createConversation(title = 'New Conversation') {
    const res = await this.request('/chat/threads/', {
      method: 'POST',
      body: JSON.stringify({ title, guest_id: this.guestId })
    });
    return res.data;
  }

  async updateConversation(id, updates) {
    const res = await this.request(`/chat/threads/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return res.data;
  }

  async deleteConversation(id) {
    const res = await this.request(`/chat/threads/${id}/`, { method: 'DELETE' });
    return res.data;
  }

  async sendMessage(query, conversationId = null) {
    const res = await this.request('/chat/send/', {
      method: 'POST',
      body: JSON.stringify({
        query,
        conversation_id: conversationId,
        guest_id: this.guestId
      })
    });
    return res.data;
  }

  async submitFeedback(messageId, ratingType, stars = 5, tags = [], comment = '') {
    const res = await this.request('/chat/feedback/', {
      method: 'POST',
      body: JSON.stringify({
        message_id: messageId,
        rating_type: ratingType,
        stars,
        tags,
        comment
      })
    });
    return res.data;
  }

  // Documents APIs
  async getDocuments() {
    const res = await this.request('/documents/items/', { method: 'GET' });
    return res.data;
  }

  async getDocument(id) {
    const res = await this.request(`/documents/items/${id}/`, { method: 'GET' });
    return res.data;
  }

  async createDocument(docData) {
    if (docData instanceof FormData) {
      const res = await this.request('/documents/items/', {
        method: 'POST',
        body: docData
      });
      return res.data;
    }
    const res = await this.request('/documents/items/', {
      method: 'POST',
      body: JSON.stringify(docData)
    });
    return res.data;
  }

  async deleteDocument(id) {
    const res = await this.request(`/documents/items/${id}/`, { method: 'DELETE' });
    return res.data;
  }

  async testRetrieval(query, top_k = 3) {
    const res = await this.request('/documents/test-retrieval/', {
      method: 'POST',
      body: JSON.stringify({ query, top_k })
    });
    return res.data;
  }

  // Admin & Observability APIs
  async getAdminMetrics() {
    const res = await this.request('/admin-dashboard/metrics/', { method: 'GET' });
    return res.data;
  }

  async getAdminTraces(search = '', limit = 30) {
    const queryStr = search ? `?search=${encodeURIComponent(search)}&limit=${limit}` : `?limit=${limit}`;
    const res = await this.request(`/admin-dashboard/traces/${queryStr}`, { method: 'GET' });
    return res.data;
  }

  async getAdminFeedback() {
    const res = await this.request('/admin-dashboard/feedback/', { method: 'GET' });
    return res.data;
  }

  async getCacheStats() {
    const res = await this.request('/admin-dashboard/cache/', { method: 'GET' });
    return res.data;
  }

  async flushCache() {
    const res = await this.request('/admin-dashboard/cache/', {
      method: 'POST',
      body: JSON.stringify({ action: 'flush' })
    });
    return res.data;
  }

  async getBlacklist() {
    const res = await this.request('/admin-dashboard/blacklist/', { method: 'GET' });
    return res.data;
  }

  async addBlacklist(entryType, value, reason) {
    const res = await this.request('/admin-dashboard/blacklist/', {
      method: 'POST',
      body: JSON.stringify({ entry_type: entryType, value, reason })
    });
    return res.data;
  }

  async removeBlacklist(id) {
    const res = await this.request('/admin-dashboard/blacklist/', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
    return res.data;
  }
}

export const api = new ApiService();
export default api;
