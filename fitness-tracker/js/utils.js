// Small shared helpers: units, dates, DOM.

export const KG_PER_LB = 0.45359237;

export function kgToLbs(kg) { return kg / KG_PER_LB; }
export function lbsToKg(lbs) { return lbs * KG_PER_LB; }

// Convert a weight value between 'kg' and 'lbs'.
export function convertWeight(value, fromUnit, toUnit) {
  if (value == null || value === '' || isNaN(value)) return null;
  const v = Number(value);
  if (fromUnit === toUnit) return v;
  return fromUnit === 'kg' ? kgToLbs(v) : lbsToKg(v);
}

export function roundWeight(value) {
  if (value == null) return null;
  // Round to 1 decimal, strip trailing .0
  const r = Math.round(value * 10) / 10;
  return Number.isInteger(r) ? r : r;
}

export function fmtWeight(value, unit) {
  if (value == null || value === '' || isNaN(value)) return '—';
  const r = Math.round(Number(value) * 10) / 10;
  return `${r} ${unit}`;
}

// Dates as 'YYYY-MM-DD' local strings.
export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return todayStr(dt);
}

export function daysBetween(fromStr, toStr) {
  const [y1, m1, d1] = fromStr.split('-').map(Number);
  const [y2, m2, d2] = toStr.split('-').map(Number);
  const a = new Date(y1, m1 - 1, d1);
  const b = new Date(y2, m2 - 1, d2);
  return Math.round((b - a) / 86400000);
}

export function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const today = todayStr();
  if (dateStr === today) return 'Today';
  if (dateStr === addDays(today, -1)) return 'Yesterday';
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// Tiny DOM helper: el('div', {class: 'x', onclick: fn}, child1, child2...)
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2), v);
    } else if (k === 'class') {
      node.className = v;
    } else if (k === 'dataset') {
      Object.assign(node.dataset, v);
    } else if (k === 'value') {
      node.value = v;
    } else {
      node.setAttribute(k, v);
    }
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(child));
  }
  return node;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
