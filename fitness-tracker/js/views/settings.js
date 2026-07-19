// Settings modal: display name, preferred unit, sign out.

import { el } from '../utils.js';
import { openModal } from './modal.js';

export function openSettings(ctx) {
  const { state, actions, helpers } = ctx;
  const me = helpers.me();
  if (!me) return;

  const nameInput = el('input', { type: 'text', value: me.name, maxlength: '20' });

  const unitChip = unit =>
    el('button', {
      class: 'chip' + (me.unit === unit ? ' selected' : ''),
      onclick: () => {
        actions.saveProfile({ ...me, unit });
        close();
        actions.toast(`Units set to ${unit}`);
      },
    }, unit === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)');

  const close = openModal(
    el('h3', {}, 'Settings'),
    el('label', { class: 'muted', style: 'font-size:0.85rem' }, 'Display name'),
    nameInput,
    el('div', { style: 'margin-top:14px' },
      el('label', { class: 'muted', style: 'font-size:0.85rem' }, 'My units (lifts & body weight)'),
      el('div', { class: 'chip-row' }, unitChip('kg'), unitChip('lbs')),
    ),
    el('div', { class: 'row', style: 'margin-top:14px' },
      el('button', {
        class: 'btn btn-primary grow',
        onclick: () => {
          const name = nameInput.value.trim();
          if (name && name !== me.name) actions.saveProfile({ ...me, name });
          close();
        },
      }, 'Save'),
      el('button', { class: 'btn', onclick: () => { close(); state.store.signOut(); } }, 'Sign out'),
    ),
    el('p', { class: 'muted', style: 'font-size:0.75rem; margin-bottom:0' },
      `Signed in as ${me.email}${state.store.kind === 'demo' ? ' · demo mode (data stays on this device)' : ''}`),
  );
}
