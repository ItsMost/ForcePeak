/**
 * PEAK FORCE — data color coding, defined ONCE.
 *
 * These are the only places where many hues are allowed (exercise categories, superset groups,
 * periodization phases), because the color itself carries meaning. All other UI (buttons,
 * badges, alerts) uses the 5 tokens only: pf-accent (orange), pf-success, pf-warning,
 * pf-danger, pf-info — see tailwind.config.js.
 *
 * Class strings must stay literal (no string building) so Tailwind can find them.
 */

// Exercise categories (timeline cards). `icon` is a name resolved in TimelineCard.
export const CATEGORY_STYLES = {
  max_strength_lower: { label: 'MAX STRENGTH (LOWER)', color: 'text-blue-600 border-blue-500', bg: 'border-blue-100 bg-blue-50/50 dark:bg-blue-950/20', icon: 'dumbbell' },
  max_strength_upper: { label: 'MAX STRENGTH (UPPER)', color: 'text-indigo-600 border-indigo-500', bg: 'border-indigo-100 bg-indigo-50/50 dark:bg-indigo-950/20', icon: 'dumbbell' },
  rofd_ballistics: { label: 'RFD & BALLISTICS', color: 'text-orange-500 border-orange-500', bg: 'border-orange-100 bg-orange-50/50 dark:bg-orange-950/20', icon: 'zap' },
  elasticity_plyo: { label: 'ELASTIC PLYOS', color: 'text-violet-500 border-violet-500', bg: 'border-violet-100 bg-violet-50/50 dark:bg-violet-950/20', icon: 'zap' },
  isometric_tendon: { label: 'ISOMETRICS & TENDON', color: 'text-amber-500 border-amber-500', bg: 'border-amber-100 bg-amber-50/50 dark:bg-amber-950/20', icon: 'target' },
  sprint_speed: { label: 'SPRINT & SPEED', color: 'text-emerald-500 border-emerald-500', bg: 'border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/20', icon: 'zap' },
  trunk_rotation: { label: 'TRUNK & ROTATION', color: 'text-purple-500 border-purple-500', bg: 'border-purple-100 bg-purple-50/50 dark:bg-purple-950/20', icon: 'shield' },
  prehab_mobility: { label: 'PREHAB & MOBILITY', color: 'text-rose-500 border-rose-500', bg: 'border-rose-100 bg-rose-50/50 dark:bg-rose-950/20', icon: 'activity' },
  // Legacy aliases (older exercises)
  mobility: { label: 'MOBILITY', color: 'text-rose-500 border-rose-500', bg: 'border-rose-100 bg-rose-50/50 dark:bg-rose-950/20', icon: 'activity' },
  core: { label: 'CORE', color: 'text-purple-500 border-purple-500', bg: 'border-purple-100 bg-purple-50/50 dark:bg-purple-950/20', icon: 'shield' },
  isometric: { label: 'ISOMETRIC', color: 'text-amber-500 border-amber-500', bg: 'border-amber-100 bg-amber-50/50 dark:bg-amber-950/20', icon: 'target' },
  power: { label: 'POWER', color: 'text-orange-500 border-orange-500', bg: 'border-orange-100 bg-orange-50/50 dark:bg-orange-950/20', icon: 'zap' },
  plyometric: { label: 'PLYOMETRIC', color: 'text-indigo-500 border-indigo-500', bg: 'border-indigo-100 bg-indigo-50/50 dark:bg-indigo-950/20', icon: 'zap' },
  strength: { label: 'STRENGTH', color: 'text-blue-500 border-blue-500', bg: 'border-blue-100 bg-blue-50/50 dark:bg-blue-950/20', icon: 'dumbbell' },
  speed: { label: 'SPEED', color: 'text-emerald-500 border-emerald-500', bg: 'border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/20', icon: 'zap' },
  endurance: { label: 'ENDURANCE', color: 'text-teal-500 border-teal-500', bg: 'border-teal-100 bg-teal-50/50 dark:bg-teal-950/20', icon: 'activity' },
  physical: { label: 'PHYSICAL', color: 'text-slate-500 border-slate-500', bg: 'border-slate-100 bg-slate-50/50 dark:bg-slate-950/20', icon: 'dumbbell' },
};

// Small colored dots (weekly stats legend).
export const EXERCISE_TYPE_DOTS = {
  max_strength_lower: { color: 'bg-blue-600', label: 'Strength Lower' },
  max_strength_upper: { color: 'bg-indigo-600', label: 'Strength Upper' },
  rofd_ballistics: { color: 'bg-orange-500', label: 'RFD & Power' },
  elasticity_plyo: { color: 'bg-violet-500', label: 'Elastic Plyo' },
  isometric_tendon: { color: 'bg-amber-500', label: 'Isometrics' },
  sprint_speed: { color: 'bg-emerald-500', label: 'Sprint & Speed' },
  trunk_rotation: { color: 'bg-purple-500', label: 'Trunk & Core' },
  prehab_mobility: { color: 'bg-rose-500', label: 'Prehab & Mobility' },
  // Legacy aliases
  power: { color: 'bg-orange-500', label: 'Power' },
  plyometric: { color: 'bg-indigo-500', label: 'Plyometric' },
  strength: { color: 'bg-blue-500', label: 'Strength' },
  core: { color: 'bg-emerald-500', label: 'Core' },
  speed: { color: 'bg-yellow-500', label: 'Speed' },
  mobility: { color: 'bg-purple-400', label: 'Mobility' },
  isometric: { color: 'bg-cyan-500', label: 'Isometric' },
  endurance: { color: 'bg-pink-500', label: 'Endurance' },
  physical: { color: 'bg-slate-400', label: 'Physical' },
};

// Superset groups A–D on the timeline.
export const SUPERSET_STYLES = {
  A: { border: 'border-orange-200 dark:border-orange-500/20', bg: 'bg-orange-500/[0.04] dark:bg-orange-500/[0.03]', badge: 'bg-orange-500 text-white', text: 'text-orange-600 dark:text-orange-400', line: 'bg-orange-500' },
  B: { border: 'border-purple-200 dark:border-purple-500/20', bg: 'bg-purple-500/[0.04] dark:bg-purple-500/[0.03]', badge: 'bg-purple-500 text-white', text: 'text-purple-600 dark:text-purple-400', line: 'bg-purple-500' },
  C: { border: 'border-teal-200 dark:border-teal-500/20', bg: 'bg-teal-500/[0.04] dark:bg-teal-500/[0.03]', badge: 'bg-teal-500 text-white', text: 'text-teal-600 dark:text-teal-400', line: 'bg-teal-500' },
  D: { border: 'border-pink-200 dark:border-pink-500/20', bg: 'bg-pink-500/[0.04] dark:bg-pink-500/[0.03]', badge: 'bg-pink-500 text-white', text: 'text-pink-600 dark:text-pink-400', line: 'bg-pink-500' },
};

// Periodization phases (macro/meso blocks).
export const PHASE_COLORS = [
  { bg: 'bg-blue-500/15', border: 'border-blue-400', text: 'text-blue-600 dark:text-blue-400', hex: '#3b82f6', label: 'blue' },
  { bg: 'bg-violet-500/15', border: 'border-violet-400', text: 'text-violet-600 dark:text-violet-400', hex: '#8b5cf6', label: 'violet' },
  { bg: 'bg-emerald-500/15', border: 'border-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', hex: '#10b981', label: 'emerald' },
  { bg: 'bg-amber-500/15', border: 'border-amber-400', text: 'text-amber-600 dark:text-amber-400', hex: '#f59e0b', label: 'amber' },
  { bg: 'bg-rose-500/15', border: 'border-rose-400', text: 'text-rose-600 dark:text-rose-400', hex: '#f43f5e', label: 'rose' },
  { bg: 'bg-cyan-500/15', border: 'border-cyan-400', text: 'text-cyan-600 dark:text-cyan-400', hex: '#06b6d4', label: 'cyan' },
];
