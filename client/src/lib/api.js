const BASE = '';

async function request(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) {
    let err;
    try { err = await res.json(); } catch { err = { error: res.statusText }; }
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const api = {
  health: () => request('/api/health'),
  clusters: () => request('/api/clusters'),
  settings: {
    get: () => request('/api/settings'),
    put: (obj) => request('/api/settings', { method: 'PUT', body: JSON.stringify(obj) }),
  },
  leads: {
    list: (params = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== null) qs.set(k, v);
      return request(`/api/leads${qs.toString() ? '?' + qs.toString() : ''}`);
    },
    get: (id) => request(`/api/leads/${id}`),
    create: (body) => request('/api/leads', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/api/leads/${id}`, { method: 'DELETE' }),
    importCsv: async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/leads/import', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error || 'Import failed');
      return res.json();
    },
    resync: (body = {}) => request('/api/leads/resync', { method: 'POST', body: JSON.stringify(body) }),
  },
  emails: {
    list: () => request('/api/emails'),
    followups: () => request('/api/emails/followups'),
    instantStatus: () => request('/api/emails/instantly/status'),
    instantCampaigns: (params = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
      return request(`/api/emails/instantly/campaigns${qs.toString() ? '?' + qs.toString() : ''}`);
    },
    createInstantCampaign: (body) => request('/api/emails/instantly/campaigns', { method: 'POST', body: JSON.stringify(body) }),
    pushToInstantly: (body) => request('/api/emails/instantly/push', { method: 'POST', body: JSON.stringify(body) }),
    campaignSendingStatus: (id) => request(`/api/emails/instantly/campaigns/${id}/sending-status`),
    setStatus: (id, status) => request(`/api/emails/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    testConnection: () => request('/api/emails/test-connection', { method: 'POST' }),
  },
  comms: {
    list: (params = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== null) qs.set(k, v);
      return request(`/api/comms${qs.toString() ? '?' + qs.toString() : ''}`);
    },
    followups: (params = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '' && v !== null) qs.set(k, v);
      return request(`/api/comms/followups${qs.toString() ? '?' + qs.toString() : ''}`);
    },
    create: (body) => request('/api/comms', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/api/comms/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  campaigns: {
    list: () => request('/api/campaigns'),
    get: (id) => request(`/api/campaigns/${id}`),
    create: (b) => request('/api/campaigns', { method: 'POST', body: JSON.stringify(b) }),
    update: (id, b) => request(`/api/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
    remove: (id) => request(`/api/campaigns/${id}`, { method: 'DELETE' }),
    stats: (id) => request(`/api/campaigns/${id}/stats`),
  },
  finder: {
    search: (b) => request('/api/finder/search', { method: 'POST', body: JSON.stringify(b) }),
    generateHook: (b) => request('/api/finder/generate-hook', { method: 'POST', body: JSON.stringify(b) }),
    testConnection: () => request('/api/finder/test-connection'),
  },
  export: {
    stats: () => request('/api/export/stats'),
    csvUrl: (params = {}) => {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
      return `/api/export/csv${qs.toString() ? '?' + qs.toString() : ''}`;
    },
  },
};
