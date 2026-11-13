import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, LineChart, Loader2, MessageCircle, Plus, Stethoscope, Trash2, X } from 'lucide-react';
import * as api from './coachApi';
import { allTests, slugify } from './tests';
import { todayStr } from './useCoachWeekData';
import ConfirmDeleteModal from '../../components/WeeklyPlanner/ConfirmDeleteModal.jsx';

const TABS = [
  ['tests', 'الاختبارات', LineChart],
  ['events', 'الماتشات', CalendarClock],
  ['notes', 'الإصابات', Stethoscope],
  ['whatsapp', 'واتساب', MessageCircle],
];
const field = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/30';
const label = 'mb-1 block text-xs font-bold text-slate-500';
const primary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-40';
const fmt = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AthleteToolsModal({ open, onClose, athlete, coach, onToast, onProfileUpdated }) {
  const [tab, setTab] = useState('tests');
  const [confirm, setConfirm] = useState(null);
  if (!open || !athlete) return null;
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/50 p-2 sm:p-4 print:hidden" onClick={onClose}>
      <div className="flex w-full max-w-2xl max-h-[92vh] flex-col rounded-3xl bg-white dark:bg-slate-800 shadow-2xl" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <div>
            <h3 className="text-lg font-black">أدوات اللاعب</h3>
            <p className="text-xs text-slate-500">{athlete.name}{athlete.groupName ? ` · ${athlete.groupName}` : ''}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-700 px-3 pt-2">
          {TABS.map(([k, name, Icon]) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-xl px-3 py-2 text-sm font-bold ${tab === k ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>
              <Icon className="w-4 h-4" /> {name}
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto p-5">
          {coach.missing ? (
            <p className="rounded-xl bg-amber-50 dark:bg-amber-500/10 p-4 text-sm font-bold text-amber-700 dark:text-amber-300">
              الأدوات دي هتشتغل بعد تطبيق ملف الجداول الجديد في Supabase.
            </p>
          ) : (
            <>
              {tab === 'tests' && <TestsTab athlete={athlete} coach={coach} onToast={onToast} onProfileUpdated={onProfileUpdated} setConfirm={setConfirm} />}
              {tab === 'events' && <EventsTab athlete={athlete} coach={coach} onToast={onToast} setConfirm={setConfirm} />}
              {tab === 'notes' && <NotesTab athlete={athlete} coach={coach} onToast={onToast} setConfirm={setConfirm} />}
              {tab === 'whatsapp' && <WhatsAppTab athlete={athlete} coach={coach} onToast={onToast} />}
            </>
          )}
        </div>
      </div>
      <div onClick={e => e.stopPropagation()}>
        <ConfirmDeleteModal open={!!confirm} {...(confirm || {})} onClose={() => setConfirm(null)} />
      </div>
    </div>
  );
}

// ---------------- Tests ----------------
function Sparkline({ points, unit }) {
  if (points.length < 2) return null;
  const w = 520, h = 120, pad = 24;
  const vals = points.map(p => Number(p.value));
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i) => pad + (i * (w - pad * 2)) / (points.length - 1);
  const y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(Number(p.value)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="تطور الاختبار" dir="ltr">
      <path d={d} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={p.id}>
          <circle cx={x(i)} cy={y(Number(p.value))} r="3.5" fill="#f97316" />
          {(i === 0 || i === points.length - 1 || points.length <= 6) && (
            <text x={x(i)} y={y(Number(p.value)) - 8} textAnchor="middle" className="fill-slate-500" fontSize="11" fontWeight="700">{Number(p.value)}{unit}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

function TestsTab({ athlete, coach, onToast, onProfileUpdated, setConfirm }) {
  const tests = useMemo(() => allTests(coach.defs), [coach.defs]);
  const [key, setKey] = useState('back_squat');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(todayStr());
  const [busy, setBusy] = useState(false);
  const [askProfile, setAskProfile] = useState(null);
  const [newTest, setNewTest] = useState({ name: '', unit: '', higher: true, open: false });

  const def = tests.find(t => t.key === key) || tests[0];
  const history = useMemo(() => coach.tests.filter(r => r.test_key === def.key).sort((a, b) => (a.tested_on < b.tested_on ? -1 : 1)), [coach.tests, def.key]);
  const latestByKey = useMemo(() => {
    const m = {};
    coach.tests.forEach(r => { if (!m[r.test_key] || r.tested_on > m[r.test_key].tested_on) m[r.test_key] = r; });
    return m;
  }, [coach.tests]);

  const save = async () => {
    if (value === '') return;
    setBusy(true);
    const res = await api.addTestResult({ athlete_id: athlete.id, test_key: def.key, test_name: def.name, value: Number(value), unit: def.unit, tested_on: date });
    setBusy(false);
    if (res.error) { onToast?.('فشل الحفظ: ' + res.error.message); return; }
    onToast?.(`اتسجل ${def.name}: ${value} ${def.unit}`);
    coach.refresh();
    if (def.profileField) {
      const current = athlete[def.profileField];
      if (Number(current) !== Number(value)) setAskProfile({ field: def.profileField, name: def.name, from: current, to: Number(value) });
    }
    setValue('');
  };

  const updateProfile = async () => {
    const { field: f, to } = askProfile;
    const res = await api.updateAthleteProfileField(athlete.id, f, to);
    if (res.error) onToast?.('فشل تحديث الملف: ' + res.error.message);
    else { onToast?.('اتحدّث الرقم في ملف اللاعب'); onProfileUpdated?.(athlete.id, f, to); }
    setAskProfile(null);
  };

  const addDefinition = async () => {
    if (!newTest.name.trim()) return;
    const res = await api.addTestDefinition({ key: slugify(newTest.name), name: newTest.name.trim(), unit: newTest.unit.trim(), higher_is_better: newTest.higher });
    if (res.error) { onToast?.('فشل: ' + res.error.message); return; }
    coach.refresh();
    setKey(res.data.key);
    setNewTest({ name: '', unit: '', higher: true, open: false });
    onToast?.('اتضاف اختبار جديد');
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_150px_auto] sm:items-end">
        <div>
          <label className={label}>الاختبار</label>
          <select className={field} value={def.key} onChange={e => setKey(e.target.value)} dir="ltr">
            <optgroup label="Strength (1RM)">{tests.filter(t => t.group === 'strength').map(t => <option key={t.key} value={t.key}>{t.name}</option>)}</optgroup>
            <optgroup label="Jumps">{tests.filter(t => t.group === 'jump').map(t => <option key={t.key} value={t.key}>{t.name}</option>)}</optgroup>
            {tests.some(t => t.group === 'custom') && <optgroup label="Custom">{tests.filter(t => t.group === 'custom').map(t => <option key={t.key} value={t.key}>{t.name}</option>)}</optgroup>}
          </select>
        </div>
        <div><label className={label}>النتيجة {def.unit && `(${def.unit})`}</label><input className={field} type="number" inputMode="decimal" step="0.1" value={value} onChange={e => setValue(e.target.value)} /></div>
        <div><label className={label}>التاريخ</label><input className={field} type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <button type="button" className={primary} onClick={save} disabled={busy || value === ''}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} سجّل</button>
      </div>

      {askProfile && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10 p-3 text-sm">
          <p className="font-bold">تحدّث {askProfile.name} في ملف اللاعب من {askProfile.from ?? '—'} لـ {askProfile.to}؟</p>
          <p className="mt-0.5 text-xs text-slate-500">الرقم القديم هيفضل محفوظ في سجل الاختبارات.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className={primary} onClick={updateProfile}>أيوه حدّثه</button>
            <button type="button" className="rounded-xl bg-white dark:bg-slate-800 px-4 py-2 text-sm font-bold" onClick={() => setAskProfile(null)}>لأ، سيبه</button>
          </div>
        </div>
      )}

      <div>
        <h4 className="mb-2 text-sm font-black">{def.name}: التطور</h4>
        {history.length >= 2 ? <Sparkline points={history} unit={def.unit} /> : <p className="text-sm text-slate-500">سجّل نتيجتين على الأقل عشان يظهر الرسم.</p>}
        <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-700">
          {[...history].reverse().map(r => (
            <li key={r.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="font-bold" dir="ltr">{Number(r.value)} {r.unit}</span>
              <span className="text-xs text-slate-500">{fmt(r.tested_on)}{r.is_readiness ? ' · Readiness' : ''}</span>
              <button type="button" className="p-1 text-slate-400 hover:text-red-500" aria-label="مسح النتيجة"
                onClick={() => setConfirm({ title: 'مسح نتيجة اختبار', message: `هتتمسح النتيجة دي من السجل:`, itemName: `${r.test_name} ${Number(r.value)} ${r.unit} · ${fmt(r.tested_on)}`, onConfirm: async () => { const x = await api.deleteTestResult(r.id); if (!x.error) { coach.refresh(); onToast?.('اتمسحت النتيجة'); } } })}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-black">آخر نتيجة لكل اختبار</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" dir="ltr">
          {tests.filter(t => latestByKey[t.key]).map(t => (
            <button key={t.key} type="button" onClick={() => setKey(t.key)} className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-left hover:border-orange-300">
              <span className="block text-[11px] font-bold text-slate-500">{t.name}</span>
              <span className="block text-base font-black">{Number(latestByKey[t.key].value)} <span className="text-xs font-bold text-slate-400">{t.unit}</span></span>
            </button>
          ))}
          {!Object.keys(latestByKey).length && <p className="col-span-full text-sm text-slate-500" dir="rtl">لسه مفيش اختبارات متسجلة.</p>}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
        {!newTest.open ? (
          <button type="button" className="text-sm font-bold text-orange-600" onClick={() => setNewTest({ ...newTest, open: true })}>+ ضيف اختبار جديد بنفسك</button>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px_auto_auto] sm:items-end">
            <div><label className={label}>اسم الاختبار</label><input className={field} value={newTest.name} onChange={e => setNewTest({ ...newTest, name: e.target.value })} placeholder="مثلاً Sprint 10m" /></div>
            <div><label className={label}>الوحدة</label><input className={field} value={newTest.unit} onChange={e => setNewTest({ ...newTest, unit: e.target.value })} placeholder="s / cm" /></div>
            <label className="flex items-center gap-1.5 pb-2 text-xs font-bold"><input type="checkbox" checked={!newTest.higher} onChange={e => setNewTest({ ...newTest, higher: !e.target.checked })} /> الأقل أحسن</label>
            <button type="button" className={primary} onClick={addDefinition}>ضيف</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Matches ----------------
function EventsTab({ athlete, coach, onToast, setConfirm }) {
  const [form, setForm] = useState({ title: '', event_date: todayStr(), event_type: 'match', scope: 'athlete', notes: '' });
  const [busy, setBusy] = useState(false);
  const upcoming = (coach.myEvents || []).filter(e => e.event_date >= todayStr());

  const save = async () => {
    if (!form.title.trim() || !form.event_date) return;
    setBusy(true);
    const row = { title: form.title.trim(), event_date: form.event_date, event_type: form.event_type, notes: form.notes || null,
      athlete_id: form.scope === 'athlete' ? athlete.id : null, group_name: form.scope === 'group' ? athlete.groupName : null };
    const res = await api.addEvent(row);
    setBusy(false);
    if (res.error) { onToast?.('فشل: ' + res.error.message); return; }
    onToast?.('اتضاف الماتش');
    coach.refresh();
    setForm({ ...form, title: '', notes: '' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><label className={label}>الاسم</label><input className={field} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="مثلاً ماتش الأهلي" /></div>
        <div><label className={label}>التاريخ</label><input className={field} type="date" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
        <div><label className={label}>النوع</label>
          <select className={field} value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
            <option value="match">ماتش</option><option value="tournament">بطولة</option><option value="other">حاجة تانية</option>
          </select>
        </div>
        <div><label className={label}>لمين؟</label>
          <select className={field} value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })}>
            <option value="athlete">{athlete.name} بس</option>
            {athlete.groupName && <option value="group">كل مجموعة {athlete.groupName}</option>}
          </select>
        </div>
        <div className="sm:col-span-2"><label className={label}>ملاحظات (اختياري)</label><input className={field} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <button type="button" className={primary} onClick={save} disabled={busy || !form.title.trim()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} ضيف</button>
      {!athlete.groupName && <p className="text-xs text-slate-500">عشان تضيف ماتش لمجموعة كاملة، حط اللاعب في Group الأول من ملفه.</p>}

      <div>
        <h4 className="mb-2 text-sm font-black">الماتشات الجاية</h4>
        {!upcoming.length && <p className="text-sm text-slate-500">مفيش ماتشات جاية في التلات أسابيع الجايين.</p>}
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {upcoming.map(e => (
            <li key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span><b>{e.title}</b> <span className="text-xs text-slate-500">· {fmt(e.event_date)}{e.group_name ? ` · مجموعة ${e.group_name}` : ''}</span></span>
              <button type="button" className="p-1 text-slate-400 hover:text-red-500" aria-label="مسح"
                onClick={() => setConfirm({ title: 'مسح ماتش', message: 'هيتمسح من الكالندر:', itemName: e.title, onConfirm: async () => { const x = await api.deleteEvent(e.id); if (!x.error) { coach.refresh(); onToast?.('اتمسح'); } } })}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------- Injuries / restrictions ----------------
function NotesTab({ athlete, coach, onToast, setConfirm }) {
  const [form, setForm] = useState({ note: '', keywords: '', start_date: todayStr(), end_date: '' });
  const [busy, setBusy] = useState(false);
  const today = todayStr();

  const save = async () => {
    if (!form.note.trim()) return;
    setBusy(true);
    const keywords = form.keywords.split(/[,،\n]/).map(s => s.trim()).filter(Boolean);
    const res = await api.addNote({ athlete_id: athlete.id, note: form.note.trim(), restricted_keywords: keywords, start_date: form.start_date, end_date: form.end_date || null });
    setBusy(false);
    if (res.error) { onToast?.('فشل: ' + res.error.message); return; }
    onToast?.('اتضافت الملاحظة');
    coach.refresh();
    setForm({ note: '', keywords: '', start_date: todayStr(), end_date: '' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={label}>الملاحظة</label><input className={field} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="مثلاً التهاب وتر رضفي يمين" /></div>
        <div className="sm:col-span-2"><label className={label}>تمارين ممنوعة (افصل بفاصلة) — أي تمرين اسمه فيه الكلمة دي هيظهر عليه تحذير</label><input className={field} value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder="depth jump, drop jump, bounds" dir="ltr" /></div>
        <div><label className={label}>من</label><input className={field} type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
        <div><label className={label}>لحد (اختياري)</label><input className={field} type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
      </div>
      <button type="button" className={primary} onClick={save} disabled={busy || !form.note.trim()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} ضيف</button>

      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {coach.notes.map(n => {
          const active = api.isNoteActive(n, today);
          return (
            <li key={n.id} className="py-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <b className={active ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}>{n.note}</b>
                  <p className="text-xs text-slate-500">{fmt(n.start_date)} → {n.end_date ? fmt(n.end_date) : 'مستمر'}{n.restricted_keywords?.length ? ` · ممنوع: ${n.restricted_keywords.join('، ')}` : ''}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {active && <button type="button" className="rounded-lg bg-slate-100 dark:bg-slate-700 px-2 py-1 text-xs font-bold" onClick={async () => { const x = await api.endNote(n.id, today); if (!x.error) { coach.refresh(); onToast?.('اتقفلت الملاحظة'); } }}>خلصت</button>}
                  <button type="button" className="p-1 text-slate-400 hover:text-red-500" aria-label="مسح"
                    onClick={() => setConfirm({ title: 'مسح ملاحظة', message: 'هتتمسح الملاحظة:', itemName: n.note, onConfirm: async () => { const x = await api.deleteNote(n.id); if (!x.error) { coach.refresh(); onToast?.('اتمسحت'); } } })}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {!coach.notes.length && <li className="py-2 text-sm text-slate-500">مفيش ملاحظات.</li>}
      </ul>
    </div>
  );
}

// ---------------- WhatsApp ----------------
function WhatsAppTab({ athlete, coach, onToast }) {
  const [num, setNum] = useState(coach.contact?.whatsapp || '');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setNum(coach.contact?.whatsapp || ''); }, [coach.contact]);
  const save = async () => {
    setBusy(true);
    const res = await api.saveContact(athlete.id, num.trim() || null);
    setBusy(false);
    if (res.error) onToast?.('فشل: ' + res.error.message);
    else { onToast?.('اتحفظ الرقم'); coach.refresh(); }
  };
  return (
    <div className="space-y-3">
      <div><label className={label}>رقم واتساب {athlete.name}</label><input className={field} value={num} onChange={e => setNum(e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" inputMode="tel" /></div>
      <button type="button" className={primary} onClick={save} disabled={busy}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} حفظ</button>
      <p className="text-xs text-slate-500">زرار "واتساب" فوق الأسبوع هيفتح المحادثة دي ومكتوب فيها تمرين اليوم. انت اللي بتدوس إرسال.</p>
    </div>
  );
}
