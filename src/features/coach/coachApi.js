/**
 * Data access for the coach-tool tables (pf_test_results, pf_session_logs, pf_events,
 * pf_athlete_notes, pf_athlete_contacts, pf_test_definitions).
 *
 * Only touches these NEW tables. The one exception is updateAthleteProfileField(), which
 * updates a single column on agilitylap_athletes and is only called after the coach confirms.
 *
 * Every call returns { data, error, missing }. `missing` is true when the tables do not exist
 * yet (migration not applied), so the UI can show a hint instead of breaking.
 */
import { supabase } from '../../supabaseClient';

const isMissing = (error) =>
  !!error && (error.code === '42P01' || error.code === 'PGRST205' || /does not exist|schema cache/i.test(error.message || ''));

async function run(promise) {
  const { data, error } = await promise;
  return { data: data ?? null, error: error ?? null, missing: isMissing(error) };
}

// ---- Tests / readiness ----
export const listTestResults = (athleteId) =>
  run(supabase.from('pf_test_results').select('*').eq('athlete_id', athleteId).order('tested_on', { ascending: false }).order('created_at', { ascending: false }));

export const listAllRecentCmj = (sinceDate) =>
  run(supabase.from('pf_test_results').select('*').eq('test_key', 'cmj').gte('tested_on', sinceDate).order('tested_on', { ascending: false }));

export const addTestResult = (row) => run(supabase.from('pf_test_results').insert([row]).select().single());

export const deleteTestResult = (id) => run(supabase.from('pf_test_results').delete().eq('id', id));

export const listTestDefinitions = () => run(supabase.from('pf_test_definitions').select('*').order('name'));

export const addTestDefinition = (row) => run(supabase.from('pf_test_definitions').insert([row]).select().single());

// ---- Session logs (RPE x minutes) ----
export const listSessionLogs = (athleteId, fromDate, toDate) =>
  run(supabase.from('pf_session_logs').select('*').eq('athlete_id', athleteId).gte('session_date', fromDate).lte('session_date', toDate));

export const listAllSessionLogs = (fromDate, toDate) =>
  run(supabase.from('pf_session_logs').select('*').gte('session_date', fromDate).lte('session_date', toDate));

export const upsertSessionLog = (row) =>
  run(supabase.from('pf_session_logs').upsert([{ ...row, updated_at: new Date().toISOString() }], { onConflict: 'athlete_id,session_date' }).select().single());

// ---- Matches / events ----
export const listEvents = (fromDate, toDate) =>
  run(supabase.from('pf_events').select('*').gte('event_date', fromDate).lte('event_date', toDate).order('event_date'));

export const addEvent = (row) => run(supabase.from('pf_events').insert([row]).select().single());

export const deleteEvent = (id) => run(supabase.from('pf_events').delete().eq('id', id));

/** Events that apply to an athlete: their own + their group's. */
export const eventsForAthlete = (events, athlete) =>
  (events || []).filter(e => e.athlete_id === athlete?.id || (e.group_name && athlete?.groupName && e.group_name === athlete.groupName));

// ---- Injury notes / restrictions ----
export const listNotes = (athleteId) =>
  run(supabase.from('pf_athlete_notes').select('*').eq('athlete_id', athleteId).order('start_date', { ascending: false }));

export const listAllNotes = () => run(supabase.from('pf_athlete_notes').select('*'));

export const addNote = (row) => run(supabase.from('pf_athlete_notes').insert([row]).select().single());

export const endNote = (id, endDate) => run(supabase.from('pf_athlete_notes').update({ end_date: endDate }).eq('id', id));

export const deleteNote = (id) => run(supabase.from('pf_athlete_notes').delete().eq('id', id));

export const isNoteActive = (note, onDate) =>
  note.start_date <= onDate && (!note.end_date || note.end_date >= onDate);

/** Returns the active note that restricts this exercise title, or null. */
export function restrictionFor(title, notes, onDate) {
  const t = (title || '').toLowerCase();
  for (const n of notes || []) {
    if (!isNoteActive(n, onDate)) continue;
    if ((n.restricted_keywords || []).some(k => k && t.includes(k.toLowerCase()))) return n;
  }
  return null;
}

// ---- WhatsApp contacts ----
export const getContact = (athleteId) =>
  run(supabase.from('pf_athlete_contacts').select('*').eq('athlete_id', athleteId).maybeSingle());

export const saveContact = (athleteId, whatsapp) =>
  run(supabase.from('pf_athlete_contacts').upsert([{ athlete_id: athleteId, whatsapp, updated_at: new Date().toISOString() }], { onConflict: 'athlete_id' }));

/** wa.me link. Egyptian numbers like 010xxxxxxxx become 2010xxxxxxxx. */
export function whatsappLink(number, text) {
  let n = String(number || '').replace(/\D/g, '');
  if (n.startsWith('00')) n = n.slice(2);
  if (n.length === 11 && n.startsWith('01')) n = '2' + n;
  const base = n ? `https://wa.me/${n}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text || '')}`;
}

// ---- Athlete profile (existing table) — single-field update, only after the coach confirms ----
const PROFILE_FIELDS = new Set(['full_squat', 'front_squat', 'half_squat', 'quarter_squat', 'bench', 'deadlift', 'hang_clean', 'power_clean', 'vertical_jump', 'squat_jump', 'rsi', 'standing_long_jump']);

export function updateAthleteProfileField(athleteId, field, value) {
  if (!PROFILE_FIELDS.has(field)) return Promise.resolve({ data: null, error: new Error('Field not allowed'), missing: false });
  return run(supabase.from('agilitylap_athletes').update({ [field]: value }).eq('id', athleteId));
}

// ---- Workouts (existing table) — read + fill EMPTY days only (copy-forward) ----
export const listWorkouts = (athleteId, fromDate, toDate) =>
  run(supabase.from('agilitylap_workouts').select('workout_date, workout_title, drills, is_completed').eq('athlete_id', athleteId).gte('workout_date', fromDate).lte('workout_date', toDate));

export const listAllWorkoutsOn = (fromDate, toDate) =>
  run(supabase.from('agilitylap_workouts').select('athlete_id, workout_date, workout_title, drills, is_completed').gte('workout_date', fromDate).lte('workout_date', toDate));
