// Meals tab: daily macro dashboard vs targets, gap flags, and meal logging
// via AI photo/text estimation, the meal bank, or manual entry. Meals can be
// shared with your partner using per-person fractions (batch cooking).

import { el, todayStr, addDays, fmtDate, uid as newId } from '../utils.js';
import { dayTotals, flagGaps, myFraction, MACRO_LABELS } from '../nutrition.js';
import { estimateMeal, downscaleImage, thumbnail } from '../ai.js';
import { openModal } from './modal.js';

const FRACTIONS = [
  { label: 'none', value: 0 },
  { label: '¼', value: 0.25 },
  { label: '⅓', value: 1 / 3 },
  { label: '½', value: 0.5 },
  { label: '⅔', value: 2 / 3 },
  { label: 'all', value: 1 },
];

export function renderMeals(ctx) {
  const { state, actions, helpers } = ctx;
  const me = helpers.me();
  if (!me) return el('p', { class: 'muted' }, 'Loading…');

  const date = state.mealDate || todayStr();
  const targets = helpers.targets();
  const totals = dayTotals(state.meals, me.uid, date);
  const isToday = date === todayStr();
  const flags = isToday ? flagGaps(totals, targets, new Date().getHours()) : [];
  const dayMeals = state.meals.filter(m => m.date === date);

  return el('div', {},
    mealDateNav(ctx, date),
    dashboard(totals, targets),
    flags.length
      ? el('div', { class: 'card flag-card' },
          ...flags.map(f => el('div', { class: 'plan-line' }, `⚠️ ${f}`)))
      : null,
    el('div', { class: 'row', style: 'margin-bottom:14px' },
      photoButton(ctx, date),
      el('button', { class: 'btn btn-small grow', style: 'margin-top:0', onclick: () => describeFlow(ctx, date) }, '✏️ Describe'),
      el('button', { class: 'btn btn-small grow', style: 'margin-top:0', onclick: () => bankPicker(ctx, date) }, '🗂 From bank'),
    ),
    dayMeals.length === 0
      ? el('p', { class: 'muted' }, 'No meals logged for this day yet.')
      : null,
    ...dayMeals.map(m => mealCard(ctx, m, me)),
  );
}

function mealDateNav(ctx, date) {
  const { state, actions } = ctx;
  const go = d => { state.mealDate = d; actions.setTab('meals'); };
  return el('div', { class: 'spread', style: 'margin-bottom:12px' },
    el('button', { class: 'btn btn-small', onclick: () => go(addDays(date, -1)) }, '‹'),
    el('div', { style: 'text-align:center' },
      el('div', { class: 'view-title', style: 'margin:0' }, `Meals · ${fmtDate(date)}`),
      date !== todayStr()
        ? el('button', { class: 'x-btn', style: 'color:var(--accent)', onclick: () => go(todayStr()) }, 'jump to today')
        : null,
    ),
    el('button', {
      class: 'btn btn-small',
      disabled: date >= todayStr() ? '' : null,
      onclick: () => go(addDays(date, 1)),
    }, '›'),
  );
}

// ---------- macro dashboard ----------

function dashboard(totals, targets) {
  const bar = (key, unitLabel) => {
    const have = totals[key] || 0;
    const want = targets[key] || 1;
    const pct = Math.min(100, Math.round((have / want) * 100));
    const over = have > want;
    return el('div', { class: 'macro-row' },
      el('div', { class: 'spread', style: 'font-size:0.82rem' },
        el('span', {}, MACRO_LABELS[key]),
        el('span', { class: over ? 'over' : 'muted' }, `${have} / ${want} ${unitLabel}`),
      ),
      el('div', { class: 'bar' },
        el('div', { class: `bar-fill${over ? ' over' : ''}`, style: `width:${pct}%` }),
      ),
    );
  };
  return el('div', { class: 'card' },
    bar('calories', 'kcal'),
    bar('protein_g', 'g'),
    bar('carbs_g', 'g'),
    bar('fat_g', 'g'),
    bar('fiber_g', 'g'),
  );
}

// ---------- meal cards ----------

function mealCard(ctx, meal, me) {
  const { helpers } = ctx;
  const partner = helpers.partner();
  const mine = myFraction(meal, me.uid);
  const theirs = partner ? myFraction(meal, partner.uid) : 0;
  const myKcal = Math.round((meal.calories || 0) * mine);

  return el('div', { class: 'card workout-item', onclick: () => reviewMeal(ctx, meal) },
    el('div', { class: 'row' },
      meal.thumb ? el('img', { src: meal.thumb, class: 'meal-thumb', alt: '' }) : null,
      el('div', { class: 'grow' },
        el('div', { class: 'spread' },
          el('strong', {}, meal.name),
          el('span', { class: 'badge neutral' }, mine ? `${myKcal} kcal` : 'not yours'),
        ),
        el('div', { class: 'summary' },
          `P ${meal.protein_g ?? '?'}g · C ${meal.carbs_g ?? '?'}g · F ${meal.fat_g ?? '?'}g`,
          mine ? ` — your share: ${fracLabel(mine)}` : '',
          theirs && partner ? ` · ${partner.name}: ${fracLabel(theirs)}` : '',
        ),
      ),
    ),
  );
}

function fracLabel(f) {
  const hit = FRACTIONS.find(x => Math.abs(x.value - f) < 0.01);
  return hit ? hit.label : `${Math.round(f * 100)}%`;
}

// ---------- add flows ----------

function photoButton(ctx, date) {
  const input = el('input', {
    type: 'file', accept: 'image/*', capture: 'environment', style: 'display:none',
    onchange: async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const working = openModal(el('h3', {}, '📷 Estimating…'), el('p', { class: 'muted' }, 'Analysing your photo.'));
      try {
        const dataUrl = await downscaleImage(file);
        const est = await estimateMeal({ imageDataUrl: dataUrl }, { demo: ctx.state.store.kind === 'demo' });
        est.thumb = await thumbnail(dataUrl);
        working();
        reviewMeal(ctx, buildMeal(ctx, date, est));
      } catch (err) {
        working();
        ctx.actions.toast(`Estimation failed: ${err.message || err}`);
      }
      e.target.value = '';
    },
  });
  return el('label', { class: 'btn btn-small grow', style: 'margin-top:0; text-align:center' }, '📷 Photo', input);
}

function describeFlow(ctx, date) {
  const ta = el('textarea', {
    rows: '3',
    placeholder: 'e.g. Batch of chicken curry: 800g chicken thighs, coconut milk, rice for 4',
  });
  const err = el('p', { class: 'error hidden' });
  const close = openModal(
    el('h3', {}, '✏️ Describe the meal'),
    ta, err,
    el('button', {
      class: 'btn btn-primary', style: 'width:100%',
      onclick: async e => {
        const text = ta.value.trim();
        if (!text) return;
        e.target.textContent = 'Estimating…';
        e.target.disabled = true;
        try {
          const est = await estimateMeal({ text }, { demo: ctx.state.store.kind === 'demo' });
          est.desc = text;
          close();
          reviewMeal(ctx, buildMeal(ctx, date, est));
        } catch (error) {
          e.target.textContent = 'Get estimate';
          e.target.disabled = false;
          err.textContent = `Estimation failed: ${error.message || error}. Check Firebase AI Logic is enabled (SETUP.md).`;
          err.classList.remove('hidden');
        }
      },
    }, 'Get estimate'),
  );
}

function bankPicker(ctx, date) {
  const { state } = ctx;
  const items = [...state.mealBank].sort((a, b) => (b.timesUsed || 0) - (a.timesUsed || 0));
  const close = openModal(
    el('h3', {}, '🗂 Meal bank'),
    items.length === 0 ? el('p', { class: 'muted' }, 'Nothing saved yet — tick “save to bank” when logging a meal you batch-cook.') : null,
    ...items.map(b =>
      el('div', { class: 'card workout-item', onclick: () => {
        close();
        reviewMeal(ctx, buildMeal(ctx, date, { ...b, estimatedBy: 'bank', bankId: b.id }));
      } },
        el('div', { class: 'spread' },
          el('strong', {}, b.name),
          el('span', { class: 'muted', style: 'font-size:0.8rem' }, `used ${b.timesUsed || 0}×`),
        ),
        el('div', { class: 'summary' }, `${b.calories} kcal · P ${b.protein_g}g · C ${b.carbs_g}g · F ${b.fat_g}g (whole batch)`),
      ),
    ),
  );
}

function buildMeal(ctx, date, est) {
  const me = ctx.helpers.me();
  const partner = ctx.helpers.partner();
  return {
    id: newId(),
    date,
    name: est.name || 'Meal',
    desc: est.desc || '',
    thumb: est.thumb || null,
    items: est.items || [],
    calories: est.calories ?? 0,
    protein_g: est.protein_g ?? 0,
    carbs_g: est.carbs_g ?? 0,
    fat_g: est.fat_g ?? 0,
    fiber_g: est.fiber_g ?? 0,
    food_groups: est.food_groups || [],
    assumptions: est.assumptions || '',
    estimatedBy: est.estimatedBy || 'manual',
    bankId: est.bankId || null,
    createdBy: me.uid,
    shares: [
      { uid: me.uid, fraction: 1 },
      ...(partner ? [{ uid: partner.uid, fraction: 0 }] : []),
    ],
    _isNew: true,
  };
}

// ---------- review / edit modal ----------

function reviewMeal(ctx, meal) {
  const { actions, helpers, state } = ctx;
  const me = helpers.me();
  const partner = helpers.partner();
  const isNew = !!meal._isNew;
  const m = structuredClone(meal);
  delete m._isNew;

  const num = (key, label) => el('div', { class: 'compact-field grow' },
    el('span', { class: 'compact-label' }, label),
    el('input', {
      type: 'number', inputmode: 'numeric', min: '0', value: m[key] ?? 0,
      onchange: e => { m[key] = Number(e.target.value) || 0; },
    }),
  );

  const shareRow = person => {
    const current = () => m.shares.find(s => s.uid === person.uid) ||
      m.shares[m.shares.push({ uid: person.uid, fraction: 0 }) - 1];
    const row = el('div', { class: 'chip-row' },
      FRACTIONS.map(f =>
        el('button', {
          class: 'chip' + (Math.abs(current().fraction - f.value) < 0.01 ? ' selected' : ''),
          onclick: e => {
            current().fraction = f.value;
            [...row.children].forEach(c => c.classList.remove('selected'));
            e.target.classList.add('selected');
          },
        }, f.label),
      ),
    );
    return el('div', { style: 'margin-top:8px' },
      el('span', { class: 'compact-label' }, `${person.name}'s share`),
      row,
    );
  };

  const bankCheckbox = el('input', { type: 'checkbox', style: 'width:auto' });
  const nameInput = el('input', { type: 'text', value: m.name, onchange: e => { m.name = e.target.value; } });

  const close = openModal(
    el('h3', {}, isNew ? 'Check the estimate' : 'Edit meal'),
    m.thumb ? el('img', { src: m.thumb, class: 'meal-thumb-lg', alt: '' }) : null,
    el('span', { class: 'compact-label' }, 'Name'),
    nameInput,
    m.items?.length ? el('p', { class: 'muted', style: 'font-size:0.82rem' }, m.items.join(' · ')) : null,
    m.assumptions ? el('p', { class: 'muted', style: 'font-size:0.78rem' }, `AI assumed: ${m.assumptions}`) : null,
    el('p', { class: 'muted', style: 'font-size:0.8rem; margin:8px 0 4px' },
      'Numbers are for the whole meal/batch — set each person\'s share below.'),
    el('div', { class: 'compact-editor' }, num('calories', 'kcal')),
    el('div', { class: 'compact-editor' },
      num('protein_g', 'Protein g'), num('carbs_g', 'Carbs g'),
    ),
    el('div', { class: 'compact-editor' },
      num('fat_g', 'Fat g'), num('fiber_g', 'Fiber g'),
    ),
    shareRow(me),
    partner ? shareRow(partner) : null,
    isNew && !m.bankId
      ? el('label', { class: 'row', style: 'margin-top:12px; font-size:0.9rem' },
          bankCheckbox, 'Save to meal bank for reuse')
      : null,
    el('div', { class: 'row', style: 'margin-top:14px' },
      el('button', {
        class: 'btn btn-primary grow',
        onclick: async () => {
          m.shares = m.shares.filter(s => s.fraction > 0);
          if (!m.shares.length) m.shares = [{ uid: me.uid, fraction: 1 }];
          await actions.saveMeal(m);
          if (m.bankId) {
            const bank = state.mealBank.find(b => b.id === m.bankId);
            if (bank) actions.saveBankMeal({ id: bank.id, timesUsed: (bank.timesUsed || 0) + 1 });
          } else if (bankCheckbox.checked) {
            await actions.saveBankMeal({
              id: newId(), name: m.name, desc: m.desc,
              calories: m.calories, protein_g: m.protein_g, carbs_g: m.carbs_g,
              fat_g: m.fat_g, fiber_g: m.fiber_g, food_groups: m.food_groups,
              timesUsed: 1, createdBy: me.uid,
            });
          }
          close();
          actions.toast(isNew ? 'Meal logged' : 'Meal updated');
        },
      }, 'Save'),
      !isNew
        ? el('button', {
            class: 'btn btn-danger',
            onclick: () => {
              if (confirm('Delete this meal for both of you?')) {
                actions.deleteMeal(m.id);
                close();
              }
            },
          }, 'Delete')
        : null,
    ),
  );
}
