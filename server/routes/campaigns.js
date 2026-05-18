import express from 'express';
import { db } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all());
});

router.get('/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

router.post('/', (req, res) => {
  const { name, cluster, archetype, subject_line, body_template, status } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const info = db.prepare(`INSERT INTO campaigns (name, cluster, archetype, subject_line, body_template, status)
    VALUES (?,?,?,?,?,?)`).run(name, cluster || null, archetype || null, subject_line || null, body_template || null, status || 'draft');
  res.json(db.prepare('SELECT * FROM campaigns WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, cluster, archetype, subject_line, body_template, status } = req.body;
  db.prepare(`UPDATE campaigns SET name = COALESCE(?, name), cluster = ?, archetype = ?,
    subject_line = ?, body_template = ?, status = COALESCE(?, status) WHERE id = ?`)
    .run(name, cluster, archetype, subject_line, body_template, status, req.params.id);
  res.json(db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/:id/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM email_log WHERE campaign_id = ?').get(req.params.id).c;
  const opened = db.prepare('SELECT COUNT(*) as c FROM email_log WHERE campaign_id = ? AND opened_at IS NOT NULL').get(req.params.id).c;
  const replied = db.prepare('SELECT COUNT(*) as c FROM email_log WHERE campaign_id = ? AND replied_at IS NOT NULL').get(req.params.id).c;
  const bounced = db.prepare("SELECT COUNT(*) as c FROM email_log WHERE campaign_id = ? AND status = 'bounced'").get(req.params.id).c;
  res.json({
    total, opened, replied, bounced,
    open_rate: total ? +(opened / total * 100).toFixed(1) : 0,
    reply_rate: total ? +(replied / total * 100).toFixed(1) : 0,
    bounce_rate: total ? +(bounced / total * 100).toFixed(1) : 0,
  });
});

router.post('/:id/preview', (req, res) => {
  const c = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const sample = {
    contact_name: 'Sample Contact',
    institution_name: 'Sample Music Academy',
    personalized_hook: 'Your recent concert showed exactly the kind of curated programming I love.',
    country: 'India',
    city: 'Sample City',
  };
  function sub(t) {
    return String(t || '')
      .replaceAll('{{first_name}}', sample.contact_name.split(' ')[0])
      .replaceAll('{{company_name}}', sample.institution_name)
      .replaceAll('{{personalized_hook}}', sample.personalized_hook)
      .replaceAll('{{country}}', sample.country)
      .replaceAll('{{city}}', sample.city);
  }
  res.json({ subject: sub(c.subject_line), body: sub(c.body_template) });
});

export default router;
