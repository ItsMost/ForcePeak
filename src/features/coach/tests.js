/**
 * Built-in tests. `profileField` = the matching column already on agilitylap_athletes
 * (we only offer to update it, the coach confirms every time).
 */
export const BUILTIN_TESTS = [
  { key: 'back_squat',   name: 'Back Squat 1RM',    unit: 'kg', group: 'strength', profileField: 'full_squat' },
  { key: 'front_squat',  name: 'Front Squat 1RM',   unit: 'kg', group: 'strength', profileField: 'front_squat' },
  { key: 'half_squat',   name: 'Half Squat 1RM',    unit: 'kg', group: 'strength', profileField: 'half_squat' },
  { key: 'quarter_squat',name: 'Quarter Squat 1RM', unit: 'kg', group: 'strength', profileField: 'quarter_squat' },
  { key: 'bench',        name: 'Bench Press 1RM',   unit: 'kg', group: 'strength', profileField: 'bench' },
  { key: 'deadlift',     name: 'Deadlift 1RM',      unit: 'kg', group: 'strength', profileField: 'deadlift' },
  { key: 'hang_clean',   name: 'Hang Clean 1RM',    unit: 'kg', group: 'strength', profileField: 'hang_clean' },
  { key: 'power_clean',  name: 'Power Clean 1RM',   unit: 'kg', group: 'strength', profileField: 'power_clean' },
  { key: 'cmj',          name: 'CMJ',               unit: 'cm', group: 'jump', profileField: 'vertical_jump' },
  { key: 'sj',           name: 'Squat Jump',        unit: 'cm', group: 'jump', profileField: 'squat_jump' },
  { key: 'rsi',          name: 'Drop Jump RSI',     unit: '',   group: 'jump', profileField: 'rsi' },
  { key: 'approach_jump',name: 'Approach Jump',     unit: 'cm', group: 'jump' },
  { key: 'slj',          name: 'Standing Long Jump',unit: 'cm', group: 'jump', profileField: 'standing_long_jump' },
];

export function allTests(customDefs = []) {
  return [
    ...BUILTIN_TESTS,
    ...customDefs.map(d => ({ key: d.key, name: d.name, unit: d.unit || '', group: 'custom', higherIsBetter: d.higher_is_better })),
  ];
}

export const slugify = (s) => 'custom:' + String(s).toLowerCase().trim().replace(/[^a-z0-9؀-ۿ]+/g, '_').replace(/^_|_$/g, '');
