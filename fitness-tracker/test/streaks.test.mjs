import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak, workoutStreak, weightStreak } from '../js/streaks.js';
import { todayStr, addDays } from '../js/utils.js';

const T = todayStr();

test('computeStreak: consecutive days ending today', () => {
  const days = [T, addDays(T, -1), addDays(T, -2)];
  assert.deepEqual(computeStreak(days, T), { current: 3, best: 3 });
});

test('computeStreak: today not logged yet keeps yesterday\'s streak alive', () => {
  const days = [addDays(T, -1), addDays(T, -2), addDays(T, -3)];
  const r = computeStreak(days, T);
  assert.equal(r.current, 3, 'streak survives an unfinished today');
});

test('computeStreak: a gap breaks the streak', () => {
  const days = [T, addDays(T, -1), addDays(T, -3), addDays(T, -4)];
  const r = computeStreak(days, T);
  assert.equal(r.current, 2, 'only the run touching today counts as current');
  assert.equal(r.best, 2);
});

test('computeStreak: best streak can exceed current', () => {
  const days = [
    addDays(T, -10), addDays(T, -9), addDays(T, -8), addDays(T, -7), addDays(T, -6), // 5-day run, long over
    T, // isolated day
  ];
  const r = computeStreak(days, T);
  assert.equal(r.current, 1);
  assert.equal(r.best, 5);
});

test('computeStreak: empty history', () => {
  assert.deepEqual(computeStreak([], T), { current: 0, best: 0 });
});

test('computeStreak: two full days missing zeroes the current streak', () => {
  const days = [addDays(T, -2), addDays(T, -3)];
  const r = computeStreak(days, T);
  assert.equal(r.current, 0, 'yesterday missing too means no live streak');
});

test('workoutStreak only counts workouts with logged exercises, for the right user', () => {
  const workouts = [
    { uid: 'me', date: T, exercises: [{ name: 'Bench Press', sets: [] }] },
    { uid: 'me', date: addDays(T, -1), exercises: [] }, // empty shell doesn't count
    { uid: 'me', date: addDays(T, -2), exercises: [{ name: 'Squat', sets: [] }] },
    { uid: 'them', date: T, exercises: [{ name: 'Squat', sets: [] }] },
  ];
  const r = workoutStreak(workouts, 'me', T);
  assert.equal(r.current, 1, 'the empty-exercise day at -1 breaks the chain back to -2');
});

test('weightStreak counts any logged day regardless of value', () => {
  const weights = [
    { uid: 'me', date: T, weight: 80 },
    { uid: 'me', date: addDays(T, -1), weight: 80.2 },
  ];
  assert.deepEqual(weightStreak(weights, 'me', T), { current: 2, best: 2 });
});
