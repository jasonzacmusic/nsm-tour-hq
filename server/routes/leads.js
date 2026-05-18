import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { db, leadFromCsvRow } from '../db.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const LEAD_COLUMNS = [
  'cluster','city','state','country','institution_name','archetype',
  'contact_name','contact_email','instagram_handle','phone','website',
  'recommended_topic','priority','personalized_hook','format_recommendation',
  'language_confidence','status','notes','send_via','verified'
];

router.get('/', (req, res) => {
  const { cluster, country, archetype, priority, status, send_via, language_confidence, search } = req.query;
  const where = [];
  const params = [];
  if (cluster) {
    const list = String(cluster).split(',').map(s => s.trim()).filter(Boolean);
    where.push(`cluster IN (${list.map(() => '?').join(',')})`);
    params.push(...list);
  }
  if (country)   { where.push('country = ?');   params.push(country); }
  if (archetype) { where.push('archetype = ?'); params.push(archetype); }
  if (priority)  { where.push('priority = ?');  params.push(priority); }
  if (status)    { where.push('status = ?');    params.push(status); }
  if (send_via)  { where.push('send_via = ?');  params.push(send_via); }
  if (language_confidence) { where.push('language_confidence = ?'); params.push(language_confidence); }
  if (search) {
    where.push(`(
      institution_name LIKE ? OR city LIKE ? OR country LIKE ? OR contact_name LIKE ?
      OR contact_email LIKE ? OR website LIKE ? OR recommended_topic LIKE ?
      OR personalized_hook LIKE ? OR notes LIKE ?
    )`);
    const q = `%${search}%`;
    params.push(q, q, q, q, q, q, q, q, q);
  }
  const sql = `SELECT * FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY
    CASE priority WHEN 'Highest' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END,
    institution_name`;
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Not found' });
  const emails = db.prepare(`
    SELECT id, sent_at, subject, body_preview, status, opened_at, replied_at, follow_up_due
    FROM email_log WHERE lead_id = ? ORDER BY COALESCE(sent_at, '0') DESC, id DESC
  `).all(req.params.id);
  res.json({ ...lead, emails });
});

router.post('/', (req, res) => {
  const data = pickFields(req.body, LEAD_COLUMNS);
  if (!data.institution_name) return res.status(400).json({ error: 'institution_name required' });
  if (!data.cluster) data.cluster = 'Northeast';
  if (!data.archetype) data.archetype = 'contemporary_academy';
  const cols = Object.keys(data);
  const placeholders = cols.map(() => '?').join(',');
  const sql = `INSERT INTO leads (${cols.join(',')}) VALUES (${placeholders})`;
  const info = db.prepare(sql).run(...cols.map(c => data[c]));
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(info.lastInsertRowid);
  res.json(lead);
});

router.put('/:id', (req, res) => {
  const data = pickFields(req.body, LEAD_COLUMNS);
  data.updated_at = new Date().toISOString();
  const cols = Object.keys(data);
  if (cols.length === 0) return res.status(400).json({ error: 'No fields' });
  const sql = `UPDATE leads SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...cols.map(c => data[c]), req.params.id);
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  res.json(lead);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file required (field name: file)' });
  const csvRaw = req.file.buffer.toString('utf8');
  let rows;
  try {
    rows = parse(csvRaw, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    return res.status(400).json({ error: 'CSV parse error: ' + e.message });
  }
  const dup = db.prepare("SELECT 1 FROM leads WHERE institution_name = ? AND COALESCE(city,'') = COALESCE(?, '')");
  const insert = db.prepare(`
    INSERT INTO leads (cluster, city, state, country, institution_name, archetype,
      contact_name, contact_email, instagram_handle, phone, website, recommended_topic,
      priority, personalized_hook, format_recommendation, language_confidence, notes, send_via, verified)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  let added = 0, skipped = 0;
  const tx = db.transaction(() => {
    for (const r of rows) {
      const lead = leadFromCsvRow(r, { defaultCluster: 'Northeast', defaultCountry: 'India' });
      if (!lead) { skipped++; continue; }
      if (dup.get(lead.institution_name, lead.city)) { skipped++; continue; }
      insert.run(
        lead.cluster,
        lead.city,
        lead.state,
        lead.country,
        lead.institution_name,
        lead.archetype,
        lead.contact_name,
        lead.contact_email,
        lead.instagram_handle,
        lead.phone,
        lead.website,
        lead.recommended_topic,
        lead.priority,
        lead.personalized_hook,
        lead.format_recommendation,
        lead.language_confidence,
        lead.notes,
        lead.send_via,
        lead.verified
      );
      added++;
    }
  });
  tx();
  res.json({ added, skipped, total: rows.length });
});

function pickFields(body, cols) {
  const out = {};
  for (const c of cols) if (body[c] !== undefined) out[c] = body[c];
  return out;
}

export default router;
