// Settings modal: display name, preferred unit, nutrition goal & target
// overrides, Fitbit connection, sign out.

import { el } from '../utils.js';
import { computeTargets, latestWeightKg } from '../nutrition.js';
import { isFitbitConfigured, isFitbitConnected, connectFitbit, disconnectFitbit } from '../fitbit.js';
import { openModal } from './modal.js';

export function openSettings(ctx) {
  const { state, actions, helpers } = ctx;
  const me = helpers.me();
  if (!me) return;

  const nameInput = el('input', { type: 'text', value: me.name, maxlength: '20' });
  const pending = {}; // profile changes collected until Save

  const goalChip = goal =>
    el('button', {
      class: 'chip' + ((pending.goal ?? me.goal ?? 'maintain') === goal ? ' selected' : ''),
      onclick: e => {
        pending.goal = goal;
        [...e.target.parentElement.children].forEach(c => c.classList.remove('selected'));
        e.target.classList.add('selected');
      },
    }, { lose: 'Lose weight', maintain: 'Maintain', gain: 'Build muscle' }[goal]);

  const computed = computeTargets(me, latestWeightKg(state.weights, me.uid));
  const targetInput = (key, label) => el('div', { class: 'compact-field grow' },
    el('span', { class: 'compact-label' }, label),
    el('input', {
      type: 'number', inputmode: 'numeric', min: '0',
      value: me.targets?.[key] ?? '',
      placeholder: String(computed[key]),
      onchange: e => {
        pending.targets = { ...me.targets, ...pending.targets };
        if (e.target.value === '') delete pending.targets[key];
        else pending.targets[key] = Number(e.target.value);
      },
    }),
  );

  const unitChip = unit =>
    el('button', {
      class: 'chip' + (me.unit === unit ? ' selected' : ''),
      onclick: () => {
        actions.saveProfile({ ...me, unit });
        close();
        actions.toast(`Units set to ${unit}`);
      },
    }, unit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)');

  const fitbitSection = () => {
    if (!isFitbitConfigured()) {
      return el('p', { class: 'muted', style: 'font-size:0.78rem; margin-top:14px' },
        '⌚ Fitbit auto-sync is off — add a Fitbit Client ID to config.js (SETUP.md) to enable it. Apple Watch data is entered on the Weight tab.');
    }
    return el('div', { style: 'margin-top:14px' },
      el('label', { class: 'muted', style: 'font-size:0.85rem' }, 'Fitbit'),
      el('div', { class: 'row' },
        isFitbitConnected()
          ? el('button', {
              class: 'btn btn-small',
              onclick: () => { disconnectFitbit(); close(); actions.toast('Fitbit disconnected'); },
            }, 'Disconnect Fitbit')
          : el('button', { class: 'btn btn-small btn-primary', onclick: () => connectFitbit() }, 'Connect Fitbit'),
      ),
    );
  };

  const close = openModal(
    el('h3', {}, 'Settings'),
    el('label', { class: 'muted', style: 'font-size:0.85rem' }, 'Display name'),
    nameInput,
    el('div', { style: 'margin-top:14px' },
      el('label', { class: 'muted', style: 'font-size:0.85rem' }, 'My units (lifts & body weight)'),
      el('div', { class: 'chip-row' }, unitChip('kg'), unitChip('lbs')),
    ),
    el('div', { style: 'margin-top:14px' },
      el('label', { class: 'muted', style: 'font-size:0.85rem' }, 'Nutrition goal'),
      el('div', { class: 'chip-row' }, goalChip('lose'), goalChip('maintain'), goalChip('gain')),
    ),
    el('div', { style: 'margin-top:14px' },
      el('label', { class: 'muted', style: 'font-size:0.85rem' },
        'Daily targets (leave blank for recommended, shown greyed)'),
      el('div', { class: 'compact-editor' }, targetInput('calories', 'kcal'), targetInput('protein_g', 'Protein g')),
      el('div', { class: 'compact-editor' }, targetInput('carbs_g', 'Carbs g'), targetInput('fat_g', 'Fat g')),
    ),
    fitbitSection(),
    el('div', { class: 'row', style: 'margin-top:14px' },
      el('button', {
        class: 'btn btn-primary grow',
        onclick: () => {
          const updates = { ...pending };
          const name = nameInput.value.trim();
          if (name && name !== me.name) updates.name = name;
          if (Object.keys(updates).length) actions.saveProfile({ ...me, ...updates });
          close();
        },
      }, 'Save'),
      el('button', { class: 'btn', onclick: () => { close(); state.store.signOut(); } }, 'Sign out'),
    ),
    el('p', { class: 'muted', style: 'font-size:0.75rem; margin-bottom:0' },
      `Signed in as ${me.email}${state.store.kind === 'demo' ? ' · demo mode (data stays on this device)' : ''}`),
  );
}
