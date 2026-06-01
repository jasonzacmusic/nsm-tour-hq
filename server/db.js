import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
export const DEFAULT_SOURCE_DATA_DIR = path.join(
  process.env.INSTANTLY_OUTREACH_DIR || '/Users/nphmacmini/Documents/Claude/instantly-outreach',
  'leads',
  'raw'
);

export const db = new Database(process.env.NSM_TOUR_DB_PATH || path.join(DATA_DIR, 'nsm_tour.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cluster TEXT NOT NULL,
      city TEXT,
      state TEXT,
      country TEXT DEFAULT 'India',
      institution_name TEXT NOT NULL,
      archetype TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT,
      instagram_handle TEXT,
      linkedin_url TEXT,
      whatsapp TEXT,
      record_id TEXT,
      entity_type TEXT,
      subtype TEXT,
      phone TEXT,
      website TEXT,
      recommended_topic TEXT,
      source_url TEXT,
      source_type TEXT,
      recommended_outreach_angle TEXT,
      repo_cluster TEXT,
      dedupe_key TEXT,
      priority TEXT DEFAULT 'Medium',
      personalized_hook TEXT,
      format_recommendation TEXT,
      language_confidence TEXT DEFAULT 'high',
      verification_level TEXT,
      status TEXT DEFAULT 'not_contacted',
      notes TEXT,
      send_via TEXT DEFAULT 'INSTANTLY_OK',
      verified TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cluster TEXT,
      archetype TEXT,
      subject_line TEXT,
      body_template TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
      campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
      sent_at DATETIME,
      subject TEXT,
      body_preview TEXT,
      status TEXT DEFAULT 'pending',
      opened_at DATETIME,
      replied_at DATETIME,
      follow_up_due DATETIME,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_log_id INTEGER REFERENCES email_log(id) ON DELETE CASCADE,
      due_date DATETIME,
      status TEXT DEFAULT 'pending',
      message_preview TEXT
    );

    CREATE TABLE IF NOT EXISTS clusters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT,
      countries TEXT,
      cities TEXT,
      priority INTEGER,
      status TEXT DEFAULT 'planning'
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_leads_cluster ON leads(cluster);
    CREATE INDEX IF NOT EXISTS idx_leads_archetype ON leads(archetype);
    CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_institution_city ON leads(institution_name, city);
    CREATE INDEX IF NOT EXISTS idx_email_log_lead ON email_log(lead_id);
    CREATE INDEX IF NOT EXISTS idx_followups_due ON followups(due_date, status);
  `);
  ensureColumn('leads', 'linkedin_url', 'TEXT');
  ensureColumn('leads', 'whatsapp', 'TEXT');
  ensureColumn('leads', 'record_id', 'TEXT');
  ensureColumn('leads', 'entity_type', 'TEXT');
  ensureColumn('leads', 'subtype', 'TEXT');
  ensureColumn('leads', 'source_url', 'TEXT');
  ensureColumn('leads', 'source_type', 'TEXT');
  ensureColumn('leads', 'recommended_outreach_angle', 'TEXT');
  ensureColumn('leads', 'repo_cluster', 'TEXT');
  ensureColumn('leads', 'dedupe_key', 'TEXT');
  ensureColumn('leads', 'verification_level', 'TEXT');
  ensureColumn('email_log', 'touch_number', 'INTEGER DEFAULT 1');
  ensureColumn('email_log', 'instant_campaign_id', 'TEXT');
  ensureColumn('email_log', 'instant_lead_id', 'TEXT');
  ensureColumn('followups', 'touch_number', 'INTEGER DEFAULT 2');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_leads_city ON leads(city);
    CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
    CREATE INDEX IF NOT EXISTS idx_leads_entity_type ON leads(entity_type);
    CREATE INDEX IF NOT EXISTS idx_leads_verification_level ON leads(verification_level);
    CREATE INDEX IF NOT EXISTS idx_leads_dedupe_key ON leads(dedupe_key);
  `);
}

function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

const DEFAULT_CLUSTERS = [
  { name: 'Northeast', color: '#e94560', countries: 'India', cities: 'Shillong, Kohima, Aizawl, Imphal, Gangtok, Darjeeling', priority: 1 },
  { name: 'Kerala', color: '#27ae60', countries: 'India', cities: 'Kochi, Trivandrum, Kozhikode, Kottayam', priority: 2 },
  { name: 'Goa+Mangalore', color: '#f5a623', countries: 'India', cities: 'Panjim, Margao, Mangalore, Manipal', priority: 3 },
  { name: 'Mussoorie+Dehradun', color: '#9b59b6', countries: 'India', cities: 'Mussoorie, Dehradun, Sanawar, Shimla, Nainital', priority: 4 },
  { name: 'South India', color: '#3498db', countries: 'India', cities: 'Pondicherry, Coimbatore, Mysore, Madurai, Hyderabad', priority: 5 },
  { name: 'Vietnam', color: '#e67e22', countries: 'Vietnam', cities: 'Hanoi, Ho Chi Minh City, Da Nang, Hoi An', priority: 6 },
  { name: 'Singapore', color: '#1abc9c', countries: 'Singapore', cities: 'Singapore', priority: 7 },
  { name: 'Dubai/UAE', color: '#d35400', countries: 'UAE', cities: 'Dubai, Abu Dhabi', priority: 8 },
  { name: 'South Africa', color: '#2ecc71', countries: 'South Africa', cities: 'Cape Town, Johannesburg', priority: 9 },
  { name: 'Thailand', color: '#e74c3c', countries: 'Thailand', cities: 'Bangkok, Chiang Mai', priority: 10 },
  { name: 'Zimbabwe+Namibia', color: '#34495e', countries: 'Zimbabwe, Namibia', cities: 'Harare, Windhoek', priority: 11 },
  { name: 'Malaysia+SriLanka', color: '#8e8cd8', countries: 'Malaysia, Sri Lanka', cities: 'Kuala Lumpur, Johor, Colombo, Kandy', priority: 12 },
];

export function seedClusters() {
  const stmt = db.prepare(
    `INSERT INTO clusters (name, color, countries, cities, priority)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       color = excluded.color,
       countries = excluded.countries,
       cities = excluded.cities,
       priority = excluded.priority`
  );
  const tx = db.transaction((rows) => {
    for (const r of rows) stmt.run(r.name, r.color, r.countries, r.cities, r.priority);
  });
  tx(DEFAULT_CLUSTERS);
}

const CSV_FILES = [
  { file: 'india_master_leads.csv', defaultCluster: null, defaultCountry: 'India' },
  { file: 'india_workshop_leads.csv', defaultCluster: null, defaultCountry: 'India' },
  { file: 'vietnam_workshop_leads_v2.csv', defaultCluster: 'Vietnam', defaultCountry: 'Vietnam' },
  { file: 'overseas_research_leads.csv', defaultCluster: null, defaultCountry: null },
];

const CLUSTER_NORMALIZE = {
  'goa+mgr': 'Goa+Mangalore',
  'goa': 'Goa+Mangalore',
  'goa+mangalore': 'Goa+Mangalore',
  'mangalore': 'Goa+Mangalore',
  'hills': 'Mussoorie+Dehradun',
  'mussoorie': 'Mussoorie+Dehradun',
  'dehradun': 'Mussoorie+Dehradun',
  'hill stations': 'Mussoorie+Dehradun',
  'south': 'South India',
  'south india': 'South India',
  'pondicherry': 'South India',
  'coimbatore': 'South India',
  'mysore': 'South India',
  'madurai': 'South India',
  'pune': 'South India',
  'hyderabad': 'South India',
  'indore': 'South India',
  'gwalior': 'South India',
  'lucknow': 'South India',
  'varanasi': 'South India',
  'khairagarh': 'South India',
  'chandigarh': 'South India',
  'bhubaneswar': 'South India',
  'bonus': 'South India',
  'production': 'South India',
  'kerala': 'Kerala',
  'northeast': 'Northeast',
  'vietnam': 'Vietnam',
  'malaysia': 'Malaysia+SriLanka',
  'sri lanka': 'Malaysia+SriLanka',
  'srilanka': 'Malaysia+SriLanka',
  'malaysia+srilanka': 'Malaysia+SriLanka',
};

export function normalizeCluster(raw, defaultCluster) {
  if (!raw) return defaultCluster || 'Northeast';
  const key = String(raw).trim().toLowerCase();
  return CLUSTER_NORMALIZE[key] || raw;
}

export function normalizePriority(raw) {
  if (!raw) return 'Medium';
  const p = String(raw).trim().toLowerCase();
  if (p === 'highest') return 'Highest';
  if (p === 'high') return 'High';
  if (p === 'medium' || p === 'med') return 'Medium';
  if (p === 'low') return 'Low';
  return raw;
}

export function normalizeVerification(raw) {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === 'highest' || v === 'high') return 'High';
  if (v === 'medium' || v === 'med') return 'Medium';
  if (v === 'low') return 'Low';
  return raw;
}

export function normalizeArchetype(raw) {
  if (!raw) return 'contemporary_academy';
  const a = String(raw).trim().toLowerCase();
  if (a === 'do_not_use_instantly' || a === 'hw' || a === 'hand_write' || a === 'anchor' || a === 'std') return 'contemporary_academy';
  return a;
}

export function normalizeSendVia(rawArchetype, rawSendVia) {
  if (rawSendVia) {
    const s = String(rawSendVia).trim().toUpperCase();
    if (s === 'DO_NOT_USE_INSTANTLY' || s === 'INSTANTLY_OK') return s;
  }
  const a = String(rawArchetype || '').trim().toLowerCase();
  if (a === 'do_not_use_instantly' || a === 'hw' || a === 'anchor') return 'DO_NOT_USE_INSTANTLY';
  if (a === 'church_choir' || a === 'church' || a.includes('church')) return 'DO_NOT_USE_INSTANTLY';
  return 'INSTANTLY_OK';
}

export function pickEmail(row) {
  const cands = [row.contact_email, row.email].filter(Boolean);
  for (const c of cands) {
    const t = String(c).trim();
    if (t && t.includes('@')) return t;
  }
  return null;
}

function pickWhatsapp(row) {
  return row.whatsapp || row.whatsapp_mobile || row.whatsapp_number || row.mobile || null;
}

function pickLinkedin(row) {
  return row.linkedin_url || row.linkedin || row.linkedin_profile || null;
}

export function pickName(row) {
  if (row.contact_name) return row.contact_name;
  if (row.contact_person) return row.contact_person;
  const fn = row.first_name?.trim();
  const ln = row.last_name?.trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
  return null;
}

export function pickInstitution(row) {
  return row.institution_name || row.company_name || row.name || null;
}

export function pickLanguageConfidence(row) {
  const raw = row.language_confidence || row.language;
  if (!raw) return 'high';
  const t = String(raw).trim().toLowerCase();
  if (t === 'high' || t === 'medium' || t === 'low') return t;
  return 'high';
}

export function leadFromCsvRow(row, defaults = {}) {
  const institution = pickInstitution(row);
  if (!institution) return null;
  const archetype = normalizeArchetype(row.archetype);
  return {
    cluster: normalizeCluster(row.cluster, defaults.defaultCluster),
    city: row.city || null,
    state: row.state || null,
    country: row.country || defaults.defaultCountry || 'India',
    institution_name: institution,
    archetype,
    contact_name: pickName(row),
    contact_email: pickEmail(row),
    instagram_handle: row.instagram_handle || row.instagram || null,
    linkedin_url: pickLinkedin(row),
    whatsapp: pickWhatsapp(row),
    record_id: row.record_id || null,
    entity_type: row.entity_type || null,
    subtype: row.subtype || null,
    phone: row.phone || null,
    website: row.website || null,
    recommended_topic: row.recommended_topic || row.recommended_outreach_angle || null,
    source_url: row.source_url || null,
    source_type: row.source_type || null,
    recommended_outreach_angle: row.recommended_outreach_angle || null,
    repo_cluster: row.repo_cluster || null,
    dedupe_key: row.dedupe_key || null,
    priority: normalizePriority(row.priority),
    personalized_hook: row.personalized_hook || null,
    format_recommendation: row.format_recommendation || null,
    language_confidence: pickLanguageConfidence(row),
    verification_level: normalizeVerification(row.verification_level) || normalizeVerification(row.verified) || null,
    notes: row.notes || null,
    send_via: normalizeSendVia(row.archetype, row.send_via),
    verified: row.verified || null,
  };
}

const LEAD_COLUMNS = [
  'cluster', 'city', 'state', 'country', 'institution_name', 'archetype',
  'contact_name', 'contact_email', 'instagram_handle', 'linkedin_url', 'whatsapp',
  'record_id', 'entity_type', 'subtype', 'phone', 'website', 'recommended_topic',
  'source_url', 'source_type', 'recommended_outreach_angle', 'repo_cluster', 'dedupe_key',
  'priority', 'personalized_hook', 'format_recommendation', 'language_confidence',
  'verification_level', 'notes', 'send_via', 'verified',
];

const insertLeadStmt = () => db.prepare(`
  INSERT INTO leads (${LEAD_COLUMNS.join(', ')})
  VALUES (${LEAD_COLUMNS.map(() => '?').join(',')})
`);

const updateLeadStmt = () => db.prepare(`
  UPDATE leads SET
    cluster = ?, city = ?, state = ?, country = ?, institution_name = ?, archetype = ?,
    contact_name = ?, contact_email = ?, instagram_handle = ?, linkedin_url = ?, whatsapp = ?,
    record_id = ?, entity_type = ?, subtype = ?, phone = ?, website = ?, recommended_topic = ?,
    source_url = ?, source_type = ?, recommended_outreach_angle = ?, repo_cluster = ?, dedupe_key = ?,
    priority = ?, personalized_hook = ?, format_recommendation = ?, language_confidence = ?,
    verification_level = ?, notes = ?, send_via = ?, verified = ?,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

function leadValues(lead) {
  return LEAD_COLUMNS.map(c => lead[c]);
}

function upsertLead(lead, insert, update) {
  const existing = findLead(lead.institution_name, lead.city);
  if (existing) {
    update.run(...leadValues(lead), existing.id);
    return 'updated';
  }
  insert.run(...leadValues(lead));
  return 'added';
}

export function upsertImportedLead(lead) {
  return upsertLead(lead, insertLeadStmt(), updateLeadStmt());
}

export function autoImportCsvs() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  if (existing > 0) {
    console.log(`[db] Skipping CSV import — ${existing} leads already present.`);
    return { skipped: true };
  }
  const insert = insertLeadStmt();
  const update = updateLeadStmt();
  let added = 0, updated = 0, skipped = 0;
  const tx = db.transaction(() => {
    for (const { file, defaultCluster, defaultCountry } of CSV_FILES) {
      const fp = path.join(DATA_DIR, file);
      if (!fs.existsSync(fp)) continue;
      const csvRaw = fs.readFileSync(fp, 'utf8');
      const rows = parse(csvRaw, { columns: true, skip_empty_lines: true, trim: true });
      for (const row of rows) {
        const lead = leadFromCsvRow(row, { defaultCluster, defaultCountry });
        if (!lead) { skipped++; continue; }
        upsertLead(lead, insert, update) === 'updated' ? updated++ : added++;
      }
    }
  });
  tx();
  console.log(`[db] CSV import complete — added ${added}, updated ${updated}, skipped ${skipped}.`);
  return { added, updated, skipped };
}

export function findLead(institutionName, city) {
  return db.prepare(`
    SELECT id FROM leads
    WHERE lower(institution_name) = lower(?)
      AND lower(COALESCE(city, '')) = lower(COALESCE(?, ''))
  `).get(institutionName, city || null);
}

export function resyncLeadsFromDisk(sourceDir = DEFAULT_SOURCE_DATA_DIR) {
  if (!fs.existsSync(sourceDir)) {
    return { ok: false, sourceDir, error: 'source directory not found', added: 0, updated: 0, skipped: 0 };
  }
  const files = fs.readdirSync(sourceDir).filter(f => f.toLowerCase().endsWith('.csv')).sort();
  if (files.length === 0) {
    return { ok: false, sourceDir, error: 'no CSV files found', added: 0, updated: 0, skipped: 0 };
  }

  const insert = insertLeadStmt();
  const update = updateLeadStmt();

  let added = 0, updated = 0, skipped = 0;
  const perFile = [];
  const tx = db.transaction(() => {
    for (const file of files) {
      const rows = parse(fs.readFileSync(path.join(sourceDir, file), 'utf8'), { columns: true, skip_empty_lines: true, trim: true });
      let fileAdded = 0, fileUpdated = 0, fileSkipped = 0;
      for (const row of rows) {
        const lead = leadFromCsvRow(row, { defaultCluster: inferClusterFromFilename(file), defaultCountry: inferCountryFromFilename(file) });
        if (!lead) { skipped++; fileSkipped++; continue; }
        if (upsertLead(lead, insert, update) === 'updated') { updated++; fileUpdated++; } else { added++; fileAdded++; }
      }
      perFile.push({ file, rows: rows.length, added: fileAdded, updated: fileUpdated, skipped: fileSkipped });
    }
  });
  tx();
  return { ok: true, sourceDir, files: perFile, added, updated, skipped };
}

function inferCountryFromFilename(file) {
  const f = file.toLowerCase();
  if (f.includes('philippines')) return 'Philippines';
  if (f.includes('malaysia')) return 'Malaysia';
  if (f.includes('sri') || f.includes('lanka')) return 'Sri Lanka';
  if (f.includes('thailand')) return 'Thailand';
  if (f.includes('nepal')) return 'Nepal';
  if (f.includes('vietnam')) return 'Vietnam';
  if (f.includes('singapore')) return 'Singapore';
  if (f.includes('uae') || f.includes('dubai')) return 'UAE';
  if (f.includes('south') && f.includes('africa')) return 'South Africa';
  return null;
}

function inferClusterFromFilename(file) {
  const country = inferCountryFromFilename(file);
  if (!country) return null;
  if (country === 'Malaysia' || country === 'Sri Lanka') return 'Malaysia+SriLanka';
  if (country === 'UAE') return 'Dubai/UAE';
  if (country === 'South Africa') return 'South Africa';
  return country;
}

export function initDb() {
  migrate();
  seedClusters();
  autoImportCsvs();
}
