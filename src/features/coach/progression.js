/**
 * Copy-forward with progression. Pure functions: they build NEW drill objects for the next
 * week and never mutate the current week.
 */
const STRENGTH_TYPES = new Set(['max_strength_lower', 'max_strength_upper', 'isometric_tendon', 'strength', 'isometric']);

export const PRESETS = {
  progress: { label: 'تقدّم عادي', pctDelta: 2.5, addSetStrength: true, setsFactor: 1 },
  deload: { label: 'Deload', pctDelta: -10, addSetStrength: false, setsFactor: 0.6 },
  same: { label: 'نسخة زي ما هي', pctDelta: 0, addSetStrength: false, setsFactor: 1 },
};

const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
// keep the original type: "3" stays a string, 3 stays a number
const keepType = (orig, value) => (typeof orig === 'string' ? String(value) : value);
const roundTo = (v, step) => Math.round(v / step) * step;

export function progressDrill(drill, opts) {
  const { pctDelta = 0, addSetStrength = false, setsFactor = 1, extraSets = 0 } = opts;
  const next = { ...drill, id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };

  // Intensity: % 1RM if present, otherwise a fixed weight scaled by the same ratio.
  const pct = num(drill.percentage);
  if (pct != null && pctDelta) {
    next.percentage = keepType(drill.percentage, Math.max(0, Math.round((pct + pctDelta) * 10) / 10));
  } else {
    const w = num(drill.weight);
    if (w != null && w > 0 && pctDelta) next.weight = keepType(drill.weight, roundTo(w * (1 + pctDelta / 100), 2.5));
  }

  // Volume
  const sets = num(drill.sets);
  if (sets != null) {
    let s = sets;
    if (setsFactor !== 1) s = Math.max(1, Math.round(s * setsFactor));
    if (addSetStrength && STRENGTH_TYPES.has((drill.type || '').toLowerCase())) s += 1;
    if (extraSets) s = Math.max(1, s + extraSets);
    if (s !== sets) next.sets = keepType(drill.sets, s);
  }
  return next;
}

/**
 * Plan the copy for each day. `existing` = { [dayName]: { title, drills } } for the TARGET week.
 * A target day is "free" only if it has no drills AND no title — anything else is left untouched.
 */
export function planCopyForward(days, schedule, titles, existing, opts) {
  const plan = [];
  for (const day of days) {
    const drills = schedule[day] || [];
    const title = titles[day] || '';
    if (!drills.length && !title) continue; // nothing to copy
    const target = existing[day];
    const occupied = !!target && ((target.drills && target.drills.length) || (target.title && target.title.trim()));
    plan.push({
      day,
      skip: occupied,
      title,
      drills: occupied ? [] : drills.map(d => progressDrill(d, opts)),
    });
  }
  return plan;
}
