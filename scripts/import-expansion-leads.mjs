#!/usr/bin/env node
// Usage:
//   npm run import:expansion
//   npm run import:expansion -- /absolute/path/to/master_expansion_leads.csv
//   npm run import:expansion -- --dry-run /absolute/path/to/master_expansion_leads.csv
//
// Imports the NSM Tour HQ expansion CSV without inventing contact details.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { db, migrate, seedClusters, normalizePriority, normalizeVerification, normalizeCluster } from '../server/db.js';

const DEFAULT_CSV = path.join(os.homedir(), 'Downloads', 'master_expansion_leads.csv');
const REQUIRED_COLUMNS = [
  'record_id', 'name', 'entity_type', 'subtype', 'city', 'state', 'country',
  'website', 'instagram_handle', 'contact_email', 'phone', 'notes', 'priority',
  'verification_level', 'source_url', 'source_type', 'recommended_outreach_angle',
  'repo_cluster', 'dedupe_key',
];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const csvPath = args.find(a => !a.startsWith('--')) || DEFAULT_CSV;

const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3, Highest: 4 };
const VERIFICATION_RANK = { Low: 1, Medium: 2, High: 3 };

function text(v) {
  const t = String(v ?? '').trim();
  return t === '' ? null : t;
}

function normalizeText(v) {
  return String(v ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeWebsite(v) {
  const raw = text(v);
  if (!raw) return '';
  try {
    const url = new URL(raw.match(/^https?:\/\//i) ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, '').toLowerCase() + url.pathname.replace(/\/+$/g, '').toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/g, '');
  }
}

function normalizeDedupeKey(v) {
  return String(v ?? '').trim().toLowerCase();
}

function exactPriority(v) {
  return normalizePriority(v) || 'Medium';
}

function exactVerification(v) {
  return normalizeVerification(v) || 'Medium';
}

function archetypeFor(row) {
  const entity = normalizeText(row.entity_type);
  if (entity === 'recording studio') return 'production_studio';
  if (entity === 'venue') return 'jazz_venue';
  if (entity === 'music university' || entity === 'university music scene') return 'conservatory';
  if (entity === 'choir' || entity === 'a cappella group' || entity === 'innovative church') return 'church_choir';
  return 'contemporary_academy';
}

function sendViaFor(row) {
  const verification = exactVerification(row.verification_level);
  const entity = normalizeText(row.entity_type);
  if (verification === 'Low') return 'DO_NOT_USE_INSTANTLY';
  if (['choir', 'a cappella group', 'innovative church', 'artist'].includes(entity)) return 'DO_NOT_USE_INSTANTLY';
  return text(row.contact_email) ? 'INSTANTLY_OK' : 'DO_NOT_USE_INSTANTLY';
}

function toLead(row) {
  const verification = exactVerification(row.verification_level);
  const priority = exactPriority(row.priority);
  const repoCluster = text(row.repo_cluster);
  return {
    record_id: text(row.record_id),
    institution_name: text(row.name),
    entity_type: text(row.entity_type),
    subtype: text(row.subtype),
    city: text(row.city),
    state: text(row.state),
    country: text(row.country) || 'India',
    website: text(row.website),
    instagram_handle: text(row.instagram_handle),
    contact_email: text(row.contact_email),
    phone: text(row.phone),
    whatsapp: null,
    linkedin_url: null,
    notes: text(row.notes),
    priority,
    verification_level: verification,
    language_confidence: verification.toLowerCase(),
    verified: verification.toLowerCase(),
    source_url: text(row.source_url),
    source_type: text(row.source_type),
    recommended_outreach_angle: text(row.recommended_outreach_angle),
    recommended_topic: text(row.recommended_outreach_angle),
    repo_cluster: repoCluster,
    dedupe_key: text(row.dedupe_key),
    cluster: normalizeCluster(repoCluster, repoCluster || 'Expansion'),
    archetype: archetypeFor(row),
    personalized_hook: null,
    format_recommendation: null,
    status: 'not_contacted',
    send_via: sendViaFor(row),
  };
}

function keysFor(lead) {
  const city = normalizeText(lead.city);
  const country = normalizeText(lead.country);
  return {
    website: lead.website && city && country ? `${normalizeWebsite(lead.website)}|${city}|${country}` : '',
    name: lead.institution_name && city && country ? `${normalizeText(lead.institution_name)}|${city}|${country}` : '',
    dedupe: lead.dedupe_key ? normalizeDedupeKey(lead.dedupe_key) : '',
    legacyNameCity: lead.institution_name && city ? `${normalizeText(lead.institution_name)}|${city}` : '',
  };
}

function richness(lead) {
  const fields = [
    lead.contact_email, lead.phone, lead.whatsapp, lead.instagram_handle, lead.website,
    lead.source_url, lead.source_type, lead.recommended_outreach_angle, lead.dedupe_key, lead.notes,
  ].filter(Boolean).length;
  return fields + (PRIORITY_RANK[lead.priority] || 0) * 2 + (VERIFICATION_RANK[lead.verification_level] || 0) * 2;
}

function pickHigherPriority(a, b) {
  return (PRIORITY_RANK[b] || 0) > (PRIORITY_RANK[a] || 0) ? b : a;
}

function pickHigherVerification(a, b) {
  return (VERIFICATION_RANK[b] || 0) > (VERIFICATION_RANK[a] || 0) ? b : a;
}

function mergeText(existing, incoming) {
  if (!existing) return incoming || null;
  if (!incoming || existing === incoming) return existing;
  if (existing.includes(incoming)) return existing;
  return `${existing}\n\nExpansion import note: ${incoming}`;
}

function mergeDelimited(existing, incoming) {
  const values = [existing, incoming]
    .flatMap(v => String(v || '').split('|'))
    .map(v => v.trim())
    .filter(Boolean);
  return [...new Set(values)].join(' | ') || null;
}

function mergedLead(existing, incoming) {
  const incomingIsRicher = richness(incoming) > richness(existing);
  const merged = { ...existing };
  const fillOnly = [
    'record_id', 'entity_type', 'subtype', 'cluster', 'repo_cluster', 'archetype',
    'city', 'state', 'country', 'website', 'instagram_handle', 'contact_email',
    'phone', 'whatsapp', 'linkedin_url', 'recommended_topic', 'recommended_outreach_angle',
    'dedupe_key',
  ];
  for (const key of fillOnly) {
    if (!merged[key] && incoming[key]) merged[key] = incoming[key];
    else if (incomingIsRicher && incoming[key] && !existing[key]) merged[key] = incoming[key];
  }
  merged.source_url = mergeDelimited(existing.source_url, incoming.source_url);
  merged.source_type = mergeDelimited(existing.source_type, incoming.source_type);
  merged.priority = pickHigherPriority(existing.priority, incoming.priority);
  merged.verification_level = pickHigherVerification(existing.verification_level, incoming.verification_level);
  merged.language_confidence = (merged.verification_level || existing.language_confidence || 'Medium').toLowerCase();
  merged.verified = merged.language_confidence;
  merged.notes = mergeText(existing.notes, incoming.notes);
  if (incoming.send_via === 'INSTANTLY_OK' && existing.send_via !== 'DO_NOT_USE_INSTANTLY') {
    merged.send_via = 'INSTANTLY_OK';
  } else {
    merged.send_via = existing.send_via || incoming.send_via;
  }
  return merged;
}

function validateHeaders(rows) {
  const headers = Object.keys(rows[0] || {});
  const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
  const extra = headers.filter(c => !REQUIRED_COLUMNS.includes(c));
  return { missing, extra };
}

function buildMaps(rows) {
  const maps = {
    website: new Map(),
    name: new Map(),
    dedupe: new Map(),
    legacyNameCity: new Map(),
    byId: new Map(),
  };
  for (const row of rows) {
    maps.byId.set(row.id, row);
    const keys = keysFor(row);
    for (const kind of ['website', 'name', 'dedupe', 'legacyNameCity']) {
      if (keys[kind] && !maps[kind].has(keys[kind])) maps[kind].set(keys[kind], row.id);
    }
  }
  return maps;
}

function findDuplicate(lead, maps) {
  const keys = keysFor(lead);
  for (const kind of ['website', 'name', 'dedupe', 'legacyNameCity']) {
    const key = keys[kind];
    if (key && maps[kind].has(key)) return { id: maps[kind].get(key), match_type: kind };
  }
  return null;
}

function indexLead(lead, maps) {
  maps.byId.set(lead.id, lead);
  const keys = keysFor(lead);
  for (const kind of ['website', 'name', 'dedupe', 'legacyNameCity']) {
    if (keys[kind]) maps[kind].set(keys[kind], lead.id);
  }
}

const INSERT_COLUMNS = [
  'cluster', 'city', 'state', 'country', 'institution_name', 'archetype',
  'contact_name', 'contact_email', 'instagram_handle', 'linkedin_url', 'whatsapp',
  'record_id', 'entity_type', 'subtype', 'phone', 'website', 'recommended_topic',
  'source_url', 'source_type', 'recommended_outreach_angle', 'repo_cluster', 'dedupe_key',
  'priority', 'personalized_hook', 'format_recommendation', 'language_confidence',
  'verification_level', 'status', 'notes', 'send_via', 'verified',
];

const UPDATE_COLUMNS = INSERT_COLUMNS.filter(c => c !== 'status');

function valuesFor(lead, columns) {
  return columns.map(c => lead[c] ?? null);
}

function run() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }
  const rows = parse(fs.readFileSync(csvPath, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });
  const headerCheck = validateHeaders(rows);
  if (headerCheck.missing.length) {
    throw new Error(`CSV missing required columns: ${headerCheck.missing.join(', ')}`);
  }

  migrate();
  seedClusters();

  const initialCount = db.prepare('SELECT COUNT(*) AS c FROM leads').get().c;
  const maps = buildMaps(db.prepare('SELECT * FROM leads').all());
  const insert = db.prepare(`
    INSERT INTO leads (${INSERT_COLUMNS.join(', ')})
    VALUES (${INSERT_COLUMNS.map(() => '?').join(',')})
  `);
  const update = db.prepare(`
    UPDATE leads SET
      ${UPDATE_COLUMNS.map(c => `${c} = ?`).join(', ')},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const report = {
    source_file: csvPath,
    dry_run: dryRun,
    input_rows: rows.length,
    inserted_rows: 0,
    skipped_duplicate_rows: 0,
    updated_duplicate_rows: 0,
    initial_lead_count: initialCount,
    final_lead_count: initialCount,
    warnings: [],
    errors: [],
    duplicate_match_types: {},
    counts_by_entity_type: {},
    counts_by_country_city: {},
  };

  const tx = db.transaction(() => {
    for (let i = 0; i < rows.length; i++) {
      const lead = toLead(rows[i]);
      if (!lead.institution_name) {
        report.errors.push(`Row ${i + 2}: missing name`);
        continue;
      }
      if (!lead.source_url) {
        report.warnings.push(`Row ${i + 2}: missing source_url`);
      }
      const dup = findDuplicate(lead, maps);
      if (dup) {
        report.skipped_duplicate_rows++;
        report.duplicate_match_types[dup.match_type] = (report.duplicate_match_types[dup.match_type] || 0) + 1;
        const existing = maps.byId.get(dup.id);
        const merged = mergedLead(existing, lead);
        if (JSON.stringify(merged) !== JSON.stringify(existing)) {
          report.updated_duplicate_rows++;
          if (!dryRun) update.run(...valuesFor(merged, UPDATE_COLUMNS), existing.id);
          indexLead({ ...existing, ...merged }, maps);
        }
        continue;
      }
      if (!dryRun) {
        const info = insert.run(...valuesFor(lead, INSERT_COLUMNS));
        lead.id = info.lastInsertRowid;
      } else {
        lead.id = -1 * (report.inserted_rows + 1);
      }
      report.inserted_rows++;
      indexLead(lead, maps);
    }
  });

  tx();

  report.final_lead_count = db.prepare('SELECT COUNT(*) AS c FROM leads').get().c;
  report.counts_by_entity_type = Object.fromEntries(
    db.prepare(`
      SELECT entity_type, COUNT(*) AS c
      FROM leads
      WHERE COALESCE(entity_type, '') != ''
      GROUP BY entity_type
      ORDER BY entity_type
    `).all().map(r => [r.entity_type, r.c])
  );
  report.counts_by_country_city = Object.fromEntries(
    db.prepare(`
      SELECT country || ' / ' || city AS place, COUNT(*) AS c
      FROM leads
      WHERE COALESCE(entity_type, '') != ''
      GROUP BY country, city
      ORDER BY c DESC, country, city
      LIMIT 100
    `).all().map(r => [r.place, r.c])
  );

  return report;
}

try {
  const report = run();
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
} finally {
  db.close();
}
