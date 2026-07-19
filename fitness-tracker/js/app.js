// App bootstrap, state, and tab routing.

import { configReady } from '../config.js';
import { demoStore } from './demo-store.js';
import { el, todayStr, convertWeight } from './utils.js';
import { detectDayType } from './split.js';
import { renderToday } from './views/today.js';
import { renderPlan } from './views/plan.js';
import { renderPartner } from './views/partner.js';
import { renderHistory } from './views/history.js';
import { renderWeight } from './views/weight.js';
import { openSettings } from './views/settings.js';

const params = new URLSearchParams(location.search);
const DEMO = params.has('demo') || !configReady();

const state = {
  store: null,
  user: null,          // {uid, name, email} or null
  profiles: [],        // users collection
  workouts: [],        // both users, date desc
  weights: [],         // both users, date desc
  tab: 'today',
  editDate: todayStr(), // date the Today tab is editing
  unauthorized: false,
  ready: false,
};

// ---------- derived helpers ----------

const helpers = {
  me: () => state.profiles.find(p => p.uid === state.user?.uid) || null,
  partner: () => state.profiles.find(p => p.uid !== state.user?.uid) || null,
  myUnit: () => helpers.me()?.unit || 'kg',
  profileFor: uid => state.profiles.find(p => p.uid === uid) || null,
  workoutFor: (uid, date) => state.workouts.find(w => w.uid === uid && w.date === date) || null,
  myWorkouts: () => state.workouts.filter(w => w.uid === state.user?.uid),
  partnerWorkouts: () => state.workouts.filter(w => w.uid !== state.user?.uid),
  // My most recent logged weight for an exercise name, in my unit.
  lastWeightFor: (exerciseName) => {
    const unit = helpers.myUnit();
    for (const w of helpers.myWorkouts()) {
      for (const ex of w.exercises || []) {
        if (ex.name.toLowerCase() !== exerciseName.toLowerCase()) continue;
        const withWeight = [...(ex.sets || [])].reverse().find(s => s.weight != null && s.weight !== '');
        if (withWeight) {
          const v = convertWeight(withWeight.weight, w.unit || unit, unit);
          return v == null ? null : Math.round(v * 10) / 10;
        }
      }
    }
    return null;
  },
};

// ---------- actions ----------

const actions = {
  setTab(tab) {
    state.tab = tab;
    render();
  },

  gotoDate(date) {
    state.editDate = date;
    state.tab = 'today';
    render();
  },

  async saveWorkout(w) {
    // Recompute the auto day type unless the user pinned one manually.
    if (w.dayTypeSource !== 'manual') {
      w.dayType = detectDayType(w.exercises);
      w.dayTypeSource = 'auto';
    }
    await state.store.saveWorkout(w);
  },

  async deleteWorkout(id) {
    await state.store.deleteWorkout(id);
  },

  async saveWeight(entry) {
    await state.store.saveWeight(entry);
  },

  async deleteWeight(id) {
    await state.store.deleteWeight(id);
  },

  async saveProfile(p) {
    await state.store.saveProfile(p);
  },

  // Copy a partner workout into my log for `date`, pre-filling weights with
  // my own last weights per exercise (in my unit) where known.
  async copyWorkout(src, date = todayStr()) {
    const me = helpers.me();
    const existing = helpers.workoutFor(me.uid, date);
    if (existing?.exercises?.length &&
        !confirm('You already logged a workout for this day. Replace it with the copied routine?')) {
      return;
    }
    const myUnit = helpers.myUnit();
    const copy = {
      id: `${me.uid}_${date}`,
      uid: me.uid,
      date,
      unit: myUnit,
      dayType: src.dayType || null,
      dayTypeSource: src.dayTypeSource === 'manual' ? 'manual' : 'auto',
      copiedFrom: src.id,
      notes: '',
      exercises: (src.exercises || []).map(ex => ({
        name: ex.name,
        ...(ex.primary ? { primary: ex.primary, secondary: ex.secondary || [] } : {}),
        sets: (ex.sets || []).map(s => ({
          reps: s.reps ?? '',
          weight: helpers.lastWeightFor(ex.name) ?? '',
        })),
      })),
    };
    await actions.saveWorkout(copy);
    actions.toast(`Copied to your log — now set your weights`);
    actions.gotoDate(date);
  },

  toast(msg) {
    document.querySelector('.toast')?.remove();
    const t = el('div', { class: 'toast' }, msg);
    document.body.append(t);
    setTimeout(() => t.remove(), 2600);
  },

  openSettings() {
    openSettings({ state, actions, helpers });
  },
};

// ---------- screens ----------

const screens = ['screen-loading', 'screen-setup', 'screen-signin', 'screen-unauthorized', 'app'];

function show(id) {
  for (const s of screens) document.getElementById(s).classList.toggle('hidden', s !== id);
}

function currentScreen() {
  if (!state.ready) return 'screen-loading';
  if (!state.user) return 'screen-signin';
  if (state.unauthorized) return 'screen-unauthorized';
  return 'app';
}

// ---------- render ----------

const viewRenderers = {
  today: renderToday,
  plan: renderPlan,
  partner: renderPartner,
  history: renderHistory,
  weight: renderWeight,
};

function render() {
  show(currentScreen());
  if (currentScreen() !== 'app') return;

  document.getElementById('demo-badge').classList.toggle('hidden', state.store.kind !== 'demo');
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === state.tab);
  });

  const view = document.getElementById('view');
  view.replaceChildren(viewRenderers[state.tab]({ state, actions, helpers }));
}

// ---------- profile bootstrap ----------

const COLORS = ['#e07b39', '#3b82c4'];

async function ensureProfile() {
  const { user, profiles } = state;
  if (!user || profiles.some(p => p.uid === user.uid)) return;
  await state.store.saveProfile({
    uid: user.uid,
    name: (user.name || 'Me').split(' ')[0],
    email: user.email,
    unit: 'kg',
    color: COLORS[profiles.length % COLORS.length],
    splitId: 'pairs5',
  });
}

// ---------- boot ----------

function onSubError(err) {
  if (err?.code === 'permission-denied') {
    state.unauthorized = true;
    render();
  } else {
    console.error(err);
  }
}

async function main() {
  if (!DEMO || params.has('demo')) {
    // Real Firebase, or explicitly requested demo.
    state.store = params.has('demo')
      ? demoStore
      : (await import('./firebase-store.js')).firebaseStore;
  } else {
    // Config still has placeholders: show setup checklist.
    show('screen-setup');
    return;
  }

  await state.store.init();

  document.getElementById('btn-signin').addEventListener('click', async () => {
    const errEl = document.getElementById('signin-error');
    errEl.classList.add('hidden');
    try {
      await state.store.signIn();
    } catch (e) {
      errEl.textContent = e.message || 'Sign-in failed';
      errEl.classList.remove('hidden');
    }
  });
  document.getElementById('btn-signout-unauth').addEventListener('click', () => state.store.signOut());
  document.getElementById('btn-settings').addEventListener('click', () => actions.openSettings());
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => actions.setTab(btn.dataset.tab));
  });

  let subscribed = false;
  state.store.onAuth(user => {
    state.user = user;
    state.ready = true;
    state.unauthorized = false;
    if (user && !subscribed) {
      subscribed = true;
      state.store.subscribeProfiles(profiles => {
        state.profiles = profiles;
        ensureProfile();
        render();
      }, onSubError);
      state.store.subscribeWorkouts(workouts => {
        state.workouts = workouts;
        render();
      }, onSubError);
      state.store.subscribeWeights(weights => {
        state.weights = weights;
        render();
      }, onSubError);
    }
    render();
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

main();
