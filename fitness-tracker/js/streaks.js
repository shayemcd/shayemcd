// Consecutive-day streak calculations, the way most habit trackers do it:
// a streak counts backward through calendar days that have at least one
// qualifying entry. Today doesn't have to be logged yet for the streak to
// still be "alive" (you have until the day ends) — but any other missed
// day breaks it. Pure functions, unit-tested in Node.

import { addDays } from './utils.js';

export function computeStreak(dateStrings, today) {
  const days = new Set(dateStrings);

  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Best streak ever, from the full history of unique days.
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }

  return { current, best: Math.max(best, current) };
}

export function workoutStreak(workouts, uid, today) {
  const dates = (workouts || [])
    .filter(w => w.uid === uid && w.exercises?.length)
    .map(w => w.date);
  return computeStreak(dates, today);
}

export function weightStreak(weights, uid, today) {
  const dates = (weights || []).filter(w => w.uid === uid).map(w => w.date);
  return computeStreak(dates, today);
}
