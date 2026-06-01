import express from 'express';
import { db } from '../db.js';

const router = express.Router();

const CHANNELS = new Set(['email', 'whatsapp', 'instagram', 'website_form', 'phone', 'other']);
const STATUSES = new Set(['drafted', 'sent', 'delivered', 'replied', 'follow_up_due', 'closed', 'failed']);

router.get('/', (req, res) => {
  const where = [];
  const params = [];
  if (req.query.lead_id) { where.push('c.lead_id = ?'); params.push(req.query.lead_id); }
  if (req.query.channel) { where.push('c.channel = ?'); params.push(req.query.channel); }
  if (req.query.status) { where.push('c.status = ?'); params.push(req.query.status); }
  const rows = db.prepare(`
    SELECT c.*, l.institution_name, l.city, l.country, l.priority
    FROM communication_log c
    LEFT JOIN leads l ON l.id = c.lead_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY COALESCE(c.occurred_at, c.created_at) DESC, c.id DESC
    LIMIT 300
  `).all(...params);
  res.json(rows);
});

router.get('/followups', (req, res) => {
  const horizon = req.query.horizon_days ? Number(req.query.horizon_days) : 1;
  const until = new Date(Date.now() + Math.max(0, horizon) * 24 * 60 * 60 * 1000).toISOString();
  const rows = db.prepare(`
    SELECT c.*, l.institution_name, l.contact_name, l.contact_email, l.instagram_handle, l.whatsapp, l.phone, l.city, l.country
    FROM communication_log c
    JOIN leads l ON l.id = c.lead_id
    WHERE c.follow_up_due IS NOT NULL
      AND c.follow_up_due <= ?
      AND c.status NOT IN ('replied', 'closed', 'failed')
      AND COALESCE(c.touch_number, 1) < 2
    ORDER BY c.follow_up_due ASC, c.id ASC
  `).all(until);
  res.json(rows);
});

router.post('/', (req, res) => {
  const leadId = Number(req.body?.lead_id);
  if (!leadId) return res.status(400).json({ error: 'lead_id required' });
  const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(leadId);
  if (!lead) return res.status(404).json({ error: 'lead not found' });

  const channel = String(req.body.channel || '').trim();
  if (!CHANNELS.has(channel)) return res.status(400).json({ error: 'invalid channel' });
  const status = STATUSES.has(req.body.status) ? req.body.status : 'sent';
  const occurredAt = req.body.occurred_at || new Date().toISOString();
  const followUpDue = req.body.follow_up_due || defaultFollowUpDue(status);

  const info = db.prepare(`
    INSERT INTO communication_log (
      lead_id, channel, direction, occurred_at, status, subject, message_preview,
      contact_value, asset_url, follow_up_due, touch_number, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    leadId,
    channel,
    req.body.direction || 'outbound',
    occurredAt,
    status,
    req.body.subject || null,
    req.body.message_preview || null,
    req.body.contact_value || null,
    req.body.asset_url || null,
    followUpDue,
    req.body.touch_number || 1,
    req.body.notes || null
  );

  const leadStatus = status === 'replied' ? 'replied' : 'contacted';
  db.prepare('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(leadStatus, leadId);
  res.json(db.prepare('SELECT * FROM communication_log WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const current = db.prepare('SELECT * FROM communication_log WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'not found' });
  const allowed = ['status', 'follow_up_due', 'notes', 'touch_number'];
  const data = {};
  for (const key of allowed) if (req.body[key] !== undefined) data[key] = req.body[key];
  if (data.status && !STATUSES.has(data.status)) return res.status(400).json({ error: 'invalid status' });
  const cols = Object.keys(data);
  if (!cols.length) return res.status(400).json({ error: 'no fields' });
  db.prepare(`UPDATE communication_log SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`)
    .run(...cols.map(c => data[c]), req.params.id);
  const updated = db.prepare('SELECT * FROM communication_log WHERE id = ?').get(req.params.id);
  if (updated.status === 'replied') {
    db.prepare("UPDATE leads SET status = 'replied', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(updated.lead_id);
  }
  res.json(updated);
});

function defaultFollowUpDue(status) {
  if (status !== 'sent' && status !== 'delivered') return null;
  return new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
}

export default router;
