/**
 * CMJ readiness: latest CMJ vs the average of the previous 4 CMJ results.
 * Drop >= 7% -> red, drop 4-7% -> yellow.
 */
export const READINESS_RED = 7;
export const READINESS_YELLOW = 4;

export function readinessFromCmj(results) {
  const cmj = (results || [])
    .filter(r => r.test_key === 'cmj')
    .sort((a, b) => (a.tested_on < b.tested_on ? 1 : a.tested_on > b.tested_on ? -1 : (a.created_at < b.created_at ? 1 : -1)));
  if (cmj.length < 2) return { level: null, latest: cmj[0] || null, baseline: null, changePct: null };
  const latest = cmj[0];
  const prev = cmj.slice(1, 5);
  const baseline = prev.reduce((s, r) => s + Number(r.value), 0) / prev.length;
  const changePct = baseline > 0 ? ((Number(latest.value) - baseline) / baseline) * 100 : null;
  let level = 'ok';
  if (changePct != null && changePct <= -READINESS_RED) level = 'red';
  else if (changePct != null && changePct <= -READINESS_YELLOW) level = 'yellow';
  return { level, latest, baseline, changePct };
}
