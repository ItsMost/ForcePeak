import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from './coachApi';
import { acwr, sessionLoad } from './load';
import { readinessFromCmj } from './readiness';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const todayStr = () => ymd(new Date());

/**
 * Coach-tool data for one athlete and the visible week.
 * Reads only the new pf_* tables. `missing` = migration not applied yet.
 */
export function useCoachWeekData({ athlete, weekDatesFull, enabled }) {
  const [state, setState] = useState({ logs: [], events: [], notes: [], tests: [], defs: [], contact: null, missing: false, loaded: false });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const weekStart = weekDatesFull?.[0] ? ymd(weekDatesFull[0]) : null;
  const weekEnd = weekDatesFull?.[6] ? ymd(weekDatesFull[6]) : null;
  const athleteId = athlete?.id || null;

  useEffect(() => {
    if (!enabled || !athleteId || !weekStart) return;
    let cancelled = false;
    (async () => {
      const end = new Date(`${weekEnd}T00:00:00`);
      const logsFrom = ymd(addDays(end, -34));          // 28-day chronic window + this week
      const eventsFrom = ymd(addDays(new Date(`${weekStart}T00:00:00`), -3));
      const eventsTo = ymd(addDays(end, 21));
      const [logs, events, notes, tests, defs, contact] = await Promise.all([
        api.listSessionLogs(athleteId, logsFrom, weekEnd),
        api.listEvents(eventsFrom, eventsTo),
        api.listNotes(athleteId),
        api.listTestResults(athleteId),
        api.listTestDefinitions(),
        api.getContact(athleteId),
      ]);
      if (cancelled) return;
      const missing = [logs, events, notes, tests, defs, contact].some(r => r.missing);
      setState({
        logs: logs.data || [], events: events.data || [], notes: notes.data || [],
        tests: tests.data || [], defs: defs.data || [], contact: contact.data || null,
        missing, loaded: true,
      });
    })();
    return () => { cancelled = true; };
  }, [enabled, athleteId, weekStart, weekEnd, version]);

  const derived = useMemo(() => {
    const logsByDate = Object.fromEntries(state.logs.map(l => [l.session_date, l]));
    const myEvents = api.eventsForAthlete(state.events, athlete);
    const eventsByDate = {};
    myEvents.forEach(e => { (eventsByDate[e.event_date] ||= []).push(e); });
    const today = todayStr();
    const asOf = weekEnd && weekEnd < today ? weekEnd : today;
    const load = acwr(state.logs, asOf);
    const weekActual = weekStart ? state.logs.filter(l => l.session_date >= weekStart && l.session_date <= weekEnd).reduce((s, l) => s + (sessionLoad(l) || 0), 0) : 0;
    const readiness = readinessFromCmj(state.tests);
    const activeNotes = state.notes.filter(n => api.isNoteActive(n, today) || (weekStart && api.isNoteActive(n, weekStart)));
    return { logsByDate, myEvents, eventsByDate, load, weekActual, readiness, activeNotes };
  }, [state, athlete, weekStart, weekEnd]);

  const saveLog = useCallback(async (dateStr, values) => {
    const res = await api.upsertSessionLog({ athlete_id: athleteId, session_date: dateStr, ...values });
    if (!res.error) refresh();
    return res;
  }, [athleteId, refresh]);

  const addReadinessCmj = useCallback(async (dateStr, value) => {
    const res = await api.addTestResult({ athlete_id: athleteId, test_key: 'cmj', test_name: 'CMJ', value, unit: 'cm', tested_on: dateStr, is_readiness: true });
    if (!res.error) refresh();
    return res;
  }, [athleteId, refresh]);

  return { ...state, ...derived, refresh, saveLog, addReadinessCmj, weekStart, weekEnd, enabled: !!enabled && !!athleteId };
}
