import express from 'express';
import { db } from '../db.js';
import { INSTANTLY_SENDER, instantlyConfigured, instantlyRequest, leadToInstantly } from '../instantly.js';

const router = express.Router();

function getEligibleLeads({ lead_ids, cluster, archetype }) {
  const where = ["send_via = 'INSTANTLY_OK'", "COALESCE(contact_email, '') != ''"];
  const params = [];
  if (Array.isArray(lead_ids) && lead_ids.length) {
    where.push(`id IN (${lead_ids.map(() => '?').join(',')})`);
    params.push(...lead_ids);
  }
  if (cluster) { where.push('cluster = ?'); params.push(cluster); }
  if (archetype) { where.push('archetype = ?'); params.push(archetype); }
  return db.prepare(`SELECT * FROM leads WHERE ${where.join(' AND ')} ORDER BY cluster, institution_name`).all(...params);
}

function logInstantlyPush({ leads, campaignId, subject, body, response }) {
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO email_log (lead_id, sent_at, subject, body_preview, status, follow_up_due, instant_campaign_id, instant_lead_id, touch_number)
    VALUES (?, ?, ?, ?, 'pushed_to_instantly', ?, ?, ?, 1)
  `);
  const updateLead = db.prepare("UPDATE leads SET status = 'contacted', updated_at = CURRENT_TIMESTAMP WHERE id = ?");
  const created = new Map((response?.created_leads || []).map(l => [String(l.email || '').toLowerCase(), l.id]));
  const followUpDue = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();
  const tx = db.transaction(() => {
    for (const lead of leads) {
      const info = insert.run(
        lead.id,
        now,
        subject || `Instantly campaign ${campaignId}`,
        String(body || lead.personalized_hook || '').slice(0, 500),
        followUpDue,
        campaignId,
        created.get(String(lead.contact_email || '').toLowerCase()) || null
      );
      db.prepare("INSERT INTO followups (email_log_id, due_date, status, message_preview, touch_number) VALUES (?, ?, 'pending', ?, 2)")
        .run(info.lastInsertRowid, followUpDue, 'Day-4 check: review Instantly reply status before any second touch.');
      updateLead.run(lead.id);
    }
  });
  tx();
}

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT e.*, l.institution_name, l.contact_name, l.cluster
    FROM email_log e LEFT JOIN leads l ON l.id = e.lead_id
    ORDER BY COALESCE(e.sent_at, e.id) DESC LIMIT 200
  `).all();
  res.json(rows);
});

router.get('/followups', (req, res) => {
  const rows = db.prepare(`
    SELECT f.*, e.subject, e.lead_id, e.touch_number as original_touch, l.institution_name, l.contact_name, l.contact_email, l.send_via
    FROM followups f
    JOIN email_log e ON e.id = f.email_log_id
    LEFT JOIN leads l ON l.id = e.lead_id
    WHERE f.status = 'pending'
      AND f.due_date <= ?
      AND COALESCE(f.touch_number, 2) <= 2
    ORDER BY f.due_date ASC
  `).all(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
  res.json(rows);
});

router.get('/instantly/status', async (req, res, next) => {
  if (!instantlyConfigured()) {
    return res.json({ ok: false, configured: false, sender: INSTANTLY_SENDER, error: 'INSTANTLY_API_KEY not set' });
  }
  try {
    const [accounts, analytics, campaigns] = await Promise.all([
      instantlyRequest('/accounts', { query: { search: INSTANTLY_SENDER, limit: 10 } }),
      instantlyRequest('/accounts/warmup-analytics', { method: 'POST', body: { emails: [INSTANTLY_SENDER] } }),
      instantlyRequest('/campaigns/analytics'),
    ]);
    const sender = (accounts.items || []).find(a => String(a.email).toLowerCase() === INSTANTLY_SENDER.toLowerCase()) || accounts.items?.[0] || null;
    res.json({ ok: true, configured: true, sender: INSTANTLY_SENDER, account: sender, warmup: analytics, campaigns });
  } catch (e) { next(e); }
});

router.get('/instantly/campaigns', async (req, res, next) => {
  try {
    const campaigns = await instantlyRequest('/campaigns', { query: { limit: 100, search: req.query.search } });
    res.json(campaigns);
  } catch (e) { next(e); }
});

router.post('/instantly/campaigns', async (req, res, next) => {
  const { name, send_window_start = '09:00', send_window_end = '17:00', timezone = 'Asia/Kolkata' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const campaign = await instantlyRequest('/campaigns', {
      method: 'POST',
      body: {
        name,
        email_list: [INSTANTLY_SENDER],
        daily_limit: 20,
        daily_max_leads: 20,
        stop_on_reply: true,
        open_tracking: true,
        link_tracking: false,
        campaign_schedule: {
          schedules: [{
            name: 'NSM workshop weekday window',
            timing: { from: send_window_start, to: send_window_end },
            days: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: false, 6: false },
            timezone,
          }],
        },
      },
    });
    res.json(campaign);
  } catch (e) { next(e); }
});

router.post('/instantly/push', async (req, res, next) => {
  const { campaign_id, lead_ids, cluster, archetype, subject, body, dry_run } = req.body || {};
  if (!campaign_id) return res.status(400).json({ error: 'campaign_id required' });
  const leads = getEligibleLeads({ lead_ids, cluster, archetype });
  const skipped = Array.isArray(lead_ids) ? lead_ids.length - leads.length : 0;
  const payload = {
    campaign_id,
    skip_if_in_workspace: true,
    leads: leads.map(leadToInstantly),
  };
  if (dry_run) return res.json({ dry_run: true, total: leads.length, skipped, campaign_id, sample: payload.leads.slice(0, 5) });
  try {
    const response = await instantlyRequest('/leads/add', { method: 'POST', body: payload });
    logInstantlyPush({ leads, campaignId: campaign_id, subject, body, response });
    res.json({ success: true, pushed: leads.length, skipped, response });
  } catch (e) { next(e); }
});

router.get('/instantly/campaigns/:id/sending-status', async (req, res, next) => {
  try {
    res.json(await instantlyRequest(`/campaigns/${req.params.id}/sending-status`, { query: { with_ai_summary: true } }));
  } catch (e) { next(e); }
});

router.post('/test-connection', async (req, res) => {
  if (!instantlyConfigured()) return res.json({ ok: false, error: 'INSTANTLY_API_KEY not set' });
  try {
    const accounts = await instantlyRequest('/accounts', { query: { search: INSTANTLY_SENDER, limit: 10 } });
    res.json({ ok: true, sender: INSTANTLY_SENDER, accounts: accounts.items || [] });
  } catch (e) {
    res.json({ ok: false, error: e.message, details: e.payload });
  }
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'pushed_to_instantly', 'sent', 'opened', 'replied', 'bounced'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'invalid status' });
  const ts = new Date().toISOString();
  const updates = ['status = ?'];
  const params = [status];
  if (status === 'opened') { updates.push('opened_at = ?'); params.push(ts); }
  if (status === 'replied') { updates.push('replied_at = ?'); params.push(ts); }
  params.push(req.params.id);
  db.prepare(`UPDATE email_log SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  if (status === 'replied') {
    const log = db.prepare('SELECT lead_id FROM email_log WHERE id = ?').get(req.params.id);
    if (log) db.prepare("UPDATE leads SET status = 'replied' WHERE id = ?").run(log.lead_id);
  }
  res.json({ ok: true });
});

export default router;
