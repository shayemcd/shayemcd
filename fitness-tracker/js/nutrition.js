// Nutrition targets, daily totals across shared meals, and gap flagging.
// Pure functions, unit-tested in Node.

import { convertWeight } from './utils.js';

export const MACROS = ['protein_g', 'carbs_g', 'fat_g', 'fiber_g'];

export const MACRO_LABELS = {
  calories: 'Calories',
  protein_g: 'Protein',
  carbs_g: 'Carbs',
  fat_g: 'Fat',
  fiber_g: 'Fiber',
};

export const FOOD_GROUPS = ['vegetables', 'fruit', 'protein', 'grains', 'dairy'];

// Recommended daily targets from body weight and goal, with any explicit
// per-user overrides (profile.targets) taking precedence.
// Heuristics: TDEE ~33 kcal/kg (moderately active), protein 1.8 g/kg,
// fat 0.9 g/kg, carbs fill the rest, fiber 14 g / 1000 kcal.
export function computeTargets(profile, latestWeightKg = null) {
  const kg = latestWeightKg || 75;
  const goal = profile?.goal || 'maintain';
  const goalAdjust = { lose: -400, maintain: 0, gain: 300 }[goal] ?? 0;

  const calories = Math.round(33 * kg + goalAdjust);
  const protein_g = Math.round(1.8 * kg);
  const fat_g = Math.round(0.9 * kg);
  const carbs_g = Math.round(Math.max(calories - protein_g * 4 - fat_g * 9, 0) / 4);
  const fiber_g = Math.round(14 * calories / 1000);

  return { calories, protein_g, carbs_g, fat_g, fiber_g, ...(profile?.targets || {}) };
}

// Latest body weight in kg from bodyweight entries (date-desc or not).
export function latestWeightKg(weights, uid) {
  const mine = (weights || []).filter(w => w.uid === uid).sort((a, b) => b.date.localeCompare(a.date));
  if (!mine.length) return null;
  return convertWeight(mine[0].weight, mine[0].unit || 'kg', 'kg');
}

// The fraction of a meal belonging to `uid` (0 when not shared with them).
export function myFraction(meal, uid) {
  const share = (meal.shares || []).find(s => s.uid === uid);
  return share ? Number(share.fraction) || 0 : 0;
}

// Totals consumed by `uid` on `date`, honouring per-person fractions.
export function dayTotals(meals, uid, date) {
  const totals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 };
  const foodGroups = new Set();
  let count = 0;
  for (const m of meals || []) {
    if (m.date !== date) continue;
    const f = myFraction(m, uid);
    if (!f) continue;
    count++;
    totals.calories += (Number(m.calories) || 0) * f;
    for (const k of MACROS) totals[k] += (Number(m[k]) || 0) * f;
    for (const g of m.food_groups || []) foodGroups.add(g);
  }
  for (const k of Object.keys(totals)) totals[k] = Math.round(totals[k]);
  return { ...totals, foodGroups: [...foodGroups], mealCount: count };
}

// How much of the day's eating is expected to be done by this hour.
function expectedPace(hour) {
  if (hour < 10) return 0.2;
  if (hour < 14) return 0.4;
  if (hour < 17) return 0.6;
  if (hour < 20) return 0.85;
  return 1;
}

// Actionable diet gaps for the rest of the day.
export function flagGaps(totals, targets, hour = 20) {
  const flags = [];
  const pace = expectedPace(hour);

  const proteinExpected = targets.protein_g * pace;
  if (totals.protein_g < proteinExpected - 15) {
    flags.push(`Protein is behind pace — about ${Math.round(targets.protein_g - totals.protein_g)} g still to go today. Prioritise it in your next meal.`);
  }
  const fiberExpected = targets.fiber_g * pace;
  if (totals.fiber_g < fiberExpected - 8) {
    flags.push(`Low on fiber (${totals.fiber_g} g of ${targets.fiber_g} g) — add veg, fruit, beans or whole grains.`);
  }
  if (hour >= 14 && totals.mealCount > 0 && !totals.foodGroups.includes('vegetables')) {
    flags.push('No vegetables logged yet today — work some into your next meal.');
  }
  if (totals.calories > targets.calories) {
    flags.push(`Over your calorie target (${totals.calories} / ${targets.calories} kcal) — go light from here.`);
  } else if (hour >= 18 && totals.calories < targets.calories * 0.5 && totals.mealCount > 0) {
    flags.push(`Well under target (${totals.calories} / ${targets.calories} kcal) — make sure you eat enough to recover.`);
  }
  return flags;
}
