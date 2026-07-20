// Weight tab: daily body-weight entry, watch data (sleep / calories out),
// and the shared trend chart (Chart.js).

import { el, todayStr, fmtDate, convertWeight } from '../utils.js';
import { isFitbitConfigured, isFitbitConnected } from '../fitbit.js';

export function renderWeight(ctx) {
  const { state, helpers, actions } = ctx;
  const me = helpers.me();
  const partner = helpers.partner();
  if (!me) return el('p', { class: 'muted' }, 'Loading…');

  const myUnit = me.unit;
  const todayEntry = state.weights.find(w => w.uid === me.uid && w.date === todayStr());

  const input = el('input', {
    type: 'number', inputmode: 'decimal', step: 'any', min: '0',
    placeholder: `Today's weight (${myUnit})`,
    value: todayEntry ? todayEntry.weight : '',
  });

  const saveToday = () => {
    const v = input.value;
    if (v === '' || isNaN(v)) return;
    const date = todayStr();
    actions.saveWeight({ id: `${me.uid}_${date}`, uid: me.uid, date, weight: Number(v), unit: myUnit });
    actions.toast('Weight saved');
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') saveToday(); });

  const canvas = el('canvas');
  const myRecent = state.weights.filter(w => w.uid === me.uid).slice(0, 14);

  const root = el('div', {},
    el('div', { class: 'view-title' }, 'Body weight'),
    el('div', { class: 'card' },
      el('div', { class: 'row' },
        el('div', { class: 'grow' }, input),
        el('button', { class: 'btn btn-primary btn-small', style: 'margin-top:0', onclick: saveToday },
          todayEntry ? 'Update' : 'Save'),
      ),
      todayEntry ? el('p', { class: 'muted', style: 'font-size:0.82rem; margin:8px 0 0' }, 'Logged for today — save again to correct it.') : null,
    ),
    watchCard(ctx, me),
    el('div', { class: 'card' },
      el('h3', {}, `Trend (${myUnit}, 7-day average)`),
      el('div', { class: 'chart-wrap' }, canvas),
    ),
    myRecent.length
      ? el('div', { class: 'card' },
          el('h3', {}, 'Your recent entries'),
          ...myRecent.map(w =>
            el('div', { class: 'spread', style: 'padding:6px 0' },
              el('span', {}, fmtDate(w.date)),
              el('span', { class: 'row' },
                el('strong', {}, `${w.weight} ${w.unit}`),
                el('button', { class: 'x-btn', 'aria-label': 'Delete entry', onclick: () => actions.deleteWeight(w.id) }, '✕'),
              ),
            ),
          ),
        )
      : null,
  );

  // Chart.js renders after the canvas is attached.
  requestAnimationFrame(() => drawChart(canvas, state.weights, me, partner, myUnit));
  return root;
}

// Watch data for today: synced from Fitbit or entered manually (Apple Watch
// wearers copy the numbers from their phone's Health/Fitness app).
function watchCard(ctx, me) {
  const { helpers, actions } = ctx;
  const date = todayStr();
  const entry = helpers.watchFor(me.uid, date);

  const sleepIn = el('input', {
    type: 'number', inputmode: 'decimal', step: '0.1', min: '0', placeholder: 'hrs',
    value: entry?.sleepMinutes ? Math.round(entry.sleepMinutes / 6) / 10 : '',
  });
  const kcalIn = el('input', {
    type: 'number', inputmode: 'numeric', min: '0', placeholder: 'kcal',
    value: entry?.caloriesOut ?? '',
  });
  const stepsIn = el('input', {
    type: 'number', inputmode: 'numeric', min: '0', placeholder: 'steps',
    value: entry?.steps ?? '',
  });

  const saveWatch = () => {
    actions.saveWatch({
      id: `${me.uid}_${date}`,
      uid: me.uid,
      date,
      sleepMinutes: sleepIn.value === '' ? null : Math.round(Number(sleepIn.value) * 60),
      caloriesOut: kcalIn.value === '' ? null : Number(kcalIn.value),
      steps: stepsIn.value === '' ? null : Number(stepsIn.value),
      source: 'manual',
    });
    actions.toast('Watch data saved');
  };

  const fitbitNote = isFitbitConfigured()
    ? (isFitbitConnected()
        ? el('p', { class: 'muted', style: 'font-size:0.78rem; margin:8px 0 0' }, '⌚ Fitbit connected — syncs on app open. Manual edits are kept too.')
        : el('p', { class: 'muted', style: 'font-size:0.78rem; margin:8px 0 0' }, '⌚ Have a Fitbit? Connect it in ⚙ Settings for automatic sync.'))
    : el('p', { class: 'muted', style: 'font-size:0.78rem; margin:8px 0 0' }, '⌚ Apple Watch: copy today\'s numbers from the Fitness app. Fitbit auto-sync can be enabled in SETUP.md.');

  return el('div', { class: 'card' },
    el('h3', {}, `Today's watch data${entry?.source === 'fitbit' ? ' · synced' : ''}`),
    el('div', { class: 'compact-editor' },
      el('div', { class: 'compact-field grow' }, el('span', { class: 'compact-label' }, 'Sleep (h)'), sleepIn),
      el('div', { class: 'compact-field grow' }, el('span', { class: 'compact-label' }, 'Burned (kcal)'), kcalIn),
      el('div', { class: 'compact-field grow' }, el('span', { class: 'compact-label' }, 'Steps'), stepsIn),
    ),
    el('button', { class: 'btn btn-small', style: 'margin-top:10px', onclick: saveWatch }, 'Save watch data'),
    fitbitNote,
  );
}

function series(weights, uid, unit) {
  return weights
    .filter(w => w.uid === uid)
    .map(w => ({ x: w.date, y: Math.round(convertWeight(w.weight, w.unit || 'kg', unit) * 10) / 10 }))
    .sort((a, b) => a.x.localeCompare(b.x));
}

function movingAvg(points, window = 7) {
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((a, q) => a + q.y, 0) / slice.length;
    return { x: p.x, y: Math.round(avg * 10) / 10 };
  });
}

let chart = null;

function drawChart(canvas, weights, me, partner, unit) {
  if (!window.Chart || !canvas.isConnected) return;
  if (chart) { chart.destroy(); chart = null; }

  const datasets = [];
  const mine = series(weights, me.uid, unit);
  if (mine.length) {
    datasets.push(
      { label: me.name, data: mine, borderColor: me.color || '#e07b39', backgroundColor: 'transparent', pointRadius: 2, tension: 0.3 },
      { label: `${me.name} · 7d avg`, data: movingAvg(mine), borderColor: (me.color || '#e07b39') + '66', borderDash: [6, 4], pointRadius: 0, tension: 0.3 },
    );
  }
  if (partner) {
    const theirs = series(weights, partner.uid, unit);
    if (theirs.length) {
      datasets.push(
        { label: partner.name, data: theirs, borderColor: partner.color || '#3b82c4', backgroundColor: 'transparent', pointRadius: 2, tension: 0.3 },
        { label: `${partner.name} · 7d avg`, data: movingAvg(theirs), borderColor: (partner.color || '#3b82c4') + '66', borderDash: [6, 4], pointRadius: 0, tension: 0.3 },
      );
    }
  }

  if (!datasets.length) return;

  chart = new Chart(canvas, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { type: 'category', ticks: { color: '#8b98ab', maxTicksLimit: 6 }, grid: { color: '#2a3547' } },
        y: { ticks: { color: '#8b98ab' }, grid: { color: '#2a3547' } },
      },
      plugins: {
        legend: { labels: { color: '#e8edf4', boxWidth: 18 } },
      },
    },
  });
}
