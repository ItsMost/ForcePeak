import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CalendarClock, Gauge, Loader2, Stethoscope, X } from 'lucide-react';
import * as api from './coachApi';
import { acwr, acwrZone } from './load';
import { readinessFromCmj } from './readiness';
import { parseDayType } from './dayType';
import { todayStr } from './useCoachWeekData';

const addDays = (s, n) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fmt = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * "Today": alerts across ALL athletes + matches in the next 14 days. Read-only.
 */
export default function TodayPanel({ open, onClose, athletes, onSelectAthlete }) {
  const [state, setState] = useState({ loading: true, alerts: [], upcoming: [], missing: false });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setState(s => ({ ...s, loading: true }));
      const today = todayStr();
      const [cmj, logs, events, notes, workouts] = await Promise.all([
        api.listAllRecentCmj(addDays(today, -90)),
        api.listAllSessionLogs(addDays(today, -34), today),
        api.listEvents(today, addDays(today, 14)),
        api.listAllNotes(),
        api.listAllWorkoutsOn(today, addDays(today, 6)),
      ]);
      if (cancelled) return;
      const missing = [cmj, logs, events, notes].some(r => r.missing);
      const byId = Object.fromEntries((athletes || []).map(a => [a.id, a]));
      const alerts = [];

      // Readiness
      const cmjBy = {};
      (cmj.data || []).forEach(r => { (cmjBy[r.athlete_id] ||= []).push(r); });
      Object.entries(cmjBy).forEach(([id, rows]) => {
        const r = readinessFromCmj(rows);
        if (r.level === 'red' || r.level === 'yellow') {
          alerts.push({ id, level: r.level === 'red' ? 'danger' : 'warn', icon: Activity,
            text: `CMJ نازل ${Math.abs(r.changePct).toFixed(1)}% (${Number(r.latest.value)} cm مقابل ${r.baseline.toFixed(1)})` });
        }
      });

      // ACWR
      const logsBy = {};
      (logs.data || []).forEach(l => { (logsBy[l.athlete_id] ||= []).push(l); });
      Object.entries(logsBy).forEach(([id, rows]) => {
        const res = acwr(rows, today);
        const z = acwrZone(res.ratio);
        if (z === 'danger' || z === 'warning') alerts.push({ id, level: z === 'danger' ? 'danger' : 'warn', icon: Gauge, text: `ACWR ${res.ratio.toFixed(2)}${z === 'danger' ? ' — خطر إصابة' : ''}` });
      });

      // High day 1–2 days before a match / restricted exercise in the next 7 days
      const evs = events.data || [];
      const activeNotes = (notes.data || []).filter(n => api.isNoteActive(n, today));
      (workouts.data || []).forEach(w => {
        const a = byId[w.athlete_id];
        if (!a) return;
        if (parseDayType(w.workout_title) === 'HIGH') {
          const m = api.eventsForAthlete(evs, a).find(e => e.event_date === addDays(w.workout_date, 1) || e.event_date === addDays(w.workout_date, 2));
          if (m) alerts.push({ id: a.id, level: 'warn', icon: CalendarClock, text: `يوم High ${fmt(w.workout_date)} قبل ${m.title} (${fmt(m.event_date)})` });
        }
        const mine = activeNotes.filter(n => n.athlete_id === a.id);
        (w.drills || []).forEach(d => {
          const n = api.restrictionFor(d.title, mine, w.workout_date);
          if (n) alerts.push({ id: a.id, level: 'danger', icon: Stethoscope, text: `${d.title} يوم ${fmt(w.workout_date)} — ${n.note}` });
        });
      });

      const upcoming = evs.map(e => ({ ...e, who: e.athlete_id ? byId[e.athlete_id]?.name : `مجموعة ${e.group_name}` }));
      alerts.sort((x, y) => (x.level === y.level ? 0 : x.level === 'danger' ? -1 : 1));
      setState({ loading: false, alerts, upcoming, missing });
    })();
    return () => { cancelled = true; };
  }, [open, athletes]);

  if (!open) return null;
  const byId = Object.fromEntries((athletes || []).map(a => [a.id, a]));

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 print:hidden" onClick={onClose}>
      <div className="flex w-full max-w-xl max-h-[92vh] flex-col rounded-3xl bg-white dark:bg-slate-800 shadow-2xl" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <div>
            <h3 className="text-lg font-black">النهارده</h3>
            <p className="text-xs text-slate-500">{fmt(todayStr())} · كل اللاعيبة</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {state.loading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> بجمع التنبيهات…</p>
          ) : state.missing ? (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-4 text-sm font-bold text-amber-700 dark:text-amber-300">الشاشة دي هتشتغل بعد تطبيق ملف الجداول الجديد.</p>
          ) : (
            <>
              <section>
                <h4 className="mb-2 text-sm font-black">تنبيهات</h4>
                {!state.alerts.length && <p className="text-sm text-slate-500">مفيش تنبيهات. كله تمام.</p>}
                <ul className="space-y-1.5">
                  {state.alerts.map((a, i) => {
                    const Icon = a.icon || AlertTriangle;
                    return (
                      <li key={i}>
                        <button type="button" onClick={() => { onSelectAthlete?.(a.id); onClose(); }}
                          className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-right text-sm ${a.level === 'danger' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'}`}>
                          <Icon className="mt-0.5 w-4 h-4 shrink-0" />
                          <span><b>{byId[a.id]?.name || 'لاعب'}</b> · {a.text}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section>
                <h4 className="mb-2 text-sm font-black">الماتشات في الأسبوعين الجايين</h4>
                {!state.upcoming.length && <p className="text-sm text-slate-500">مفيش ماتشات متسجلة.</p>}
                <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                  {state.upcoming.map(e => (
                    <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                      <span><b>{e.title}</b> <span className="text-xs text-slate-500">· {e.who}</span></span>
                      <span className="text-xs font-bold text-slate-500">{fmt(e.event_date)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
