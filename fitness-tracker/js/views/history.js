// History tab: weekly recap + merged timeline of both users' workouts.

import { el, fmtDate, todayStr } from '../utils.js';
import { openWorkoutDetail, workoutSummary } from './detail.js';
import { weeklyRecap } from '../recap.js';
import { groupLabel } from '../split.js';

export function renderHistory(ctx) {
  const { state, helpers, actions } = ctx;
  const me = helpers.me();
  const partner = helpers.partner();
  const filter = state.historyFilter || 'all';

  const workouts = state.workouts.filter(w =>
    filter === 'all' ? true : filter === 'me' ? w.uid === me?.uid : w.uid !== me?.uid,
  );

  const setFilter = f => { state.historyFilter = f; actions.setTab('history'); };

  return el('div', {},
    el('div', { class: 'view-title' }, 'History'),
    recapCard(ctx),
    el('div', { class: 'chip-row' },
      [['all', 'Everyone'], ['me', me?.name || 'Me'], ['partner', partner?.name || 'Partner']].map(([f, label]) =>
        el('button', { class: 'chip' + (filter === f ? ' selected' : ''), onclick: () => setFilter(f) }, label),
      ),
    ),
    workouts.length === 0 ? el('p', { class: 'muted' }, 'No workouts logged yet.') : null,
    ...workouts.slice(0, 60).map(w => {
      const mine = w.uid === me?.uid;
      const owner = mine ? me : partner;
      return el('div', {
        class: 'card workout-item',
        onclick: () => openWorkoutDetail(w, {
          ownerProfile: owner,
          viewerUnit: me?.unit || 'kg',
          onCopy: mine ? null : () => actions.copyWorkout(w, todayStr()),
          onEdit: mine ? () => actions.gotoDate(w.date) : null,
          onDelete: mine ? () => { if (confirm('Delete this workout?')) actions.deleteWorkout(w.id); } : null,
          trendWorkouts: state.workouts.filter(x => x.uid === w.uid),
        }),
      },
        el('div', { class: 'spread' },
          el('span', {},
            el('strong', {}, fmtDate(w.date)),
            ' ',
            el('span', { class: 'muted', style: 'font-size:0.85rem' }, `· ${owner?.name || '?'}`),
          ),
          w.dayType ? el('span', { class: `badge ${mine ? '' : 'partner'}` }, w.dayType) : null,
        ),
        el('div', { class: 'summary' }, workoutSummary(w)),
      );
    }),
  );
}

// Last-7-days summary card.
function recapCard(ctx) {
  const { state, helpers } = ctx;
  const me = helpers.me();
  if (!me) return null;

  const r = weeklyRecap({
    workouts: state.workouts,
    meals: state.meals,
    weights: state.weights,
    watch: state.watch,
    uid: me.uid,
    unit: me.unit,
    targets: helpers.targets(),
    splitId: me.splitId,
    today: todayStr(),
  });
  const streak = helpers.myStreak();

  const stat = (label, value) =>
    el('div', { class: 'stat' },
      el('div', { class: 'stat-value' }, value),
      el('div', { class: 'stat-label' }, label),
    );

  const topGroups = Object.entries(r.setsByGroup)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([g, v]) => `${groupLabel(g)} ${v}`)
    .join(' · ');

  return el('div', { class: 'card' },
    el('h3', {}, '📊 Your last 7 days'),
    el('div', { class: 'stat-grid' },
      stat('workouts', `${r.workoutsDone}/${r.workoutsPlanned}`),
      stat('streak', `🔥 ${streak.current}d`),
      stat('best streak', `${streak.best}d`),
      stat('avg kcal in', r.kcalInAvg != null ? String(r.kcalInAvg) : '—'),
      stat('avg kcal out', r.kcalOutAvg != null ? String(r.kcalOutAvg) : '—'),
      stat('protein target', r.proteinAdherence != null ? `${r.proteinAdherence}%` : '—'),
      stat('avg sleep', r.sleepAvgMin != null ? `${Math.round(r.sleepAvgMin / 6) / 10} h` : '—'),
      stat('weight', r.weightDelta != null ? `${r.weightDelta > 0 ? '+' : ''}${r.weightDelta} ${me.unit}` : '—'),
    ),
    topGroups
      ? el('p', { class: 'muted', style: 'font-size:0.8rem; margin:10px 0 0' }, `Sets: ${topGroups}`)
      : null,
  );
}
