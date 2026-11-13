import React, { useMemo } from 'react';
import { AlertTriangle, Activity, CalendarClock, CopyPlus, Gauge, MessageCircle, Stethoscope, Sun, Wrench } from 'lucide-react';
import { parseDayType, weekDayTypeWarnings } from './dayType';
import { acwrZone } from './load';

const chip = 'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-bold whitespace-nowrap';
const tone = {
  neutral: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300',
  high: 'border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300',
  low: 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
  ok: 'border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300',
  warn: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300',
  danger: 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
};
const btn = 'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-colors whitespace-nowrap';

const fmtDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/**
 * Week summary above the planner: High/Low/Rest rhythm, readiness, load/ACWR, injuries,
 * matches, plus the entry points to the coach tools.
 */
export default function CoachBar({ coach, days, schedule, dayTitles, calculateDayVolume, onOpenTools, onOpenProgression, onOpenToday, onWhatsApp }) {
  const types = useMemo(() => Object.fromEntries(days.map(d => [d, parseDayType(dayTitles[d]) || ((schedule[d] || []).length ? null : 'EMPTY')])), [days, dayTitles, schedule]);
  const counts = useMemo(() => {
    const c = { HIGH: 0, LOW: 0, REST: 0 };
    days.forEach(d => { if (c[types[d]] !== undefined) c[types[d]]++; });
    return c;
  }, [days, types]);
  const warnings = useMemo(() => weekDayTypeWarnings(days, types), [days, types]);
  const planned = useMemo(() => days.reduce((s, d) => {
    const v = calculateDayVolume(schedule[d] || []);
    return s + (v.cnsLoad || 0) + (v.structuralLoad || 0);
  }, 0), [days, schedule, calculateDayVolume]);

  if (!coach.enabled) return null;

  const r = coach.readiness;
  const zone = acwrZone(coach.load?.ratio);
  const weekEvents = (coach.myEvents || []).filter(e => e.event_date >= coach.weekStart && e.event_date <= coach.weekEnd);

  return (
    <section className="mx-2 md:mx-4 mt-3 mb-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-3 py-2.5 print:hidden" dir="ltr">
      {coach.missing && (
        <p className="mb-2 text-[12px] font-bold text-amber-700 dark:text-amber-300" dir="rtl">
          أدوات الكابتن (الاختبارات، الـ RPE، الماتشات، الإصابات) هتشتغل بعد تطبيق ملف الجداول الجديد.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Rhythm */}
        <span className={`${chip} ${tone.high}`} title="High days">High {counts.HIGH}</span>
        <span className={`${chip} ${tone.low}`} title="Low days">Low {counts.LOW}</span>
        <span className={`${chip} ${tone.neutral}`} title="Rest days">Rest {counts.REST}</span>

        {/* Readiness */}
        {r?.level && (
          <span className={`${chip} ${r.level === 'red' ? tone.danger : r.level === 'yellow' ? tone.warn : tone.ok}`}
                title={`آخر CMJ ${r.latest?.value} cm مقابل متوسط ${r.baseline?.toFixed(1)} cm`}>
            <Activity className="w-3.5 h-3.5" /> CMJ {Number(r.latest?.value)} cm ({r.changePct > 0 ? '+' : ''}{r.changePct?.toFixed(1)}%)
          </span>
        )}

        {/* Load */}
        <span className={`${chip} ${tone.neutral}`} title="الحِمل المتوقع من البرنامج (CNS + Structural)">
          <Gauge className="w-3.5 h-3.5" /> Planned {Math.round(planned)}
        </span>
        {coach.weekActual > 0 && (
          <span className={`${chip} ${tone.neutral}`} title="sRPE = RPE × دقائق، مجموع الأسبوع">sRPE {Math.round(coach.weekActual)}</span>
        )}
        {zone && (
          <span className={`${chip} ${zone === 'danger' ? tone.danger : zone === 'warning' ? tone.warn : zone === 'low' ? tone.low : tone.ok}`}
                title="ACWR: حِمل آخر 7 أيام ÷ متوسط آخر 4 أسابيع. 0.8–1.3 آمن، فوق 1.5 خطر">
            ACWR {coach.load.ratio.toFixed(2)}
          </span>
        )}

        {/* Matches this week */}
        {weekEvents.map(e => (
          <span key={e.id} className={`${chip} ${tone.warn}`} title={e.notes || ''}>
            <CalendarClock className="w-3.5 h-3.5" /> {e.title} · {fmtDate(e.event_date)}
          </span>
        ))}

        <span className="flex-1" />

        <button type="button" onClick={onOpenToday} className={`${btn} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700`}>
          <Sun className="w-3.5 h-3.5" /> النهارده
        </button>
        <button type="button" onClick={onOpenTools} className={`${btn} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700`}>
          <Wrench className="w-3.5 h-3.5" /> أدوات اللاعب
        </button>
        <button type="button" onClick={onWhatsApp} className={`${btn} bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/20`}>
          <MessageCircle className="w-3.5 h-3.5" /> واتساب
        </button>
        <button type="button" onClick={onOpenProgression} className={`${btn} bg-orange-500 text-white hover:bg-orange-600`}>
          <CopyPlus className="w-3.5 h-3.5" /> انسخ للأسبوع الجاي
        </button>
      </div>

      {(warnings.length > 0 || coach.activeNotes.length > 0 || r?.level === 'red') && (
        <div className="mt-2 flex flex-col gap-1" dir="rtl">
          {r?.level === 'red' && (
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-red-600 dark:text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> الـ CMJ نازل {Math.abs(r.changePct).toFixed(1)}% عن المتوسط: فكّر تخلي اليوم Low.
            </p>
          )}
          {warnings.map(w => (
            <p key={w} className="flex items-center gap-1.5 text-[12px] font-bold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {w}
            </p>
          ))}
          {coach.activeNotes.map(n => (
            <p key={n.id} className="flex items-center gap-1.5 text-[12px] font-bold text-red-600 dark:text-red-400">
              <Stethoscope className="w-3.5 h-3.5 shrink-0" /> {n.note}
              {n.restricted_keywords?.length > 0 && <span className="font-normal text-red-500/80">· ممنوع: {n.restricted_keywords.join('، ')}</span>}
              {n.end_date && <span className="font-normal text-red-500/80">· لحد {fmtDate(n.end_date)}</span>}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
