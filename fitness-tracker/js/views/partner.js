// Partner tab: browse your training partner's recent workouts and copy one.

import { el, fmtDate, todayStr } from '../utils.js';
import { openWorkoutDetail, workoutSummary } from './detail.js';

export function renderPartner(ctx) {
  const { helpers, actions } = ctx;
  const partner = helpers.partner();
  const me = helpers.me();

  if (!partner) {
    return el('div', { class: 'card', style: 'text-align:center' },
      el('div', { class: 'logo-mark' }, '🤝'),
      el('p', {}, 'Your partner hasn’t signed in yet.'),
      el('p', { class: 'muted', style: 'font-size:0.9rem' },
        'Send them the app link — once they sign in with Google their workouts show up here automatically.'),
    );
  }

  const workouts = helpers.partnerWorkouts();

  return el('div', {},
    el('div', { class: 'view-title' }, `${partner.name}’s workouts`),
    workouts.length === 0
      ? el('p', { class: 'muted' }, `${partner.name} hasn’t logged any workouts yet.`)
      : null,
    ...workouts.slice(0, 30).map(w =>
      el('div', {
        class: 'card workout-item',
        onclick: () => openWorkoutDetail(w, {
          ownerProfile: partner,
          viewerUnit: me?.unit || 'kg',
          onCopy: () => actions.copyWorkout(w, todayStr()),
        }),
      },
        el('div', { class: 'spread' },
          el('strong', {}, fmtDate(w.date)),
          w.dayType ? el('span', { class: 'badge partner' }, w.dayType) : null,
        ),
        el('div', { class: 'summary' }, workoutSummary(w)),
      ),
    ),
  );
}
