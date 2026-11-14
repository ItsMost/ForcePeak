/**
 * Send one day's workout to an athlete: as a designed image (PNG), a PDF, or plain text.
 * Read-only: uses the schedule already on screen, writes nothing to Supabase.
 * The image is drawn with Canvas 2D so Arabic text is shaped by the browser (no extra library).
 */
import { getUnifiedCategory } from '../../data/constants.js';
import { parseDayType } from './dayType.js';

const CAT = {
  max_strength_lower: ['#2563eb', 'Max Strength · Lower'],
  max_strength_upper: ['#4f46e5', 'Max Strength · Upper'],
  rofd_ballistics: ['#f97316', 'RFD & Ballistics'],
  elasticity_plyo: ['#8b5cf6', 'Elastic Plyos'],
  isometric_tendon: ['#f59e0b', 'Isometrics & Tendon'],
  sprint_speed: ['#10b981', 'Sprint & Speed'],
  trunk_rotation: ['#a855f7', 'Trunk & Rotation'],
  prehab_mobility: ['#f43f5e', 'Prehab & Mobility'],
};
const DAY_TYPE_COLOR = { HIGH: '#ef4444', LOW: '#10b981', REST: '#64748b' };
const AR = /[؀-ۿ]/;

/** 1RM used for "% 1RM" — same matching as TimelineCard. */
function maxFor(title, a) {
  if (!a) return null;
  const t = (title || '').toLowerCase();
  if (t.includes('power clean')) return a.powerClean || a.clean;
  if (t.includes('hang clean')) return a.hangClean;
  if (t.includes('clean')) return a.powerClean || a.clean;
  if (t.includes('bench')) return a.bench;
  if (t.includes('deadlift')) return a.deadlift;
  if (t.includes('front squat')) return a.frontSquat;
  if (t.includes('squat')) return a.fullSquat;
  return null;
}

const UNIT = { reps: '', sec: 'sec', min: 'min', jumps: 'jumps', meters: 'm' };

/** Plain, display-ready facts for one drill. */
export function drillFacts(drill, athlete) {
  const unitKey = (drill.unit || '').toLowerCase();
  const amount = unitKey === 'meters' ? (drill.distance || drill.reps) : drill.reps;
  const unit = UNIT[unitKey] ?? (drill.unit || '');
  const volume = drill.sets || amount ? `${drill.sets || '-'} × ${amount || '-'}${unit ? ` ${unit}` : ''}` : '';

  let load = '';
  const max = parseFloat(maxFor(drill.title, athlete)) || 0;
  const pct = parseFloat(drill.percentage) || 0;
  const w = parseFloat(drill.weight);
  if (!Number.isNaN(w) && drill.weight !== '' && drill.weight != null) load = `${w} ${(drill.weightUnit || 'kg').toUpperCase()}`;
  else if (pct > 0) load = max > 0 ? `${Math.round((max * pct) / 100)} KG (${pct}%)` : `${pct}% 1RM`;
  else if (drill.bwRatio && athlete?.weight > 0) load = `${Math.round(parseFloat(drill.bwRatio) * athlete.weight)} KG (${drill.bwRatio}x BW)`;
  else if (drill.bwRatio) load = `${drill.bwRatio}x BW`;

  const extras = [];
  if (drill.tempo) extras.push(`Tempo ${drill.tempo}`);
  const mv = drill.meanVelocity || drill.mean_velocity || drill.velocity_target_m_s || drill.targetVelocity;
  if (mv) extras.push(`MV ${mv} m/s`);
  if (drill.velocityLoss) extras.push(`VL ${drill.velocityLoss}`);
  if (drill.focus) extras.push(drill.focus);

  const cat = CAT[getUnifiedCategory(drill)] || CAT.max_strength_lower;
  return {
    title: drill.title || 'Exercise',
    volume, load,
    rest: drill.rest && drill.rest !== '0' ? String(drill.rest) : '',
    extras,
    notes: (drill.details || '').trim(),
    color: cat[0], category: cat[1],
  };
}

/** Superset labels (A1, A2...) for adjacent drills sharing a group. */
function supersetLabels(drills) {
  return drills.map((d, i) => {
    const g = d.superset;
    if (!g) return '';
    const adj = drills[i - 1]?.superset === g || drills[i + 1]?.superset === g;
    if (!adj) return '';
    let s = i; while (s > 0 && drills[s - 1].superset === g) s--;
    return `${g}${i - s + 1}`;
  });
}

export function dateLabel(date) {
  return date ? date.toLocaleDateString('ar-EG-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
}

const cleanTitle = (t) => (t || '').replace(/\b(HIGH|LOW|REST)\b\s*:?\s*/i, '').replace(/\|\s*$/, '').replace(/\s*\|\s*\|/g, ' |').trim();

// ---------------- Text ----------------
export function workoutText({ athlete, date, dayTitle, drills }) {
  const labels = supersetLabels(drills);
  const lines = drills.map((d, i) => {
    const f = drillFacts(d, athlete);
    const head = `${labels[i] ? `${labels[i]}) ` : `${i + 1}) `}${f.title}`;
    const bits = [f.volume, f.load && `@ ${f.load}`, f.rest && `Rest ${f.rest}`, ...f.extras].filter(Boolean).join(' · ');
    return [head, bits && `   ${bits}`, f.notes && `   📝 ${f.notes}`].filter(Boolean).join('\n');
  });
  const type = parseDayType(dayTitle);
  return [
    `🏋️ *PEAK FORCE* · ${athlete?.name || ''}`,
    `📅 ${dateLabel(date)}${type ? ` · ${type}` : ''}`,
    cleanTitle(dayTitle) && `*${cleanTitle(dayTitle)}*`,
    '',
    ...lines,
    '',
    'بالتوفيق 💪',
  ].filter((x) => x !== false && x != null).join('\n');
}

// ---------------- Image ----------------
const W = 1080, PAD = 64;
const FONT = '"Outfit", "Segoe UI", "Cairo", Tahoma, Arial, sans-serif';
const font = (size, weight = 400) => `${weight} ${size}px ${FONT}`;

function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const out = []; let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

function text(ctx, str, x, y, { size, weight, color, maxW, align = 'left', keepLeft = false }) {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  const rtl = AR.test(str);
  ctx.direction = rtl ? 'rtl' : 'ltr';
  const right = rtl && !keepLeft;
  ctx.textAlign = right ? 'right' : align;
  const lines = wrap(ctx, str, maxW);
  const lh = Math.round(size * 1.35);
  lines.forEach((l, i) => ctx.fillText(l, right ? x + maxW : x, y + i * lh));
  ctx.direction = 'ltr'; ctx.textAlign = 'left';
  return lines.length * lh;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function pill(ctx, str, x, y, { bg, fg, size = 26 }) {
  ctx.font = font(size, 700);
  const w = ctx.measureText(str).width + 32, h = size + 22;
  roundRect(ctx, x, y, w, h, h / 2); ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.fillText(str, x + 16, y + h / 2 + 1); ctx.textBaseline = 'alphabetic';
  return w;
}

/** Draws everything; when `measureOnly` it just returns the total height. */
function paint(ctx, data, measureOnly) {
  const { athlete, date, dayTitle, drills } = data;
  const labels = supersetLabels(drills);
  const type = parseDayType(dayTitle);
  const title = cleanTitle(dayTitle);
  const innerW = W - PAD * 2;
  let y = 0;

  // Header
  const headerH = 300 + (title ? 30 : 0);
  if (!measureOnly) {
    const g = ctx.createLinearGradient(0, 0, W, headerH);
    g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#1e293b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, headerH);
    ctx.fillStyle = '#f97316'; ctx.fillRect(0, headerH - 8, W, 8);
    ctx.font = font(30, 800); ctx.fillStyle = '#f97316'; ctx.fillText('PEAK FORCE', PAD, 92);
    const bw = ctx.measureText('PEAK FORCE').width;
    ctx.font = font(24, 500); ctx.fillStyle = '#94a3b8'; ctx.fillText('  ·  Performance Lab', PAD + bw, 92);
    text(ctx, athlete?.name || '', PAD, 168, { size: 60, weight: 800, color: '#ffffff', maxW: innerW - 220 });
    text(ctx, dateLabel(date), PAD, 226, { size: 32, weight: 500, color: '#cbd5e1', maxW: innerW, keepLeft: true });
    if (title) text(ctx, title, PAD, 270, { size: 26, weight: 600, color: '#fdba74', maxW: innerW });
    if (type) {
      ctx.font = font(30, 800);
      const tw = ctx.measureText(type).width + 44;
      pill(ctx, type, W - PAD - tw, 120, { bg: DAY_TYPE_COLOR[type], fg: '#fff', size: 30 });
    }
  }
  y = headerH + 48;

  // Exercises
  drills.forEach((d, i) => {
    const f = drillFacts(d, athlete);
    const top = y;
    const x = PAD + 96, w = innerW - 96 - 28;
    ctx.font = font(36, 700);
    const titleLines = wrap(ctx, f.title, w).length;
    let h = 34 + 30 + titleLines * 49 + 22;         // category line + title
    const chips = [f.volume, f.load && `@ ${f.load}`, f.rest && `⏱ ${f.rest}`, ...f.extras].filter(Boolean);
    let rows = 0;
    if (chips.length) {
      let cx = 0; rows = 1;
      chips.forEach((c) => { ctx.font = font(26, 700); const cw = ctx.measureText(c).width + 32; if (cx + cw > w && cx > 0) { rows++; cx = 0; } cx += cw + 12; });
      h += rows * 62 + 6;
    }
    let noteLines = 0;
    if (f.notes) { ctx.font = font(26, 400); noteLines = wrap(ctx, f.notes, w - 24).length; h += noteLines * 35 + 30; }
    h += 26;

    if (!measureOnly) {
      roundRect(ctx, PAD, top, innerW, h, 28); ctx.fillStyle = '#ffffff'; ctx.fill();
      ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); roundRect(ctx, PAD, top, innerW, h, 28); ctx.clip(); ctx.fillStyle = f.color; ctx.fillRect(PAD, top, 10, h); ctx.restore();
      // number badge
      ctx.beginPath(); ctx.arc(PAD + 56, top + 66, 30, 0, Math.PI * 2); ctx.fillStyle = f.color; ctx.fill();
      ctx.font = font(labels[i] ? 24 : 28, 800); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(labels[i] || String(i + 1), PAD + 56, top + 67); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

      let yy = top + 34 + 22;
      ctx.font = font(22, 700); ctx.fillStyle = f.color; ctx.fillText(f.category.toUpperCase(), x, yy);
      yy += 14 + 36;
      yy += text(ctx, f.title, x, yy, { size: 36, weight: 700, color: '#0f172a', maxW: w }) - 49 + 10;
      if (chips.length) {
        yy += 49 - 36;
        let cx = 0;
        chips.forEach((c, ci) => {
          ctx.font = font(26, 700);
          const cw = ctx.measureText(c).width + 32;
          if (cx + cw > w && cx > 0) { cx = 0; yy += 62; }
          const isLoad = c.startsWith('@');
          pill(ctx, c, x + cx, yy, ci === 0 ? { bg: '#0f172a', fg: '#fff' } : isLoad ? { bg: '#fff7ed', fg: '#c2410c' } : { bg: '#f1f5f9', fg: '#334155' });
          cx += cw + 12;
        });
        yy += 62 + 6;
      }
      if (f.notes) {
        const nh = noteLines * 35 + 18;
        roundRect(ctx, x, yy, w, nh, 14); ctx.fillStyle = '#f8fafc'; ctx.fill();
        text(ctx, f.notes, x + 12, yy + 34, { size: 26, weight: 400, color: '#475569', maxW: w - 24 });
      }
    }
    y = top + h + 22;
  });

  // Footer
  y += 20;
  if (!measureOnly) {
    ctx.font = font(24, 600); ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center';
    ctx.fillText(`${drills.length} exercises  ·  PEAK FORCE`, W / 2, y + 10); ctx.textAlign = 'left';
  }
  return y + 60;
}

export async function renderWorkoutCanvas(data) {
  try { await document.fonts?.ready; } catch { /* ignore */ }
  const probe = document.createElement('canvas').getContext('2d');
  const H = Math.ceil(paint(probe, data, true));
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, W, H);
  paint(ctx, data, false);
  return canvas;
}

export const canvasToBlob = (canvas, type = 'image/png', q) =>
  new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('image failed'))), type, q));

/** One-page PDF that is exactly the image (keeps the Arabic text perfect). */
export async function canvasToPdfBlob(canvas) {
  const { jsPDF } = await import('jspdf');
  const wMm = 210, hMm = (canvas.height / canvas.width) * wMm;
  const doc = new jsPDF({ unit: 'mm', format: [wMm, hMm], orientation: hMm > wMm ? 'portrait' : 'landscape' });
  doc.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, wMm, hMm);
  return doc.output('blob');
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canShareFile(file) {
  try { return !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch { return false; }
}

export const safeFileName = (s) => String(s || 'workout').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').slice(0, 60);
