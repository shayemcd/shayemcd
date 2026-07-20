// Read-only workout detail (used by Partner and History tabs), shown in a
// modal. Weights are shown in the workout's own unit, with the viewer's unit
// alongside when it differs.

import { el, fmtDate, convertWeight } from '../utils.js';
import { musclesFor, GROUPS } from '../exercises.js';
import { exerciseTrend } from '../progress.js';
import { openModal } from './modal.js';

export function openWorkoutDetail(workout, { ownerProfile, viewerUnit, onCopy, onEdit, onDelete, trendWorkouts }) {
  const unit = workout.unit || 'kg';
  const showBoth = unit !== viewerUnit;

  const fmtW = w => {
    if (w == null || w === '') return '—';
    const own = `${w} ${unit}`;
    if (!showBoth) return own;
    const conv = Math.round(convertWeight(w, unit, viewerUnit) * 10) / 10;
    return `${own} (${conv} ${viewerUnit})`;
  };

  const close = openModal(
    el('div', { class: 'spread' },
      el('h3', {}, `${ownerProfile?.name || '?'} · ${fmtDate(workout.date)}`),
      workout.dayType ? el('span', { class: 'badge' }, workout.dayType) : null,
    ),
    workout.copiedFrom ? el('p', { class: 'muted', style: 'font-size:0.85rem' }, '🤝 Same routine as partner') : null,
    ...(workout.exercises || []).map(ex => {
      const m = musclesFor(ex);
      const canTrend = !ex.cardio && trendWorkouts?.length;
      return el('div', {
        class: 'card exercise-card',
        ...(canTrend ? { style: 'cursor:pointer', onclick: () => openExerciseTrend(ex.name, trendWorkouts, viewerUnit) } : {}),
      },
        el('div', { class: 'exercise-head' },
          el('span', { class: 'exercise-name' }, ex.name, canTrend ? ' 📈' : ''),
          el('span', { class: 'exercise-muscles' }, ex.cardio ? 'cardio' : m.primary.map(g => GROUPS[g] || g).join(' · ')),
        ),
        el('div', { class: 'muted', style: 'font-size:0.9rem' },
          ex.cardio
            ? `${ex.minutes || '—'} min`
            : (ex.sets || []).map((s, i) => `Set ${i + 1}: ${s.reps || '—'} × ${fmtW(s.weight)}`).join('   ·   '),
        ),
      );
    }),
    workout.notes ? el('p', { class: 'muted' }, `📝 ${workout.notes}`) : null,
    el('div', { class: 'row', style: 'margin-top:10px' },
      onCopy ? el('button', { class: 'btn btn-primary grow', onclick: () => { close(); onCopy(); } }, 'Copy to my log') : null,
      onEdit ? el('button', { class: 'btn grow', onclick: () => { close(); onEdit(); } }, 'Edit') : null,
      onDelete ? el('button', { class: 'btn btn-danger', onclick: () => { close(); onDelete(); } }, 'Delete') : null,
    ),
  );
  return close;
}

// Progression chart for one exercise (top-set weight over time).
export function openExerciseTrend(name, workouts, unit) {
  const points = exerciseTrend(name, workouts, unit);
  const canvas = el('canvas');
  openModal(
    el('h3', {}, `📈 ${name}`),
    points.length < 2
      ? el('p', { class: 'muted' }, 'Log this exercise a few more times to see a trend.')
      : el('div', { class: 'chart-wrap' }, canvas),
  );
  if (points.length >= 2 && window.Chart) {
    requestAnimationFrame(() => {
      new Chart(canvas, {
        type: 'line',
        data: {
          datasets: [{
            label: `Top set (${unit})`,
            data: points.map(p => ({ x: p.date, y: p.weight })),
            borderColor: '#e07b39',
            backgroundColor: 'transparent',
            pointRadius: 3,
            tension: 0.25,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { type: 'category', ticks: { color: '#8b98ab', maxTicksLimit: 6 }, grid: { color: '#2a3547' } },
            y: { ticks: { color: '#8b98ab' }, grid: { color: '#2a3547' } },
          },
          plugins: { legend: { labels: { color: '#e8edf4' } } },
        },
      });
    });
  }
}

export function workoutSummary(workout) {
  const exs = workout.exercises || [];
  const names = exs.slice(0, 3).map(e => e.name).join(', ');
  const more = exs.length > 3 ? ` +${exs.length - 3} more` : '';
  const sets = exs.reduce((a, e) => a + (e.sets?.length || 0), 0);
  return `${exs.length} exercise${exs.length === 1 ? '' : 's'} · ${sets} sets — ${names}${more}`;
}
