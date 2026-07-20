// 7-day workout plan generator. Pure functions, unit-tested in Node.
// Each training day: 5-10 min cardio warm-up, 2 ab exercises, 4 weighted/
// machine exercises for the day's muscle groups, and a stretching warm-down.

import { PLAN_PICKS, CARDIO } from './exercises.js';
import { suggestNextDay } from './split.js';
import { addDays } from './utils.js';

// Training/rest cadence over 7 days per split (T = train, R = rest).
const CADENCE = {
  pairs5: ['T', 'T', 'T', 'R', 'T', 'T', 'R'],
  ppl: ['T', 'T', 'T', 'R', 'T', 'T', 'T'],
  upperlower: ['T', 'T', 'R', 'T', 'T', 'R', 'R'],
};
const DEFAULT_CADENCE = ['T', 'T', 'T', 'R', 'T', 'T', 'R'];

const WARMUP_CARDIO = CARDIO.filter(c => c.name !== 'Stretching / Cool-down');
const WARMDOWN = { name: 'Stretching / Cool-down', minutes: 5 };
const MAIN_EXERCISES = 4;
const ABS_EXERCISES = 2;

// Pick `count` main exercises for a day's muscle groups: round-robin over the
// groups (excluding core, which the abs slot covers), taking the next curated
// pick from each.
export function pickMainExercises(groups, count = MAIN_EXERCISES) {
  const pools = groups
    .filter(g => g !== 'core' && PLAN_PICKS[g]?.length)
    .map(g => ({ group: g, picks: [...PLAN_PICKS[g]] }));
  const out = [];
  let i = 0;
  while (out.length < count && pools.some(p => p.picks.length)) {
    const pool = pools[i % pools.length];
    i++;
    const name = pool.picks.shift();
    if (name) out.push({ name, group: pool.group });
  }
  return out;
}

// Generate the next 7 days of training. `workouts` is the user's history
// (for rotation continuity), `split` a SPLITS entry, `today` 'YYYY-MM-DD'.
export function generateWeekPlan(workouts, split, today) {
  const cadence = CADENCE[split.id] || DEFAULT_CADENCE;

  // Start the rotation from the most-recovered day, then cycle in split order.
  const { suggestion } = suggestNextDay(workouts, split, today);
  let dayIdx = Math.max(split.days.findIndex(d => d.name === suggestion.name), 0);

  const plan = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    if (cadence[i] === 'R') {
      plan.push({ date, kind: 'rest' });
      continue;
    }
    const day = split.days[dayIdx % split.days.length];
    dayIdx++;

    plan.push({
      date,
      kind: 'train',
      dayName: day.name,
      groups: day.groups,
      cardio: {
        name: WARMUP_CARDIO[i % WARMUP_CARDIO.length].name,
        minutes: 8, // within the requested 5-10 min warm-up window
      },
      abs: PLAN_PICKS.core.slice((i * ABS_EXERCISES) % 4, (i * ABS_EXERCISES) % 4 + ABS_EXERCISES),
      main: pickMainExercises(day.groups),
      warmdown: { ...WARMDOWN },
    });
  }
  return plan;
}

// Materialise a generated plan day into a workout document's exercise list.
// `lastWeightFor(name)` supplies the user's most recent weight per exercise.
export function planDayToExercises(planDay, lastWeightFor = () => null) {
  const exercises = [];
  exercises.push({ name: planDay.cardio.name, cardio: true, minutes: planDay.cardio.minutes, sets: [] });
  for (const name of planDay.abs) {
    exercises.push({ name, sets: [1, 2, 3].map(() => ({ reps: '', weight: '' })) });
  }
  for (const { name } of planDay.main) {
    const w = lastWeightFor(name);
    exercises.push({ name, sets: [1, 2, 3].map(() => ({ reps: '', weight: w ?? '' })) });
  }
  exercises.push({ name: planDay.warmdown.name, cardio: true, minutes: planDay.warmdown.minutes, sets: [] });
  return exercises;
}
