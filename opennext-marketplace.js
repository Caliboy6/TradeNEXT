// Private buyer requests and supplier inventory share one matching workspace.
let api, installed = false, currentRoute = 'rfq', composer = null;
const filters = { rfq: 'all', supply: 'all' };
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const number = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0);
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value) || 0);
const rate = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 6 }).format(Number(value) || 0);
const deliveryDeadline = record => new Date(Date.parse(record.createdAt) + Number(record.deliveryHours) * 3600000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
const months = value => `${number(value)} ${Number(value) === 1 ? 'month' : 'months'}`;
const today = () => new Date().toISOString().slice(0, 10);
const date = value => {
  if (!value) return 'Not specified';
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? 'Not specified' : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
};
const tokens = value => Number(value) >= 1e9 ? `${number(Number(value) / 1e9)}B tokens` : Number(value) >= 1e6 ? `${number(Number(value) / 1e6)}M tokens` : `${number(value)} tokens`;
const labelMarket = market => market === 'gpu' ? 'GPU' : 'Token';
const active = record => ['open', 'active'].includes(record.status);
const records = kind => kind === 'supply' ? api.store.supplies : api.store.rfqs;
const findRecord = (kind, id) => records(kind).find(record => record.id === id);
const sourceLabel = value => ({ original: 'Original provider', authorized: 'Authorized partner', independent: 'Independent supplier', any: 'Any source' }[value] || 'Not specified');
const sourceRequirementLabel = value => value === 'authorized' ? 'Original provider or authorized partner' : sourceLabel(value);
const statusLabel = value => ({ open: 'Open', active: 'Active', paused: 'Paused', closed: 'Closed', completed: 'Completed', withdrawn: 'Withdrawn', depleted: 'Depleted' }[value] || value);
const button = (label, action, attributes = '', primary = false) => `<button type="button" class="mp-button${primary ? ' mp-button-primary' : ''}" data-marketplace-action="${action}" ${attributes}>${label}</button>`;
const icon = market => `<span class="mp-market-icon" aria-hidden="true">${market === 'gpu' ? '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14"/><rect x="9" y="9" width="6" height="6"/><path d="M8 2v3m4-3v3m4-3v3M8 19v3m4-3v3m4-3v3M2 8h3m-3 4h3m-3 4h3m14-8h3m-3 4h3m-3 4h3"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 9h8m-8 4h5"/></svg>'}</span>`;

function summary(record, kind) {
  if (record.market === 'token') return `${tokens(record.quotaTokens)} · ${kind === 'supply' ? sourceLabel(record.sourceType) : sourceRequirementLabel(record.sourceRequirement)}`;
  return kind === 'supply' ? `${number(record.servers)} servers × ${number(record.gpusPerServer)} GPUs · ${number(record.totalGpus)} GPUs total` : `${number(record.gpuCount)} GPUs · ${number(record.durationMonths)} ${Number(record.durationMonths) === 1 ? 'month' : 'months'}`;
}
function terms(record, kind) {
  if (record.market === 'token') return `<strong>${rate(kind === 'supply' ? record.inputPrice : record.maxInputPrice)} / ${rate(kind === 'supply' ? record.outputPrice : record.maxOutputPrice)}</strong><small>${kind === 'supply' ? 'Input / output per 1M tokens' : 'Input / output price caps per 1M'}</small>`;
  return `<strong>${money(kind === 'supply' ? record.monthlyPrice : record.monthlyBudget)}<span> / mo</span></strong><small>${kind === 'supply' ? 'Entire inventory asking price' : 'Maximum monthly budget'}</small>`;
}
function schedule(record, kind) {
  if (record.market === 'token') return kind === 'supply' ? `<strong>${Number(record.deliveryHours) === 0 ? 'Immediate delivery' : `Within ${number(record.deliveryHours)} hours`}</strong><small>Available ${date(record.availableFrom)}</small>` : `<strong>${deliveryDeadline(record)}</strong><small>Fixed delivery deadline</small>`;
  return `<strong>${escape(record.region)}</strong><small>${kind === 'supply' ? record.availability === 'unavailable' ? 'Currently unavailable' : `Available ${date(record.availableFrom)}` : `Starts ${date(record.startDate)}`}</small>`;
}

export function renderMarketplacePage(route) {
  currentRoute = route === 'supply' ? 'supply' : 'rfq';
  const kind = currentRoute;
  const all = records(kind);
  const items = all.filter(record => filters[kind] === 'all' || record.market === filters[kind]);
  const title = kind === 'supply' ? 'My Supplies' : 'My RFQs';
  const subtitle = kind === 'supply' ? 'Keep your available capacity current. Receive qualified demand as it matches.' : 'Define your requirements. Find capacity that fits your schedule and budget.';
  const counts = new Map();
  for (const match of api.store.matches) {
    const id = kind === 'supply' ? match.supplyId : match.rfqId;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  const matchCount = all.reduce((total, record) => total + (counts.get(record.id) || 0), 0);
  const row = record => {
    const count = counts.get(record.id) || 0;
    return `<article class="mp-record"><div class="mp-record-name">${icon(record.market)}<div><button type="button" class="mp-record-title" data-marketplace-action="details" data-kind="${kind}" data-id="${escape(record.id)}">${escape(record.model)} <span aria-hidden="true">↗</span></button><p>${escape(summary(record, kind))}</p><span class="mp-record-id">${escape(record.id)}</span></div></div><div class="mp-record-terms">${terms(record, kind)}</div><div class="mp-record-schedule">${schedule(record, kind)}</div><div class="mp-record-status"><span class="mp-status${active(record) ? ' is-active' : ''}"><i></i>${escape(statusLabel(record.status))}</span><button type="button" class="mp-text-button" data-marketplace-action="details" data-kind="${kind}" data-id="${escape(record.id)}">${count ? `${count} ${count === 1 ? 'match' : 'matches'} →` : 'View details →'}</button></div></article>`;
  };
  return `<section class="on-marketplace" data-marketplace-page="${kind}"><header class="mp-page-head"><div><p class="mp-eyebrow">PRIVATE PROCUREMENT</p><h1>${title}</h1><p>${subtitle}</p></div>${button(kind === 'supply' ? '+ List supply' : '+ Post RFQ', 'compose', `data-kind="${kind}"`, true)}</header><div class="mp-overview"><div><span>${kind === 'supply' ? 'Active listings' : 'Open requests'}</span><strong>${all.filter(active).length}</strong></div><div><span>GPU / Token</span><strong>${all.filter(record => record.market === 'gpu').length}<i>/</i>${all.filter(record => record.market === 'token').length}</strong></div><div><span>Potential matches</span><strong>${matchCount}</strong></div></div><div class="mp-ledger"><div class="mp-ledger-head"><nav class="mp-filters" aria-label="${title} market filter">${[['all', 'All markets'], ['gpu', 'GPU'], ['token', 'Token']].map(([value, label]) => `<button type="button" data-marketplace-action="filter" data-filter="${value}" data-kind="${kind}" aria-pressed="${filters[kind] === value}">${label}</button>`).join('')}</nav><span>${items.length} ${items.length === 1 ? 'record' : 'records'}</span></div>${items.length ? `<div class="mp-column-labels" aria-hidden="true"><span>${kind === 'supply' ? 'RESOURCE' : 'REQUIREMENT'}</span><span>COMMERCIAL TERMS</span><span>DELIVERY</span><span>STATUS</span></div><div class="mp-records">${items.map(row).join('')}</div>` : `<div class="mp-empty">${icon(filters[kind] === 'token' ? 'token' : 'gpu')}<h2>${all.length ? `No ${labelMarket(filters[kind])} ${kind === 'supply' ? 'listings' : 'requests'} yet.` : kind === 'supply' ? 'Make room for your next buyer.' : 'Your next allocation starts here.'}</h2><p>${kind === 'supply' ? 'List GPU capacity or token allocations. Matching buyer requests will appear alongside your inventory.' : 'Post a GPU or token requirement. Matching continues as new supplier inventory becomes available.'}</p>${button(kind === 'supply' ? 'List your first resource →' : 'Create a request →', 'compose', `data-kind="${kind}"`, true)}</div>`}</div></section>`;
}

function refreshPage() {
  const current = document.querySelector('[data-marketplace-page]');
  if (current) current.outerHTML = renderMarketplacePage(current.dataset.marketplacePage);
}
function changed() { api.onChange?.(); }
function showDialog(title, body) {
  api.openDialog({ title, body: `<div class="on-marketplace mp-dialog">${body}</div>` });
  const dialog = document.querySelector('#modal-host [role="dialog"]');
  dialog?.classList.add('mp-dialog-shell');
}
const field = (name, label, input, help = '') => `<label class="mp-field" for="mp-${name}"><span>${label}</span>${input}${help ? `<small>${help}</small>` : ''}</label>`;
function input(name, values, options = {}) {
  const { type = 'text', min, max, step, placeholder = '', required = true, list } = options;
  return `<input id="mp-${name}" name="${name}" type="${type}" value="${escape(values[name])}" ${required ? 'required' : ''}${min !== undefined ? ` min="${min}"` : ''}${max !== undefined ? ` max="${max}"` : ''}${step !== undefined ? ` step="${step}"` : ''}${list ? ` list="${list}"` : ''} ${type === 'text' ? 'maxlength="100"' : ''}${type === 'date' ? ' lang="en-US"' : ''} placeholder="${escape(placeholder)}" autocomplete="off">`;
}
function select(name, values, options, required = true) {
  return `<select id="mp-${name}" name="${name}"${required ? ' required' : ''}>${options.map(([value, label]) => `<option value="${escape(value)}" ${String(values[name]) === value ? 'selected' : ''}>${label}</option>`).join('')}</select>`;
}
const section = (label, body) => `<fieldset class="mp-form-section"><legend>${label}</legend><div class="mp-form-grid">${body}</div></fieldset>`;
const gpuModels = '<datalist id="mp-gpu-models"><option value="H100"></option><option value="H200"></option><option value="B200"></option><option value="B300"></option><option value="A100"></option><option value="MI300X"></option></datalist>';
const tokenModels = '<datalist id="mp-token-models"><option value="GPT-4.1"></option><option value="Claude Sonnet 4.6"></option><option value="Gemini 2.5 Pro"></option><option value="Llama 3.3 70B"></option></datalist>';
const regionOptions = [['United States', 'United States'], ['European Union', 'European Union'], ['United Kingdom', 'United Kingdom'], ['Singapore', 'Singapore'], ['Japan', 'Japan'], ['Canada', 'Canada'], ['Australia', 'Australia']];

function defaultValues(kind, market) {
  if (market === 'gpu') return kind === 'supply'
    ? { model: '', servers: '', gpusPerServer: 8, region: 'United States', minimumMonths: 1, monthlyPrice: '', slaPercent: 99.95, availability: 'available', availableFrom: today(), allowPartial: true, legalEntity: '', billingCadence: 'To be agreed', supportWindow: 'To be agreed', warranty: '', acceptanceWindow: 'To be agreed' }
    : { model: '', gpuCount: '', region: 'Any region', durationMonths: 1, monthlyBudget: '', minSlaPercent: 99.9, startDate: today(), buyerAcceptanceWindow: 'To be agreed', buyerPaymentCadence: 'To be agreed', buyerNetwork: '' };
  return kind === 'supply' ? { model: '', quotaMillions: '', inputPrice: '', outputPrice: '', deliveryHours: 4, sourceType: '', availableFrom: today() } : { model: '', quotaMillions: '', maxInputPrice: '', maxOutputPrice: '', deliveryHours: 24, sourceRequirement: 'authorized' };
}
function gpuFields(kind, values) {
  const numeric = (name, label, options = {}, help = '') => field(name, label, input(name, values, { type: 'number', min: 1, step: 1, ...options }), help);
  const model = field('model', 'GPU model', input('model', values, { list: 'mp-gpu-models', placeholder: 'e.g. H100' })) + gpuModels;
  const region = field('region', kind === 'supply' ? 'Operating region' : 'Required region', input('region', values, { list: 'mp-regions', placeholder: 'e.g. United States or US West' })) + `<datalist id="mp-regions">${(kind === 'supply' ? regionOptions : [['Any region', 'Any region'], ...regionOptions]).map(([value]) => `<option value="${escape(value)}"></option>`).join('')}</datalist>`;
  if (kind === 'supply') return section('Resource configuration', model + region + numeric('servers', 'Available servers', { max: 100000, placeholder: '64' }) + numeric('gpusPerServer', 'GPUs per server', { max: 72 }) + '<p class="mp-computed-total" aria-live="polite"><span>Total available capacity</span><strong data-marketplace-total>0 GPUs</strong></p>') + section('Availability & terms', field('availability', 'Availability', select('availability', values, [['available', 'Idle — ready to allocate'], ['scheduled', 'Available from a date'], ['unavailable', 'Currently unavailable']])) + field('availableFrom', 'Earliest start date', input('availableFrom', values, { type: 'date' })) + numeric('minimumMonths', 'Minimum lease · months', { max: 120 }) + numeric('slaPercent', 'Uptime SLA · %', { min: 0, max: 100, step: 0.01 }) + numeric('monthlyPrice', 'Monthly price · USD', { min: 0.01, max: 1e9, step: 0.01, placeholder: '210000' }, 'Asking price for the entire inventory above.') + `<label class="mp-checkbox"><input type="checkbox" name="allowPartial" ${values.allowPartial ? 'checked' : ''}><span><strong>Allow partial allocations</strong><small>Smaller requests use a proportional share of the monthly price.</small></span></label>`);
  return section('Capacity requirements', model + numeric('gpuCount', 'Total GPUs required', { max: 7200000, placeholder: '64' }) + region + numeric('minSlaPercent', 'Minimum uptime SLA · %', { min: 0, max: 100, step: 0.01, required: false })) + section('Schedule & budget', field('startDate', 'Requested start date', input('startDate', values, { type: 'date', min: today() })) + numeric('durationMonths', 'Lease duration · months', { max: 120 }) + numeric('monthlyBudget', 'Maximum monthly budget · USD', { min: 0.01, max: 1e9, step: 0.01, placeholder: '210000' }, 'Total budget for all requested GPUs, before tax.'));
}
function tokenFields(kind, values) {
  const numeric = (name, label, options = {}, help = '') => field(name, label, input(name, values, { type: 'number', min: 0, max: 1e6, step: 0.000001, ...options }), help);
  const model = field('model', 'Provider & model', input('model', values, { list: 'mp-token-models', placeholder: 'e.g. GPT-4.1' })) + tokenModels;
  const quota = numeric('quotaMillions', kind === 'supply' ? 'Available quota · million tokens' : 'Required quota · million tokens', { min: 0.000001, max: 1e9, step: 0.000001, placeholder: '100' }, 'Total allocation across input and output usage.');
  if (kind === 'supply') return section('Token allocation', model + quota) + section('Pricing & delivery', numeric('inputPrice', 'Input price · USD / 1M tokens', { placeholder: '2.00' }) + numeric('outputPrice', 'Output price · USD / 1M tokens', { placeholder: '8.00' }) + numeric('deliveryHours', 'Delivery lead time · hours', { step: 1, max: 8760 }, 'Use 0 for immediate delivery.') + field('availableFrom', 'Available from', input('availableFrom', values, { type: 'date' })) + field('sourceType', 'Supply source', select('sourceType', values, [['', 'Select supply source'], ['original', 'Original provider'], ['authorized', 'Authorized partner'], ['independent', 'Independent supplier']]), 'Supplier-declared source. Supporting documentation is reviewed before commitment.'));
  return section('Token requirements', model + quota) + section('Price limits & delivery', numeric('maxInputPrice', 'Maximum input price · USD / 1M', { placeholder: '2.00' }) + numeric('maxOutputPrice', 'Maximum output price · USD / 1M', { placeholder: '8.00' }) + numeric('deliveryHours', 'Required delivery within · hours', { min: 1, step: 1, max: 8760 }, 'Deadline starts when your RFQ is posted.') + field('sourceRequirement', 'Acceptable supply source', select('sourceRequirement', values, [['authorized', 'Original provider or authorized partner'], ['original', 'Original provider only'], ['any', 'Any source']])));
}
function rentalAgreementFields(kind, values) {
  const seller = kind === 'supply';
  const flowCopy = seller
    ? 'Publish the reusable seller terms first. Delivery, acceptance and final legal details can be confirmed after a buyer match.'
    : 'Start with the minimum fields that determine a match. The remaining bilateral terms stay open for Message or Agent review.';
  const stages = `<div class="mp-agreement-stages"><div><span>01</span><strong>${seller ? 'Reusable supply terms' : 'Fast match brief'}</strong><small>${seller ? 'Seller can prefill once and reuse.' : 'Buyer only enters what matching needs.'}</small></div><div><span>02</span><strong>Shared confirmation</strong><small>Buyer and seller complete the same rental document.</small></div><div><span>03</span><strong>Final approval</strong><small>Agent or Message fills the remaining terms.</small></div></div>`;
  const fields = seller
    ? section('Reusable seller terms', field('legalEntity', 'Legal entity name', input('legalEntity', values, { required: false, placeholder: 'Optional until buyer match' })) + field('billingCadence', 'Billing cadence', select('billingCadence', values, [['To be agreed', 'To be agreed'], ['Monthly in advance', 'Monthly in advance'], ['Bi-monthly in advance', 'Bi-monthly in advance']], false)) + field('supportWindow', 'Support window', select('supportWindow', values, [['To be agreed', 'To be agreed'], ['Business hours', 'Business hours'], ['7 × 24 support', '7 × 24 support']], false)) + field('warranty', 'Warranty / remedy', input('warranty', values, { required: false, placeholder: 'Optional reusable language' })) + field('acceptanceWindow', 'Acceptance window', select('acceptanceWindow', values, [['To be agreed', 'To be agreed'], ['3 business days', '3 business days'], ['5 business days', '5 business days']], false)))
    : section('Buyer preferences · confirm after match', field('buyerAcceptanceWindow', 'Acceptance window', select('buyerAcceptanceWindow', values, [['To be agreed', 'To be agreed'], ['3 business days', '3 business days'], ['5 business days', '5 business days']], false), 'Leave as To be agreed when the seller should propose the window.') + field('buyerPaymentCadence', 'Payment cadence', select('buyerPaymentCadence', values, [['To be agreed', 'To be agreed'], ['Monthly in advance', 'Monthly in advance'], ['Bi-monthly in advance', 'Bi-monthly in advance']], false), 'This is confirmed in the shared document.') + field('buyerNetwork', 'Network / interconnect preference', input('buyerNetwork', values, { required: false, placeholder: 'e.g. NVLink, InfiniBand, or no preference' }), 'Optional for the first match; add detail later in Message or Agent.'));
  return `<section class="mp-agreement-flow" aria-label="Standard GPU rental agreement"><div class="mp-agreement-flow-head"><div><p class="mp-step-label">STANDARD GPU RENTAL AGREEMENT · V1</p><strong>${seller ? 'Seller-side terms that can be reused' : 'Buyer-side fast match first'}</strong><p>${flowCopy}</p></div><span class="mp-agreement-badge">${seller ? 'SELLER PREFILL' : 'BUYER INTAKE'}</span></div>${stages}<div class="mp-agreement-clauses"><span>Shared document covers</span><p>Delivery schedule · acceptance test · billing and tax · SLA remedies · support · warranty · term and termination.</p></div>${fields}</section>`;
}
function captureDraft() {
  const form = document.querySelector('#marketplaceComposerForm');
  if (!form || !composer?.market) return;
  const values = Object.fromEntries(new FormData(form));
  values.allowPartial = Boolean(form.querySelector('[name="allowPartial"]')?.checked);
  composer.drafts[composer.market] = values;
}
function showMarketPicker() {
  const kind = composer.kind;
  showDialog(kind === 'supply' ? 'List your supply' : 'Post a request', `<p class="mp-step-label">01 / SELECT A MARKET</p><p class="mp-dialog-intro">${kind === 'supply' ? 'What resource would you like to make available?' : 'What kind of capacity are you looking for?'}</p><div class="mp-market-picker">${[['gpu', 'GPU capacity', 'Dedicated accelerators, cluster availability and lease terms.'], ['token', 'Token capacity', 'Model allocations, input and output pricing, and delivery.']].map(([market, title, copy]) => `<button type="button" data-marketplace-action="choose-market" data-market="${market}">${icon(market)}<strong>${title}</strong><span>${copy}</span><b aria-hidden="true">↗</b></button>`).join('')}</div><p class="mp-quiet">${kind === 'supply' ? 'Create a separate listing for each GPU model or token model.' : 'Each request covers one model so suppliers can quote against clear requirements.'}</p>`);
}
function showComposerForm() {
  const { kind, market } = composer;
  const values = { ...defaultValues(kind, market), ...composer.drafts[market] };
  if (values.quotaTokens !== undefined && (values.quotaMillions === undefined || values.quotaMillions === '')) values.quotaMillions = Number(values.quotaTokens) / 1e6;
  const resourceFields = market === 'gpu' ? gpuFields(kind, values) : tokenFields(kind, values);
  const agreement = market === 'gpu' ? rentalAgreementFields(kind, values) : '';
  const stepLabel = kind === 'supply' ? '02 / REUSABLE SUPPLY TERMS' : '02 / FAST MATCH BRIEF';
  const note = kind === 'supply' ? 'Only reusable supply terms are requested now. Shared delivery, acceptance and final contract terms can be completed after a buyer match.' : 'Only the minimum matching fields are required now. The shared rental document is completed with the seller after a qualified match.';
  showDialog(kind === 'supply' ? `List ${labelMarket(market)} supply` : `New ${labelMarket(market)} RFQ`, `<div class="mp-step-row"><p class="mp-step-label">${stepLabel}</p><button class="mp-text-button" type="button" data-marketplace-action="back-to-market">← Change market</button></div><p class="mp-composer-note">${note}</p><form id="marketplaceComposerForm" data-kind="${kind}" data-market="${market}" novalidate><div class="mp-form-error" role="alert" tabindex="-1" hidden></div>${resourceFields}${agreement}${section('Additional requirements', `<label class="mp-field mp-field-wide" for="mp-notes"><span>${kind === 'supply' ? 'Resource notes' : 'Requirements & preferences'} <em>optional</em></span><textarea id="mp-notes" name="notes" rows="2" maxlength="1000" placeholder="Networking, infrastructure, residency or delivery requirements…">${escape(values.notes || '')}</textarea></label>`)}<div class="mp-form-footer"><p>${kind === 'supply' ? 'Your listing is private. Matching buyers can be notified when the requirements align.' : 'Your request is private. Matching continues as new supplier capacity becomes available.'}</p><button class="mp-button mp-button-primary" type="submit">${kind === 'supply' ? 'Publish supply' : 'Post RFQ'} →</button></div></form>`);
  updateGpuTotal();
}
function updateGpuTotal() {
  const form = document.getElementById('marketplaceComposerForm');
  const target = form?.querySelector('[data-marketplace-total]');
  if (!target) return;
  const total = Number(form.elements.namedItem('servers')?.value) * Number(form.elements.namedItem('gpusPerServer')?.value);
  target.textContent = Number.isFinite(total) && total > 0 ? `${number(total)} GPUs` : '0 GPUs';
}
export function openMarketplaceComposer(kind, market, prefill = {}) {
  if (!api) return;
  composer = { kind: kind === 'supply' ? 'supply' : 'rfq', market: ['gpu', 'token'].includes(market) ? market : null, drafts: {} };
  if (composer.market) composer.drafts[composer.market] = { ...prefill };
  composer.market ? showComposerForm() : showMarketPicker();
}

function detailsRows(record, kind, includeNotes = true) {
  const rows = [['Market', labelMarket(record.market)], ['Model', record.model], ['Status', statusLabel(record.status)]];
  if (record.market === 'gpu' && kind === 'supply') rows.push(['Servers / GPUs per server', `${number(record.servers)} / ${number(record.gpusPerServer)}`], ['Total capacity', `${number(record.totalGpus)} GPUs`], ['Operating region', record.region], ['Monthly asking price', `${money(record.monthlyPrice)} for the full inventory`], ['Partial allocations', record.allowPartial ? 'Available at a proportional monthly price' : 'Full inventory only'], ['Minimum lease', `${months(record.minimumMonths)}`], ['Uptime SLA', `${number(record.slaPercent)}%`], ['Availability', record.availability === 'unavailable' ? 'Currently unavailable' : `Available ${date(record.availableFrom)}`]);
  else if (record.market === 'gpu') rows.push(['GPUs required', number(record.gpuCount)], ['Required region', record.region], ['Monthly budget', money(record.monthlyBudget)], ['Lease duration', `${months(record.durationMonths)}`], ['Requested start', date(record.startDate)], ['Minimum uptime SLA', `${number(record.minSlaPercent)}%`]);
  else rows.push(['Token allocation', tokens(record.quotaTokens)], [kind === 'supply' ? 'Input price / 1M tokens' : 'Maximum input price / 1M', rate(kind === 'supply' ? record.inputPrice : record.maxInputPrice)], [kind === 'supply' ? 'Output price / 1M tokens' : 'Maximum output price / 1M', rate(kind === 'supply' ? record.outputPrice : record.maxOutputPrice)], [kind === 'supply' ? 'Delivery lead time' : 'Delivery deadline', kind === 'supply' ? `${number(record.deliveryHours)} hours` : deliveryDeadline(record)], [kind === 'supply' ? 'Declared source' : 'Source requirement', kind === 'supply' ? sourceLabel(record.sourceType) : sourceRequirementLabel(record.sourceRequirement)], ...(kind === 'supply' ? [['Available from', date(record.availableFrom)], ['Source documentation', 'Pending review']] : []));
  if (record.market === 'gpu' && record.agreement) {
    const buyerFields = Object.values(record.agreement.buyer || {}).filter(value => value && value !== 'To be agreed').length;
    const sellerFields = Object.values(record.agreement.seller || {}).filter(value => value && value !== 'To be agreed').length;
    rows.push(['Shared document', 'OpenNEXT GPU Rental Agreement v1'], ['Agreement stage', record.agreement.stage || 'Open for bilateral confirmation'], ['Prefilled fields', `${buyerFields + sellerFields} reusable or buyer fields`]);
  }
  if (includeNotes && record.notes) rows.push(['Additional requirements', record.notes]);
  return `<dl class="mp-detail-list">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
}
function matchCards(kind, id) {
  const matches = api.store.getMatches(kind, id);
  if (!matches.length) return `<div class="mp-match-empty"><strong>No matching ${kind === 'supply' ? 'buyer requests' : 'supply'} yet.</strong><p>${active(findRecord(kind, id)) ? 'Matching continues when new requirements or inventory are published.' : 'Reopen this record to include it in new matching checks.'}</p></div>`;
  return `<div class="mp-matches">${matches.map(match => {
    const counterKind = kind === 'supply' ? 'rfq' : 'supply';
    const counter = findRecord(counterKind, counterKind === 'rfq' ? match.rfqId : match.supplyId);
    if (!counter) return '';
    return `<article class="mp-match-card"><div><span class="mp-eyebrow">${kind === 'supply' ? 'MATCHING REQUEST' : 'MATCHING SUPPLY'}</span><strong>${escape(counter.model)}</strong><p>${escape(summary(counter, counterKind))}</p><small>${escape(counter.market === 'gpu' ? counter.region : sourceLabel(counter.sourceType || counter.sourceRequirement))}</small></div><div>${counter.market === 'gpu' ? `<strong>${money(match.estimatedMonthlyCost)}<small> / mo</small></strong><span>Estimated allocation cost</span>` : `<strong>${rate(kind === 'supply' ? counter.maxInputPrice : counter.inputPrice)} / ${rate(kind === 'supply' ? counter.maxOutputPrice : counter.outputPrice)}</strong><span>Input / output per 1M tokens</span>`}<button type="button" class="mp-text-button" data-marketplace-action="review-match" data-match="${escape(match.id)}">Review match →</button></div></article>`;
  }).join('')}</div><p class="mp-quiet">Confirm availability and any additional requirements before proceeding.</p>`;
}
function showDetails(kind, id) {
  const record = findRecord(kind, id);
  if (!record) { api.notify('This record is no longer available.'); return; }
  const count = api.store.getMatches(kind, id).length;
  const transition = kind === 'supply' ? active(record) ? 'paused' : 'active' : active(record) ? 'closed' : 'open';
  showDialog(`${record.model} · ${kind === 'supply' ? 'Supply' : 'RFQ'}`, `<div class="mp-detail-header"><span>${escape(record.id)}</span><span class="mp-status${active(record) ? ' is-active' : ''}"><i></i>${escape(statusLabel(record.status))}</span></div>${detailsRows(record, kind)}<section class="mp-match-section"><header><h3>Potential matches</h3><span>${count}</span></header>${matchCards(kind, id)}</section><div class="mp-dialog-footer">${button(kind === 'supply' ? active(record) ? 'Pause listing' : 'Reopen listing' : active(record) ? 'Close request' : 'Reopen request', 'status', `data-kind="${kind}" data-id="${escape(id)}" data-status="${transition}"`)}${button('Done', 'close', '', true)}</div>`);
}
function reviewMatch(id) {
  const match = api.store.matches.find(item => item.id === id);
  const rfq = match && findRecord('rfq', match.rfqId);
  const supply = match && findRecord('supply', match.supplyId);
  if (!match || !rfq || !supply) { api.notify('This match is no longer active.'); return; }
  showDialog(`${rfq.model} · Match review`, `<div class="mp-match-review-summary"><span class="mp-status is-active"><i></i>Potential match</span><p>${rfq.market === 'gpu' ? `${number(rfq.gpuCount)} GPUs · ${months(rfq.durationMonths)} · ${money(match.estimatedMonthlyCost)} estimated per month` : `${tokens(rfq.quotaTokens)} · ${rate(supply.inputPrice)} input / ${rate(supply.outputPrice)} output per 1M tokens`}</p></div><div class="mp-comparison"><section><h3>Buyer request</h3><p class="mp-record-id">${escape(rfq.id)}</p>${detailsRows(rfq, 'rfq', false)}</section><section><h3>Supplier inventory</h3><p class="mp-record-id">${escape(supply.id)}</p>${detailsRows(supply, 'supply', false)}</section></div><p class="mp-quiet">Confirm availability, source documentation and any additional requirements before proceeding. Private notes are excluded from this comparison.</p><div class="mp-dialog-footer">${button('View RFQ', 'details', `data-kind="rfq" data-id="${escape(rfq.id)}"`)}${button('View supply', 'details', `data-kind="supply" data-id="${escape(supply.id)}"`, true)}</div>`);
}

export function renderMarketplaceNotifications() {
  if (!api) return '';
  const items = api.store.notifications;
  const unread = items.filter(item => !item.read).length;
  return `<div class="mp-notifications-head"><p>${unread ? `${unread} unread ${unread === 1 ? 'notification' : 'notifications'}` : 'You’re all caught up.'}</p>${unread ? button('Mark all as read', 'read-all') : ''}</div>${items.length ? `<div class="mp-notification-list">${items.map(item => `<article class="mp-notification${item.read ? '' : ' is-unread'}"><span class="mp-notification-dot" aria-hidden="true"></span><div><div class="mp-notification-meta"><span>${item.role === 'seller' ? 'SELLER UPDATE' : 'BUYER UPDATE'}</span><time>${date(item.createdAt)}</time></div><strong>${escape(item.title)}</strong><p>${escape(item.body)}</p><div class="mp-notification-actions"><button type="button" class="mp-text-button" data-marketplace-action="notification-open" data-id="${escape(item.id)}">Review match →</button>${!item.read ? `<button type="button" class="mp-text-button" data-marketplace-action="read" data-id="${escape(item.id)}">Mark as read</button>` : ''}</div></div></article>`).join('')}</div>` : `<div class="mp-empty mp-empty-small"><span class="mp-notification-empty" aria-hidden="true">↗</span><h2>Good matches start here.</h2><p>New buyer requests and supplier inventory are checked against each other. Your matching updates will appear here.</p></div>`}`;
}
export function openMarketplaceNotifications() {
  if (api) showDialog('Notifications', renderMarketplaceNotifications());
}

export function initializeMarketplace(options) {
  api = options;
  if (installed) return;
  installed = true;
  window.addEventListener('click', event => {
    const target = event.target.closest?.('[data-marketplace-action]');
    if (!target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const { marketplaceAction: action, kind, id } = target.dataset;
    if (action === 'compose') openMarketplaceComposer(kind);
    else if (action === 'create-rfq') openMarketplaceComposer('rfq');
    else if (action === 'create-supply') openMarketplaceComposer('supply');
    else if (action === 'choose-market' && composer) { composer.market = target.dataset.market; showComposerForm(); }
    else if (action === 'back-to-market' && composer) { captureDraft(); showMarketPicker(); }
    else if (action === 'filter') { filters[kind] = target.dataset.filter; refreshPage(); }
    else if (action === 'close') api.closeDialog();
    else if (action === 'details') showDetails(kind, id);
    else if (action === 'review-match') reviewMatch(target.dataset.match);
    else if (action === 'notifications') openMarketplaceNotifications();
    else if (action === 'status') {
      try { api.store.updateStatus(kind, id, target.dataset.status); changed(); refreshPage(); showDetails(kind, id); api.notify(kind === 'supply' ? target.dataset.status === 'active' ? 'Listing reopened. Matching resumed.' : 'Listing paused.' : target.dataset.status === 'open' ? 'Request reopened. Matching resumed.' : 'Request closed.'); }
      catch (error) { api.notify(error.message || 'This record could not be updated.'); }
    } else if (action === 'read') { api.store.markRead(id); changed(); openMarketplaceNotifications(); }
    else if (action === 'read-all') { api.store.markAllRead(); changed(); openMarketplaceNotifications(); }
    else if (action === 'notification-open') {
      const notification = api.store.notifications.find(item => item.id === id);
      if (!notification) return;
      api.store.markRead(id); changed();
      const route = notification.role === 'seller' ? 'supply' : 'rfq';
      api.closeDialog(); api.navigate(route);
      if (api.store.matches.some(match => match.id === notification.matchId)) reviewMatch(notification.matchId);
      else showDetails(route, route === 'supply' ? notification.supplyId : notification.rfqId);
    }
  }, true);
  window.addEventListener('input', event => {
    if (event.target.closest?.('#marketplaceComposerForm')) updateGpuTotal();
  }, true);
  window.addEventListener('submit', event => {
    const form = event.target;
    if (form.id !== 'marketplaceComposerForm') return;
    event.preventDefault(); event.stopImmediatePropagation();
    const errorBox = form.querySelector('.mp-form-error');
    errorBox.hidden = true;
    form.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute('aria-invalid'));
    if (!form.checkValidity()) {
      const invalid = form.querySelector(':invalid');
      invalid?.setAttribute('aria-invalid', 'true');
      errorBox.textContent = 'Please complete the required fields and check the highlighted value.';
      errorBox.hidden = false;
      invalid?.focus();
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    values.market = form.dataset.market;
    values.allowPartial = Boolean(form.querySelector('[name="allowPartial"]')?.checked);
    if (values.market === 'token') { values.quotaTokens = Math.round(Number(values.quotaMillions) * 1e6); delete values.quotaMillions; }
    try {
      const kind = form.dataset.kind;
      const record = kind === 'supply' ? api.store.createSupply(values) : api.store.createRfq(values);
      const matches = api.store.getMatches(kind, record.id).length;
      api.closeDialog(); composer = null; filters[kind] = 'all';
      changed(); api.navigate(kind === 'supply' ? 'supply' : 'rfq');
      api.notify(`${kind === 'supply' ? 'Supply published' : 'RFQ posted'}.${matches ? ` ${matches} potential ${matches === 1 ? 'match' : 'matches'} found.` : ' Matching is active.'}`);
    } catch (error) {
      errorBox.textContent = error.message || 'Check your requirements and try again.';
      errorBox.hidden = false; errorBox.focus();
    }
  }, true);
}
