// Personal records and per-exercise progression. Pure functions.
// All comparisons happen in kg (workouts store their own unit).

import { convertWeight } from './utils.js';

export function epley1RM(weightKg, reps) {
  if (!weightKg || !reps) return 0;
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30);
}

function setsInKg(workout) {
  const unit = workout.unit || 'kg';
  const out = [];
  for (const ex of workout.exercises || []) {
    if (ex.cardio) continue;
    for (const s of ex.sets || []) {
      const weight = Number(s.weight);
      const reps = Number(s.reps);
      if (!weight || !reps) continue;
      out.push({ name: ex.name, weightKg: convertWeight(weight, unit, 'kg'), reps });
    }
  }
  return out;
}

// Best (highest est. 1RM) set per exercise across a workout history.
export function bestByExercise(workouts) {
  const best = {};
  for (const w of workouts || []) {
    for (const s of setsInKg(w)) {
      const oneRM = epley1RM(s.weightKg, s.reps);
      const cur = best[s.name.toLowerCase()];
      if (!cur || oneRM > cur.oneRM) {
        best[s.name.toLowerCase()] = { name: s.name, weightKg: s.weightKg, reps: s.reps, oneRM, date: w.date };
      }
    }
  }
  return best;
}

// New PRs in `workout` relative to `history` (history should NOT include it).
export function detectPRs(workout, history) {
  const prior = bestByExercise(history);
  const prs = [];
  const seen = new Set();
  for (const s of setsInKg(workout)) {
    const key = s.name.toLowerCase();
    if (seen.has(key)) continue;
    const oneRM = epley1RM(s.weightKg, s.reps);
    const old = prior[key];
    if (old && oneRM > old.oneRM + 0.01) {
      seen.add(key);
      prs.push({ name: s.name, weightKg: s.weightKg, reps: s.reps });
    }
  }
  return prs;
}

// "Last time" summary for an exercise before a given date, in the viewer's unit.
export function lastPerformance(name, workouts, beforeDate, unit = 'kg') {
  const key = String(name).toLowerCase();
  const sorted = [...(workouts || [])].sort((a, b) => b.date.localeCompare(a.date));
  for (const w of sorted) {
    if (beforeDate && w.date >= beforeDate) continue;
    for (const ex of w.exercises || []) {
      if (ex.cardio || ex.name.toLowerCase() !== key) continue;
      const sets = (ex.sets || []).filter(s => Number(s.reps) || Number(s.weight));
      if (!sets.length) continue;
      const top = sets.reduce((a, b) => (Number(b.weight) > Number(a.weight) ? b : a));
      const topW = Number(top.weight)
        ? Math.round(convertWeight(top.weight, w.unit || 'kg', unit) * 10) / 10
        : null;
      const repsList = sets.map(s => Number(s.reps) || '?');
      const uniform = repsList.every(r => r === repsList[0]);
      const repsStr = uniform ? `${sets.length}×${repsList[0]}` : repsList.join('/');
      return { date: w.date, summary: topW != null ? `${repsStr} @ ${topW} ${unit}` : repsStr };
    }
  }
  return null;
}

// Top-set weight over time for charts, in the viewer's unit.
export function exerciseTrend(name, workouts, unit = 'kg') {
  const key = String(name).toLowerCase();
  const points = [];
  for (const w of workouts || []) {
    for (const ex of w.exercises || []) {
      if (ex.cardio || ex.name.toLowerCase() !== key) continue;
      const weights = (ex.sets || []).map(s => Number(s.weight)).filter(Boolean);
      if (!weights.length) continue;
      const top = Math.max(...weights);
      points.push({ date: w.date, weight: Math.round(convertWeight(top, w.unit || 'kg', unit) * 10) / 10 });
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}
