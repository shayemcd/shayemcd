// Plan tab: pick a split, see today's smart suggestion and recovery status.

import { el, todayStr } from '../utils.js';
import { SPLITS, getSplit, suggestNextDay, lastTrainedByGroup, groupLabel } from '../split.js';
import { examplesFor } from '../exercises.js';
import { daysBetween } from '../utils.js';

export function renderPlan(ctx) {
  const { actions, helpers } = ctx;
  const me = helpers.me();
  if (!me) return el('p', { class: 'muted' }, 'Loading…');

  const split = getSplit(me.splitId);
  const today = todayStr();
  const myWorkouts = helpers.myWorkouts();
  const { suggestion, reason, ranked } = suggestNextDay(myWorkouts, split, today);
  const last = lastTrainedByGroup(myWorkouts);

  return el('div', {},
    el('div', { class: 'view-title' }, 'Training plan'),

    // Split picker
    el('div', { class: 'chip-row' },
      SPLITS.map(s =>
        el('button', {
          class: 'chip' + (s.id === split.id ? ' selected' : ''),
          onclick: () => actions.saveProfile({ ...me, splitId: s.id }),
        }, s.name),
      ),
    ),
    el('p', { class: 'muted', style: 'font-size:0.88rem' }, split.blurb),

    // Suggestion
    el('div', { class: 'card suggestion-card' },
      el('h3', {}, '💡 Train today'),
      el('div', { class: 'spread' },
        el('span', { class: 'badge' }, suggestion.name),
        el('span', { class: 'muted', style: 'font-size:0.8rem' },
          suggestion.groups.map(groupLabel).join(' · ')),
      ),
      el('p', { class: 'muted', style: 'font-size:0.88rem; margin-bottom:0' }, reason),
    ),

    // All days with recovery status
    el('div', { class: 'card' },
      el('h3', {}, `${split.name} — recovery`),
      ...ranked.map(({ day, daysSince, recovered }) =>
        el('div', { class: 'split-day' },
          el('div', { class: 'spread' },
            el('span', {},
              el('span', { class: `recovered-dot ${recovered ? 'ok' : 'no'}` }),
              el('strong', {}, day.name),
            ),
            el('span', { class: 'muted', style: 'font-size:0.8rem' },
              daysSince === Infinity ? 'not trained yet'
                : daysSince === 0 ? 'trained today'
                : `${daysSince} day${daysSince === 1 ? '' : 's'} ago`),
          ),
          el('div', { class: 'examples' },
            day.groups.map(g => `${groupLabel(g)}: ${examplesFor(g, 2).join(', ')}`).join('  ·  ')),
        ),
      ),
    ),

    // Per-muscle last trained
    el('div', { class: 'card' },
      el('h3', {}, 'Muscle groups — last trained'),
      el('div', { class: 'chip-row' },
        Object.entries(last)
          .sort((a, b) => a[1] < b[1] ? -1 : 1)
          .map(([g, date]) => {
            const d = daysBetween(date, today);
            return el('span', { class: 'chip' }, `${groupLabel(g)} · ${d === 0 ? 'today' : `${d}d ago`}`);
          }),
        Object.keys(last).length ? null : el('span', { class: 'muted' }, 'Log some workouts to see this.'),
      ),
    ),
  );
}
