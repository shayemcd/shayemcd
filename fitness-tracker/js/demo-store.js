// Demo store: same interface as firebase-store, but everything lives in
// localStorage. Used at ?demo=1 (or automatically while config.js still has
// placeholders) so the app can be tried before Firebase is set up.
// Seeds a fake partner ("Akim") with recent workouts and weights.

import { todayStr, addDays } from './utils.js';

const LS_KEY = 'fittrack-demo-v2';
const ME = { uid: 'demo-shaye', name: 'Shaye', email: 'shaye@example.com' };
const PARTNER_UID = 'demo-akim';

const sets = (n, reps, weight) => Array.from({ length: n }, () => ({ reps, weight }));

function seedData() {
  const t = todayStr();
  return {
    signedIn: false,
    users: {
      [ME.uid]: { uid: ME.uid, name: 'Shaye', email: ME.email, unit: 'kg', color: '#e07b39' },
      [PARTNER_UID]: { uid: PARTNER_UID, name: 'Akim', email: 'akim@example.com', unit: 'lbs', color: '#3b82c4' },
    },
    workouts: {
      [`${PARTNER_UID}_${addDays(t, -1)}`]: {
        id: `${PARTNER_UID}_${addDays(t, -1)}`,
        uid: PARTNER_UID, date: addDays(t, -1), unit: 'lbs',
        dayType: 'Chest + Triceps', dayTypeSource: 'auto',
        exercises: [
          { name: 'Bench Press', sets: sets(4, 8, 185) },
          { name: 'Incline Dumbbell Press', sets: sets(3, 10, 60) },
          { name: 'Cable Fly', sets: sets(3, 12, 40) },
          { name: 'Tricep Pushdown', sets: sets(3, 12, 55) },
          { name: 'Skull Crusher', sets: sets(3, 10, 65) },
        ],
        notes: '',
      },
      [`${PARTNER_UID}_${addDays(t, -3)}`]: {
        id: `${PARTNER_UID}_${addDays(t, -3)}`,
        uid: PARTNER_UID, date: addDays(t, -3), unit: 'lbs',
        dayType: 'Back + Biceps', dayTypeSource: 'auto',
        exercises: [
          { name: 'Pull-Up', sets: sets(4, 8, 0) },
          { name: 'Barbell Row', sets: sets(4, 8, 155) },
          { name: 'Lat Pulldown', sets: sets(3, 10, 120) },
          { name: 'Barbell Curl', sets: sets(3, 10, 65) },
          { name: 'Hammer Curl', sets: sets(3, 12, 30) },
        ],
        notes: '',
      },
    },
    bodyweight: Object.fromEntries(
      [1, 2, 3, 4, 5, 6, 7].flatMap(i => {
        const d = addDays(t, -i);
        return [
          [`${PARTNER_UID}_${d}`, { id: `${PARTNER_UID}_${d}`, uid: PARTNER_UID, date: d, weight: 176 - i * 0.2, unit: 'lbs' }],
        ];
      }),
    ),
    meals: {
      'demo-meal-1': {
        id: 'demo-meal-1', date: t, name: 'Chicken & rice batch',
        desc: 'Batch-cooked chicken breast, basmati rice, broccoli, olive oil',
        items: ['800g chicken breast', '4 cups cooked rice', 'broccoli', 'olive oil'],
        calories: 2600, protein_g: 210, carbs_g: 280, fat_g: 50, fiber_g: 18,
        food_groups: ['protein', 'grains', 'vegetables'],
        estimatedBy: 'ai-text', createdBy: PARTNER_UID,
        shares: [{ uid: PARTNER_UID, fraction: 0.5 }, { uid: ME.uid, fraction: 0.25 }],
      },
    },
    mealBank: {
      'demo-bank-1': {
        id: 'demo-bank-1', name: 'Chicken & rice batch',
        desc: 'Batch-cooked chicken breast, basmati rice, broccoli, olive oil',
        calories: 2600, protein_g: 210, carbs_g: 280, fat_g: 50, fiber_g: 18,
        food_groups: ['protein', 'grains', 'vegetables'],
        timesUsed: 3, createdBy: PARTNER_UID,
      },
      'demo-bank-2': {
        id: 'demo-bank-2', name: 'Overnight oats',
        desc: 'Oats, whey, milk, berries, peanut butter',
        calories: 550, protein_g: 40, carbs_g: 60, fat_g: 16, fiber_g: 9,
        food_groups: ['grains', 'dairy', 'fruit'],
        timesUsed: 5, createdBy: ME.uid,
      },
    },
    watch: {
      [`${PARTNER_UID}_${addDays(t, -1)}`]: {
        id: `${PARTNER_UID}_${addDays(t, -1)}`, uid: PARTNER_UID, date: addDays(t, -1),
        sleepMinutes: 432, caloriesOut: 3100, steps: 11200, source: 'fitbit',
      },
    },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to reseed */ }
  return seedData();
}

let data = null;
const listeners = { auth: [], profiles: [], workouts: [], weights: [], meals: [], mealBank: [], watch: [] };

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function emit(kind) {
  if (kind === 'auth') {
    const u = data.signedIn ? ME : null;
    listeners.auth.forEach(cb => cb(u));
  } else if (kind === 'profiles') {
    listeners.profiles.forEach(cb => cb(Object.values(data.users)));
  } else if (kind === 'workouts') {
    const list = Object.values(data.workouts).sort((a, b) => b.date.localeCompare(a.date));
    listeners.workouts.forEach(cb => cb(list));
  } else if (kind === 'weights') {
    const list = Object.values(data.bodyweight).sort((a, b) => b.date.localeCompare(a.date));
    listeners.weights.forEach(cb => cb(list));
  } else if (kind === 'meals') {
    const list = Object.values(data.meals).sort((a, b) => b.date.localeCompare(a.date));
    listeners.meals.forEach(cb => cb(list));
  } else if (kind === 'mealBank') {
    listeners.mealBank.forEach(cb => cb(Object.values(data.mealBank)));
  } else if (kind === 'watch') {
    const list = Object.values(data.watch).sort((a, b) => b.date.localeCompare(a.date));
    listeners.watch.forEach(cb => cb(list));
  }
}

export const demoStore = {
  kind: 'demo',

  async init() {
    data = load();
    persist();
  },

  onAuth(cb) { listeners.auth.push(cb); emit('auth'); },

  async signIn() { data.signedIn = true; persist(); emit('auth'); },

  async signOut() { data.signedIn = false; persist(); emit('auth'); },

  async saveProfile(profile) {
    data.users[profile.uid] = { ...data.users[profile.uid], ...profile };
    persist(); emit('profiles');
  },

  subscribeProfiles(cb) { listeners.profiles.push(cb); emit('profiles'); return () => {}; },

  subscribeWorkouts(cb) { listeners.workouts.push(cb); emit('workouts'); return () => {}; },

  async saveWorkout(w) { data.workouts[w.id] = w; persist(); emit('workouts'); },

  async deleteWorkout(id) { delete data.workouts[id]; persist(); emit('workouts'); },

  subscribeWeights(cb) { listeners.weights.push(cb); emit('weights'); return () => {}; },

  async saveWeight(entry) { data.bodyweight[entry.id] = entry; persist(); emit('weights'); },

  async deleteWeight(id) { delete data.bodyweight[id]; persist(); emit('weights'); },

  subscribeMeals(cb) { listeners.meals.push(cb); emit('meals'); return () => {}; },

  async saveMeal(meal) { data.meals[meal.id] = meal; persist(); emit('meals'); },

  async deleteMeal(id) { delete data.meals[id]; persist(); emit('meals'); },

  subscribeMealBank(cb) { listeners.mealBank.push(cb); emit('mealBank'); return () => {}; },

  async saveBankMeal(entry) {
    data.mealBank[entry.id] = { ...data.mealBank[entry.id], ...entry };
    persist(); emit('mealBank');
  },

  async deleteBankMeal(id) { delete data.mealBank[id]; persist(); emit('mealBank'); },

  subscribeWatch(cb) { listeners.watch.push(cb); emit('watch'); return () => {}; },

  async saveWatch(entry) {
    data.watch[entry.id] = { ...data.watch[entry.id], ...entry };
    persist(); emit('watch');
  },
};
