import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nsm-tour-hq-'));
const sourceDir = path.join(tmp, 'leads', 'raw');
fs.mkdirSync(sourceDir, { recursive: true });

process.env.NSM_TOUR_DB_PATH = path.join(tmp, 'test.db');
process.env.INSTANTLY_OUTREACH_DIR = tmp;

const csv = `institution_name,city,country,cluster,archetype,contact_name,email,linkedin,whatsapp,website,priority,personalized_hook,send_via,verified
Alpha Music School,Kuala Lumpur,Malaysia,Malaysia,contemporary_academy,Ana Alpha,ana@example.com,https://linkedin.com/company/alpha,+60111111111,https://alpha.example,High,"Alpha hook",INSTANTLY_OK,high
Beta Choir,Kandy,Sri Lanka,Sri Lanka,hw,Beta Director,beta@example.com,,+94711111111,https://beta.example,Highest,"Beta hook",,high
`;
fs.writeFileSync(path.join(sourceDir, 'malaysia_test.csv'), csv);

const { db, migrate, resyncLeadsFromDisk, normalizeArchetype, normalizeSendVia } = await import('../server/db.js');

migrate();

const first = resyncLeadsFromDisk(sourceDir);
assert.equal(first.ok, true);
assert.equal(first.added, 2);
assert.equal(first.updated, 0);

const second = resyncLeadsFromDisk(sourceDir);
assert.equal(second.ok, true);
assert.equal(second.added, 0);
assert.equal(second.updated, 2);
assert.equal(db.prepare('SELECT COUNT(*) AS c FROM leads').get().c, 2);

assert.equal(normalizeArchetype('hw'), 'contemporary_academy');
assert.equal(normalizeSendVia('hw'), 'DO_NOT_USE_INSTANTLY');
assert.equal(normalizeSendVia('contemporary_academy', 'INSTANTLY_OK'), 'INSTANTLY_OK');

const alpha = db.prepare('SELECT * FROM leads WHERE institution_name = ?').get('Alpha Music School');
assert.equal(alpha.linkedin_url, 'https://linkedin.com/company/alpha');
assert.equal(alpha.whatsapp, '+60111111111');

const beta = db.prepare('SELECT * FROM leads WHERE institution_name = ?').get('Beta Choir');
assert.equal(beta.archetype, 'contemporary_academy');
assert.equal(beta.send_via, 'DO_NOT_USE_INSTANTLY');

const exportable = db.prepare(`
  SELECT COUNT(*) AS c FROM leads
  WHERE send_via = 'INSTANTLY_OK'
    AND COALESCE(contact_email, '') != ''
`).get().c;
assert.equal(exportable, 1);

db.close();
fs.rmSync(tmp, { recursive: true, force: true });
console.log('Smoke tests passed: CSV idempotency, routing normalization, export filter.');
