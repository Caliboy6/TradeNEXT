import { gpuSupplyListings } from './procurement-data.js?v=opennext-20260914-desk-1';

// Local, deterministic product simulation. Never sends prompts, creates third-
// party accounts, charges a payment method, or claims to run a production guardrail.
const defaultRequest = { accelerator: 'H100', quantity: 32, region: 'Singapore', hours: 72, budget: 6500, agentLimit: 25 };
export const QUICK_START = "I'd like 64 H100 GPUs for one month, with a monthly budget of $210,000. Can you find suitable suppliers?";
export const SOURCING_FEE = 500;
let agentState = freshState();
let timer = null;
let rfqPrefillTimer = null;
let initialized = false;
let runId = 0;
function freshState() { return { request: { ...defaultRequest }, brief: {}, messages: [], phase: 'idle', running: false, prompt: '', progress: -1, authorized: false, escrow: false, feePaid: 0, escrowFunded: 0, reservation: null, postedRfq: null, inventoryError: '', error: '' }; }
const escape = (text) => String(text ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const money = (value, digits = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const arrow = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.4"/></svg>';
const sparkle = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" stroke="currentColor" stroke-width="1.2"/><path d="M19 2v4m-2-2h4" stroke="currentColor" stroke-width="1.2"/></svg>';

// Legacy catalog estimator API retained for existing market integrations.
export function parseAgentRequest(text, previous = defaultRequest) {
  const product = text.match(/\b(H100|H200|A100|B200|B300|L40S|(?:RTX\s*)?4090|(?:RTX\s*)?5090)\b/i);
  if (!product) return null;
  let accelerator = product[1].toUpperCase().replace(/\s+/g, ' ');
  if (/^\d{4}$/.test(accelerator)) accelerator = `RTX ${accelerator}`;
  const prefix = text.slice(0, product.index), suffix = text.slice(product.index + product[0].length);
  const count = prefix.match(/(?:^|\s)(\d+)\s*(?:GPUs?|cards?|units?|accelerators?)?\s*$/i)?.[1] || suffix.match(/^\s*[x×]\s*(\d+)/i)?.[1] || text.match(/\b(\d+)\s*(?:GPUs?|cards?|units?|accelerators?)\b/i)?.[1];
  const duration = text.match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|days?|d)\b/i);
  const budget = text.match(/(?:budget(?:\s*(?:of|is|:))?\s*\$?\s*|\$\s*)([\d,]+(?:\.\d+)?)(k)?\b/i);
  const region = ['Singapore', 'US East', 'US West', 'Tokyo', 'Frankfurt', 'London'].find(value => text.toLowerCase().includes(value.toLowerCase())) || previous.region;
  const hours = duration ? Number(duration[1]) * (/^d/i.test(duration[2]) ? 24 : 1) : previous.hours;
  return { accelerator, quantity: count ? Math.max(1, Math.min(100000, Number(count))) : previous.quantity, region, hours: Math.max(1, Math.min(8760, hours)), budget: budget ? Math.max(1, Math.min(1e9, Number(budget[1].replaceAll(',', '')) * (budget[2] ? 1000 : 1))) : previous.budget, agentLimit: previous.agentLimit };
}
export function analyzeAgentRequest(request) {
  const product = gpuSupplyListings.filter(item => item.accelerator.toUpperCase().includes(request.accelerator.toUpperCase()));
  const regional = product.filter(item => item.region === request.region);
  const matches = regional.filter(item => item.units >= request.quantity).map(item => ({ ...item, estimatedTotal: Math.round(item.pricePerHour * request.quantity * request.hours * 100) / 100 })).sort((a, b) => a.estimatedTotal - b.estimatedTotal);
  return { product, regional, matches, suppliers: new Set(product.map(item => item.supplier)).size };
}

/** Only parameters explicitly stated by the user are added to the brief. */
export function parseProcurementBrief(text, previous = {}) {
  const brief = { ...previous };
  const product = text.match(/(?:H100|H200|A100|B200|B300|L40S|RTX\s*4090|RTX\s*5090)/i);
  if (product) {
    brief.accelerator = product[0].toUpperCase();
    const prefix = text.slice(0, product.index), suffix = text.slice(product.index + product[0].length);
    const quantity = prefix.match(/(\d+)\s*(?:GPUs?|cards?|units?|accelerators?|卡)?\s*$/i)?.[1] || suffix.match(/^\s*[x×]\s*(\d+)/i)?.[1];
    if (quantity) brief.quantity = Number(quantity);
  }
  const count = text.match(/(?<![a-z0-9])(\d+)\s*(?:GPUs?|cards?|accelerators?|张卡|卡)/i);
  if (count) brief.quantity = Number(count[1]);
  const duration = text.match(/(\d+)\s*(?:months?|个月|月)/i);
  if (duration) brief.months = Number(duration[1]);
  else if (/\b(?:one|a)\s+month\b|一个月/i.test(text)) brief.months = 1;
  const budget = text.match(/(?:\$\s*|(?:monthly\s+)?budget\s*(?:of|is|:)?\s*(?:USD\s*)?|预算(?:是|为)?\s*)([\d,]+(?:\.\d+)?)\s*(k|w|万)?/i);
  if (budget) {
    const amount = Number(budget[1].replaceAll(',', '')) * (/k/i.test(budget[2] || '') ? 1000 : /w|万/i.test(budget[2] || '') ? 10000 : 1);
    // A total budget is never silently interpreted as a monthly budget.
    if (!/\btotal\s+budget\b|总预算/i.test(text)) brief.monthlyBudget = amount;
  }
  const regions = [['Singapore', /Singapore|新加坡/i], ['US East', /US East|美国东部|美东/i], ['US West', /US West|美国西部|美西/i], ['United States', /United States|\bUSA?\b|美国/i], ['Europe', /Europe|\bEU\b|欧洲/i], ['Frankfurt', /Frankfurt|法兰克福/i], ['London', /London|伦敦/i], ['Tokyo', /Tokyo|东京/i]];
  const region = regions.find(([, pattern]) => pattern.test(text));
  if (region) brief.region = region[0];
  if (/no (?:region|location) preference|any (?:region|location)|地区不限|无地区要求|没有地区要求/i.test(text)) brief.region = 'No region preference';
  const start = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (start) brief.startDate = start[1];
  if (/\bASAP\b|as soon as (?:possible|available)|尽快/i.test(text)) brief.startDate = 'As soon as available';
  if (/no (?:other|additional|extra) requirements|没有其[他它]要求|无其[他它]要求/i.test(text)) brief.requirements = 'No additional requirements';
  else {
    const explicit = text.match(/(?:requirements?|also need|must have)\s*:\s*(.+)/i);
    const network = [text.match(/NVLink/i)?.[0], text.match(/InfiniBand/i)?.[0], text.match(/RDMA/i)?.[0]].filter(Boolean);
    if (explicit) brief.requirements = explicit[1].trim();
    else if (network.length) brief.requirements = network.join(' + ');
  }
  return brief;
}

export function validateProcurementBrief(brief, today = new Date().toISOString().slice(0, 10)) {
  const errors = [];
  if (!/^(?:H100|H200|A100|B200|B300|L40S|RTX\s*4090|RTX\s*5090)$/i.test(brief.accelerator || '')) errors.push('Choose a supported GPU model.');
  if (!Number.isInteger(brief.quantity) || brief.quantity < 1 || brief.quantity > 100000) errors.push('GPU quantity must be a whole number between 1 and 100,000.');
  if (!Number.isInteger(brief.months) || brief.months < 1 || brief.months > 12) errors.push('Choose a duration of 1–12 whole months for this simulation.');
  if (!Number.isFinite(brief.monthlyBudget) || brief.monthlyBudget < 1000 || brief.monthlyBudget > 1e9) errors.push('Enter a monthly budget between $1,000 and $1 billion for this simulation.');
  if (!brief.region?.trim()) errors.push('Specify a region, or explicitly choose no region preference.');
  if (!brief.startDate) errors.push('Choose a start date, or explicitly request the earliest availability.');
  else if (brief.startDate !== 'As soon as available') {
    const parsed = new Date(`${brief.startDate}T00:00:00Z`);
    const latest = new Date(`${today}T00:00:00Z`).getTime() + 365 * 86400000;
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(brief.startDate) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== brief.startDate || brief.startDate < today || parsed.getTime() > latest) errors.push('Choose a valid start date between today and one year from today.');
  }
  if (!brief.requirements?.trim()) errors.push('Add network, SLA or other requirements, or explicitly state that there are none.');
  if (/[\u3400-\u9fff]/u.test(brief.requirements || '')) errors.push('Please enter the supplier requirements in English so the circulated RFQ stays consistent.');
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b(?:sk-|api[_ -]?key|password)\b/i.test(brief.requirements || '')) errors.push('Remove personal contact details, API keys or passwords from the supplier requirements.');
  return errors;
}

export function resolveReservationStart(startDate, now = Date.now()) {
  return startDate === 'As soon as available' ? new Date(now + 86400000).toISOString().slice(0, 10) : startDate;
}

export function calculateEscrow(monthlyBudget, months) {
  if (!Number.isFinite(monthlyBudget) || monthlyBudget <= 0 || !Number.isInteger(months) || months < 1) throw new RangeError('Invalid escrow terms.');
  if (months === 1) return { available: true, amount: Math.round(monthlyBudget * .5 * 100) / 100, label: '50% of the one-month budget' };
  if (months > 6) return { available: true, amount: Math.round((monthlyBudget + monthlyBudget * months * .1) * 100) / 100, label: 'First month + 10% of the full-term budget' };
  return { available: false, amount: 0, label: 'Custom terms required for 2–6 months' };
}
export function calculateSettlement(computeTotal, feePaid = SOURCING_FEE, escrowFunded = 0) {
  if (![computeTotal, feePaid, escrowFunded].every(Number.isFinite) || computeTotal < 0 || feePaid < 0 || escrowFunded < 0 || feePaid > computeTotal) throw new RangeError('Invalid settlement values.');
  const feeCredit = Math.min(feePaid, computeTotal);
  const escrowApplied = Math.min(escrowFunded, computeTotal - feeCredit);
  return { computeTotal, feeCredit, escrowApplied, escrowRefund: Math.round((escrowFunded - escrowApplied) * 100) / 100, amountDue: Math.round((computeTotal - feeCredit - escrowApplied) * 100) / 100 };
}
export function createSupplierOptions(brief) {
  const totalBudget = brief.monthlyBudget * brief.months;
  const startDate = resolveReservationStart(brief.startDate);
  return [
    { id: 'supplier-1', name: 'Supplier 01', total: Math.round(totalBudget * 1.08), eligible: false, status: 'Over budget', reason: 'Capacity matches, but the quote exceeds your approved budget.', timing: startDate },
    { id: 'supplier-2', name: 'Supplier 02', total: Math.round(totalBudget * .92), eligible: false, status: 'Start date mismatch', reason: 'Capacity is not available until two months after your requested start.', timing: 'Two-month delay' },
    { id: 'supplier-3', name: 'Supplier 03', total: Math.round(totalBudget * (198 / 210)), eligible: true, status: 'Meets your brief', reason: 'GPU quantity, region, start date, term and stated requirements match.', timing: startDate },
  ];
}

const progressSteps = [
  ['Prepare request package', 'User-approved specifications only; no account credentials or payment data.'],
  ['Prepare platform accounts', 'Simulated account setup across supplier platforms; nothing is submitted.'],
  ['Begin supplier outreach', 'RFQ and quote requests prepared for compatible providers.'],
  ['Search supplier network', '20 compatible suppliers identified in the simulated network.'],
  ['Supplier 01 · price review', 'No suitable price: the quote is 8% above budget.'],
  ['Supplier 02 · availability review', 'Requested start unavailable: a two-month delay is required.'],
  ['Supplier 03 · terms review', 'Price and all stated requirements match. Three outcomes ready to compare.'],
];
function requestSummary(request) { return `${request.quantity} ${request.accelerator} · ${request.region} · ${request.hours} hours`; }
function briefSummary() { const b = agentState.brief; return b.accelerator ? `${b.quantity || '—'} × ${b.accelerator} · ${b.months || '—'} ${b.months === 1 ? 'month' : 'months'}` : 'No active request'; }
function addMessage(text, role = 'agent') { agentState.messages.push({ role, text }); if (agentState.messages.length > 10) agentState.messages.shift(); }
function primary(label, action, disabled = false) { return `<button type="button" class="agent-primary" data-agent-action="${action}"${disabled ? ' disabled' : ''}>${label} ${arrow}</button>`; }
function renderMessages() { return agentState.messages.map(message => `<article class="agent-message agent-message-${message.role}"><span class="agent-speaker">${message.role === 'user' ? 'You' : 'OpenNEXT Agent'}</span><p>${escape(message.text)}</p></article>`).join(''); }
function renderRfq() {
  const b = agentState.brief;
  return `<section class="agent-card agent-rfq"><span class="agent-kicker">Standard RFQ · GPU capacity</span><dl class="agent-facts"><div><dt>Hardware</dt><dd>${escape(b.quantity)} × ${escape(b.accelerator)}</dd></div><div><dt>Term</dt><dd>${escape(b.months)} ${b.months === 1 ? 'month' : 'months'}</dd></div><div><dt>Monthly budget</dt><dd>${money(b.monthlyBudget)}</dd></div><div><dt>Full-term budget</dt><dd>${money(b.monthlyBudget * b.months)}</dd></div><div><dt>Region</dt><dd>${escape(b.region)}</dd></div><div><dt>Start</dt><dd>${escape(b.startDate)}</dd></div><div><dt>Requirements</dt><dd>${escape(b.requirements)}</dd></div></dl><p class="agent-note">Only these specifications are included. Your identity, credentials and payment details are not part of this RFQ.</p></section>`;
}
function renderIntake() {
  const b = agentState.brief, today = new Date().toISOString().slice(0, 10);
  const regions = ['Singapore', 'US East', 'US West', 'United States', 'Europe', 'Frankfurt', 'London', 'Tokyo', 'No region preference'];
  if (b.region && !regions.includes(b.region)) regions.push(b.region);
  return `<form id="agentBriefForm" class="agent-card agent-intake"><span class="agent-kicker">Complete your brief</span><p class="agent-note">Please confirm the missing details. Nothing is assumed or sent to a supplier.</p><div class="agent-field-grid"><label>GPU model<select name="accelerator" required><option value="">Select model</option>${['H100', 'H200', 'A100', 'B200', 'B300', 'L40S', 'RTX 4090', 'RTX 5090'].map(value => `<option${b.accelerator === value ? ' selected' : ''}>${value}</option>`).join('')}</select></label><label>GPU quantity<input name="quantity" type="number" min="1" max="100000" step="1" value="${escape(b.quantity || '')}" required></label><label>Term in months<input name="months" type="number" min="1" max="12" step="1" value="${escape(b.months || '')}" required></label><label>Monthly budget · USD<input name="monthlyBudget" type="number" min="1000" max="1000000000" step="1" value="${escape(b.monthlyBudget || '')}" required></label></div><label>Deployment region<select name="region" required><option value="">Choose a region</option>${regions.map(value => `<option${b.region === value ? ' selected' : ''}>${escape(value)}</option>`).join('')}</select></label><label>Requested start date<input type="date" name="startDate" min="${today}" value="${b.startDate !== 'As soon as available' ? escape(b.startDate || '') : ''}"${b.startDate === 'As soon as available' ? ' disabled' : ' required'}></label><label class="agent-check"><input type="checkbox" name="asap"${b.startDate === 'As soon as available' ? ' checked' : ''}><span>Start as soon as capacity is available</span></label><label>Network, SLA or other requirements<textarea name="requirements" rows="2" maxlength="600" placeholder="For example: NVLink, InfiniBand, dedicated cluster" required>${escape(b.requirements || '')}</textarea></label><button type="button" class="agent-text-button" data-agent-action="no-requirements">No additional requirements</button>${agentState.error ? `<p class="agent-error" role="alert">${escape(agentState.error)}</p>` : ''}<button type="submit" class="agent-primary">Prepare standard RFQ ${arrow}</button></form>`;
}
function renderGuardrail() {
  const analyzing = agentState.phase === 'guardrail';
  return `<section class="agent-card agent-guardrail"><span class="agent-kicker">VETA · policy review</span><h3>${analyzing ? '<span class="agent-spinner" aria-hidden="true"></span>Guardrail analyzing' : '✓ Guarded with VETA Guardrail'}</h3><ul><li>Request stays within your stated parameters</li><li>Personal identifiers and credentials excluded</li><li>No purchase or payment authority implied</li><li>Supplier outreach requires your confirmation</li></ul><p class="agent-note">Simulated policy checks. No external guardrail service is called.</p></section>`;
}
function renderAuthorization() {
  const b = agentState.brief, escrow = calculateEscrow(b.monthlyBudget, b.months);
  return `<form id="agentAuthorizationForm" class="agent-card agent-authorization"><span class="agent-kicker">Your approval</span><h3>Let us source this request.</h3><dl class="agent-facts"><div><dt>Sourcing fee</dt><dd>$500</dd></div><div><dt>Credit on completed order</dt><dd>−$500</dd></div></dl><p class="agent-note">The $500 sourcing fee is credited against the final compute price when you complete an order. It is non-refundable if you do not place an order.</p><label class="agent-check"><input type="checkbox" name="authorize" required><span>I authorize supplier inquiries and the $500 sourcing fee under these terms.</span></label><div class="agent-escrow"><span class="agent-kicker">Optional · third-party escrow</span><p class="agent-note">Pre-fund a reserve to secure suitable capacity faster. Funds remain separate from the sourcing fee; no order is placed without your final approval.</p><label class="agent-check"><input type="checkbox" name="escrow"${escrow.available ? '' : ' disabled'}${agentState.escrow ? ' checked' : ''}><span>${escrow.available ? `Reserve ${money(escrow.amount)} with a third-party escrow provider.` : 'Escrow terms require a custom quote for this duration.'}</span></label><p class="agent-note">${escape(escrow.label)}. This simulation moves no funds.</p></div><div class="agent-total"><span>Simulated payment now</span><strong id="agentAuthorizeTotal">${money(SOURCING_FEE + (agentState.escrow ? escrow.amount : 0))}</strong></div><button type="submit" class="agent-primary">Authorize &amp; continue ${arrow}</button></form>`;
}
function renderInventoryPosting() {
  const posted = agentState.postedRfq;
  const result = posted ? (posted.matchCount ? `${posted.matchCount} potential inventory ${posted.matchCount === 1 ? 'match' : 'matches'} found. Review the details in My RFQs.` : 'No matching inventory yet. Your RFQ remains open for new supply.') : 'Check submitted inventory using your reviewed specifications. Additional requirements remain subject to supplier confirmation.';
  return `<section class="agent-card"><span class="agent-kicker">Private supply matching</span><h3>${posted ? 'Posted to My RFQs' : 'Check available inventory.'}</h3><p class="agent-note"${posted ? ' role="status"' : ''}>${escape(result)}</p>${posted ? `<p class="agent-note">Reference: ${escape(posted.id)}</p>` : '<p class="agent-note">Posting an RFQ does not authorize paid sourcing, reserve capacity or move funds.</p>'}${agentState.inventoryError ? `<p class="agent-error" role="alert">${escape(agentState.inventoryError)}</p>` : ''}<button type="button" class="agent-secondary" data-agent-action="post-inventory-rfq"${posted ? ' disabled' : ''}>${posted ? 'RFQ posted' : 'Post to My RFQs'}</button></section>`;
}
function renderProgress() {
  return `<section class="agent-card agent-work-log"><span class="agent-kicker">Execution activity · simulation</span>${progressSteps.map(([label, detail], index) => `<div class="agent-log-step ${index < agentState.progress || agentState.phase === 'offers' || agentState.phase === 'payment' || agentState.phase === 'confirmed' ? 'is-complete' : index === agentState.progress ? 'is-current' : ''}"><span>${index < agentState.progress || agentState.progress >= progressSteps.length ? '✓' : String(index + 1).padStart(2, '0')}</span><div><strong>${label}</strong>${index <= agentState.progress ? `<p>${detail}</p>` : ''}</div></div>`).join('')}${agentState.running ? '<button type="button" class="agent-text-button" data-agent-action="stop">Stop sourcing</button>' : ''}</section>`;
}
function renderOffers() {
  return `<section class="agent-offers"><div class="agent-section-title"><h3>Three supplier outcomes</h3><span>20 reviewed</span></div>${createSupplierOptions(agentState.brief).map((option, index) => `<article class="agent-card agent-offer ${option.eligible ? 'is-match' : ''}"><div class="agent-offer-top"><span class="agent-kicker">${option.name}</span><span class="agent-offer-status">${option.status}</span></div><strong class="agent-offer-price">${money(option.total)}<small> / full term</small></strong><p>${option.reason}</p><dl class="agent-facts"><div><dt>Start</dt><dd>${escape(option.timing)}</dd></div><div><dt>Region</dt><dd>${escape(agentState.brief.region)}</dd></div></dl><button type="button" class="${option.eligible ? 'agent-primary' : 'agent-secondary'}" data-agent-action="select-${index + 1}"${option.eligible ? '' : ' disabled'}>${option.eligible ? 'Select supplier 03' : option.status}${option.eligible ? arrow : ''}</button></article>`).join('')}<p class="agent-note">Illustrative supplier identities and quotes. No live network search or availability guarantee.</p></section>`;
}
function renderPayment() {
  const option = createSupplierOptions(agentState.brief)[2], bill = calculateSettlement(option.total, agentState.feePaid, agentState.escrowFunded);
  return `<section class="agent-card agent-payment"><span class="agent-kicker">Confirm reservation · Supplier 03</span><h3>Review your payment.</h3><dl class="agent-facts"><div><dt>Full-term compute price</dt><dd>${money(bill.computeTotal)}</dd></div><div><dt>Sourcing fee already paid</dt><dd>−${money(bill.feeCredit)}</dd></div><div><dt>Escrow applied</dt><dd>−${money(bill.escrowApplied)}</dd></div>${bill.escrowRefund ? `<div><dt>Unused escrow returned</dt><dd>${money(bill.escrowRefund)}</dd></div>` : ''}</dl><div class="agent-total"><span>Amount due now</span><strong>${money(bill.amountDue)}</strong></div><p class="agent-note">The sourcing fee is credited once, not added again. The compute price is the total order cost in this simulation.</p><label class="agent-check"><input id="agentFinalApproval" type="checkbox"><span>I approve the selected supplier and the ${money(bill.amountDue)} final payment.</span></label>${primary(agentState.running ? 'Processing simulated payment…' : 'Simulate payment &amp; reserve', 'pay', agentState.running)}<button type="button" class="agent-text-button" data-agent-action="back-offers"${agentState.running ? ' disabled' : ''}>Back to supplier options</button></section>`;
}
function renderConfirmation() {
  const reservation = agentState.reservation;
  return `<section class="agent-card agent-confirmation"><span class="agent-confirmation-mark">✓</span><span class="agent-kicker">Payment successful · simulation</span><h3>Reservation confirmed.</h3><p>${escape(reservation.quantity)} × ${escape(reservation.accelerator)} · ${escape(reservation.months)} ${reservation.months === 1 ? 'month' : 'months'}</p><dl class="agent-facts"><div><dt>Reference</dt><dd>${escape(reservation.id)}</dd></div><div><dt>Supplier</dt><dd>Supplier 03</dd></div><div><dt>Start</dt><dd>${escape(reservation.startDate)}</dd></div><div><dt>Region</dt><dd>${escape(reservation.region)}</dd></div><div><dt>Total order cost</dt><dd>${money(reservation.total)}</dd></div></dl><p class="agent-note">Added to My OpenDesk. No real payment or GPU reservation has been made.</p>${primary('Source another request', 'reset')}</section>`;
}
function renderCurrentStage() {
  const phase = agentState.phase;
  if (phase === 'idle') return `<section class="agent-task"><span class="agent-kicker">Quick start</span><h3>64 H100 GPUs.<br>One month.</h3><p>A $210,000 monthly budget. Find the right supplier, on your terms.</p>${primary('Find suitable suppliers', 'run')}</section>`;
  if (phase === 'intake') return renderIntake();
  if (phase === 'review') return `${renderRfq()}<p class="agent-note">Confirm that the RFQ accurately reflects your instructions.</p>${primary('Confirm RFQ &amp; run guardrail', 'guardrail')}<button class="agent-text-button" type="button" data-agent-action="edit">Edit requirements</button>`;
  if (phase === 'guardrail') return `${renderRfq()}${renderGuardrail()}`;
  if (phase === 'authorization') return `${renderGuardrail()}${renderInventoryPosting()}${renderAuthorization()}`;
  if (phase === 'sourcing') return renderProgress();
  if (phase === 'stopped') return `${renderProgress()}<p class="agent-note">Sourcing paused. No order has been placed. Your simulated fee and escrow remain recorded for this request.</p>${primary('Resume sourcing', 'resume')}`;
  if (phase === 'offers') return `<details class="agent-details"><summary>View completed execution activity</summary>${renderProgress()}</details>${renderOffers()}`;
  if (phase === 'payment') return renderPayment();
  if (phase === 'confirmed') return renderConfirmation();
  return '';
}
export function renderAgentPanel() {
  return `<div class="agent-heading"><div class="agent-identity"><span class="agent-symbol">${sparkle}</span><div><h2>OpenNEXT Agent</h2><p>From request to reserved capacity</p></div></div><button type="button" class="agent-reset" data-agent-action="reset" title="Reset this simulation">Reset</button></div><div class="agent-context"><span>Active brief</span><strong id="agentContext">${escape(briefSummary())}</strong></div><div class="agent-scroll"><div class="agent-intro"><p>Tell me what you need. I’ll clarify the details, prepare an RFQ and ask for approval before taking action.</p></div><div id="agentConversation" class="agent-conversation" role="log" aria-label="Agent conversation and workflow" aria-live="polite" aria-relevant="additions text">${renderMessages()}${renderCurrentStage()}</div></div><form class="agent-composer" id="agentPromptForm"><label class="agent-visually-hidden" for="agentPrompt">Describe your GPU procurement goal</label><textarea id="agentPrompt" name="prompt" rows="2" maxlength="1200" placeholder="Describe your capacity requirements…">${escape(agentState.prompt)}</textarea><div class="agent-composer-footer"><span>Approval before action</span><button type="submit" class="agent-send" aria-label="Send to agent"${agentState.running ? ' disabled' : ''}>${arrow}</button></div></form><p class="agent-scope">Interactive simulation · no data sent or charges made</p>`;
}
function refreshConversation(scrollToBottom = true) {
  const panel = document.querySelector('.agent-panel');
  if (!panel) return;
  const log = panel.querySelector('#agentConversation');
  if (log) log.innerHTML = `${renderMessages()}${renderCurrentStage()}`;
  const context = panel.querySelector('#agentContext');
  if (context) context.textContent = briefSummary();
  panel.querySelectorAll('.agent-send').forEach(button => { button.disabled = agentState.running; });
  if (scrollToBottom) { const scroll = panel.querySelector('.agent-scroll'); if (scroll) scroll.scrollTop = scroll.scrollHeight; }
}
function stopRun() { runId += 1; if (timer) clearTimeout(timer); timer = null; agentState.running = false; }
function resetPanel() {
  stopRun();
  if (rfqPrefillTimer !== null) clearTimeout(rfqPrefillTimer);
  rfqPrefillTimer = null;
  agentState = freshState();
  const panel = document.querySelector('.agent-panel');
  if (panel) panel.innerHTML = renderAgentPanel();
}
function startBrief(text) {
  const existing = ['idle', 'intake', 'review'].includes(agentState.phase);
  if (!existing) { addMessage('This request is already authorized. Finish it, or use Reset to start a separate request. No additional authorization has been granted.'); refreshConversation(); return; }
  agentState.brief = parseProcurementBrief(text, agentState.brief);
  agentState.phase = 'intake'; agentState.error = '';
  // Translate the specified Chinese quick-start to an English summary; all
  // interface copy remains English. The original prompt is not transmitted.
  addMessage(/[\u3400-\u9fff]/u.test(text) ? `Request received: ${agentState.brief.quantity || 'unspecified'} ${agentState.brief.accelerator || 'GPU'} units, ${agentState.brief.months || 'unspecified'} month(s), ${agentState.brief.monthlyBudget ? money(agentState.brief.monthlyBudget) : 'unspecified'} monthly budget.` : text, 'user');
  const b = agentState.brief;
  const questions = [];
  if (!b.region) questions.push('Do you have a preferred deployment region?');
  if (!b.startDate) questions.push('When should the GPUs become available?');
  if (!b.requirements) questions.push('Any network, SLA or other requirements? You can explicitly choose none.');
  addMessage(questions.length ? questions.join('\n') : 'Please review the captured specifications below before I prepare your RFQ.');
  refreshConversation(false);
  document.getElementById('agentBriefForm')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function runGuardrail() {
  if (agentState.phase !== 'review') return;
  const errors = validateProcurementBrief(agentState.brief);
  if (errors.length) { agentState.error = errors.join(' '); agentState.phase = 'intake'; refreshConversation(); return; }
  stopRun(); agentState.phase = 'guardrail'; agentState.running = true; refreshConversation();
  const epoch = runId;
  timer = setTimeout(() => { if (epoch !== runId || agentState.phase !== 'guardrail') return; timer = null; agentState.running = false; agentState.phase = 'authorization'; refreshConversation(); }, 1700);
}
function postInventoryRfq() {
  if (agentState.phase !== 'authorization' || agentState.running || agentState.postedRfq) return;
  const errors = validateProcurementBrief(agentState.brief);
  if (errors.length) { agentState.inventoryError = errors.join(' '); refreshConversation(false); return; }
  if (typeof window.OpenNEXTPostAgentRfq !== 'function') {
    agentState.inventoryError = 'RFQ posting is unavailable right now. Please try again when the workspace is ready.';
    refreshConversation(false); return;
  }
  try {
    const result = window.OpenNEXTPostAgentRfq({ ...agentState.brief });
    if (!result?.record?.id || !Number.isInteger(result.matchCount) || result.matchCount < 0) throw new Error('The workspace could not confirm your RFQ. Check My RFQs before trying again.');
    agentState.postedRfq = { id: String(result.record.id), matchCount: result.matchCount };
    agentState.inventoryError = '';
  } catch (error) {
    agentState.inventoryError = error instanceof Error && !/[\u3400-\u9fff]/u.test(error.message) ? error.message : 'Your RFQ could not be posted. Please review the specifications and try again.';
  }
  refreshConversation(false);
}
function startSourcing(resume = false) {
  if (!agentState.authorized || (!resume && agentState.phase !== 'authorization') || (resume && agentState.phase !== 'stopped')) return;
  stopRun(); agentState.phase = 'sourcing'; agentState.running = true;
  if (!resume) agentState.progress = 0;
  const epoch = runId;
  function advance() {
    if (epoch !== runId || agentState.phase !== 'sourcing' || !agentState.running) return;
    agentState.progress += 1;
    if (agentState.progress >= progressSteps.length) { timer = null; agentState.running = false; agentState.phase = 'offers'; refreshConversation(false); return; }
    refreshConversation(); timer = setTimeout(advance, 1100);
  }
  refreshConversation(); timer = setTimeout(advance, 1100);
}
function processPayment() {
  if (agentState.phase !== 'payment' || agentState.running || agentState.reservation) return;
  const consent = document.getElementById('agentFinalApproval');
  if (!consent?.checked) { consent?.focus(); if (consent) { consent.setCustomValidity('Approve the final payment to continue.'); consent.reportValidity(); } return; }
  stopRun(); agentState.running = true; refreshConversation(); const epoch = runId;
  timer = setTimeout(() => {
    if (epoch !== runId || agentState.phase !== 'payment' || agentState.reservation) return;
    const b = agentState.brief, supplier = createSupplierOptions(b)[2];
    const id = `ON-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    agentState.reservation = { id, accelerator: b.accelerator, quantity: b.quantity, region: b.region, startDate: supplier.timing, requestedStart: b.startDate, months: b.months, total: supplier.total, status: 'Reserved', supplier: supplier.name };
    agentState.phase = 'confirmed'; agentState.running = false; timer = null;
    window.dispatchEvent(new CustomEvent('opennext:reservation', { detail: { ...agentState.reservation } }));
    refreshConversation();
  }, 1300);
}

// Backward-compatible handoff for legacy RFQ controls elsewhere in the app.
function prefillRfq(request) {
  const form = document.getElementById('unifiedRfqForm');
  if (!form) return;
  const set = (name, value) => { const field = form.elements.namedItem(name); if (field) field.value = value; };
  set('quantity', `${request.quantity} accelerators`); set('amount', money(request.budget)); set('term', 'custom');
  const region = form.elements.namedItem('region');
  if (region) { if (![...region.options].some(option => option.value === request.region)) region.add(new Option(request.region, request.region)); region.value = request.region; }
  set('notes', `Agent brief: ${requestSummary(request)}. Continuous duration: ${request.hours} hours. Agent spending cap: ${money(request.agentLimit)}. Confirm availability and terms before acceptance.`);
}
export function initializeAgentPanel() {
  if (initialized) return;
  initialized = true;
  window.addEventListener('click', event => {
    if (!event.target.closest?.('.agent-panel [data-agent-rfq]')) return;
    const request = { ...agentState.request };
    if (rfqPrefillTimer !== null) clearTimeout(rfqPrefillTimer);
    rfqPrefillTimer = setTimeout(() => { rfqPrefillTimer = null; prefillRfq(request); }, 0);
  }, true);
  document.addEventListener('click', event => {
    const button = event.target.closest?.('.agent-panel [data-agent-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.agentAction;
    if (action === 'reset') resetPanel();
    else if (action === 'run' && agentState.phase === 'idle') startBrief(QUICK_START);
    else if (action === 'edit' && agentState.phase === 'review') { agentState.phase = 'intake'; refreshConversation(); }
    else if (action === 'no-requirements') { const field = document.getElementById('agentBriefForm')?.elements.namedItem('requirements'); if (field) { field.value = 'No additional requirements'; agentState.brief.requirements = field.value; } }
    else if (action === 'guardrail') runGuardrail();
    else if (action === 'post-inventory-rfq') postInventoryRfq();
    else if (action === 'stop' && agentState.phase === 'sourcing') { stopRun(); agentState.phase = 'stopped'; refreshConversation(); }
    else if (action === 'resume') startSourcing(true);
    else if (action === 'select-3' && agentState.phase === 'offers') { agentState.phase = 'payment'; refreshConversation(); }
    else if (action === 'back-offers' && agentState.phase === 'payment' && !agentState.running) { agentState.phase = 'offers'; refreshConversation(); }
    else if (action === 'pay') processPayment();
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'agentFinalApproval') event.target.setCustomValidity('');
    if (event.target.name === 'asap' && event.target.closest?.('#agentBriefForm')) {
      const field = event.target.form.elements.namedItem('startDate'); field.disabled = event.target.checked; field.required = !event.target.checked;
      agentState.brief.startDate = event.target.checked ? 'As soon as available' : field.value;
    }
    if (event.target.name === 'escrow' && event.target.closest?.('#agentAuthorizationForm')) {
      const terms = calculateEscrow(agentState.brief.monthlyBudget, agentState.brief.months);
      agentState.escrow = terms.available && event.target.checked;
      const total = document.getElementById('agentAuthorizeTotal'); if (total) total.textContent = money(SOURCING_FEE + (agentState.escrow ? terms.amount : 0));
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'agentPrompt') agentState.prompt = event.target.value;
    if (event.target.closest?.('#agentBriefForm') && event.target.name !== 'asap') {
      const name = event.target.name;
      if (['accelerator', 'quantity', 'months', 'monthlyBudget', 'region', 'startDate', 'requirements'].includes(name)) agentState.brief[name] = ['quantity', 'months', 'monthlyBudget'].includes(name) ? Number(event.target.value) : event.target.value;
    }
  });
  document.addEventListener('submit', event => {
    const form = event.target;
    if (!['agentPromptForm', 'agentBriefForm', 'agentAuthorizationForm'].includes(form.id)) return;
    event.preventDefault();
    if (agentState.running) return;
    const data = new FormData(form);
    if (form.id === 'agentPromptForm') {
      const prompt = String(data.get('prompt') || '').trim();
      if (!prompt) { document.getElementById('agentPrompt')?.focus(); return; }
      agentState.prompt = ''; const input = document.getElementById('agentPrompt'); if (input) input.value = '';
      startBrief(prompt);
    } else if (form.id === 'agentBriefForm' && agentState.phase === 'intake') {
      const brief = { accelerator: String(data.get('accelerator') || ''), quantity: Number(data.get('quantity')), months: Number(data.get('months')), monthlyBudget: Number(data.get('monthlyBudget')), region: String(data.get('region') || '').trim(), startDate: data.has('asap') ? 'As soon as available' : String(data.get('startDate') || ''), requirements: String(data.get('requirements') || '').trim() };
      agentState.brief = brief;
      const errors = validateProcurementBrief(brief);
      if (errors.length) { agentState.error = errors.join(' '); refreshConversation(); return; }
      agentState.error = ''; agentState.phase = 'review'; refreshConversation();
    } else if (form.id === 'agentAuthorizationForm' && agentState.phase === 'authorization') {
      if (!data.has('authorize') || agentState.authorized) return;
      const escrow = calculateEscrow(agentState.brief.monthlyBudget, agentState.brief.months);
      agentState.authorized = true; agentState.escrow = escrow.available && data.has('escrow');
      agentState.feePaid = SOURCING_FEE; agentState.escrowFunded = agentState.escrow ? escrow.amount : 0;
      addMessage(`${money(agentState.feePaid)} sourcing fee payment simulated${agentState.escrow ? `; ${money(agentState.escrowFunded)} escrow reserve simulated` : ''}. Your approved RFQ is ready for outreach.`);
      startSourcing();
    }
  });
  document.addEventListener('keydown', event => {
    if (event.target.id === 'agentPrompt' && event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); document.getElementById('agentPromptForm')?.requestSubmit(); }
  });
  window.addEventListener('opennext:signout', resetPanel);
}
