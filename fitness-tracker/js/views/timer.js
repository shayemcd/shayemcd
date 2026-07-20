// Floating rest timer: pick 60/90/120s, get a countdown chip that vibrates
// and beeps when done. One timer at a time.

import { el } from '../utils.js';

let ticking = null;

export function startRestTimer() {
  document.querySelector('.timer-chip')?.remove();
  clearInterval(ticking);

  const chip = el('div', { class: 'timer-chip' });
  const showPresets = () => {
    chip.replaceChildren(
      el('span', { class: 'muted', style: 'font-size:0.8rem' }, 'Rest:'),
      ...[60, 90, 120].map(s =>
        el('button', { class: 'chip', onclick: () => run(s) }, `${s}s`),
      ),
      el('button', { class: 'x-btn', onclick: () => dismiss() }, '✕'),
    );
  };

  const dismiss = () => {
    clearInterval(ticking);
    chip.remove();
  };

  const run = total => {
    let left = total;
    const label = el('strong', { style: 'min-width:44px; text-align:center' }, fmt(left));
    chip.replaceChildren(
      el('span', {}, '⏱️'),
      label,
      el('button', { class: 'x-btn', onclick: () => dismiss() }, '✕'),
    );
    clearInterval(ticking);
    ticking = setInterval(() => {
      left--;
      if (left <= 0) {
        clearInterval(ticking);
        label.textContent = 'GO!';
        chip.classList.add('done');
        navigator.vibrate?.([200, 100, 200]);
        beep();
        setTimeout(dismiss, 4000);
      } else {
        label.textContent = fmt(left);
      }
    }, 1000);
  };

  showPresets();
  document.body.append(chip);
}

function fmt(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch { /* audio may be blocked before user gesture */ }
}
