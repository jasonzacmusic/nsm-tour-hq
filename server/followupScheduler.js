import cron from 'node-cron';
import { db } from './db.js';

export function getDueFollowups(limit = 50) {
  return db.prepare(`
    SELECT f.*, e.lead_id, e.instant_campaign_id, l.institution_name, l.contact_email, l.send_via
    FROM followups f
    JOIN email_log e ON e.id = f.email_log_id
    LEFT JOIN leads l ON l.id = e.lead_id
    WHERE f.status = 'pending'
      AND f.due_date <= ?
      AND COALESCE(f.touch_number, 2) <= 2
    ORDER BY f.due_date ASC
    LIMIT ?
  `).all(new Date().toISOString(), limit);
}

export function startFollowupScheduler() {
  cron.schedule('*/30 * * * *', () => {
    const due = getDueFollowups();
    const upsert = db.prepare(`
      INSERT INTO settings(key, value) VALUES(?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    upsert.run('followups_last_scan_at', new Date().toISOString());
    upsert.run('followups_due_count', String(due.length));
    if (due.length) {
      console.log(`[followups] ${due.length} Day-4 review(s) due. Open the dashboard; no emails were auto-sent.`);
    }
  });
}
