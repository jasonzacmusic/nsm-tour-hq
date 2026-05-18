import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'nsm_tour.db'));
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
      phone TEXT,
      website TEXT,
      recommended_topic TEXT,
      priority TEXT DEFAULT 'Medium',
      personalized_hook TEXT,
      format_recommendation TEXT,
      language_confidence TEXT DEFAULT 'high',
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
    CREATE INDEX IF NOT EXISTS idx_email_log_lead ON email_log(lead_id);
    CREATE INDEX IF NOT EXISTS idx_followups_due ON followups(due_date, status);
  `);
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
];

export function seedClusters() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM clusters').get().c;
  if (existing > 0) return;
  const stmt = db.prepare(
    'INSERT INTO clusters (name, color, countries, cities, priority) VALUES (?, ?, ?, ?, ?)'
  );
  const tx = db.transaction((rows) => {
    for (const r of rows) stmt.run(r.name, r.color, r.countries, r.cities, r.priority);
  });
  tx(DEFAULT_CLUSTERS);
  console.log(`[db] Seeded ${DEFAULT_CLUSTERS.length} clusters.`);
}

const CSV_FILES = [
  { file: 'india_master_leads.csv', defaultCluster: null, defaultCountry: 'India' },
  { file: 'india_workshop_leads.csv', defaultCluster: null, defaultCountry: 'India' },
  { file: 'vietnam_workshop_leads_v2.csv', defaultCluster: 'Vietnam', defaultCountry: 'Vietnam' },
];

const CLUSTER_NORMALIZE = {
  'goa+mgr': 'Goa+Mangalore',
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
};

function normalizeCluster(raw, defaultCluster) {
  if (!raw) return defaultCluster || 'Northeast';
  const key = String(raw).trim().toLowerCase();
  return CLUSTER_NORMALIZE[key] || raw;
}

function normalizePriority(raw) {
  if (!raw) return 'Medium';
  const p = String(raw).trim().toLowerCase();
  if (p === 'highest') return 'Highest';
  if (p === 'high') return 'High';
  if (p === 'medium' || p === 'med') return 'Medium';
  if (p === 'low') return 'Low';
  return raw;
}

function normalizeArchetype(raw) {
  if (!raw) return 'contemporary_academy';
  const a = String(raw).trim().toLowerCase();
  if (a === 'do_not_use_instantly' || a === 'hw' || a === 'hand_write') return 'church_choir';
  if (a === 'anchor' || a === 'std') return 'contemporary_academy';
  return a;
}

function normalizeSendVia(rawArchetype, rawSendVia) {
  if (rawSendVia) {
    const s = String(rawSendVia).trim().toUpperCase();
    if (s === 'DO_NOT_USE_INSTANTLY' || s === 'INSTANTLY_OK') return s;
  }
  const a = String(rawArchetype || '').trim().toLowerCase();
  if (a === 'do_not_use_instantly' || a === 'hw' || a === 'anchor') return 'DO_NOT_USE_INSTANTLY';
  if (a === 'church_choir' || a === 'church' || a.includes('church')) return 'DO_NOT_USE_INSTANTLY';
  return 'INSTANTLY_OK';
}

function pickEmail(row) {
  const cands = [row.contact_email, row.email].filter(Boolean);
  for (const c of cands) {
    const t = String(c).trim();
    if (t && t.includes('@')) return t;
  }
  return null;
}

function pickName(row) {
  if (row.contact_name) return row.contact_name;
  if (row.contact_person) return row.contact_person;
  const fn = row.first_name?.trim();
  const ln = row.last_name?.trim();
  if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
  return null;
}

function pickInstitution(row) {
  return row.institution_name || row.company_name || row.name || null;
}

function pickLanguageConfidence(row) {
  const raw = row.language_confidence || row.language;
  if (!raw) return 'high';
  const t = String(raw).trim().toLowerCase();
  if (t === 'high' || t === 'medium' || t === 'low') return t;
  return 'high';
}

export function autoImportCsvs() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;
  if (existing > 0) {
    console.log(`[db] Skipping CSV import — ${existing} leads already present.`);
    return { skipped: true };
  }
  const dupCheck = db.prepare("SELECT 1 FROM leads WHERE institution_name = ? AND COALESCE(city,'') = COALESCE(?, '')");
  const insert = db.prepare(`
    INSERT INTO leads (
      cluster, city, state, country, institution_name, archetype,
      contact_name, contact_email, instagram_handle, phone, website,
      recommended_topic, priority, personalized_hook, format_recommendation,
      language_confidence, notes, send_via, verified
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  let added = 0, skipped = 0;
  const tx = db.transaction(() => {
    for (const { file, defaultCluster, defaultCountry } of CSV_FILES) {
      const fp = path.join(DATA_DIR, file);
      if (!fs.existsSync(fp)) continue;
      const csvRaw = fs.readFileSync(fp, 'utf8');
      const rows = parse(csvRaw, { columns: true, skip_empty_lines: true, trim: true, relax_column_count: true });
      for (const row of rows) {
        const institution = pickInstitution(row);
        if (!institution) { skipped++; continue; }
        const city = row.city || null;
        if (dupCheck.get(institution, city)) { skipped++; continue; }
        const cluster = normalizeCluster(row.cluster, defaultCluster);
        const archetype = normalizeArchetype(row.archetype);
        const sendVia = normalizeSendVia(row.archetype, row.send_via);
        insert.run(
          cluster,
          city,
          row.state || null,
          row.country || defaultCountry || 'India',
          institution,
          archetype,
          pickName(row),
          pickEmail(row),
          row.instagram_handle || row.instagram || null,
          row.phone || null,
          row.website || null,
          row.recommended_topic || null,
          normalizePriority(row.priority),
          row.personalized_hook || null,
          row.format_recommendation || null,
          pickLanguageConfidence(row),
          row.notes || null,
          sendVia,
          row.verified || null
        );
        added++;
      }
    }
  });
  tx();
  console.log(`[db] CSV import complete — added ${added}, skipped ${skipped}.`);
  return { added, skipped };
}

export function initDb() {
  migrate();
  seedClusters();
  autoImportCsvs();
}
