// Plan tab: pick a split, see today's smart suggestion, the generated
// next-7-days plan (cardio + abs + 4 lifts + warm-down), and recovery status.

import { el, todayStr, fmtDate } from '../utils.js';
import { SPLITS, getSplit, suggestNextDay, lastTrainedByGroup, groupLabel } from '../split.js';
import { examplesFor } from '../exercises.js';
import { daysBetween } from '../utils.js';
import { generateWeekPlan, planDayToExercises } from '../plan-gen.js';

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

    // Generated next 7 days
    el('h3', { style: 'margin:18px 0 10px' }, '📅 Next 7 days'),
    ...generateWeekPlan(myWorkouts, split, today).map(day => weekDayCard(ctx, day, today)),

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

    // Per-muscle last trained (kept below the 7-day plan)
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

// One generated day of the 7-day plan.
function weekDayCard(ctx, day, today) {
  const { actions, helpers } = ctx;

  if (day.kind === 'rest') {
    return el('div', { class: 'card week-day rest' },
      el('div', { class: 'spread' },
        el('strong', {}, fmtDate(day.date)),
        el('span', { class: 'badge neutral' }, '😴 Rest day'),
      ),
    );
  }

  const addToLog = async () => {
    const me = helpers.me();
    const existing = helpers.workoutFor(me.uid, day.date);
    if (existing?.exercises?.length &&
        !confirm(`You already logged a workout for ${fmtDate(day.date)}. Replace it with this plan?`)) {
      return;
    }
    await actions.saveWorkout({
      id: `${me.uid}_${day.date}`,
      uid: me.uid,
      date: day.date,
      unit: me.unit,
      dayType: day.dayName,
      dayTypeSource: 'manual',
      notes: '',
      exercises: planDayToExercises(day, name => helpers.lastWeightFor(name)),
    });
    actions.toast(`${day.dayName} added — fill in your reps as you go`);
    actions.gotoDate(day.date);
  };

  return el('div', { class: 'card week-day' },
    el('div', { class: 'spread' },
      el('strong', {}, fmtDate(day.date)),
      el('span', { class: 'badge' }, day.dayName),
    ),
    el('div', { class: 'plan-lines' },
      el('div', { class: 'plan-line' }, `🏃 ${day.cardio.name} — ${day.cardio.minutes} min warm-up`),
      el('div', { class: 'plan-line' }, `🧱 Abs: ${day.abs.join(', ')}`),
      ...day.main.map(m => el('div', { class: 'plan-line' }, `🏋️ ${m.name}`,
        el('span', { class: 'muted' }, ` · ${groupLabel(m.group)}`))),
      el('div', { class: 'plan-line' }, `🧘 ${day.warmdown.name} — ${day.warmdown.minutes} min`),
    ),
    el('button', {
      class: 'btn btn-primary btn-small', style: 'margin-top:10px',
      onclick: addToLog,
    }, day.date === today ? '+ Add to today' : `+ Add to ${fmtDate(day.date)}`),
  );
}
