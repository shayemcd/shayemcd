// Bottom-sheet modal helper. Returns a close() function.

import { el } from '../utils.js';

export function openModal(...children) {
  const modal = el('div', { class: 'modal' }, ...children);
  const backdrop = el('div', { class: 'modal-backdrop' }, modal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  function close() { backdrop.remove(); }
  document.body.append(backdrop);
  return close;
}
