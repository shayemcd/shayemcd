// History tab: merged timeline of both users' workouts.

import { el, fmtDate, todayStr } from '../utils.js';
import { openWorkoutDetail, workoutSummary } from './detail.js';

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
