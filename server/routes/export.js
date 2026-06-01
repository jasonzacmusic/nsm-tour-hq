import express from 'express';
import { stringify } from 'csv-stringify/sync';
import { db } from '../db.js';

const router = express.Router();

const INSTANTLY_COLUMNS = [
  'email', 'first_name', 'last_name', 'company_name',
  'personalized_hook', 'city', 'country', 'website',
  'phone', 'linkedin_url', 'whatsapp', 'entity_type', 'subtype', 'archetype',
  'recommended_topic', 'verification_level', 'source_url', 'source_type', 'priority', 'cluster', 'notes',
];

router.get('/csv', (req, res) => {
  const { cluster, send_via, archetype, instantly_only } = req.query;
  const where = [];
  const params = [];
  if (cluster) {
    const list = String(cluster).split(',').map(s => s.trim()).filter(Boolean);
    where.push(`cluster IN (${list.map(() => '?').join(',')})`);
    params.push(...list);
  }
  if (archetype) { where.push('archetype = ?'); params.push(archetype); }
  if (send_via) { where.push('send_via = ?'); params.push(send_via); }
  if (instantly_only === '1' || instantly_only === 'true') {
    where.push('send_via = ?'); params.push('INSTANTLY_OK');
    where.push('contact_email IS NOT NULL');
  }
  const sql = `SELECT * FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY cluster, institution_name`;
  const rows = db.prepare(sql).all(...params);
  const mapped = rows.map(r => {
    const [first_name, ...rest] = (r.contact_name || '').split(' ');
    return {
      email: r.contact_email || '',
      first_name: first_name || '',
      last_name: rest.join(' '),
      company_name: r.institution_name || '',
      personalized_hook: r.personalized_hook || '',
      city: r.city || '',
      country: r.country || '',
      website: r.website || '',
      phone: r.phone || r.whatsapp || '',
      linkedin_url: r.linkedin_url || '',
      whatsapp: r.whatsapp || '',
      entity_type: r.entity_type || '',
      subtype: r.subtype || '',
      archetype: r.archetype || '',
      recommended_topic: r.recommended_topic || '',
      verification_level: r.verification_level || '',
      source_url: r.source_url || '',
      source_type: r.source_type || '',
      priority: r.priority || '',
      cluster: r.cluster || '',
      notes: r.notes || '',
    };
  });
  const csv = stringify(mapped, { header: true, columns: INSTANTLY_COLUMNS });
  const filename = `nsm_leads${cluster ? '_' + cluster : ''}_${new Date().toISOString().slice(0, 10)}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

router.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  const byCluster = db.prepare(`
    SELECT cluster,
      COUNT(*) as total,
      SUM(CASE WHEN status='contacted' OR status='replied' OR status='follow_up_sent' OR status='closed' THEN 1 ELSE 0 END) as contacted,
      SUM(CASE WHEN status='replied' THEN 1 ELSE 0 END) as replied
    FROM leads GROUP BY cluster ORDER BY cluster
  `).all();
  const byArchetype = db.prepare('SELECT archetype, COUNT(*) as c FROM leads GROUP BY archetype').all();
  const byEntityType = db.prepare(`
    SELECT entity_type, COUNT(*) as c
    FROM leads
    WHERE COALESCE(entity_type, '') != ''
    GROUP BY entity_type ORDER BY entity_type
  `).all();
  const byVerification = db.prepare(`
    SELECT verification_level, COUNT(*) as c
    FROM leads
    WHERE COALESCE(verification_level, '') != ''
    GROUP BY verification_level ORDER BY verification_level
  `).all();
  const bySendVia = db.prepare('SELECT send_via, COUNT(*) as c FROM leads GROUP BY send_via').all();
  const instantlyReady = db.prepare(`
    SELECT COUNT(*) as c FROM leads
    WHERE send_via = 'INSTANTLY_OK'
      AND COALESCE(contact_email, '') != ''
  `).get().c;
  const handwrite = db.prepare(`
    SELECT COUNT(*) as c FROM leads
    WHERE send_via = 'DO_NOT_USE_INSTANTLY'
  `).get().c;
  const missingEmail = db.prepare(`
    SELECT COUNT(*) as c FROM leads
    WHERE COALESCE(contact_email, '') = ''
  `).get().c;
  const needsVerification = db.prepare(`
    SELECT COUNT(*) as c FROM leads
    WHERE lower(COALESCE(verified, language_confidence, '')) = 'low'
       OR COALESCE(website, '') = ''
       OR notes LIKE '%Verify%'
       OR notes LIKE '%verify%'
  `).get().c;
  const invalidSendVia = db.prepare(`
    SELECT COUNT(*) as c FROM leads
    WHERE send_via NOT IN ('INSTANTLY_OK', 'DO_NOT_USE_INSTANTLY')
       OR send_via IS NULL
  `).get().c;
  const emailsSent = db.prepare("SELECT COUNT(*) as c FROM email_log WHERE status != 'pending'").get().c;
  const replies = db.prepare('SELECT COUNT(*) as c FROM email_log WHERE replied_at IS NOT NULL').get().c;
  res.json({
    total_leads: total,
    emails_sent: emailsSent,
    replies,
    reply_rate: emailsSent ? +(replies / emailsSent * 100).toFixed(1) : 0,
    by_cluster: byCluster,
    by_archetype: byArchetype,
    by_entity_type: byEntityType,
    by_verification: byVerification,
    by_send_via: bySendVia,
    instantly_ready: instantlyReady,
    handwrite,
    missing_email: missingEmail,
    needs_verification: needsVerification,
    invalid_send_via: invalidSendVia,
  });
});

export default router;
