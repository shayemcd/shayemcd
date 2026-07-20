// Calorie-burn estimates using MET values (kcal = MET x kg x hours).
// Estimates, not gospel — good enough to compare days and feed the recap.

import { findCardio } from './exercises.js';

const STRENGTH_MET = 5.0;         // vigorous free-weight/machine training
const MINUTES_PER_SET = 1.5;      // ~40s of work + rest, averaged
const DEFAULT_BODYWEIGHT_KG = 75;

export function exerciseKcal(exercise, bodyweightKg = DEFAULT_BODYWEIGHT_KG) {
  const kg = bodyweightKg > 0 ? bodyweightKg : DEFAULT_BODYWEIGHT_KG;
  if (exercise.cardio) {
    const minutes = Number(exercise.minutes) || 0;
    const met = findCardio(exercise.name)?.met ?? 6;
    return Math.round(met * kg * (minutes / 60));
  }
  const sets = exercise.sets?.length || 0;
  return Math.round(STRENGTH_MET * kg * (sets * MINUTES_PER_SET / 60));
}

export function workoutKcal(exercises, bodyweightKg = DEFAULT_BODYWEIGHT_KG) {
  return (exercises || []).reduce((sum, ex) => sum + exerciseKcal(ex, bodyweightKg), 0);
}
