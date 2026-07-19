// Demo store: same interface as firebase-store, but everything lives in
// localStorage. Used at ?demo=1 (or automatically while config.js still has
// placeholders) so the app can be tried before Firebase is set up.
// Seeds a fake partner ("Akim") with recent workouts and weights.

import { todayStr, addDays } from './utils.js';

const LS_KEY = 'fittrack-demo-v1';
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
const listeners = { auth: [], profiles: [], workouts: [], weights: [] };

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
};
