// Today tab: the workout editor for a given date (defaults to today).
// Strength exercises use a collapsed "sets × reps @ weight" editor that
// writes every set at once; expand for per-set control. Cardio entries log
// minutes. Each exercise shows an estimated calorie burn.

import { el, todayStr, addDays, fmtDate } from '../utils.js';
import { searchExercises, findExercise, findCardio, GROUPS, musclesFor } from '../exercises.js';
import { ARCHETYPES } from '../split.js';
import { exerciseKcal, workoutKcal } from '../energy.js';
import { lastPerformance } from '../progress.js';
import { openModal } from './modal.js';
import { startRestTimer } from './timer.js';

// Transient UI state: which exercises are showing the per-set editor.
const expanded = new Set();

export function renderToday(ctx) {
  const { state, actions, helpers } = ctx;
  const me = helpers.me();
  if (!me) return el('p', { class: 'muted' }, 'Setting up your profile…');

  const date = state.editDate;
  const workout = helpers.workoutFor(me.uid, date) || emptyWorkout(me, date);
  const kg = helpers.bodyweightKg();

  const save = mutate => {
    const w = structuredClone(workout);
    mutate(w);
    actions.saveWorkout(w);
  };

  const rerender = () => actions.setTab('today');
  const totalKcal = workoutKcal(workout.exercises, kg);

  return el('div', {},
    dateNav(date, actions),
    el('div', { class: 'row', style: 'margin-bottom:12px; flex-wrap:wrap' },
      streakBadge(ctx),
      dayTypeBadge(workout, save),
      workout.copiedFrom ? el('span', { class: 'badge partner' }, '🤝 partner routine') : null,
      totalKcal ? el('span', { class: 'badge neutral' }, `🔥 ~${totalKcal} kcal`) : null,
    ),
    ...workout.exercises.map((ex, i) => exerciseCard(ctx, workout, ex, i, me.unit, kg, save, rerender)),
    addExerciseBox(ctx, workout, save),
    notesBox(workout, save),
    workout.exercises.length
      ? el('button', {
          class: 'btn btn-danger btn-small',
          style: 'margin-top:6px',
          onclick: () => {
            if (confirm('Delete this whole workout?')) actions.deleteWorkout(workout.id);
          },
        }, 'Delete workout')
      : null,
  );
}

function emptyWorkout(me, date) {
  return {
    id: `${me.uid}_${date}`,
    uid: me.uid,
    date,
    unit: me.unit,
    dayType: null,
    dayTypeSource: 'auto',
    exercises: [],
    notes: '',
  };
}

// ---------- streak ----------

// Only shown on the current-day view (browsing past dates shouldn't imply
// "log today"). helpers.myStreak() already accounts for today being
// unfinished, so `current` is exactly "the streak you're protecting".
function streakBadge(ctx) {
  const { state, helpers } = ctx;
  if (state.editDate !== todayStr()) return null;
  const me = helpers.me();
  const { current } = helpers.myStreak();
  if (current > 0) {
    const loggedToday = !!helpers.workoutFor(me.uid, todayStr())?.exercises?.length;
    return el('span', { class: 'streak-badge' },
      `🔥 ${current}-day streak${loggedToday ? '' : ' — log today to keep it!'}`);
  }
  return el('span', { class: 'streak-badge zero' }, '💪 Log a workout to start your streak');
}

// ---------- date navigation ----------

function dateNav(date, actions) {
  return el('div', { class: 'spread', style: 'margin-bottom:12px' },
    el('button', { class: 'btn btn-small', onclick: () => actions.gotoDate(addDays(date, -1)) }, '‹'),
    el('div', { style: 'text-align:center' },
      el('div', { class: 'view-title', style: 'margin:0' }, fmtDate(date)),
      date !== todayStr()
        ? el('button', { class: 'x-btn', style: 'color:var(--accent)', onclick: () => actions.gotoDate(todayStr()) }, 'jump to today')
        : el('span', { class: 'muted', style: 'font-size:0.8rem' }, date),
    ),
    el('button', {
      class: 'btn btn-small',
      disabled: date >= todayStr() ? '' : null,
      onclick: () => actions.gotoDate(addDays(date, 1)),
    }, '›'),
  );
}

// ---------- day type ----------

function dayTypeBadge(workout, save) {
  const label = workout.dayType
    ? `${workout.dayType}${workout.dayTypeSource === 'auto' ? ' · auto' : ''}`
    : 'Day type appears as you log';
  return el('span', {
    class: `badge ${workout.dayType ? '' : 'neutral'}`,
    style: 'cursor:pointer',
    onclick: () => pickDayType(workout, save),
  }, label);
}

function pickDayType(workout, save) {
  if (!workout.exercises.length) return;
  const options = ['Auto-detect', ...ARCHETYPES.map(a => a.name), 'Full Body'];
  const close = openModal(
    el('h3', {}, 'Day type'),
    el('div', { class: 'chip-row' },
      options.map(name =>
        el('button', {
          class: 'chip' + ((name === 'Auto-detect' && workout.dayTypeSource === 'auto') || workout.dayType === name ? ' selected' : ''),
          onclick: () => {
            save(w => {
              if (name === 'Auto-detect') {
                w.dayTypeSource = 'auto'; // saveWorkout recomputes
              } else {
                w.dayType = name;
                w.dayTypeSource = 'manual';
              }
            });
            close();
          },
        }, name),
      ),
    ),
  );
}

// ---------- exercise cards ----------

function isUniform(sets) {
  if (!sets.length) return true;
  return sets.every(s => s.reps === sets[0].reps && s.weight === sets[0].weight);
}

function exerciseCard(ctx, workout, ex, i, unit, kg, save, rerender) {
  if (ex.cardio) return cardioCard(ex, i, kg, save);

  const { helpers } = ctx;
  const key = `${workout.date}:${ex.name}`;
  const uniform = isUniform(ex.sets);
  const showTable = expanded.has(key) || !uniform;
  const kcal = exerciseKcal(ex, kg);
  const last = lastPerformance(ex.name, helpers.myWorkouts(), workout.date, unit);
  const m = musclesFor(ex);

  return el('div', { class: 'card exercise-card' },
    el('div', { class: 'exercise-head' },
      el('div', {},
        el('div', { class: 'exercise-name' }, ex.name),
        el('div', { class: 'exercise-muscles' },
          m.primary.map(g => GROUPS[g] || g).join(' · ') || 'custom',
          last ? ` — last: ${last.summary}` : '',
        ),
      ),
      el('div', { class: 'row', style: 'gap:6px' },
        kcal ? el('span', { class: 'kcal-chip' }, `~${kcal} kcal`) : null,
        el('button', { class: 'x-btn', 'aria-label': 'Rest timer', onclick: () => startRestTimer() }, '⏱️'),
        el('button', {
          class: 'x-btn', 'aria-label': 'Remove exercise',
          onclick: () => save(w => w.exercises.splice(i, 1)),
        }, '✕'),
      ),
    ),
    showTable ? setTable(ex, i, unit, save) : compactEditor(ex, i, unit, save),
    el('div', { class: 'row', style: 'margin-top:8px' },
      showTable
        ? el('button', {
            class: 'btn btn-small',
            onclick: () => save(w => {
              const sets = w.exercises[i].sets;
              const lastSet = sets[sets.length - 1];
              sets.push({ reps: lastSet?.reps ?? '', weight: lastSet?.weight ?? '' });
            }),
          }, '+ Add set')
        : null,
      el('button', {
        class: 'btn btn-small',
        onclick: () => {
          if (showTable) {
            if (!uniform && !confirm('Sets differ — the compact editor applies one value to every set. Continue?')) return;
            expanded.delete(key);
            if (!uniform) {
              // Make sets uniform (copy the first) so the compact editor is honest.
              save(w => {
                const sets = w.exercises[i].sets;
                for (const s of sets) { s.reps = sets[0].reps; s.weight = sets[0].weight; }
              });
              return; // save triggers re-render
            }
          } else {
            expanded.add(key);
          }
          rerender();
        },
      }, showTable ? 'Collapse' : 'Edit per set'),
    ),
  );
}

// Collapsed editor: one row controlling every set.
function compactEditor(ex, i, unit, save) {
  const s0 = ex.sets[0] || { reps: '', weight: '' };
  const setCount = ex.sets.length;

  const apply = (field, value) => save(w => {
    for (const s of w.exercises[i].sets) s[field] = value;
  });

  return el('div', { class: 'compact-editor' },
    el('div', { class: 'compact-field' },
      el('span', { class: 'compact-label' }, 'Sets'),
      el('div', { class: 'stepper' },
        el('button', {
          'aria-label': 'Fewer sets',
          onclick: () => setCount > 1 && save(w => w.exercises[i].sets.pop()),
        }, '−'),
        el('span', { class: 'stepper-value' }, String(setCount)),
        el('button', {
          'aria-label': 'More sets',
          onclick: () => save(w => {
            const sets = w.exercises[i].sets;
            sets.push({ ...(sets.at(-1) || { reps: '', weight: '' }) });
          }),
        }, '+'),
      ),
    ),
    el('div', { class: 'compact-field' },
      el('span', { class: 'compact-label' }, 'Reps'),
      el('input', {
        type: 'number', inputmode: 'numeric', min: '0', value: s0.reps ?? '',
        onchange: e => apply('reps', e.target.value === '' ? '' : Number(e.target.value)),
      }),
    ),
    el('div', { class: 'compact-field grow' },
      el('span', { class: 'compact-label' }, `Weight (${unit})`),
      el('input', {
        type: 'number', inputmode: 'decimal', min: '0', step: 'any', value: s0.weight ?? '',
        onchange: e => apply('weight', e.target.value === '' ? '' : Number(e.target.value)),
      }),
    ),
  );
}

function setTable(ex, i, unit, save) {
  return el('table', { class: 'set-table' },
    el('thead', {}, el('tr', {},
      el('th', {}, 'Set'), el('th', {}, 'Reps'), el('th', {}, `Weight (${unit})`), el('th', {}),
    )),
    el('tbody', {},
      ex.sets.map((s, j) =>
        el('tr', {},
          el('td', { class: 'set-num' }, String(j + 1)),
          el('td', {}, numInput(s.reps, v => save(w => { w.exercises[i].sets[j].reps = v; }))),
          el('td', {}, numInput(s.weight, v => save(w => { w.exercises[i].sets[j].weight = v; }))),
          el('td', { class: 'set-del' },
            el('button', { 'aria-label': 'Remove set', onclick: () => save(w => w.exercises[i].sets.splice(j, 1)) }, '✕'),
          ),
        ),
      ),
    ),
  );
}

function cardioCard(ex, i, kg, save) {
  const kcal = exerciseKcal(ex, kg);
  return el('div', { class: 'card exercise-card' },
    el('div', { class: 'exercise-head' },
      el('div', {},
        el('div', { class: 'exercise-name' }, ex.name),
        el('div', { class: 'exercise-muscles' }, 'cardio'),
      ),
      el('div', { class: 'row', style: 'gap:6px' },
        kcal ? el('span', { class: 'kcal-chip' }, `~${kcal} kcal`) : null,
        el('button', {
          class: 'x-btn', 'aria-label': 'Remove exercise',
          onclick: () => save(w => w.exercises.splice(i, 1)),
        }, '✕'),
      ),
    ),
    el('div', { class: 'compact-editor' },
      el('div', { class: 'compact-field grow' },
        el('span', { class: 'compact-label' }, 'Minutes'),
        el('input', {
          type: 'number', inputmode: 'numeric', min: '0', value: ex.minutes ?? '',
          onchange: e => save(w => { w.exercises[i].minutes = e.target.value === '' ? '' : Number(e.target.value); }),
        }),
      ),
    ),
  );
}

function numInput(value, onchange) {
  return el('input', {
    type: 'number', inputmode: 'decimal', min: '0', step: 'any',
    value: value ?? '',
    onchange: e => onchange(e.target.value === '' ? '' : Number(e.target.value)),
  });
}

// ---------- add exercise ----------

function addExerciseBox(ctx, workout, save) {
  const { helpers } = ctx;
  const input = el('input', { type: 'search', placeholder: '+ Add exercise (e.g. Bench Press, Treadmill Run)', autocomplete: 'off' });
  const list = el('div', { class: 'ac-list hidden' });
  const wrap = el('div', { class: 'card autocomplete' }, input, list);

  const addExercise = exercise => {
    if (exercise.cardio) {
      save(w => w.exercises.push({ name: exercise.name, cardio: true, minutes: 10, sets: [] }));
      return;
    }
    const lastW = helpers.lastWeightFor(exercise.name);
    save(w => {
      w.exercises.push({
        name: exercise.name,
        ...(exercise.custom ? { primary: exercise.primary, secondary: [] } : {}),
        sets: [1, 2, 3].map(() => ({ reps: '', weight: lastW ?? '' })),
      });
    });
  };

  const refresh = () => {
    const q = input.value.trim();
    list.replaceChildren();
    if (!q) { list.classList.add('hidden'); return; }
    const results = searchExercises(q);
    for (const r of results) {
      list.append(el('div', { class: 'ac-item', onclick: () => addExercise(r) },
        el('span', {}, r.name),
        el('span', { class: 'muscles' }, r.cardio ? 'cardio' : r.primary.map(g => GROUPS[g] || g).join(', ')),
      ));
    }
    if (!findExercise(q) && !findCardio(q)) {
      list.append(el('div', { class: 'ac-item', onclick: () => customExercise(q, addExercise) },
        el('span', {}, `Add "${q}" as custom…`),
        el('span', { class: 'muscles' }, 'pick muscles'),
      ));
    }
    list.classList.remove('hidden');
  };

  input.addEventListener('input', refresh);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const first = searchExercises(input.value)[0];
      if (first) addExercise(first);
      else if (input.value.trim()) customExercise(input.value.trim(), addExercise);
    }
  });
  return wrap;
}

function customExercise(name, done) {
  const selected = new Set();
  const close = openModal(
    el('h3', {}, `"${name}" — which muscles does it work?`),
    el('div', { class: 'chip-row' },
      Object.entries(GROUPS).map(([key, label]) =>
        el('button', {
          class: 'chip',
          onclick: e => {
            e.target.classList.toggle('selected');
            selected.has(key) ? selected.delete(key) : selected.add(key);
          },
        }, label),
      ),
    ),
    el('button', {
      class: 'btn btn-primary',
      onclick: () => {
        if (!selected.size) return;
        close();
        done({ name, custom: true, primary: [...selected] });
      },
    }, 'Add exercise'),
  );
}

// ---------- notes ----------

function notesBox(workout, save) {
  if (!workout.exercises.length && !workout.notes) return null;
  return el('div', { class: 'card' },
    el('textarea', {
      placeholder: 'Notes (optional)', rows: '2', value: workout.notes || '',
      onchange: e => save(w => { w.notes = e.target.value; }),
    }),
  );
}
