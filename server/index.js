import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDb, db } from './db.js';
import leadsRouter from './routes/leads.js';
import emailsRouter from './routes/emails.js';
import campaignsRouter from './routes/campaigns.js';
import finderRouter from './routes/finder.js';
import exportRouter from './routes/export.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

initDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  const leadCount = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  res.json({
    ok: true,
    leadCount,
    gmailConfigured: !!process.env.GMAIL_APP_PASSWORD,
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
  });
});

app.get('/api/clusters', (req, res) => {
  const rows = db.prepare('SELECT * FROM clusters ORDER BY priority ASC').all();
  res.json(rows);
});

app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  res.json(out);
});

app.put('/api/settings', (req, res) => {
  const upsert = db.prepare('INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  const tx = db.transaction((obj) => {
    for (const [k, v] of Object.entries(obj)) upsert.run(k, String(v ?? ''));
  });
  tx(req.body || {});
  res.json({ ok: true });
});

app.use('/api/leads', leadsRouter);
app.use('/api/emails', emailsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/finder', finderRouter);
app.use('/api/export', exportRouter);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('[api error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`[server] NSM Tour HQ API on http://localhost:${PORT}`);
});
