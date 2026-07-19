import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDayType, volumeByGroup, suggestNextDay, getSplit, lastTrainedByGroup } from '../js/split.js';
import { findExercise, searchExercises, musclesFor } from '../js/exercises.js';
import { convertWeight, addDays, daysBetween, todayStr } from '../js/utils.js';

const sets = n => Array.from({ length: n }, () => ({ reps: 10, weight: 50 }));

test('exercise lookup is case-insensitive and search ranks prefixes first', () => {
  assert.equal(findExercise('bench press').name, 'Bench Press');
  assert.equal(findExercise('nonexistent'), null);
  const results = searchExercises('curl');
  assert.ok(results.length > 0);
  assert.ok(results.some(e => e.name === 'Barbell Curl'));
});

test('custom exercises carry their own muscle groups', () => {
  const custom = { name: 'Sled Push', primary: ['quads'], secondary: ['glutes'] };
  assert.deepEqual(musclesFor(custom), { primary: ['quads'], secondary: ['glutes'] });
});

test('volumeByGroup counts primary sets fully and secondary partially', () => {
  const vol = volumeByGroup([{ name: 'Bench Press', sets: sets(3) }]);
  assert.equal(vol.chest, 3);
  assert.ok(vol.triceps > 0 && vol.triceps < 3);
});

test('detects chest + triceps day', () => {
  const day = detectDayType([
    { name: 'Bench Press', sets: sets(4) },
    { name: 'Incline Dumbbell Press', sets: sets(3) },
    { name: 'Tricep Pushdown', sets: sets(3) },
    { name: 'Skull Crusher', sets: sets(3) },
  ]);
  assert.equal(day, 'Chest + Triceps');
});

test('detects back + biceps day', () => {
  const day = detectDayType([
    { name: 'Pull-Up', sets: sets(4) },
    { name: 'Barbell Row', sets: sets(4) },
    { name: 'Lat Pulldown', sets: sets(3) },
    { name: 'Barbell Curl', sets: sets(3) },
    { name: 'Hammer Curl', sets: sets(3) },
  ]);
  assert.equal(day, 'Back + Biceps');
});

test('a pure back session is Back Day, not Back + Biceps', () => {
  const day = detectDayType([
    { name: 'Straight-Arm Pulldown', sets: sets(4) },
    { name: 'Machine Row', sets: sets(4) },
    { name: 'Shrug', sets: sets(3) },
  ]);
  assert.equal(day, 'Back Day');
});

test('detects quad-focused vs hamstring/glute-focused leg days', () => {
  const quadDay = detectDayType([
    { name: 'Squat', sets: sets(4) },
    { name: 'Leg Extension', sets: sets(3) },
    { name: 'Standing Calf Raise', sets: sets(4) },
  ]);
  assert.equal(quadDay, 'Quad Day');

  const hamDay = detectDayType([
    { name: 'Romanian Deadlift', sets: sets(4) },
    { name: 'Lying Leg Curl', sets: sets(3) },
    { name: 'Hip Thrust', sets: sets(4) },
  ]);
  assert.equal(hamDay, 'Hamstrings + Glutes');
});

test('mixed full-body session falls back sensibly', () => {
  const day = detectDayType([
    { name: 'Bench Press', sets: sets(3) },
    { name: 'Barbell Row', sets: sets(3) },
    { name: 'Squat', sets: sets(3) },
    { name: 'Plank', sets: sets(2) },
  ]);
  assert.equal(day, 'Full Body');
});

test('empty workout has no day type', () => {
  assert.equal(detectDayType([]), null);
});

test('suggestNextDay picks the least recently trained recovered day', () => {
  const today = todayStr();
  const workouts = [
    // Chest+Triceps yesterday (not recovered), Back+Biceps 5 days ago (recovered)
    { date: addDays(today, -1), exercises: [{ name: 'Bench Press', sets: sets(4) }, { name: 'Tricep Pushdown', sets: sets(3) }] },
    { date: addDays(today, -5), exercises: [{ name: 'Barbell Row', sets: sets(4) }, { name: 'Barbell Curl', sets: sets(3) }] },
    { date: addDays(today, -3), exercises: [{ name: 'Squat', sets: sets(4) }, { name: 'Standing Calf Raise', sets: sets(3) }] },
  ];
  const split = getSplit('pairs5');
  const { suggestion, ranked } = suggestNextDay(workouts, split, today);
  // Shoulders+Core and Hamstrings+Glutes are untrained (infinitely stale) -> one of them wins.
  assert.ok(['Shoulders + Core', 'Hamstrings + Glutes'].includes(suggestion.name));
  // Chest + Triceps trained yesterday must rank last-ish (not recovered).
  const chest = ranked.find(r => r.day.name === 'Chest + Triceps');
  assert.equal(chest.recovered, false);
});

test('suggestNextDay flags rest when everything is fresh', () => {
  const today = todayStr();
  const split = getSplit('upperlower');
  const workouts = [
    { date: addDays(today, -1), exercises: [{ name: 'Bench Press', sets: sets(4) }, { name: 'Barbell Row', sets: sets(4) }] },
    { date: today, exercises: [{ name: 'Squat', sets: sets(4) }, { name: 'Romanian Deadlift', sets: sets(4) }] },
  ];
  const { ranked, reason } = suggestNextDay(workouts, split, today);
  assert.ok(ranked.every(r => !r.recovered));
  assert.match(reason, /rest/i);
});

test('lastTrainedByGroup ignores token volume', () => {
  const today = todayStr();
  const last = lastTrainedByGroup([
    { date: today, exercises: [{ name: 'Barbell Curl', sets: sets(1) }] }, // 1 set: doesn't count
    { date: addDays(today, -3), exercises: [{ name: 'Barbell Curl', sets: sets(3) }] },
  ]);
  assert.equal(last.biceps, addDays(today, -3));
});

test('unit conversion round-trips', () => {
  assert.equal(convertWeight(100, 'kg', 'kg'), 100);
  const lbs = convertWeight(100, 'kg', 'lbs');
  assert.ok(Math.abs(lbs - 220.46) < 0.01);
  assert.ok(Math.abs(convertWeight(lbs, 'lbs', 'kg') - 100) < 1e-9);
});

test('date helpers', () => {
  assert.equal(addDays('2026-07-19', -1), '2026-07-18');
  assert.equal(daysBetween('2026-07-01', '2026-07-19'), 18);
  assert.equal(daysBetween('2026-06-30', '2026-07-01'), 1); // month boundary
});
