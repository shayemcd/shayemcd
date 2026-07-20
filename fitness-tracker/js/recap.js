// Weekly recap: the last 7 days summarised. Pure function.

import { volumeByGroup } from './split.js';
import { dayTotals, latestWeightKg } from './nutrition.js';
import { convertWeight, addDays } from './utils.js';

const PLANNED_PER_WEEK = { pairs5: 5, ppl: 6, upperlower: 4 };

export function weeklyRecap({ workouts, meals, weights, watch, uid, unit = 'kg', targets, splitId, today }) {
  const from = addDays(today, -6);
  const inWindow = d => d >= from && d <= today;

  // Workouts
  const myWorkouts = (workouts || []).filter(w => w.uid === uid && inWindow(w.date) && w.exercises?.length);
  const setsByGroup = {};
  for (const w of myWorkouts) {
    for (const [g, v] of Object.entries(volumeByGroup(w.exercises))) {
      setsByGroup[g] = (setsByGroup[g] || 0) + v;
    }
  }
  for (const g of Object.keys(setsByGroup)) setsByGroup[g] = Math.round(setsByGroup[g]);

  // Nutrition: average over days that have logged meals
  let kcalDays = 0, kcalSum = 0, proteinSum = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i);
    const t = dayTotals(meals, uid, d);
    if (t.mealCount > 0) {
      kcalDays++;
      kcalSum += t.calories;
      proteinSum += t.protein_g;
    }
  }
  const kcalInAvg = kcalDays ? Math.round(kcalSum / kcalDays) : null;
  const proteinAvg = kcalDays ? Math.round(proteinSum / kcalDays) : null;
  const proteinAdherence = proteinAvg != null && targets?.protein_g
    ? Math.round((proteinAvg / targets.protein_g) * 100)
    : null;

  // Watch: averages over days with data
  const myWatch = (watch || []).filter(w => w.uid === uid && inWindow(w.date));
  const avg = arr => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
  const sleepAvgMin = avg(myWatch.map(w => Number(w.sleepMinutes)).filter(Boolean));
  const kcalOutAvg = avg(myWatch.map(w => Number(w.caloriesOut)).filter(Boolean));

  // Weight change across the window (viewer's unit)
  const myWeights = (weights || [])
    .filter(w => w.uid === uid && inWindow(w.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  let weightDelta = null;
  if (myWeights.length >= 2) {
    const first = convertWeight(myWeights[0].weight, myWeights[0].unit || 'kg', unit);
    const last = convertWeight(myWeights[myWeights.length - 1].weight, myWeights[myWeights.length - 1].unit || 'kg', unit);
    weightDelta = Math.round((last - first) * 10) / 10;
  }

  return {
    from,
    to: today,
    workoutsDone: myWorkouts.length,
    workoutsPlanned: PLANNED_PER_WEEK[splitId] ?? 5,
    setsByGroup,
    kcalInAvg,
    proteinAvg,
    proteinAdherence,
    sleepAvgMin,
    kcalOutAvg,
    weightDelta,
  };
}

// Convenience: latest bodyweight in kg for energy estimates.
export { latestWeightKg };
