import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Download, FileText, Image as ImageIcon, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { whatsappLink } from './coachApi';
import {
  workoutText, renderWorkoutCanvas, canvasToBlob, canvasToPdfBlob,
  downloadBlob, canShareFile, safeFileName, dateLabel,
} from './workoutShare';

const DAY_AR = { Saturday: 'السبت', Sunday: 'الأحد', Monday: 'الاتنين', Tuesday: 'التلات', Wednesday: 'الأربع', Thursday: 'الخميس', Friday: 'الجمعة' };
const FORMATS = [['image', 'صورة', ImageIcon], ['pdf', 'PDF', FileText], ['text', 'كتابة', MessageCircle]];
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Send one chosen day to the athlete as image / PDF / text. Read-only (nothing is saved). */
export default function SendWorkoutModal({ open, onClose, athlete, whatsapp, days, schedule, dayTitles, weekDatesFull, onToast }) {
  const firstDay = useMemo(() => {
    const today = ymd(new Date());
    const ti = (weekDatesFull || []).findIndex((d) => d && ymd(d) === today);
    if (ti >= 0 && (schedule[days[ti]] || []).length) return days[ti];
    return days.find((d) => (schedule[d] || []).length) || days[0];
  }, [days, schedule, weekDatesFull]);

  const [day, setDay] = useState(firstDay);
  const [format, setFormat] = useState('image');
  const [file, setFile] = useState(null);       // File ready to share (image or pdf)
  const [preview, setPreview] = useState('');   // object URL of the image
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const idx = days.indexOf(day);
  const date = weekDatesFull?.[idx];
  const drills = useMemo(() => schedule[day] || [], [schedule, day]);
  const data = useMemo(() => ({ athlete, date, dayTitle: dayTitles[day] || '', drills }), [athlete, date, dayTitles, day, drills]);
  const text = useMemo(() => workoutText(data), [data]);
  const baseName = `${safeFileName(athlete?.name)}_${date ? ymd(date) : day}`;

  // Build the image (and the PDF when chosen) ahead of time, so "send" is instant on phones.
  useEffect(() => {
    if (!open || !drills.length || format === 'text') { setFile(null); return undefined; }
    let cancelled = false;
    setBusy(true); setError('');
    (async () => {
      try {
        const canvas = await renderWorkoutCanvas(data);
        if (cancelled) return;
        const png = await canvasToBlob(canvas);
        if (cancelled) return;
        const url = URL.createObjectURL(png);
        setPreview((old) => { if (old) URL.revokeObjectURL(old); return url; });
        if (format === 'pdf') {
          const pdf = await canvasToPdfBlob(canvas);
          if (!cancelled) setFile(new File([pdf], `${baseName}.pdf`, { type: 'application/pdf' }));
        } else {
          setFile(new File([png], `${baseName}.png`, { type: 'image/png' }));
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'حصلت مشكلة');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, data, format, drills.length, baseName]);

  if (!open) return null;

  const shareable = file && canShareFile(file);
  const chatLink = (msg) => whatsappLink(whatsapp, msg);

  const share = async () => {
    try {
      await navigator.share({ files: [file], title: `PEAK FORCE · ${athlete?.name || ''}` });
    } catch (e) {
      if (e?.name !== 'AbortError') setError('المشاركة مش شغالة هنا، استخدم "نزّل وافتح واتساب"');
    }
  };
  const downloadAndOpen = () => {
    downloadBlob(file, file.name);
    window.open(chatLink(`تمرين ${DAY_AR[day] || day} ${date ? dateLabel(date) : ''} 💪`), '_blank', 'noopener');
    onToast?.('الملف اتنزل — اسحبه جوه شات الواتساب');
  };
  const copyText = async () => {
    try { await navigator.clipboard.writeText(text); onToast?.('اتنسخ'); } catch { setError('مقدرتش أنسخ'); }
  };

  const tab = (active) => `flex-1 rounded-xl border px-2 py-2 text-sm font-bold transition-colors ${active ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`;
  const primary = 'flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-40';
  const secondary = 'flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 py-2.5 text-sm font-bold disabled:opacity-40';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/50 p-4 print:hidden" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-black"><Send className="w-5 h-5 text-green-600" /> ابعت التمرين · {athlete?.name}</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>

        <p className="mb-1.5 text-xs font-bold text-slate-500">اليوم</p>
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {days.map((d, i) => {
            const n = (schedule[d] || []).length;
            const dt = weekDatesFull?.[i];
            return (
              <button key={d} type="button" disabled={!n} onClick={() => setDay(d)}
                className={`rounded-xl border px-1 py-1.5 text-center transition-colors disabled:opacity-35 ${day === d ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                <span className="block text-xs font-black">{DAY_AR[d] || d}</span>
                <span className="block text-[10px] text-slate-500">{dt ? dt.getDate() : ''}</span>
                <span className="block text-[10px] font-bold text-slate-400">{n ? `${n} تمرين` : '—'}</span>
              </button>
            );
          })}
        </div>

        <p className="mb-1.5 mt-4 text-xs font-bold text-slate-500">هيتبعت إزاي</p>
        <div className="flex gap-2">
          {FORMATS.map(([k, label, Icon]) => (
            <button key={k} type="button" onClick={() => setFormat(k)} className={`${tab(format === k)} flex items-center justify-center gap-1.5`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-slate-100 dark:bg-slate-900/60 p-2">
          {!drills.length && <p className="p-6 text-center text-sm text-slate-500">اليوم ده مفيهوش تمارين</p>}
          {!!drills.length && format === 'text' && (
            <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap p-2 text-sm font-sans leading-relaxed" dir="auto">{text}</pre>
          )}
          {!!drills.length && format !== 'text' && (
            busy && !preview
              ? <p className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> بجهّز…</p>
              : preview && <img src={preview} alt="معاينة التمرين" className="mx-auto max-h-[45vh] rounded-xl object-contain" />
          )}
          {format === 'pdf' && !!drills.length && <p className="pt-1 text-center text-[11px] text-slate-500">الـ PDF صفحة واحدة بنفس شكل الصورة</p>}
        </div>

        {!whatsapp && <p className="mt-2 text-[11px] text-slate-500">مفيش رقم واتساب للاعب ده — هتختار الشات بنفسك (تقدر تضيف الرقم من أدوات اللاعب).</p>}
        {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {format === 'text' ? (
            <>
              <button type="button" disabled={!drills.length} onClick={() => window.open(chatLink(text), '_blank', 'noopener')} className={primary}>
                <MessageCircle className="w-4 h-4" /> ابعت على واتساب
              </button>
              <button type="button" disabled={!drills.length} onClick={copyText} className={secondary}><Copy className="w-4 h-4" /> انسخ</button>
            </>
          ) : (
            <>
              {shareable && (
                <button type="button" disabled={busy || !file} onClick={share} className={primary}>
                  <Send className="w-4 h-4" /> شارك (واتساب)
                </button>
              )}
              <button type="button" disabled={busy || !file} onClick={downloadAndOpen} className={shareable ? secondary : primary}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} نزّل وافتح واتساب
              </button>
              <button type="button" disabled={busy || !file} onClick={() => downloadBlob(file, file.name)} className={`${secondary} flex-none px-4`} title="نزّل بس">
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
