const BASE_DRAW = 60;
const MAX_SAVED = 3;
const DEFAULT_BUDGET = 1500;
const MIN_BUDGET = 300;
const MAX_BUDGET = 10000;

const CATEGORIES = [
  { key: 'cpu', label: 'Processor' },
  { key: 'motherboard', label: 'Motherboard' },
  { key: 'ram', label: 'Memory' },
  { key: 'gpu', label: 'Graphics card' },
  { key: 'psu', label: 'Power supply' }
];

const parts = [
  { id: 1, name: 'Ryzen 5 7600', category: 'cpu', price: 220, watts: 65, socket: 'AM5', memType: null, inStock: true, tags: ['amd', '6-core'] },
  { id: 2, name: 'Ryzen 5 5600', category: 'cpu', price: 130, watts: 65, socket: 'AM4', memType: null, inStock: true, tags: ['amd', '6-core', 'budget'] },
  { id: 3, name: 'Core i5-12400F', category: 'cpu', price: 150, watts: 65, socket: 'LGA1700', memType: null, inStock: true, tags: ['intel', '6-core', 'budget'] },
  { id: 4, name: 'Core i7-14700K', category: 'cpu', price: 380, watts: 125, socket: 'LGA1700', memType: null, inStock: true, tags: ['intel', '20-core'] },

  { id: 5, name: 'B650 Board', category: 'motherboard', price: 120, watts: 30, socket: 'AM5', memType: 'DDR5', inStock: true, tags: ['amd', 'ddr5'] },
  { id: 6, name: 'B550 Board', category: 'motherboard', price: 100, watts: 30, socket: 'AM4', memType: 'DDR4', inStock: true, tags: ['amd', 'ddr4', 'budget'] },
  { id: 7, name: 'B660 Board', category: 'motherboard', price: 110, watts: 30, socket: 'LGA1700', memType: 'DDR4', inStock: true, tags: ['intel', 'ddr4'] },
  { id: 8, name: 'Z790 Board', category: 'motherboard', price: 200, watts: 35, socket: 'LGA1700', memType: 'DDR5', inStock: true, tags: ['intel', 'ddr5', 'overclock'] },

  { id: 9, name: '16 GB DDR4', category: 'ram', price: 45, watts: 5, socket: null, memType: 'DDR4', inStock: true, tags: ['ddr4', 'budget'] },
  { id: 10, name: '32 GB DDR4', category: 'ram', price: 80, watts: 8, socket: null, memType: 'DDR4', inStock: true, tags: ['ddr4'] },
  { id: 11, name: '16 GB DDR5', category: 'ram', price: 70, watts: 6, socket: null, memType: 'DDR5', inStock: true, tags: ['ddr5'] },
  { id: 12, name: '32 GB DDR5', category: 'ram', price: 120, watts: 10, socket: null, memType: 'DDR5', inStock: true, tags: ['ddr5'] },

  { id: 13, name: 'RTX 4060', category: 'gpu', price: 300, watts: 115, socket: null, memType: null, inStock: true, tags: ['nvidia', '1080p'] },
  { id: 14, name: 'RX 7700 XT', category: 'gpu', price: 420, watts: 245, socket: null, memType: null, inStock: true, tags: ['amd', '1440p'] },
  { id: 15, name: 'RTX 4070 Super', category: 'gpu', price: 600, watts: 220, socket: null, memType: null, inStock: true, tags: ['nvidia', '1440p'] },
  { id: 16, name: 'RTX 4090', category: 'gpu', price: 1800, watts: 450, socket: null, memType: null, inStock: false, tags: ['nvidia', '4k'] },

  { id: 17, name: '450 W PSU', category: 'psu', price: 55, watts: 450, socket: null, memType: null, inStock: true, tags: ['budget'] },
  { id: 18, name: '650 W PSU', category: 'psu', price: 85, watts: 650, socket: null, memType: null, inStock: true, tags: ['gold'] },
  { id: 19, name: '850 W PSU', category: 'psu', price: 130, watts: 850, socket: null, memType: null, inStock: true, tags: ['gold'] },
  { id: 20, name: '1000 W PSU', category: 'psu', price: 190, watts: 1000, socket: null, memType: null, inStock: true, tags: ['platinum'] }
];

let selected = emptySelection();
let budget = DEFAULT_BUDGET;
let searchText = '';
let categoryFilter = 'all';
let savedBuilds = [];
let buildCounter = 0;

const messageEl = document.getElementById('message');
const budgetInput = document.getElementById('budget');
const budgetHint = document.getElementById('budget-hint');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const catalogEl = document.getElementById('catalog');
const noResultsEl = document.getElementById('no-results');
const buildListEl = document.getElementById('build-list');
const totalEl = document.getElementById('total');
const budgetBar = document.getElementById('budget-bar');
const budgetText = document.getElementById('budget-text');
const powerText = document.getElementById('power-text');
const saveBtn = document.getElementById('save-build');
const clearBtn = document.getElementById('clear-build');
const savedEl = document.getElementById('saved');
const savedEmptyEl = document.getElementById('saved-empty');

function emptySelection() {
  const sel = {};
  for (const cat of CATEGORIES) {
    sel[cat.key] = null;
  }
  return sel;
}

function getPart(id) {
  return parts.find(function (p) { return p.id === id; });
}

function partIn(sel, key) {
  return sel[key] === null ? undefined : getPart(sel[key]);
}

function calcTotal(sel) {
  let total = 0;
  for (let i = 0; i < CATEGORIES.length; i++) {
    const part = partIn(sel, CATEGORIES[i].key);
    if (part !== undefined) {
      total += part.price;
    }
  }
  return total;
}

function calcDraw(sel) {
  let draw = BASE_DRAW;
  for (const cat of CATEGORIES) {
    if (cat.key === 'psu') {
      continue;
    }
    const part = partIn(sel, cat.key);
    if (part !== undefined) {
      draw += part.watts;
    }
  }
  return draw;
}

function money(n) {
  return '$' + n;
}

function setMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = 'message' + (type ? ' message--' + type : '');
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

function getBlockReason(part) {
  if (selected[part.category] === part.id) {
    return '';
  }
  if (!part.inStock) {
    return 'Out of stock.';
  }

  const next = Object.assign({}, selected);
  next[part.category] = part.id;

  const cpu = partIn(next, 'cpu');
  const board = partIn(next, 'motherboard');
  const ram = partIn(next, 'ram');
  const psu = partIn(next, 'psu');

  if (cpu !== undefined && board !== undefined && cpu.socket !== board.socket) {
    return 'Socket conflict: ' + cpu.name + ' needs ' + cpu.socket + ', but ' + board.name + ' has ' + board.socket + '.';
  }
  if (board !== undefined && ram !== undefined && board.memType !== ram.memType) {
    return 'Memory conflict: ' + board.name + ' supports ' + board.memType + ', but ' + ram.name + ' is ' + ram.memType + '.';
  }
  if (psu !== undefined) {
    const draw = calcDraw(next);
    if (draw > psu.watts) {
      return 'Not enough power: the build needs ' + draw + ' W, ' + psu.name + ' gives ' + psu.watts + ' W.';
    }
  }
  const newTotal = calcTotal(next);
  if (newTotal > budget && newTotal > calcTotal(selected)) {
    return 'Over budget by ' + money(newTotal - budget) + '.';
  }
  return '';
}

function togglePart(part) {
  if (selected[part.category] === part.id) {
    selected[part.category] = null;
    setMessage(part.name + ' removed from your build.', 'info');
    render();
    return;
  }
  const reason = getBlockReason(part);
  if (reason !== '') {
    setMessage('Cannot add ' + part.name + '. ' + reason, 'error');
    render();
    return;
  }
  selected[part.category] = part.id;
  setMessage(part.name + ' added.', 'ok');
  render();
}

function saveBuild() {
  const missing = CATEGORIES.filter(function (cat) { return selected[cat.key] === null; });
  if (missing.length > 0) {
    setMessage('Choose a part in every category first. Missing: ' + missing.map(function (c) { return c.label; }).join(', ') + '.', 'error');
    return;
  }
  if (savedBuilds.length >= MAX_SAVED) {
    setMessage('You can save only ' + MAX_SAVED + ' builds. Remove one first.', 'error');
    return;
  }
  buildCounter += 1;
  savedBuilds.push({
    name: 'Build ' + buildCounter,
    parts: Object.assign({}, selected),
    total: calcTotal(selected),
    draw: calcDraw(selected)
  });
  setMessage('Build ' + buildCounter + ' saved.', 'ok');
  render();
}

function clearBuild() {
  selected = emptySelection();
  setMessage('Build cleared.', 'info');
  render();
}

function removeSaved(index) {
  const removed = savedBuilds.splice(index, 1)[0];
  setMessage(removed.name + ' removed from comparison.', 'info');
  render();
}

function matchesFilters(part) {
  const text = searchText.trim().toLowerCase();
  const inCategory = categoryFilter === 'all' || part.category === categoryFilter;
  const inText = text === ''
    || part.name.toLowerCase().includes(text)
    || part.tags.some(function (t) { return t.includes(text); });
  return inCategory && inText;
}

function specLine(part) {
  const bits = [];
  if (part.category === 'psu') {
    bits.push(part.watts + ' W capacity');
  } else {
    bits.push(part.watts + ' W');
  }
  if (part.socket !== null) {
    bits.push(part.socket);
  }
  if (part.memType !== null) {
    bits.push(part.memType);
  }
  return bits.join(' · ');
}

function renderCatalog() {
  catalogEl.replaceChildren();
  const visible = parts.filter(matchesFilters);

  for (const part of visible) {
    const isSelected = selected[part.category] === part.id;
    const reason = getBlockReason(part);
    const card = el('article', 'card part-card');
    card.classList.toggle('is-selected', isSelected);
    card.classList.toggle('is-blocked', reason !== '');

    card.appendChild(el('h3', '', part.name));

    const catLabel = CATEGORIES.find(function (c) { return c.key === part.category; }).label;
    card.appendChild(el('span', 'badge', catLabel));
    card.appendChild(el('p', 'part-card__price', money(part.price)));
    card.appendChild(el('p', 'muted', specLine(part)));

    const tagRow = el('p', 'row');
    for (const tag of part.tags) {
      tagRow.appendChild(el('span', 'tag', tag));
    }
    card.appendChild(tagRow);

    if (reason !== '') {
      card.appendChild(el('p', 'part-card__reason', reason));
    }

    const btn = el('button', 'btn btn--small', isSelected ? 'Remove' : 'Add to build');
    btn.type = 'button';
    btn.dataset.id = String(part.id);
    btn.classList.toggle('btn--primary', !isSelected && reason === '');
    btn.disabled = reason !== '';
    card.appendChild(btn);

    catalogEl.appendChild(card);
  }

  noResultsEl.hidden = visible.length > 0;
}

function renderSummary() {
  buildListEl.replaceChildren();
  for (const cat of CATEGORIES) {
    const part = partIn(selected, cat.key);
    const li = el('li');
    li.appendChild(el('span', '', cat.label));
    if (part === undefined) {
      li.appendChild(el('span', 'is-empty', 'not chosen'));
    } else {
      li.appendChild(el('span', '', part.name + ' (' + money(part.price) + ')'));
    }
    buildListEl.appendChild(li);
  }

  const total = calcTotal(selected);
  const draw = calcDraw(selected);
  const psu = partIn(selected, 'psu');

  totalEl.textContent = money(total);
  totalEl.classList.toggle('is-over', total > budget);
  totalEl.classList.toggle('is-ok', total <= budget && total > 0);

  budgetBar.max = budget;
  budgetBar.value = Math.min(total, budget);
  budgetBar.classList.toggle('progress--over', total > budget);
  budgetText.textContent = total > budget
    ? 'Over budget by ' + money(total - budget) + '.'
    : money(budget - total) + ' left of ' + money(budget) + '.';

  powerText.textContent = 'Power needed: ' + draw + ' W'
    + (psu !== undefined ? ' of ' + psu.watts + ' W available.' : ' (no PSU yet).');
}

function renderSaved() {
  savedEl.replaceChildren();
  savedEmptyEl.hidden = savedBuilds.length > 0;
  saveBtn.disabled = savedBuilds.length >= MAX_SAVED;
  if (savedBuilds.length === 0) {
    return;
  }

  let cheapest = savedBuilds[0].total;
  for (const b of savedBuilds) {
    if (b.total < cheapest) {
      cheapest = b.total;
    }
  }

  const table = el('table');
  const head = el('tr');
  head.appendChild(el('th', '', 'Component'));
  savedBuilds.forEach(function (build, index) {
    const th = el('th', '', build.name + ' ');
    const rm = el('button', 'btn btn--danger btn--small', 'Remove');
    rm.type = 'button';
    rm.dataset.index = String(index);
    th.appendChild(rm);
    head.appendChild(th);
  });
  table.appendChild(el('thead')).appendChild(head);

  const body = el('tbody');
  for (const cat of CATEGORIES) {
    const row = el('tr');
    row.appendChild(el('th', '', cat.label));
    for (const build of savedBuilds) {
      row.appendChild(el('td', '', getPart(build.parts[cat.key]).name));
    }
    body.appendChild(row);
  }
  const drawRow = el('tr');
  drawRow.appendChild(el('th', '', 'Power needed'));
  for (const build of savedBuilds) {
    drawRow.appendChild(el('td', '', build.draw + ' W'));
  }
  body.appendChild(drawRow);

  const totalRow = el('tr');
  totalRow.appendChild(el('th', '', 'Total'));
  for (const build of savedBuilds) {
    const td = el('td', '', money(build.total));
    td.classList.toggle('is-best', build.total === cheapest && savedBuilds.length > 1);
    totalRow.appendChild(td);
  }
  body.appendChild(totalRow);

  table.appendChild(body);
  savedEl.appendChild(table);
}

function render() {
  renderCatalog();
  renderSummary();
  renderSaved();
}

function setupControls() {
  const all = el('option', '', 'All categories');
  all.value = 'all';
  categorySelect.appendChild(all);
  for (const cat of CATEGORIES) {
    const opt = el('option', '', cat.label);
    opt.value = cat.key;
    categorySelect.appendChild(opt);
  }
  budgetInput.value = String(budget);
  budgetHint.textContent = 'Between ' + money(MIN_BUDGET) + ' and ' + money(MAX_BUDGET) + '.';
}

catalogEl.addEventListener('click', function (event) {
  const btn = event.target.closest('button[data-id]');
  if (btn === null || btn.disabled) {
    return;
  }
  const part = getPart(Number(btn.dataset.id));
  if (part !== undefined) {
    togglePart(part);
  }
});

savedEl.addEventListener('click', function (event) {
  const btn = event.target.closest('button[data-index]');
  if (btn !== null) {
    removeSaved(Number(btn.dataset.index));
  }
});

budgetInput.addEventListener('input', function () {
  const value = Number(budgetInput.value);
  const valid = budgetInput.value !== '' && Number.isFinite(value) && value >= MIN_BUDGET && value <= MAX_BUDGET;
  budgetInput.setAttribute('aria-invalid', valid ? 'false' : 'true');
  if (!valid) {
    setMessage('Budget must be a number from ' + money(MIN_BUDGET) + ' to ' + money(MAX_BUDGET) + '. Keeping ' + money(budget) + '.', 'error');
    return;
  }
  budget = Math.floor(value);
  setMessage('Budget set to ' + money(budget) + '.', 'info');
  render();
});

searchInput.addEventListener('input', function () {
  searchText = searchInput.value;
  render();
});

categorySelect.addEventListener('change', function () {
  categoryFilter = categorySelect.value;
  render();
});

saveBtn.addEventListener('click', saveBuild);
clearBtn.addEventListener('click', clearBuild);

setupControls();
setMessage('Pick parts to start your build.', 'info');
render();