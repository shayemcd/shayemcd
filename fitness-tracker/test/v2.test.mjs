import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateWeekPlan, pickMainExercises, planDayToExercises } from '../js/plan-gen.js';
import { exerciseKcal, workoutKcal } from '../js/energy.js';
import { computeTargets, dayTotals, flagGaps, myFraction, latestWeightKg } from '../js/nutrition.js';
import { epley1RM, bestByExercise, detectPRs, lastPerformance, exerciseTrend } from '../js/progress.js';
import { weeklyRecap } from '../js/recap.js';
import { getSplit } from '../js/split.js';
import { findCardio, searchExercises } from '../js/exercises.js';
import { todayStr, addDays } from '../js/utils.js';

const sets = (n, reps = 10, weight = 50) => Array.from({ length: n }, () => ({ reps, weight }));
const T = todayStr();

// ---------- plan-gen ----------

test('generateWeekPlan: 7 days with the right structure', () => {
  const plan = generateWeekPlan([], getSplit('pairs5'), T);
  assert.equal(plan.length, 7);
  const train = plan.filter(d => d.kind === 'train');
  const rest = plan.filter(d => d.kind === 'rest');
  assert.equal(train.length, 5);
  assert.equal(rest.length, 2);
  for (const d of train) {
    assert.ok(d.cardio.minutes >= 5 && d.cardio.minutes <= 10, 'cardio 5-10 min');
    assert.ok(findCardio(d.cardio.name), 'cardio is a known activity');
    assert.equal(d.abs.length, 2);
    assert.equal(d.main.length, 4);
    assert.equal(d.warmdown.name, 'Stretching / Cool-down');
  }
  // No training day repeated before the rotation cycles through the split
  assert.equal(new Set(train.map(d => d.dayName)).size, 5);
});

test('generateWeekPlan starts from the most recovered day', () => {
  // Chest+Triceps trained yesterday -> the week should not start with it
  const history = [
    { date: addDays(T, -1), exercises: [{ name: 'Bench Press', sets: sets(4) }, { name: 'Tricep Pushdown', sets: sets(3) }] },
  ];
  const plan = generateWeekPlan(history, getSplit('pairs5'), T);
  const firstTrain = plan.find(d => d.kind === 'train');
  assert.notEqual(firstTrain.dayName, 'Chest + Triceps');
});

test('pickMainExercises spreads picks across groups, skipping core', () => {
  const picks = pickMainExercises(['chest', 'triceps', 'core']);
  assert.equal(picks.length, 4);
  assert.ok(picks.some(p => p.group === 'chest'));
  assert.ok(picks.some(p => p.group === 'triceps'));
  assert.ok(!picks.some(p => p.group === 'core'));
  assert.equal(new Set(picks.map(p => p.name)).size, 4, 'no duplicates');
});

test('planDayToExercises builds cardio + abs + main + warmdown with prefilled weights', () => {
  const plan = generateWeekPlan([], getSplit('pairs5'), T);
  const day = plan.find(d => d.kind === 'train');
  const exs = planDayToExercises(day, name => (name === day.main[0].name ? 60 : null));
  assert.equal(exs.length, 1 + 2 + 4 + 1);
  assert.ok(exs[0].cardio && exs[0].minutes === 8);
  assert.ok(exs.at(-1).cardio);
  const first = exs.find(e => e.name === day.main[0].name);
  assert.equal(first.sets[0].weight, 60);
  assert.equal(first.sets.length, 3);
});

test('cardio activities appear in exercise search', () => {
  assert.ok(searchExercises('rowing').some(e => e.cardio));
});

// ---------- energy ----------

test('exerciseKcal: strength scales with sets, cardio with minutes and MET', () => {
  const strength = exerciseKcal({ name: 'Bench Press', sets: sets(4) }, 80);
  assert.ok(strength > 20 && strength < 80, `strength kcal plausible (${strength})`);
  const run = exerciseKcal({ name: 'Treadmill Run', cardio: true, minutes: 30 }, 80);
  assert.ok(run > 250 && run < 450, `30min run plausible (${run})`);
  const stretch = exerciseKcal({ name: 'Stretching / Cool-down', cardio: true, minutes: 30 }, 80);
  assert.ok(stretch < run, 'stretching burns less than running');
});

test('workoutKcal sums exercises', () => {
  const exs = [
    { name: 'Bench Press', sets: sets(3) },
    { name: 'Stationary Bike', cardio: true, minutes: 10 },
  ];
  assert.equal(workoutKcal(exs, 80), exerciseKcal(exs[0], 80) + exerciseKcal(exs[1], 80));
});

// ---------- nutrition ----------

test('computeTargets scales with weight and goal, honours overrides', () => {
  const maintain = computeTargets({ goal: 'maintain' }, 80);
  const lose = computeTargets({ goal: 'lose' }, 80);
  assert.equal(maintain.calories - lose.calories, 400);
  assert.equal(maintain.protein_g, Math.round(1.8 * 80));
  const overridden = computeTargets({ goal: 'maintain', targets: { protein_g: 200 } }, 80);
  assert.equal(overridden.protein_g, 200);
  assert.equal(overridden.calories, maintain.calories);
});

test('dayTotals respects per-person fractions of shared meals', () => {
  const meals = [
    {
      date: T, calories: 2000, protein_g: 120, carbs_g: 200, fat_g: 60, fiber_g: 20,
      food_groups: ['protein', 'grains'],
      shares: [{ uid: 'me', fraction: 0.25 }, { uid: 'them', fraction: 0.5 }],
    },
    { date: T, calories: 400, protein_g: 30, shares: [{ uid: 'me', fraction: 1 }], food_groups: ['vegetables'] },
    { date: addDays(T, -1), calories: 999, shares: [{ uid: 'me', fraction: 1 }] },
  ];
  const mine = dayTotals(meals, 'me', T);
  assert.equal(mine.calories, 2000 * 0.25 + 400);
  assert.equal(mine.protein_g, 60);
  assert.deepEqual([...mine.foodGroups].sort(), ['grains', 'protein', 'vegetables']);
  const theirs = dayTotals(meals, 'them', T);
  assert.equal(theirs.calories, 1000);
  assert.equal(myFraction(meals[0], 'them'), 0.5);
});

test('flagGaps flags protein shortfall, missing veg, and overshoot', () => {
  const targets = { calories: 2600, protein_g: 150, carbs_g: 300, fat_g: 70, fiber_g: 36 };
  const behind = flagGaps(
    { calories: 900, protein_g: 20, carbs_g: 120, fat_g: 30, fiber_g: 5, foodGroups: ['grains'], mealCount: 2 },
    targets, 16,
  );
  assert.ok(behind.some(f => /protein/i.test(f)), 'protein flag');
  assert.ok(behind.some(f => /vegetable/i.test(f)), 'veg flag');
  const over = flagGaps(
    { calories: 3000, protein_g: 160, carbs_g: 300, fat_g: 80, fiber_g: 40, foodGroups: ['vegetables'], mealCount: 4 },
    targets, 20,
  );
  assert.ok(over.some(f => /over your calorie/i.test(f)), 'over flag');
  const fine = flagGaps(
    { calories: 1300, protein_g: 80, carbs_g: 150, fat_g: 35, fiber_g: 20, foodGroups: ['vegetables', 'protein'], mealCount: 2 },
    targets, 14,
  );
  assert.equal(fine.length, 0, `no flags when on track (got: ${fine.join(' | ')})`);
});

test('latestWeightKg converts units and picks newest', () => {
  const w = latestWeightKg([
    { uid: 'me', date: addDays(T, -2), weight: 80, unit: 'kg' },
    { uid: 'me', date: T, weight: 176.4, unit: 'lbs' },
  ], 'me');
  assert.ok(Math.abs(w - 80.01) < 0.1);
});

// ---------- progress ----------

test('PR detection across units', () => {
  const history = [
    { date: addDays(T, -10), unit: 'kg', exercises: [{ name: 'Bench Press', sets: [{ reps: 8, weight: 80 }] }] },
  ];
  assert.ok(epley1RM(80, 8) > 80);
  // 190 lbs x 8 (~86kg) beats 80kg x 8
  const prs = detectPRs(
    { date: T, unit: 'lbs', exercises: [{ name: 'Bench Press', sets: [{ reps: 8, weight: 190 }] }] },
    history,
  );
  assert.equal(prs.length, 1);
  // Same weight is not a PR
  const none = detectPRs(
    { date: T, unit: 'kg', exercises: [{ name: 'Bench Press', sets: [{ reps: 8, weight: 80 }] }] },
    history,
  );
  assert.equal(none.length, 0);
  const best = bestByExercise(history);
  assert.equal(best['bench press'].weightKg, 80);
});

test('lastPerformance summarises the previous session in viewer unit', () => {
  const workouts = [
    { date: addDays(T, -3), unit: 'kg', exercises: [{ name: 'Squat', sets: sets(3, 8, 100) }] },
    { date: T, unit: 'kg', exercises: [{ name: 'Squat', sets: sets(3, 8, 105) }] },
  ];
  const last = lastPerformance('Squat', workouts, T, 'kg');
  assert.equal(last.summary, '3×8 @ 100 kg');
  const trend = exerciseTrend('Squat', workouts, 'kg');
  assert.deepEqual(trend.map(p => p.weight), [100, 105]);
});

// ---------- recap ----------

test('weeklyRecap aggregates the last 7 days', () => {
  const uid = 'me';
  const recap = weeklyRecap({
    workouts: [
      { uid, date: T, exercises: [{ name: 'Bench Press', sets: sets(4) }] },
      { uid, date: addDays(T, -2), exercises: [{ name: 'Squat', sets: sets(4) }] },
      { uid, date: addDays(T, -10), exercises: [{ name: 'Deadlift', sets: sets(4) }] }, // outside window
      { uid: 'them', date: T, exercises: [{ name: 'Squat', sets: sets(4) }] },          // partner
    ],
    meals: [
      { date: T, calories: 2000, protein_g: 150, shares: [{ uid, fraction: 1 }] },
      { date: addDays(T, -1), calories: 1800, protein_g: 130, shares: [{ uid, fraction: 1 }] },
    ],
    weights: [
      { uid, date: addDays(T, -6), weight: 84, unit: 'kg' },
      { uid, date: T, weight: 83, unit: 'kg' },
    ],
    watch: [
      { uid, date: T, sleepMinutes: 420, caloriesOut: 2800 },
      { uid, date: addDays(T, -1), sleepMinutes: 480, caloriesOut: 3000 },
    ],
    uid, unit: 'kg',
    targets: { protein_g: 150 },
    splitId: 'pairs5',
    today: T,
  });
  assert.equal(recap.workoutsDone, 2);
  assert.equal(recap.workoutsPlanned, 5);
  assert.ok(recap.setsByGroup.chest >= 4);
  assert.equal(recap.kcalInAvg, 1900);
  assert.equal(recap.proteinAdherence, Math.round((140 / 150) * 100));
  assert.equal(recap.sleepAvgMin, 450);
  assert.equal(recap.kcalOutAvg, 2900);
  assert.equal(recap.weightDelta, -1);
});
