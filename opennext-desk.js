// OpenDesk is a local market-operations view. Indicative series and activity
// fixtures are deliberately deterministic; no live feed or orderbook is used.
const STORAGE_KEY = 'opennext.desk.reservations.v1';
const MARKET_AS_OF = '2026-09-14T09:00:00Z';
const DAY = 86400000;
const GPU_MARKETS = [
  { id: 'H100', spec: 'SXM · 80 GB HBM3', rate: 2.72, change: 3.42, available: 4096 },
  { id: 'H200', spec: 'SXM · 141 GB HBM3e', rate: 3.89, change: 2.10, available: 2048 },
  { id: 'B300', spec: 'Blackwell Ultra · 288 GB HBM3e', rate: 7.45, change: 1.68, available: 512 },
  { id: 'B200', spec: 'Blackwell · 180 GB HBM3e', rate: 5.65, change: 4.18, available: 1024 },
  { id: 'A100', spec: 'SXM · 80 GB HBM2e', rate: 1.26, change: -1.56, available: 6144 },
  { id: 'L40S', spec: 'Ada Lovelace · 48 GB GDDR6', rate: .84, change: .72, available: 3072 },
];
const REGIONS = [
  { id: 'Singapore', code: 'AP-SG', multiplier: 1, suppliers: 6 },
  { id: 'US East', code: 'US-EAST', multiplier: .88, suppliers: 9 },
  { id: 'US West', code: 'US-WEST', multiplier: .91, suppliers: 7 },
  { id: 'Frankfurt', code: 'EU-DE', multiplier: 1.06, suppliers: 5 },
  { id: 'Tokyo', code: 'AP-JP', multiplier: 1.09, suppliers: 4 },
];
const recentFixtures = [
  ['H100', 'Order completed', '64 GPUs', 'Singapore', '09:00'],
  ['H200', 'Order delivered', '32 GPUs', 'US East', '08:57'],
  ['B300', 'Order completed', '16 GPUs', 'Frankfurt', '08:53'],
  ['H100', 'Order delivered', '128 GPUs', 'US West', '08:48'],
  ['B200', 'Order completed', '64 GPUs', 'Singapore', '08:42'],
  ['H200', 'Order completed', '16 GPUs', 'Tokyo', '08:38'],
];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const number = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
const money = (value, digits = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const shortDate = value => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const clean = (value, fallback) => String(value || fallback).replace(/[\u0000-\u001f]/g, '').slice(0, 120);
const finite = (value, fallback, min = 0, max = 1e12) => { const n = Number(value); return Number.isFinite(n) && n >= min && n <= max ? n : fallback; };
let view = { gpu: 'H100', region: 'Singapore', range: '1M', tab: 'capacity', query: '', paused: false, point: -1 };
let reservations = [];
let initialized = false;
let loaded = false;
const seededAt = Date.now();

export function normalizeDeskReservation(detail = {}) {
  if (!detail || typeof detail !== 'object' || Array.isArray(detail)) return null;
  const gpu = clean(detail.gpu || detail.accelerator || detail.model, 'H100');
  const quantity = Math.floor(finite(detail.quantity ?? detail.gpuCount, 64, 1, 100000));
  const durationDays = finite(detail.durationDays ?? detail.days ?? (detail.hours ? Number(detail.hours) / 24 : undefined) ?? (detail.months ? Number(detail.months) * 30 : undefined), 30, 1, 3650);
  const totalPrice = finite(detail.totalPrice ?? detail.total ?? detail.amount ?? detail.price, 198000, 0, 1e12);
  const startCandidate = detail.startDate || detail.startsAt || Date.now() + 7 * DAY;
  const start = new Date(startCandidate).getTime();
  return {
    id: clean(detail.id || detail.orderId || detail.reservationId, `ON-${Date.now().toString(36).toUpperCase()}`),
    gpu, quantity, durationDays, totalPrice,
    hourlyRate: finite(detail.hourlyRate ?? detail.rate, totalPrice / quantity / durationDays / 24, 0, 1e6),
    region: clean(detail.region, 'Singapore'), supplier: clean(detail.supplier || detail.supplierName, 'Meridian Compute'),
    startDate: Number.isFinite(start) ? start : Date.now() + 7 * DAY,
    status: 'Reserved', createdAt: finite(detail.createdAt, Date.now(), 1, 1e14),
  };
}

function loadReservations() {
  if (loaded) return;
  loaded = true;
  try {
    const data = JSON.parse(globalThis.sessionStorage?.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(data)) reservations = data.slice(0, 40).filter(item => item && typeof item === 'object').map(normalizeDeskReservation).filter(Boolean);
  } catch { reservations = []; }
}
function persistReservations() { try { globalThis.sessionStorage?.setItem(STORAGE_KEY, JSON.stringify(reservations)); } catch { /* Storage is optional. */ } }
function gpu() { return GPU_MARKETS.find(item => item.id === view.gpu) || GPU_MARKETS[0]; }
function region() { return REGIONS.find(item => item.id === view.region) || REGIONS[0]; }
function price(item = gpu(), place = region()) { return item.rate * place.multiplier; }

export function createDeskSeries(gpuId = 'H100', regionId = 'Singapore', range = '1M') {
  const item = GPU_MARKETS.find(entry => entry.id === gpuId) || GPU_MARKETS[0];
  const place = REGIONS.find(entry => entry.id === regionId) || REGIONS[0];
  const spans = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 };
  const days = spans[range] || 30;
  const end = Date.parse(MARKET_AS_OF);
  const base = price(item, place);
  const seed = GPU_MARKETS.indexOf(item) + REGIONS.indexOf(place) * .65;
  const amplitude = days === 1 ? .008 : days < 31 ? .024 : .058;
  const raw = Array.from({ length: 73 }, (_, i) => base * (1 + amplitude * (Math.sin(i * .17 + seed) + .38 * Math.sin(i * .61 + seed) + .2 * Math.cos(i * 1.37)) + (i - 72) / 72 * (days / 365 * .09 + item.change / 100)));
  const correction = base - raw.at(-1);
  return raw.map((value, index) => ({ time: end - days * DAY + index / 72 * days * DAY, value: Math.max(.01, value + correction) }));
}

function chartGeometry() {
  const series = createDeskSeries(view.gpu, view.region, view.range);
  const low = Math.min(...series.map(p => p.value));
  const high = Math.max(...series.map(p => p.value));
  const padding = (high - low) * .2 || .1;
  const min = low - padding, max = high + padding;
  const points = series.map((p, i) => ({ ...p, x: 12 + i / (series.length - 1) * 654, y: 16 + (max - p.value) / (max - min) * 180 }));
  return { series, min, max, points, path: points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') };
}

function chart() {
  const { min, max, points, path } = chartGeometry();
  const last = points.at(-1);
  return `<div class="od-chart" data-desk-chart><svg viewBox="0 0 742 232" role="img" tabindex="0" aria-label="${esc(view.gpu)} indicative GPU compute index, ${esc(view.region)}, ${view.range}. Use left and right arrow keys to inspect prices." data-desk-chart-svg>
    <defs><linearGradient id="od-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".10"/><stop offset="100%" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
    ${Array.from({ length: 5 }, (_, i) => `<line class="od-grid-line" x1="12" x2="666" y1="${16 + i * 45}" y2="${16 + i * 45}"/><text class="od-chart-label" x="682" y="${20 + i * 45}">${(max - (max - min) * i / 4).toFixed(2)}</text>`).join('')}
    <path class="od-chart-area" d="${path} L666,196 L12,196 Z" fill="url(#od-chart-fill)"/>
    <path class="od-chart-line" d="${path}" fill="none"/>
    <circle class="od-chart-end" cx="${last.x}" cy="${last.y.toFixed(2)}" r="3.5"/>
    ${[0, 18, 36, 54, 72].map(i => `<text class="od-chart-label" x="${points[i].x}" y="219" text-anchor="${i === 0 ? 'start' : i === 72 ? 'end' : 'middle'}">${view.range === '1D' ? new Date(points[i].time).toISOString().slice(11, 16) : shortDate(points[i].time)}</text>`).join('')}
    <g data-desk-crosshair visibility="hidden"><line class="od-crosshair" x1="12" x2="12" y1="12" y2="196"/><circle class="od-chart-hover-dot" cx="12" cy="16" r="4.5"/></g>
  </svg><div class="od-chart-tooltip" data-desk-tooltip hidden></div></div>`;
}

function marketList() {
  const rows = GPU_MARKETS.filter(item => item.id.toLowerCase().includes(view.query.toLowerCase()));
  return `<section class="od-panel od-watchlist"><div class="od-panel-title"><h2>GPU markets</h2><span>USD / GPU·hr</span></div><label class="od-search"><span aria-hidden="true">⌕</span><input type="search" data-desk-search aria-label="Search GPU markets" placeholder="Find a GPU" value="${esc(view.query)}" maxlength="20"></label><div class="od-watchlist-head"><span>GPU</span><span>Index</span><span>24h</span></div><div data-desk-watchlist>${rows.length ? rows.map(item => `<button type="button" class="od-market-row${view.gpu === item.id ? ' is-selected' : ''}" data-desk-gpu="${item.id}" aria-pressed="${view.gpu === item.id}"><strong>${item.id}</strong><span>${money(price(item), 2)}</span><small class="${item.change < 0 ? 'od-down' : 'od-up'}">${item.change > 0 ? '+' : ''}${item.change.toFixed(2)}%</small></button>`).join('') : '<p class="od-no-results">No matching GPU.</p>'}</div></section>`;
}

function regionList() {
  return `<section class="od-panel od-regions"><div class="od-panel-title"><h2>Regional view</h2><span>${view.gpu}</span></div>${REGIONS.map(place => `<button type="button" class="od-region-row${place.id === view.region ? ' is-selected' : ''}" data-desk-region="${place.id}" aria-pressed="${place.id === view.region}"><span><strong>${place.id}</strong><small>${place.code}</small></span><span><strong>${money(price(gpu(), place), 2)}</strong><small>${place.suppliers} suppliers</small></span></button>`).join('')}<p class="od-region-note">Like-for-like capacity.<br>Final terms vary by supplier.</p></section>`;
}

function recentMatches() {
  const matches = [...reservations.slice(0, 2).map(item => [item.gpu, 'Order reserved', `${item.quantity} GPUs`, item.region, 'Just now']), ...recentFixtures];
  const batch = matches.map(([model, status, , , time]) => `<article class="od-match"><span class="od-match-top"><strong>${esc(model)}</strong><small>${esc(time)}</small></span><p><i aria-hidden="true"></i>${esc(status)}</p></article>`).join('');
  return `<section class="od-panel od-recent"><div class="od-panel-title"><h2>Recent matches</h2><button type="button" class="od-icon-button" data-desk-action="pause" aria-label="${view.paused ? 'Resume' : 'Pause'} recent matches" aria-pressed="${view.paused}">${view.paused ? '▶' : 'Ⅱ'}</button></div><p class="od-recent-intro">Across the network</p><div class="od-match-window"><div class="od-match-track${view.paused ? ' is-paused' : ''}"><div>${batch}</div><div aria-hidden="true">${batch}</div></div></div><div class="od-recent-footer"><span class="od-status-dot"></span>Completed &amp; delivered</div></section>`;
}

function seededCapacity() {
  return [
    { id: 'ON-9428', gpu: 'H100 SXM', quantity: 32, region: 'Singapore', supplier: 'Meridian Compute', hourlyRate: 2.28, startDate: seededAt - DAY, durationDays: 3, totalPrice: 5253.12, status: 'Running' },
    { id: 'ON-9426', gpu: 'A100 80GB', quantity: 8, region: 'US East', supplier: 'Aperture Compute', hourlyRate: 1.18, startDate: seededAt - 9 * 3600000, durationDays: .5, totalPrice: 113.28, status: 'Running' },
    { id: 'ON-9425', gpu: 'H200', quantity: 16, region: 'Frankfurt', supplier: 'Vertex Infrastructure', hourlyRate: 3.10, startDate: seededAt + 2 * 3600000, durationDays: 1, totalPrice: 1190.4, status: 'Scheduled' },
  ];
}
function statusTag(status) { return `<span class="od-status od-status-${status.toLowerCase()}">${esc(status)}</span>`; }
function capacityTable() {
  const all = [...reservations, ...seededCapacity()];
  return `<div class="od-table-scroll"><table class="od-table"><thead><tr><th>Capacity / region</th><th>Status</th><th class="od-numeric">GPUs</th><th>Reservation</th><th class="od-numeric">Rate / GPU·hr</th><th class="od-numeric">Committed</th></tr></thead><tbody>${all.map(item => `<tr><td><strong>${esc(item.gpu)}</strong><small>${esc(item.region)}</small></td><td>${statusTag(item.status)}</td><td class="od-numeric">${number(item.quantity)}</td><td><strong>${shortDate(item.startDate)} – ${shortDate(item.startDate + item.durationDays * DAY)}</strong><small>${number(item.durationDays * 24)} hours</small></td><td class="od-numeric">${money(item.hourlyRate, 2)}</td><td class="od-numeric"><strong>${money(item.totalPrice, 2)}</strong></td></tr>`).join('')}</tbody></table></div>`;
}
function ordersTable() {
  const all = [...reservations, ...seededCapacity()];
  return `<div class="od-table-scroll"><table class="od-table"><thead><tr><th>Order</th><th>Supplier / capacity</th><th>Status</th><th class="od-numeric">Term</th><th class="od-numeric">Total</th></tr></thead><tbody>${all.map(item => `<tr><td><strong>${esc(item.id)}</strong><small>${shortDate(item.createdAt || seededAt)}</small></td><td><strong>${esc(item.supplier)}</strong><small>${item.quantity} × ${esc(item.gpu)} · ${esc(item.region)}</small></td><td>${statusTag(item.status === 'Running' ? 'Delivered' : 'Reserved')}</td><td class="od-numeric">${number(item.durationDays * 24)} hr</td><td class="od-numeric">${money(item.totalPrice, 2)}</td></tr>`).join('')}</tbody></table></div>`;
}
function activityTable() {
  return `<div class="od-table-scroll"><table class="od-table"><thead><tr><th>Activity</th><th>Scope</th><th>Status</th><th>Authorization</th></tr></thead><tbody>${reservations.length ? reservations.map(item => `<tr><td><strong>Capacity reservation</strong><small>${esc(item.id)}</small></td><td>${item.quantity} × ${esc(item.gpu)}<small>${esc(item.supplier)}</small></td><td>${statusTag('Completed')}</td><td><strong>Buyer approved</strong><small>VETA Guardrail passed</small></td></tr>`).join('') : '<tr><td colspan="4"><div class="od-empty-activity"><span aria-hidden="true">↗</span><div><strong>Your next task starts with a brief.</strong><p>Ask your agent to source capacity. Approved actions and reservations will appear here.</p></div></div></td></tr>'}</tbody></table></div>`;
}
function holdings() {
  const all = [...reservations, ...seededCapacity()];
  const active = all.filter(item => item.status === 'Running').reduce((sum, item) => sum + item.quantity, 0);
  const reserved = all.filter(item => item.status !== 'Running').reduce((sum, item) => sum + item.quantity, 0);
  return `<section class="od-panel od-holdings"><div class="od-holdings-head"><div class="od-tabs" role="tablist" aria-label="My capacity activity">${[['capacity', 'Capacity'], ['orders', 'Orders'], ['activity', 'Agent activity']].map(([id, label]) => `<button type="button" id="od-tab-${id}" role="tab" aria-controls="od-tabpanel" aria-selected="${view.tab === id}" tabindex="${view.tab === id ? 0 : -1}" data-desk-tab="${id}">${label}${id !== 'activity' ? `<span>${all.length}</span>` : reservations.length ? `<span>${reservations.length}</span>` : ''}</button>`).join('')}</div><span class="od-holdings-currency">USD</span></div><div class="od-portfolio-summary"><div><span>Running</span><strong>${number(active)}<small>GPUs</small></strong></div><div><span>Reserved</span><strong>${number(reserved)}<small>GPUs</small></strong></div><div><span>Committed</span><strong>${money(all.reduce((sum, item) => sum + item.totalPrice, 0))}</strong></div></div><div id="od-tabpanel" role="tabpanel" aria-labelledby="od-tab-${view.tab}" tabindex="0">${view.tab === 'capacity' ? capacityTable() : view.tab === 'orders' ? ordersTable() : activityTable()}</div></section>`;
}

function insights() {
  const items = [
    ['Procurement note', 'The hourly rate is only part of the cost.', 'Compare networking, storage, egress, support and minimum commitments before choosing a supplier. A lower GPU-hour rate does not always produce a lower total reservation cost.'],
    ['Capacity planning', 'Match delivery dates before comparing prices.', 'Confirm your required start date, region, interconnect and allocation size first. A quote is actionable only when the supplier can meet the complete specification.'],
    ['Index methodology', 'An index is a reference, not an executable offer.', 'The GCI line compares indicative GPU-hour pricing over time. It is not a bid, ask or guaranteed transaction price. Figures shown in this workspace are illustrative and do not represent a real-time supplier feed.'],
  ];
  return `<section class="od-panel od-insights"><div class="od-panel-title"><h2>Market perspective</h2><span>For better procurement decisions</span></div>${items.map(([type, title, body]) => `<details><summary><small>${type}</small><strong>${title}</strong><span aria-hidden="true">↗</span></summary><p>${body}</p></details>`).join('')}</section>`;
}

export function renderOpenDesk() {
  loadReservations();
  const item = gpu(), place = region();
  const series = createDeskSeries(view.gpu, view.region, view.range);
  const periodChange = (series.at(-1).value / series[0].value - 1) * 100;
  return `<section class="od-desk" id="openDesk" aria-label="My OpenDesk"><header class="od-heading"><div><p class="od-eyebrow">MY OPENNEXT / MY OPENDESK</p><h1>A clearer view of compute.</h1></div><div class="od-heading-actions"><span class="od-simulation" title="Prices, matches and reservations in this workspace are simulated.">Simulation</span><button type="button" class="od-source-button" data-desk-action="source">Source capacity <span aria-hidden="true">↗</span></button></div></header>
    <div class="od-market-bar"><label><span>GPU</span><select data-desk-select="gpu" aria-label="GPU model">${GPU_MARKETS.map(entry => `<option value="${entry.id}"${entry.id === view.gpu ? ' selected' : ''}>NVIDIA ${entry.id}</option>`).join('')}</select></label><label><span>Region</span><select data-desk-select="region" aria-label="Delivery region">${REGIONS.map(entry => `<option value="${entry.id}"${entry.id === view.region ? ' selected' : ''}>${entry.id} · ${entry.code}</option>`).join('')}</select></label><div class="od-market-asof"><span>Indicative · USD / GPU·hr</span><time datetime="${MARKET_AS_OF}">14 Sep 2026, 09:00 UTC</time></div></div>
    <div class="od-layout"><aside class="od-markets" aria-label="Market selection">${marketList()}${regionList()}</aside><section class="od-panel od-index"><div class="od-index-title"><div><h2>${item.id}<span>/ ${place.code}</span></h2><p>${item.spec}</p></div><span class="od-reference-tag">GCI REFERENCE</span></div><div class="od-index-stats"><div class="od-main-price"><span>GPU compute index</span><strong>${money(price(), 2)}<small class="${periodChange < 0 ? 'od-down' : 'od-up'}">${periodChange >= 0 ? '+' : ''}${periodChange.toFixed(2)}%<em>${view.range}</em></small></strong></div><div><span>Listed capacity</span><strong>${number(Math.round(item.available * (place.id === 'US East' ? 1.5 : 1)))}<small>GPUs</small></strong></div><div><span>Suppliers</span><strong>${place.suppliers}<small>in region</small></strong></div></div><div class="od-chart-toolbar"><div role="group" aria-label="Chart period">${['1D', '1W', '1M', '3M', '1Y'].map(range => `<button type="button" data-desk-range="${range}" aria-pressed="${view.range === range}">${range}</button>`).join('')}</div><span><i aria-hidden="true"></i>Price index</span></div>${chart()}<div class="od-chart-footer"><span>Indicative pricing · not an executable offer</span><span data-desk-chart-reading>Hover to inspect</span></div></section>${recentMatches()}${holdings()}</div>${insights()}</section>`;
}

function refresh() {
  const root = document.getElementById('openDesk');
  if (root) root.outerHTML = renderOpenDesk();
}
function showPoint(index) {
  const root = document.querySelector('[data-desk-chart]');
  if (!root) return;
  const { points } = chartGeometry();
  view.point = Math.max(0, Math.min(points.length - 1, index));
  const point = points[view.point], crosshair = root.querySelector('[data-desk-crosshair]');
  crosshair.setAttribute('visibility', 'visible');
  crosshair.querySelector('line').setAttribute('x1', point.x); crosshair.querySelector('line').setAttribute('x2', point.x);
  crosshair.querySelector('circle').setAttribute('cx', point.x); crosshair.querySelector('circle').setAttribute('cy', point.y);
  const tooltip = root.querySelector('[data-desk-tooltip]');
  tooltip.hidden = false;
  tooltip.style.left = `${Math.min(73, Math.max(4, point.x / 742 * 100))}%`;
  tooltip.innerHTML = `<span>${shortDate(point.time)}${view.range === '1D' ? ` · ${new Date(point.time).toISOString().slice(11, 16)} UTC` : ''}</span><strong>${money(point.value, 3)}<small>/ GPU·hr</small></strong>`;
  document.querySelector('[data-desk-chart-reading]').textContent = `${shortDate(point.time)} · ${money(point.value, 3)} / GPU·hr`;
}

export function initializeOpenDesk() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  loadReservations();
  window.addEventListener('click', event => {
    const target = event.target.closest?.('[data-desk-gpu], [data-desk-region], [data-desk-range], [data-desk-tab], [data-desk-action]');
    if (!target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (target.dataset.deskAction === 'source') { window.dispatchEvent(new Event('opennext:open-agent')); return; }
    if (target.dataset.deskGpu) view.gpu = target.dataset.deskGpu;
    if (target.dataset.deskRegion) view.region = target.dataset.deskRegion;
    if (target.dataset.deskRange) view.range = target.dataset.deskRange;
    if (target.dataset.deskTab) view.tab = target.dataset.deskTab;
    if (target.dataset.deskAction === 'pause') view.paused = !view.paused;
    const focusSelector = target.dataset.deskTab ? `[data-desk-tab="${target.dataset.deskTab}"]` : target.dataset.deskRange ? `[data-desk-range="${target.dataset.deskRange}"]` : target.dataset.deskAction ? `[data-desk-action="${target.dataset.deskAction}"]` : null;
    refresh();
    if (focusSelector) document.querySelector(focusSelector)?.focus({ preventScroll: true });
  }, true);
  window.addEventListener('change', event => {
    const select = event.target.closest?.('[data-desk-select]');
    if (!select) return;
    const key = select.dataset.deskSelect;
    if (key === 'gpu' && GPU_MARKETS.some(item => item.id === select.value)) view.gpu = select.value;
    if (key === 'region' && REGIONS.some(item => item.id === select.value)) view.region = select.value;
    refresh(); document.querySelector(`[data-desk-select="${key}"]`)?.focus({ preventScroll: true });
  });
  window.addEventListener('input', event => {
    if (!event.target.matches?.('[data-desk-search]')) return;
    view.query = event.target.value.slice(0, 20);
    const wrapper = document.createElement('div'); wrapper.innerHTML = marketList();
    document.querySelector('[data-desk-watchlist]').replaceChildren(...wrapper.querySelector('[data-desk-watchlist]').childNodes);
  });
  window.addEventListener('pointermove', event => {
    const svg = event.target.closest?.('[data-desk-chart-svg]'); if (!svg) return;
    const box = svg.getBoundingClientRect();
    // The SVG's 742:232 aspect ratio is kept by CSS, so no letterbox correction is needed.
    const x = (event.clientX - box.left) / box.width * 742;
    showPoint(Math.round((x - 12) / 654 * 72));
  });
  window.addEventListener('pointerout', event => {
    const chart = event.target.closest?.('[data-desk-chart]');
    if (!chart || chart.contains(event.relatedTarget)) return;
    chart.querySelector('[data-desk-crosshair]')?.setAttribute('visibility', 'hidden');
    const tooltip = chart.querySelector('[data-desk-tooltip]'); if (tooltip) tooltip.hidden = true;
  });
  window.addEventListener('keydown', event => {
    const tab = event.target.closest?.('[data-desk-tab]');
    if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const tabs = ['capacity', 'orders', 'activity'];
      const position = tabs.indexOf(view.tab);
      view.tab = tabs[event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (position + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
      refresh(); document.querySelector(`[data-desk-tab="${view.tab}"]`)?.focus(); return;
    }
    if (!event.target.matches?.('[data-desk-chart-svg]') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    showPoint(event.key === 'Home' ? 0 : event.key === 'End' ? 72 : (view.point < 0 ? 36 : view.point) + (event.key === 'ArrowRight' ? 1 : -1));
  });
  window.addEventListener('opennext:reservation', event => {
    const record = normalizeDeskReservation(event.detail);
    if (!record || reservations.some(item => item.id === record.id)) return;
    reservations.unshift(record); reservations = reservations.slice(0, 40);
    view.tab = 'orders'; persistReservations(); refresh();
  });
  window.addEventListener('opennext:signout', () => {
    reservations = []; view = { gpu: 'H100', region: 'Singapore', range: '1M', tab: 'capacity', query: '', paused: false, point: -1 };
    try { globalThis.sessionStorage?.removeItem(STORAGE_KEY); } catch { /* Storage is optional. */ }
  });
}
