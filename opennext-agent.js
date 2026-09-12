import { gpuSupplyListings } from './procurement-data.js?v=opennext-20260912-6';

// This assistant is intentionally local and deterministic. All prices and stock
// below come from the same synthetic catalog displayed in the GPU marketplace.
const defaultRequest = { accelerator: 'H100', quantity: 32, region: 'Singapore', hours: 72, budget: 6500, agentLimit: 25 };
const stages = ['Source capacity', 'Compare terms', 'Review constraints'];
let agentState = freshState();
let timer = null;
let initialized = false;
let runId = 0;

function freshState() { return { request: { ...defaultRequest }, messages: [], phase: -1, running: false, completed: false, analysis: null, prompt: '' }; }
const escape = (text) => String(text ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const money = (value, digits = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
const arrow = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.4"/></svg>';
const sparkle = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" stroke="currentColor" stroke-width="1.2"/><path d="M19 2v4m-2-2h4" stroke="currentColor" stroke-width="1.2"/></svg>';

export function parseAgentRequest(text, previous = defaultRequest) {
  const product = text.match(/\b(H100|H200|A100|B200|B300|L40S|(?:RTX\s*)?4090|(?:RTX\s*)?5090)\b/i);
  if (!product) return null;
  let accelerator = product[1].toUpperCase().replace(/\s+/g, ' ');
  if (/^\d{4}$/.test(accelerator)) accelerator = `RTX ${accelerator}`;
  const prefix = text.slice(0, product.index);
  const suffix = text.slice(product.index + product[0].length);
  const count = prefix.match(/(?:^|\s)(\d+)\s*(?:GPUs?|cards?|units?|accelerators?)?\s*$/i)?.[1]
    || suffix.match(/^\s*[x×]\s*(\d+)/i)?.[1]
    || text.match(/\b(\d+)\s*(?:GPUs?|cards?|units?|accelerators?)\b/i)?.[1];
  const duration = text.match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|days?|d)\b/i);
  const budget = text.match(/(?:budget(?:\s*(?:of|is|:))?\s*\$?\s*|\$\s*)([\d,]+(?:\.\d+)?)(k)?\b/i);
  const regions = ['Singapore', 'US East', 'US West', 'Tokyo', 'Frankfurt', 'London'];
  const region = regions.find((value) => text.toLowerCase().includes(value.toLowerCase())) || previous.region;
  const hours = duration ? Number(duration[1]) * (/^d/i.test(duration[2]) ? 24 : 1) : previous.hours;
  return {
    accelerator,
    quantity: count ? Math.max(1, Math.min(100000, Number(count))) : previous.quantity,
    region,
    hours: Math.max(1, Math.min(8760, hours)),
    budget: budget ? Math.max(1, Math.min(1e9, Number(budget[1].replaceAll(',', '')) * (budget[2] ? 1000 : 1))) : previous.budget,
    agentLimit: previous.agentLimit,
  };
}

export function analyzeAgentRequest(request) {
  const product = gpuSupplyListings.filter((item) => item.accelerator.toUpperCase().includes(request.accelerator.toUpperCase()));
  const regional = product.filter((item) => item.region === request.region);
  const matches = regional.filter((item) => item.units >= request.quantity)
    .map((item) => ({ ...item, estimatedTotal: Math.round(item.pricePerHour * request.quantity * request.hours * 100) / 100 }))
    .sort((a, b) => a.estimatedTotal - b.estimatedTotal);
  return { product, regional, matches, suppliers: new Set(product.map((item) => item.supplier)).size };
}

function requestSummary(request) { return `${request.quantity} ${request.accelerator} · ${request.region} · ${request.hours} hours`; }

function renderMessages() {
  if (!agentState.messages.length) return `<div class="agent-empty"><span class="agent-empty-mark">${sparkle}</span><p>Your next trade starts here.</p><span>Give your agent a procurement goal.</span></div>`;
  return agentState.messages.map((message) => `<article class="agent-message agent-message-${message.role}"><span class="agent-speaker">${message.role === 'user' ? 'You' : 'Master Agent'}</span><p>${escape(message.text)}</p></article>`).join('');
}

function renderProgress() {
  if (agentState.phase < 0) return '';
  return `<div class="agent-workflow" aria-label="Demo procurement progress">${stages.map((label, i) => `<div class="agent-stage ${i < agentState.phase || agentState.completed ? 'is-complete' : i === agentState.phase && agentState.running ? 'is-current' : ''}"><span>${i < agentState.phase || agentState.completed ? '✓' : String(i + 1).padStart(2, '0')}</span><strong>${label}</strong><small>${i < agentState.phase || agentState.completed ? 'Done' : i === agentState.phase && agentState.running ? 'Running' : 'Pending'}</small></div>`).join('')}${agentState.running ? '<button class="agent-cancel" type="button" data-agent-action="cancel">Stop demo</button>' : ''}</div>`;
}

function renderResults() {
  if (!agentState.completed || !agentState.analysis) return '';
  const { matches, regional } = agentState.analysis;
  const request = agentState.request;
  const best = matches[0];
  if (!best) return `<div class="agent-result"><span class="agent-kicker">Review required</span><h3>No exact capacity match.</h3><p>${regional.length ? 'The sample listings in this region do not cover the requested quantity.' : 'There is no sample listing for this accelerator in the selected region.'} You can adjust your request or send a private RFQ.</p>${rfqButton(request)}</div>`;
  const underBudget = best.estimatedTotal <= request.budget;
  return `<div class="agent-result"><span class="agent-kicker">${underBudget ? 'Option ready to review' : 'Budget review required'}</span><h3>${escape(best.supplier)}</h3><p class="agent-result-caption">${escape(best.accelerator)} · ${escape(best.region)}</p><dl class="agent-result-facts"><div><dt>Sample rate</dt><dd>${money(best.pricePerHour, 2)}<small> / GPU·hr</small></dd></div><div><dt>Estimated compute</dt><dd>${money(best.estimatedTotal, 2)}</dd></div><div><dt>Budget ${underBudget ? 'remaining' : 'exceeded'}</dt><dd>${money(Math.abs(request.budget - best.estimatedTotal), 2)}</dd></div><div><dt>Listed capacity</dt><dd>${best.units} GPUs</dd></div></dl><p class="agent-result-note">${escape(best.term)} · ${best.sla}% listed SLA. Scheduling, network compatibility and final terms need supplier confirmation. Estimate excludes additional fees.</p><p class="agent-approval">Your approval comes next.</p>${rfqButton(request)}</div>`;
}

function rfqButton(request) {
  return `<button type="button" class="agent-primary" data-agent-rfq data-proc-action="post-rfq" data-rfq-type="gpu" data-family="${escape(`${request.accelerator} × ${request.quantity}`)}">Review &amp; open RFQ ${arrow}</button>`;
}

export function renderAgentPanel() {
  return `<div class="agent-heading"><div class="agent-identity"><span class="agent-symbol">${sparkle}</span><div><h2>Master Agent</h2><p>Your procurement partner</p></div></div><span class="agent-demo-badge">Demo</span></div>
    <div class="agent-context"><span>Current brief</span><strong id="agentContext">${escape(agentState.request.accelerator)} / ${escape(agentState.request.region)}</strong><span class="agent-context-dot" aria-hidden="true"></span></div>
    <div class="agent-scroll"><div class="agent-intro"><p>Set your goal. I’ll help source capacity, compare terms and prepare your next move.</p><div class="agent-capabilities"><span>Sourcing</span><i></i><span>Comparison</span><i></i><span>Review</span></div></div>
    <section class="agent-task" aria-label="Recommended demo task"><span class="agent-kicker">Recommended demo</span><h3>Procure 32 H100 GPUs.</h3><p>Singapore · 72 continuous hours</p><dl><div><dt>Compute budget</dt><dd>$6,500<span>.00</span></dd></div><div><dt>Agent limit</dt><dd>$25</dd></div></dl><button type="button" class="agent-primary" data-agent-action="run"${agentState.running ? ' disabled' : ''}>Start procurement demo ${arrow}</button></section>
    <div class="agent-shortcuts"><button type="button" data-agent-action="market">Analyze the sample market ${arrow}</button><button type="button" data-agent-action="fees">Understand agent fees ${arrow}</button></div>
    <div class="agent-conversation-head"><h3>Conversation &amp; execution</h3><button type="button" data-agent-action="reset" aria-label="Clear agent conversation" title="Clear conversation">Reset</button></div>
    <div id="agentConversation" class="agent-conversation" role="log" aria-label="Agent conversation" aria-live="polite" aria-relevant="additions text">${renderMessages()}${renderProgress()}${renderResults()}</div></div>
    <form class="agent-composer" id="agentPromptForm"><label class="agent-visually-hidden" for="agentPrompt">Describe your GPU procurement goal</label><textarea id="agentPrompt" name="prompt" rows="2" maxlength="600" placeholder="Describe the capacity you need…">${escape(agentState.prompt)}</textarea><div class="agent-composer-footer"><span>Approval before action</span><button type="submit" class="agent-send" aria-label="Send to demo agent"${agentState.running ? ' disabled' : ''}>${arrow}</button></div></form><p class="agent-scope">Demo assistant · sample catalog · no live orders</p>`;
}

function refreshConversation() {
  const panel = document.querySelector('.agent-panel');
  if (!panel) return;
  const log = panel.querySelector('#agentConversation');
  if (log) log.innerHTML = `${renderMessages()}${renderProgress()}${renderResults()}`;
  const context = panel.querySelector('#agentContext');
  if (context) context.textContent = `${agentState.request.accelerator} / ${agentState.request.region}`;
  panel.querySelectorAll('[data-agent-action="run"], .agent-send').forEach((button) => { button.disabled = agentState.running; });
  const scroll = panel.querySelector('.agent-scroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;
}

function addMessage(text, role = 'agent') {
  agentState.messages.push({ role, text });
  if (agentState.messages.length > 8) agentState.messages.splice(0, agentState.messages.length - 8);
}

function stopRun() {
  runId += 1;
  if (timer) clearTimeout(timer);
  timer = null;
  agentState.running = false;
}

function startRun(request, userText) {
  stopRun();
  agentState.request = { ...request };
  agentState.completed = false;
  agentState.analysis = analyzeAgentRequest(request);
  agentState.phase = 0;
  agentState.running = true;
  addMessage(userText || `Procure ${requestSummary(request)}, with a ${money(request.budget)} compute budget.`, 'user');
  addMessage(`Using this brief: ${requestSummary(request)}. Compute budget ${money(request.budget)}. I’ll compare the sample catalog; no orders will be placed.`);
  refreshConversation();
  const thisRun = runId;
  function advance() {
    if (thisRun !== runId || !agentState.running) return;
    agentState.phase += 1;
    if (agentState.phase < stages.length) {
      refreshConversation();
      timer = setTimeout(advance, 650);
      return;
    }
    agentState.running = false;
    agentState.completed = true;
    timer = null;
    const { matches, product, suppliers } = agentState.analysis;
    addMessage(`Compared ${product.length} ${request.accelerator} sample listings from ${suppliers} suppliers. ${matches.length} ${matches.length === 1 ? 'listing meets' : 'listings meet'} the region and quantity requirements. Review the estimate and open an RFQ when you’re ready.`);
    refreshConversation();
  }
  timer = setTimeout(advance, 650);
}

function marketSummary() {
  const result = analyzeAgentRequest(agentState.request);
  const prices = result.product.map((item) => item.pricePerHour);
  const overallSuppliers = new Set(gpuSupplyListings.map((item) => item.supplier)).size;
  addMessage('Analyze the sample market.', 'user');
  addMessage(prices.length
    ? `The demo catalog has ${gpuSupplyListings.length} GPU listings across ${overallSuppliers} suppliers. ${agentState.request.accelerator}: ${result.product.length} listings, ${money(Math.min(...prices), 2)}–${money(Math.max(...prices), 2)} per GPU-hour. ${result.regional.length} ${result.regional.length === 1 ? 'listing is' : 'listings are'} in ${agentState.request.region}. These are synthetic asking rates, not live market prices.`
    : `The demo catalog has ${gpuSupplyListings.length} listings. There are no ${agentState.request.accelerator} sample listings. Try H100, H200, A100, B200 or RTX 4090.`);
  refreshConversation();
}

function resetPanel() {
  stopRun();
  agentState = freshState();
  const panel = document.querySelector('.agent-panel');
  if (panel) panel.innerHTML = renderAgentPanel();
}

function prefillRfq() {
  const form = document.getElementById('unifiedRfqForm');
  if (!form) return;
  const request = agentState.request;
  const set = (name, value) => { const field = form.elements.namedItem(name); if (field) field.value = value; };
  set('quantity', `${request.quantity} accelerators`);
  set('amount', money(request.budget));
  set('term', 'custom');
  const region = form.elements.namedItem('region');
  if (region) {
    if (![...region.options].some((option) => option.value === request.region)) region.add(new Option(request.region, request.region));
    region.value = request.region;
  }
  set('notes', `Agent demo brief: ${requestSummary(request)}. Compute budget: ${money(request.budget)}. Continuous duration: ${request.hours} hours. Confirm start time, network topology, inventory availability, SLA, extra fees and final terms before acceptance. Agent spending cap: ${money(request.agentLimit)} (illustrative; no demo charge).`);
  addMessage('Your RFQ draft is open with this brief. Review the requirements and submit it yourself to continue the demo.');
  refreshConversation();
}

export function initializeAgentPanel() {
  if (initialized) return;
  initialized = true;
  // Window capture runs before the legacy procurement document handler, which
  // opens the modal and stops propagation. Prefill after its synchronous work.
  window.addEventListener('click', (event) => {
    const target = event.target.closest?.('.agent-panel [data-agent-rfq]');
    if (target) queueMicrotask(prefillRfq);
  }, true);
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.agent-panel [data-agent-action]');
    if (!button) return;
    const action = button.dataset.agentAction;
    if (action === 'run') startRun(defaultRequest);
    else if (action === 'cancel') { stopRun(); agentState.phase = -1; addMessage('Demo stopped. No RFQ or order was created.'); refreshConversation(); }
    else if (action === 'market') marketSummary();
    else if (action === 'fees') {
      addMessage('How do agent fees work?', 'user');
      addMessage('The $25 agent limit is an illustrative spending cap, separate from the $6,500 compute budget. This demo charges nothing and has no live billing connection. Any real fee schedule and approval terms would need to be agreed before a paid task.');
      refreshConversation();
    } else if (action === 'reset') resetPanel();
  });
  document.addEventListener('input', (event) => { if (event.target.id === 'agentPrompt') agentState.prompt = event.target.value; });
  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'agentPromptForm') return;
    event.preventDefault();
    if (agentState.running) return;
    const prompt = String(new FormData(event.target).get('prompt') || '').trim();
    if (!prompt) { document.getElementById('agentPrompt')?.focus(); return; }
    const request = parseAgentRequest(prompt, agentState.request);
    agentState.prompt = '';
    const input = document.getElementById('agentPrompt');
    if (input) input.value = '';
    if (request) startRun(request, prompt);
    else {
      addMessage(prompt, 'user');
      addMessage('I can compare the demo GPU catalog. Try “32 H100 in Singapore for 72 hours, budget $6,500”. Include an accelerator, quantity, region and duration; omitted fields use the current brief.');
      refreshConversation();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.target.id === 'agentPrompt' && event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      document.getElementById('agentPromptForm')?.requestSubmit();
    }
  });
  window.addEventListener('opennext:signout', resetPanel);
}
