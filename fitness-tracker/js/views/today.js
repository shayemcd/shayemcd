// Today tab: the workout editor for a given date (defaults to today).

import { el, todayStr, addDays, fmtDate } from '../utils.js';
import { searchExercises, findExercise, GROUPS, musclesFor } from '../exercises.js';
import { ARCHETYPES } from '../split.js';
import { openModal } from './modal.js';

export function renderToday(ctx) {
  const { state, actions, helpers } = ctx;
  const me = helpers.me();
  if (!me) return el('p', { class: 'muted' }, 'Setting up your profile…');

  const date = state.editDate;
  const workout = helpers.workoutFor(me.uid, date) || emptyWorkout(me, date);

  // Persist a mutation of the current workout doc.
  const save = mutate => {
    const w = structuredClone(workout);
    mutate(w);
    actions.saveWorkout(w);
  };

  const root = el('div', {},
    dateNav(date, actions),
    dayTypeRow(workout, save),
    ...workout.exercises.map((ex, i) => exerciseCard(ex, i, me.unit, save)),
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
  return root;
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

function dayTypeRow(workout, save) {
  const label = workout.dayType
    ? `${workout.dayType}${workout.dayTypeSource === 'auto' ? ' · auto' : ''}`
    : 'Day type appears as you log';
  return el('div', { class: 'row', style: 'margin-bottom:12px' },
    el('span', {
      class: `badge ${workout.dayType ? '' : 'neutral'}`,
      style: 'cursor:pointer',
      onclick: () => pickDayType(workout, save),
    }, label),
    workout.copiedFrom ? el('span', { class: 'badge partner' }, '🤝 partner routine') : null,
  );
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

function exerciseCard(ex, i, unit, save) {
  const m = musclesFor(ex);
  return el('div', { class: 'card exercise-card' },
    el('div', { class: 'exercise-head' },
      el('div', {},
        el('div', { class: 'exercise-name' }, ex.name),
        el('div', { class: 'exercise-muscles' }, m.primary.map(g => GROUPS[g] || g).join(' · ') || 'custom'),
      ),
      el('button', {
        class: 'x-btn', 'aria-label': 'Remove exercise',
        onclick: () => save(w => w.exercises.splice(i, 1)),
      }, '✕'),
    ),
    el('table', { class: 'set-table' },
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
    ),
    el('button', {
      class: 'btn btn-small', style: 'margin-top:8px',
      onclick: () => save(w => {
        const sets = w.exercises[i].sets;
        const last = sets[sets.length - 1];
        sets.push({ reps: last?.reps ?? '', weight: last?.weight ?? '' });
      }),
    }, '+ Add set'),
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
  const input = el('input', { type: 'search', placeholder: '+ Add exercise (e.g. Bench Press)', autocomplete: 'off' });
  const list = el('div', { class: 'ac-list hidden' });
  const wrap = el('div', { class: 'card autocomplete' }, input, list);

  const addExercise = exercise => {
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
        el('span', { class: 'muscles' }, r.primary.map(g => GROUPS[g] || g).join(', ')),
      ));
    }
    if (!findExercise(q)) {
      list.append(el('div', { class: 'ac-item', onclick: () => customExercise(q, addExercise) },
        el('span', {}, `Add “${q}” as custom…`),
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
    el('h3', {}, `“${name}” — which muscles does it work?`),
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
