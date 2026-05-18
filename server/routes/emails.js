import express from 'express';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';

const router = express.Router();

const sendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Rate limit: max 20 sends per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function getTransporter() {
  if (!process.env.GMAIL_APP_PASSWORD) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function substituteVars(template, lead) {
  if (!template) return '';
  const firstName = (lead.contact_name || '').split(' ')[0] || 'there';
  return String(template)
    .replaceAll('{{first_name}}', firstName)
    .replaceAll('{{company_name}}', lead.institution_name || '')
    .replaceAll('{{personalized_hook}}', lead.personalized_hook || '')
    .replaceAll('{{country}}', lead.country || '')
    .replaceAll('{{city}}', lead.city || '');
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
  const now = new Date().toISOString();
  const rows = db.prepare(`
    SELECT f.*, e.subject, e.lead_id, l.institution_name, l.contact_name, l.contact_email
    FROM followups f
    JOIN email_log e ON e.id = f.email_log_id
    LEFT JOIN leads l ON l.id = e.lead_id
    WHERE f.status = 'pending' AND f.due_date <= ?
    ORDER BY f.due_date ASC
  `).all(new Date(Date.now() + 24*60*60*1000).toISOString());
  res.json(rows);
});

router.post('/send', sendLimiter, async (req, res) => {
  const { lead_id, subject, body, campaign_id, dry_run } = req.body;
  if (!lead_id || !subject || !body) return res.status(400).json({ error: 'lead_id, subject, body required' });
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(lead_id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (!lead.contact_email) return res.status(400).json({ error: 'Lead has no contact_email' });

  const finalSubject = substituteVars(subject, lead);
  const finalBody = substituteVars(body, lead);

  if (dry_run) {
    return res.json({ dry_run: true, to: lead.contact_email, subject: finalSubject, body: finalBody });
  }

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(400).json({ error: 'Gmail not configured. Add GMAIL_APP_PASSWORD to .env in Settings.' });
  }

  try {
    const info = await transporter.sendMail({
      from: `"Jason Zachariah" <${process.env.GMAIL_USER}>`,
      to: lead.contact_email,
      subject: finalSubject,
      text: finalBody,
    });
    const sentAt = new Date().toISOString();
    const followUpDue = new Date(Date.now() + 4*24*60*60*1000).toISOString();
    const ins = db.prepare(`
      INSERT INTO email_log (lead_id, campaign_id, sent_at, subject, body_preview, status, follow_up_due)
      VALUES (?, ?, ?, ?, ?, 'sent', ?)
    `).run(lead_id, campaign_id || null, sentAt, finalSubject, finalBody.slice(0, 500), followUpDue);
    db.prepare("INSERT INTO followups (email_log_id, due_date, status, message_preview) VALUES (?, ?, 'pending', ?)")
      .run(ins.lastInsertRowid, followUpDue, finalSubject);
    db.prepare("UPDATE leads SET status = 'contacted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(lead_id);
    res.json({ success: true, message_id: info.messageId, log_id: ins.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/send-bulk', sendLimiter, async (req, res) => {
  const { lead_ids, subject, body, campaign_id, dry_run } = req.body;
  if (!Array.isArray(lead_ids) || lead_ids.length === 0) return res.status(400).json({ error: 'lead_ids array required' });
  if (!subject || !body) return res.status(400).json({ error: 'subject and body required' });

  const leads = db.prepare(`SELECT * FROM leads WHERE id IN (${lead_ids.map(() => '?').join(',')})`).all(...lead_ids);
  const eligible = leads.filter(l => l.contact_email && l.send_via !== 'DO_NOT_USE_INSTANTLY');
  const skipped = leads.length - eligible.length;

  if (dry_run) {
    return res.json({
      dry_run: true,
      total: lead_ids.length,
      eligible: eligible.length,
      skipped,
      previews: eligible.slice(0, 5).map(l => ({
        to: l.contact_email,
        subject: substituteVars(subject, l),
        body_preview: substituteVars(body, l).slice(0, 200),
      })),
    });
  }

  const transporter = getTransporter();
  if (!transporter) return res.status(400).json({ error: 'Gmail not configured.' });

  let sent = 0, failed = 0;
  for (const l of eligible) {
    try {
      const finalSubject = substituteVars(subject, l);
      const finalBody = substituteVars(body, l);
      const info = await transporter.sendMail({
        from: `"Jason Zachariah" <${process.env.GMAIL_USER}>`,
        to: l.contact_email, subject: finalSubject, text: finalBody,
      });
      const sentAt = new Date().toISOString();
      const followUpDue = new Date(Date.now() + 4*24*60*60*1000).toISOString();
      const ins = db.prepare(`
        INSERT INTO email_log (lead_id, campaign_id, sent_at, subject, body_preview, status, follow_up_due)
        VALUES (?, ?, ?, ?, ?, 'sent', ?)
      `).run(l.id, campaign_id || null, sentAt, finalSubject, finalBody.slice(0, 500), followUpDue);
      db.prepare("INSERT INTO followups (email_log_id, due_date, status, message_preview) VALUES (?, ?, 'pending', ?)")
        .run(ins.lastInsertRowid, followUpDue, finalSubject);
      db.prepare("UPDATE leads SET status = 'contacted', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(l.id);
      sent++;
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      failed++;
    }
  }
  res.json({ success: true, sent, failed, skipped });
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'sent', 'opened', 'replied', 'bounced'];
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

router.post('/test-connection', async (req, res) => {
  const t = getTransporter();
  if (!t) return res.json({ ok: false, error: 'GMAIL_APP_PASSWORD not set' });
  try {
    await t.verify();
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

export default router;
