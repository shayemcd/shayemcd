// Smart split logic: day-type detection from logged exercises, best-practice
// split templates, and "what should I train today" suggestions.
// Pure functions — no DOM, no Firebase — so this file is unit-testable in Node.

import { musclesFor, GROUPS } from './exercises.js';
import { daysBetween } from './utils.js';

const SECONDARY_WEIGHT = 0.4;

// Per-muscle-group training volume for one workout's exercises.
// Primary muscles get 1 point per set, secondary muscles SECONDARY_WEIGHT.
export function volumeByGroup(exercises) {
  const vol = {};
  for (const ex of exercises || []) {
    const sets = Math.max(ex.sets?.length || 0, 1);
    const { primary, secondary } = musclesFor(ex);
    for (const g of primary) vol[g] = (vol[g] || 0) + sets;
    for (const g of secondary) vol[g] = (vol[g] || 0) + sets * SECONDARY_WEIGHT;
  }
  return vol;
}

// Day archetypes, most specific first. A workout is labeled with the most
// specific archetype whose muscle groups cover >= 70% of its training volume.
const COVERAGE_THRESHOLD = 0.7;

export const ARCHETYPES = [
  { name: 'Chest Day', groups: ['chest'] },
  { name: 'Back Day', groups: ['back'] },
  { name: 'Shoulder Day', groups: ['shoulders'] },
  { name: 'Glute Day', groups: ['glutes'] },
  { name: 'Core Day', groups: ['core'] },
  { name: 'Arm Day', groups: ['biceps', 'triceps', 'forearms'] },
  { name: 'Chest + Triceps', groups: ['chest', 'triceps'] },
  { name: 'Back + Biceps', groups: ['back', 'biceps'] },
  { name: 'Quad Day', groups: ['quads', 'glutes', 'calves'] },
  { name: 'Hamstrings + Glutes', groups: ['hamstrings', 'glutes', 'calves'] },
  { name: 'Shoulders + Arms', groups: ['shoulders', 'biceps', 'triceps', 'forearms'] },
  { name: 'Push Day', groups: ['chest', 'shoulders', 'triceps'] },
  { name: 'Pull Day', groups: ['back', 'biceps', 'forearms'] },
  { name: 'Leg Day', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { name: 'Upper Body', groups: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'] },
  { name: 'Lower Body', groups: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
];

// Classify a workout's exercises into a day type, e.g. "Back + Biceps".
// Returns null when there is nothing to classify.
export function detectDayType(exercises) {
  const vol = volumeByGroup(exercises);
  const total = Object.values(vol).reduce((a, b) => a + b, 0);
  if (!total) return null;

  let best = null;
  for (const arch of ARCHETYPES) {
    const covered = arch.groups.reduce((a, g) => a + (vol[g] || 0), 0);
    const coverage = covered / total;
    if (coverage < COVERAGE_THRESHOLD) continue;
    // Prefer fewer groups (more specific); tie-break on higher coverage.
    if (
      !best ||
      arch.groups.length < best.groups.length ||
      (arch.groups.length === best.groups.length && coverage > best.coverage)
    ) {
      best = { ...arch, coverage };
    }
  }
  return best ? best.name : 'Full Body';
}

// Best-practice split templates. Each day pairs muscle groups the standard
// way: agonist pairings (chest+triceps, back+biceps), quad- vs hip-dominant
// leg days, plus push/pull/legs and upper/lower variants.
export const SPLITS = [
  {
    id: 'pairs5',
    name: '5-Day Muscle Pairings',
    blurb: 'The classic bodybuilding pairing split: each session hits two muscle groups that work together, so every group gets a full week to recover.',
    days: [
      { name: 'Chest + Triceps', groups: ['chest', 'triceps'] },
      { name: 'Back + Biceps', groups: ['back', 'biceps'] },
      { name: 'Quads + Calves', groups: ['quads', 'calves'] },
      { name: 'Shoulders + Core', groups: ['shoulders', 'core'] },
      { name: 'Hamstrings + Glutes', groups: ['hamstrings', 'glutes'] },
    ],
  },
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    blurb: 'Three-day rotation grouping muscles by movement pattern. Run it 3x/week for balance or 6x/week for volume.',
    days: [
      { name: 'Push', groups: ['chest', 'shoulders', 'triceps'] },
      { name: 'Pull', groups: ['back', 'biceps', 'forearms'] },
      { name: 'Legs', groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
  },
  {
    id: 'upperlower',
    name: 'Upper / Lower',
    blurb: 'Simple 4-day split alternating upper and lower body. Great frequency: every muscle trained twice a week.',
    days: [
      { name: 'Upper', groups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
      { name: 'Lower', groups: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
    ],
  },
];

export function getSplit(id) {
  return SPLITS.find(s => s.id === id) || SPLITS[0];
}

const RECOVERY_DAYS = 2; // ~48h before hitting the same muscle group again
const TRAINED_MIN_SETS = 2; // fewer than this doesn't count as "trained"

// Date each muscle group was last meaningfully trained, from a list of
// workouts [{date, exercises}].
export function lastTrainedByGroup(workouts) {
  const last = {};
  for (const w of workouts || []) {
    const vol = volumeByGroup(w.exercises);
    for (const [g, v] of Object.entries(vol)) {
      if (v < TRAINED_MIN_SETS) continue;
      if (!last[g] || w.date > last[g]) last[g] = w.date;
    }
  }
  return last;
}

// Suggest which day of the split to train today.
// A day is "recovered" when none of its muscle groups were trained in the
// last RECOVERY_DAYS days. Among recovered days, pick the one whose most
// recently trained muscle group is longest ago (never-trained counts as
// infinitely stale). Returns {day, reason, recovered, daysSince} ranked list.
export function suggestNextDay(workouts, split, today) {
  const last = lastTrainedByGroup(workouts);

  const ranked = split.days.map(day => {
    let minDaysSince = Infinity; // freshest muscle in this day
    for (const g of day.groups) {
      const d = last[g] ? daysBetween(last[g], today) : Infinity;
      if (d < minDaysSince) minDaysSince = d;
    }
    return { day, daysSince: minDaysSince, recovered: minDaysSince >= RECOVERY_DAYS };
  });

  ranked.sort((a, b) => {
    if (a.recovered !== b.recovered) return a.recovered ? -1 : 1;
    return b.daysSince - a.daysSince;
  });

  const top = ranked[0];
  let reason;
  if (!top.recovered) {
    reason = 'Everything was trained in the last 2 days — a rest day is the smart move. If you train anyway, this is the least recently worked option.';
  } else if (top.daysSince === Infinity) {
    reason = `You haven't logged ${top.day.name} yet with this split — start here.`;
  } else {
    reason = `${top.day.name} muscles were last trained ${top.daysSince} day${top.daysSince === 1 ? '' : 's'} ago — the most recovered option.`;
  }
  return { suggestion: top.day, reason, ranked };
}

export function groupLabel(g) {
  return GROUPS[g] || g;
}
