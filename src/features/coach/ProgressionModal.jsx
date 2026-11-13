import React, { useEffect, useMemo, useState } from 'react';
import { CopyPlus, Loader2, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { listWorkouts } from './coachApi';
import { PRESETS, planCopyForward } from './progression';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const JS_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Copy this week to next week with progression.
 * SAFETY: only fills days of next week that are completely empty (no exercises, no title).
 * Days that already have a program are listed as skipped and are never written.
 */
export default function ProgressionModal({ open, onClose, athlete, days, schedule, dayTitles, weekDatesFull, onDone }) {
  const [preset, setPreset] = useState('progress');
  const [custom, setCustom] = useState({ pctDelta: 2.5, addSetStrength: true, setsFactor: 1, extraSets: 0 });
  const [existing, setExisting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const nextDates = useMemo(() => (weekDatesFull || []).map(d => addDays(d, 7)), [weekDatesFull]);
  const from = nextDates[0] ? ymd(nextDates[0]) : null;
  const to = nextDates[6] ? ymd(nextDates[6]) : null;

  useEffect(() => {
    if (!open || !athlete?.id || !from) return;
    let cancelled = false;
    setExisting(null); setError('');
    listWorkouts(athlete.id, from, to).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) { setError(err.message); return; }
      const map = {};
      (data || []).forEach(r => { map[JS_DAYS[new Date(`${r.workout_date}T00:00:00`).getDay()]] = { title: r.workout_title, drills: r.drills || [] }; });
      setExisting(map);
    });
    return () => { cancelled = true; };
  }, [open, athlete?.id, from, to]);

  const opts = preset === 'custom' ? custom : PRESETS[preset];
  const plan = useMemo(() => (existing ? planCopyForward(days, schedule, dayTitles, existing, opts) : []), [existing, days, schedule, dayTitles, opts]);
  const toWrite = plan.filter(p => !p.skip);

  if (!open) return null;

  const apply = async () => {
    if (!toWrite.length) return;
    setBusy(true); setError('');
    const rows = toWrite.map(p => ({
      athlete_id: athlete.id,
      workout_date: ymd(nextDates[days.indexOf(p.day)]),
      workout_title: p.title,
      drills: p.drills,
      is_completed: false,
    }));
    // Re-check right before writing, so a day filled in the meantime is never overwritten.
    const { data: fresh, error: reErr } = await listWorkouts(athlete.id, from, to);
    if (reErr) { setError(reErr.message); setBusy(false); return; }
    const occupied = new Set((fresh || []).filter(r => (r.drills || []).length || (r.workout_title || '').trim()).map(r => r.workout_date));
    const safeRows = rows.filter(r => !occupied.has(r.workout_date));
    if (safeRows.length) {
      const { error: upErr } = await supabase.from('agilitylap_workouts').upsert(safeRows, { onConflict: 'athlete_id,workout_date' });
      if (upErr) { setError(upErr.message); setBusy(false); return; }
    }
    setBusy(false);
    onDone?.(`اتنسخ ${safeRows.length} يوم للأسبوع الجاي${plan.length - safeRows.length ? ` · ${plan.length - safeRows.length} يوم متساب لأنه فيه برنامج` : ''}`);
    onClose();
  };

  const num = 'w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-sm font-bold';
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 p-4 print:hidden" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-black"><CopyPlus className="w-5 h-5 text-orange-500" /> انسخ للأسبوع الجاي</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[['progress', 'تقدّم', '+2.5% و ست زيادة للقوة'], ['deload', 'Deload', '−40% ستات و −10%'], ['same', 'زي ما هو', 'من غير تغيير'], ['custom', 'بنفسي', 'حدد الأرقام']].map(([k, label, hint]) => (
            <button key={k} type="button" onClick={() => setPreset(k)}
              className={`rounded-xl border p-2.5 text-right transition-colors ${preset === k ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
              <span className="block text-sm font-black">{label}</span>
              <span className="block text-[11px] text-slate-500">{hint}</span>
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3 text-sm">
            <label className="flex items-center justify-between gap-2">تغيير النسبة / الوزن (%)<input className={num} type="number" step="0.5" value={custom.pctDelta} onChange={e => setCustom({ ...custom, pctDelta: Number(e.target.value) })} /></label>
            <label className="flex items-center justify-between gap-2">ضرب عدد الستات في<input className={num} type="number" step="0.1" min="0.1" value={custom.setsFactor} onChange={e => setCustom({ ...custom, setsFactor: Number(e.target.value) || 1 })} /></label>
            <label className="flex items-center justify-between gap-2">ستات زيادة لكل تمرين<input className={num} type="number" step="1" value={custom.extraSets} onChange={e => setCustom({ ...custom, extraSets: Number(e.target.value) || 0 })} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={custom.addSetStrength} onChange={e => setCustom({ ...custom, addSetStrength: e.target.checked })} /> ست زيادة لتمارين القوة والـ Isometric</label>
          </div>
        )}

        <div className="mt-4">
          <p className="mb-2 text-xs font-bold text-slate-500">الأسبوع الجاي: {from} → {to}</p>
          {!existing && !error && <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> بشوف الأسبوع الجاي…</p>}
          {existing && plan.length === 0 && <p className="text-sm text-slate-500">الأسبوع ده فاضي، مفيش حاجة تتنسخ.</p>}
          <ul className="space-y-1">
            {plan.map(p => (
              <li key={p.day} className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${p.skip ? 'bg-slate-100 dark:bg-slate-900 text-slate-400' : 'bg-green-50 dark:bg-green-500/10'}`}>
                <span className="font-bold" dir="ltr">{p.day}</span>
                <span className="text-xs">{p.skip ? 'متساب: فيه برنامج' : `هيتنسخ · ${p.drills.length} تمرين`}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">الأيام اللي فيها برنامج في الأسبوع الجاي مش هتتلمس خالص.</p>
        </div>

        {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-700 py-2.5 text-sm font-bold">إلغاء</button>
          <button type="button" onClick={apply} disabled={busy || !toWrite.length} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white disabled:opacity-40">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} انسخ {toWrite.length ? `${toWrite.length} يوم` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
