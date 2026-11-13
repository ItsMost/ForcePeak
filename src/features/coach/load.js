/** Training load helpers. */

/** Session RPE load (Foster): RPE (0-10) x minutes. */
export function sessionLoad(log) {
  if (!log || log.rpe == null || log.duration_min == null) return null;
  return Number(log.rpe) * Number(log.duration_min);
}

const toDate = (s) => new Date(`${s}T00:00:00`);
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);

/**
 * ACWR (rolling): acute = load of the 7 days ending on `asOf`,
 * chronic = average weekly load over the 28 days ending on `asOf`.
 * Needs logs spanning >= 21 days, otherwise returns { ratio: null, reason }.
 */
export function acwr(logs, asOf) {
  const withLoad = (logs || []).map(l => ({ date: l.session_date, load: sessionLoad(l) })).filter(l => l.load != null);
  if (!withLoad.length) return { ratio: null, acute: 0, chronic: 0, reason: 'no-data' };
  const inWindow = (d, n) => { const x = daysBetween(d, asOf); return x >= 0 && x < n; };
  const acute = withLoad.filter(l => inWindow(l.date, 7)).reduce((s, l) => s + l.load, 0);
  const chronicTotal = withLoad.filter(l => inWindow(l.date, 28)).reduce((s, l) => s + l.load, 0);
  const chronic = chronicTotal / 4;
  const oldest = withLoad.reduce((m, l) => (l.date < m ? l.date : m), asOf);
  if (daysBetween(oldest, asOf) < 21) return { ratio: null, acute, chronic, reason: 'need-history' };
  if (chronic <= 0) return { ratio: null, acute, chronic, reason: 'no-chronic' };
  return { ratio: acute / chronic, acute, chronic };
}

/** Zone: under 0.8 low, 0.8-1.3 sweet spot, 1.3-1.5 caution, over 1.5 high risk. */
export function acwrZone(ratio) {
  if (ratio == null) return null;
  if (ratio > 1.5) return 'danger';
  if (ratio > 1.3) return 'warning';
  if (ratio < 0.8) return 'low';
  return 'ok';
}

/**
 * Planned load from the program itself (no RPE needed): sets x how demanding the category is.
 * Understands both the new categories and the legacy type names.
 */
const CATEGORY_WEIGHT = {
  elasticity_plyo: 3, rofd_ballistics: 3, sprint_speed: 3,
  max_strength_lower: 2.5, max_strength_upper: 2,
  isometric_tendon: 1.5, trunk_rotation: 1, prehab_mobility: 0.5,
  // legacy
  plyometric: 3, power: 3, speed: 3, strength: 2.5, isometric: 1.5, core: 1, mobility: 0.5, endurance: 1, physical: 1,
};
export function plannedLoad(drills) {
  return (drills || []).reduce((sum, d) => {
    const sets = parseFloat(String(d.sets ?? '').replace(/[^\d.]/g, '')) || 1;
    const w = CATEGORY_WEIGHT[(d.type || '').toLowerCase()] ?? 1;
    return sum + sets * w;
  }, 0);
}
