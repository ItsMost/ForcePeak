#!/usr/bin/env node
/**
 * PEAK FORCE — READ-ONLY Supabase backup.
 *
 * This script ONLY runs SELECT queries and storage downloads. It never writes,
 * updates or deletes anything in Supabase.
 *
 * Usage:
 *   node backup/export.mjs            full export -> backup/<timestamp>/
 *   node backup/export.mjs --counts   row counts only (compare with an earlier counts.json)
 *   node backup/export.mjs --counts --compare backup/<timestamp>/counts.json
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env (gitignored).
 * If SUPABASE_BACKUP_KEY is set in .env it is used instead of the anon key
 * (e.g. to read tables that RLS hides from anon). Never commit that key.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = 1000;
const BUCKET = 'welcome-packs';

const TABLES = [
  'agilitylap_athletes',
  'agilitylap_programs',
  'agilitylap_workouts',
  'agilitylap_templates',
  'periodization_deployments',
  'athletes_assessments',
  'library_drills',
  'pf_players',
  'players',
  // Also referenced by the app's gym sync code (src/db/sync.ts)
  'pf_subscriptions',
  'pf_attendance',
  'pf_payments',
  'pf_expenses',
];

// ---------- env ----------
function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
loadEnv();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_BACKUP_KEY || process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

const args = process.argv.slice(2);
const countsOnly = args.includes('--counts');
const compareIdx = args.indexOf('--compare');
const compareFile = compareIdx >= 0 ? args[compareIdx + 1] : null;

// ---------- helpers ----------
function toCsv(rows) {
  if (!rows.length) return '';
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

async function countRows(table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) return { count: null, error: error.message };
  return { count };
}

async function fetchAll(table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

async function listBucket(prefix = '') {
  const files = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: PAGE, offset });
    if (error) throw new Error(error.message);
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) files.push(...(await listBucket(full))); // folder
      else files.push(full);
    }
    if (data.length < PAGE) break;
  }
  return files;
}

// ---------- main ----------
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(ROOT, 'backup', stamp);
fs.mkdirSync(outDir, { recursive: true });

const counts = { taken_at: new Date().toISOString(), key_used: process.env.SUPABASE_BACKUP_KEY ? 'backup_key' : 'anon', tables: {}, storage: {} };
const problems = [];

for (const table of TABLES) {
  const head = await countRows(table);
  if (head.error) {
    counts.tables[table] = { count: null, error: head.error };
    problems.push(`${table}: ${head.error}`);
    console.log(`✗ ${table.padEnd(28)} ERROR ${head.error}`);
    continue;
  }
  if (countsOnly) {
    counts.tables[table] = { count: head.count };
    console.log(`  ${table.padEnd(28)} ${head.count}`);
    continue;
  }
  try {
    const rows = await fetchAll(table);
    fs.writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(rows, null, 2));
    fs.writeFileSync(path.join(outDir, `${table}.csv`), toCsv(rows));
    counts.tables[table] = { count: rows.length, head_count: head.count };
    const flag = rows.length !== head.count ? '  ⚠ exported != counted' : '';
    if (flag) problems.push(`${table}: exported ${rows.length} but count says ${head.count}`);
    console.log(`✓ ${table.padEnd(28)} ${rows.length}${flag}`);
  } catch (e) {
    counts.tables[table] = { count: null, head_count: head.count, error: e.message };
    problems.push(`${table}: ${e.message}`);
    console.log(`✗ ${table.padEnd(28)} ERROR ${e.message}`);
  }
}

// storage bucket
try {
  const files = await listBucket();
  counts.storage[BUCKET] = { files: files.length };
  if (!countsOnly) {
    const dir = path.join(outDir, 'storage', BUCKET);
    let ok = 0;
    for (const f of files) {
      const { data, error } = await supabase.storage.from(BUCKET).download(f);
      if (error) { problems.push(`storage ${f}: ${error.message}`); continue; }
      const dest = path.join(dir, f);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await data.arrayBuffer()));
      ok++;
    }
    counts.storage[BUCKET].downloaded = ok;
  }
  console.log(`${countsOnly ? ' ' : '✓'} storage/${BUCKET.padEnd(20)} ${files.length} files`);
} catch (e) {
  counts.storage[BUCKET] = { files: null, error: e.message };
  problems.push(`storage ${BUCKET}: ${e.message}`);
  console.log(`✗ storage/${BUCKET} ERROR ${e.message}`);
}

fs.writeFileSync(path.join(outDir, 'counts.json'), JSON.stringify(counts, null, 2));
console.log(`\nSaved to ${path.relative(ROOT, outDir)}`);

// compare with an earlier snapshot — counts must never go down
if (compareFile) {
  const before = JSON.parse(fs.readFileSync(path.resolve(ROOT, compareFile), 'utf8'));
  let dropped = false;
  console.log(`\nCompare with ${compareFile}:`);
  for (const [t, b] of Object.entries(before.tables)) {
    const a = counts.tables[t]?.count;
    const was = b.count;
    const bad = was !== null && (a === null || a === undefined || a < was);
    if (bad) dropped = true;
    console.log(`${bad ? '✗ DROPPED' : '  ok     '} ${t.padEnd(28)} ${was} -> ${a}`);
  }
  const sb = before.storage?.[BUCKET]?.files, sa = counts.storage[BUCKET]?.files;
  if (sb != null && (sa == null || sa < sb)) dropped = true;
  console.log(`${sb != null && (sa == null || sa < sb) ? '✗ DROPPED' : '  ok     '} storage/${BUCKET} ${sb} -> ${sa}`);
  if (dropped) { console.error('\n!!! A COUNT WENT DOWN — STOP AND CHECK !!!'); process.exitCode = 2; }
}

if (problems.length) {
  console.log('\nProblems:');
  for (const p of problems) console.log(' - ' + p);
}
