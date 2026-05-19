const INSTANTLY_BASE_URL = process.env.INSTANTLY_BASE_URL || 'https://api.instantly.ai/api/v2';
export const INSTANTLY_SENDER = process.env.INSTANTLY_SENDER_EMAIL || 'workshops@jasonzacmusic.com';

export function instantlyConfigured() {
  return Boolean(process.env.INSTANTLY_API_KEY);
}

export async function instantlyRequest(path, { method = 'GET', body, query } = {}) {
  if (!instantlyConfigured()) {
    const err = new Error('INSTANTLY_API_KEY not configured. Add it to .env before pushing leads.');
    err.status = 400;
    throw err;
  }
  const url = new URL(INSTANTLY_BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.INSTANTLY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let payload = text;
  try { payload = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const err = new Error(payload?.message || payload?.error || `Instantly API ${res.status}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export function splitName(contactName = '') {
  const parts = String(contactName || '').trim().split(/\s+/).filter(Boolean);
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') };
}

export function leadToInstantly(lead) {
  const { first_name, last_name } = splitName(lead.contact_name);
  return {
    email: lead.contact_email,
    first_name,
    last_name,
    company_name: lead.institution_name || '',
    phone: lead.whatsapp || lead.phone || '',
    website: lead.website || '',
    personalization: lead.personalized_hook || '',
    pl_value_lead: lead.priority || 'Medium',
    custom_variables: {
      cluster: lead.cluster || '',
      city: lead.city || '',
      country: lead.country || '',
      archetype: lead.archetype || '',
      recommended_topic: lead.recommended_topic || '',
      instagram_handle: lead.instagram_handle || '',
      linkedin_url: lead.linkedin_url || '',
      whatsapp: lead.whatsapp || '',
      notes: lead.notes || '',
      source: 'nsm-tour-hq',
    },
  };
}
