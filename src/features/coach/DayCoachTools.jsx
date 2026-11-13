import React, { useState } from 'react';
import { AlertTriangle, CalendarClock, ClipboardCheck, Loader2, X } from 'lucide-react';
import { DAY_TYPES, parseDayType, setDayType } from './dayType';
import { sessionLoad } from './load';

const TYPE_STYLE = {
  HIGH: 'bg-orange-500 text-white border-orange-500',
  LOW: 'bg-blue-500 text-white border-blue-500',
  REST: 'bg-slate-500 text-white border-slate-500',
};
const TYPE_LABEL = { HIGH: 'High', LOW: 'Low', REST: 'Rest' };
const addDays = (s, n) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/**
 * Small row under each day title:
 *  - High / Low / Rest buttons (they rewrite the tag inside the title, nothing else)
 *  - match badge + warning if a High day is 1–2 days before a match
 *  - log button: RPE, minutes, today's CMJ
 */
export default function DayCoachTools({ coach, dateStr, title, onChangeTitle, readOnly, compact }) {
  const [open, setOpen] = useState(false);
  const type = parseDayType(title);
  const events = coach.eventsByDate?.[dateStr] || [];
  const soonMatch = type === 'HIGH' && [1, 2].some(n => (coach.eventsByDate?.[addDays(dateStr, n)] || []).length);
  const log = coach.logsByDate?.[dateStr];
  const load = sessionLoad(log);

  return (
    <div className={`flex flex-wrap items-center gap-1 ${compact ? 'mt-1.5' : 'mt-2'} print:hidden`} dir="ltr">
      {!readOnly && (
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden" role="group" aria-label="نوع اليوم">
          {DAY_TYPES.map(t => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => onChangeTitle(setDayType(title, type === t ? null : t))}
              className={`px-2 py-0.5 text-[10px] font-black border-r last:border-r-0 border-slate-200 dark:border-slate-700 transition-colors ${type === t ? TYPE_STYLE[t] : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      )}

      {events.map(e => (
        <span key={e.id} className="inline-flex items-center gap-1 rounded-md bg-amber-100 dark:bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300" title={e.notes || ''}>
          <CalendarClock className="w-3 h-3" /> {e.title}
        </span>
      ))}
      {soonMatch && (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-100 dark:bg-red-500/15 px-1.5 py-0.5 text-[10px] font-black text-red-700 dark:text-red-300" title="يوم High قبل ماتش بيوم أو يومين">
          <AlertTriangle className="w-3 h-3" /> قبل ماتش
        </span>
      )}

      {coach.enabled && !coach.missing && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black transition-colors ${log ? 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          title="سجّل RPE ومدة السيشن والـ CMJ"
        >
          <ClipboardCheck className="w-3 h-3" />
          {log ? `RPE ${log.rpe ?? '–'} · ${log.duration_min ?? '–'}′${load != null ? ` · ${Math.round(load)}` : ''}` : 'سجّل'}
        </button>
      )}

      {open && <LogDialog coach={coach} dateStr={dateStr} log={log} onClose={() => setOpen(false)} />}
    </div>
  );
}

function LogDialog({ coach, dateStr, log, onClose }) {
  const [rpe, setRpe] = useState(log?.rpe ?? '');
  const [minutes, setMinutes] = useState(log?.duration_min ?? '');
  const [cmj, setCmj] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setBusy(true); setError('');
    const r = rpe === '' ? null : Number(rpe);
    const m = minutes === '' ? null : Number(minutes);
    if (r != null && (r < 0 || r > 10)) { setError('الـ RPE من 0 لـ 10'); setBusy(false); return; }
    if (r != null || m != null) {
      const res = await coach.saveLog(dateStr, { rpe: r, duration_min: m });
      if (res.error) { setError(res.error.message); setBusy(false); return; }
    }
    if (cmj !== '') {
      const res = await coach.addReadinessCmj(dateStr, Number(cmj));
      if (res.error) { setError(res.error.message); setBusy(false); return; }
    }
    setBusy(false);
    onClose();
  };

  const field = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/30';
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-2xl" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-black">تسجيل سيشن {new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="إغلاق"><X className="w-4 h-4" /></button>
        </div>
        <label className="mb-1 block text-xs font-bold text-slate-500">RPE (0–10)</label>
        <input className={field} type="number" inputMode="decimal" min="0" max="10" step="0.5" value={rpe} onChange={e => setRpe(e.target.value)} />
        <label className="mb-1 mt-3 block text-xs font-bold text-slate-500">مدة السيشن (دقيقة)</label>
        <input className={field} type="number" inputMode="numeric" min="0" value={minutes} onChange={e => setMinutes(e.target.value)} />
        <label className="mb-1 mt-3 block text-xs font-bold text-slate-500">CMJ النهارده (cm) — اختياري</label>
        <input className={field} type="number" inputMode="decimal" min="0" step="0.1" value={cmj} onChange={e => setCmj(e.target.value)} placeholder="مثلاً 48.5" />
        {rpe !== '' && minutes !== '' && <p className="mt-2 text-xs text-slate-500">الحِمل: {Math.round(Number(rpe) * Number(minutes))} (RPE × دقائق)</p>}
        {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-700 py-2 text-xs font-bold">إلغاء</button>
          <button type="button" onClick={save} disabled={busy} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-orange-500 py-2 text-xs font-bold text-white disabled:opacity-50">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
