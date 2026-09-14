import test from 'node:test';
import assert from 'node:assert/strict';
import { QUICK_START, parseProcurementBrief, validateProcurementBrief, calculateEscrow, calculateSettlement, createSupplierOptions, resolveReservationStart, renderAgentPanel } from '../opennext-agent.js';

const completeBrief = { accelerator:'H100', quantity:64, months:1, monthlyBudget:210000, region:'Singapore', startDate:'2027-01-01', requirements:'No additional requirements' };

test('English and Chinese sample requests produce the same brief without inventing region, date or requirements', () => {
  const expected = { accelerator:'H100', quantity:64, months:1, monthlyBudget:210000 };
  assert.deepEqual(parseProcurementBrief(QUICK_START), expected);
  assert.deepEqual(parseProcurementBrief('我想要买64卡H100，要使用1个月的时间，我的预算是21w美金一个月 你能帮我找到合适的供应商吗？'), expected);
  assert.deepEqual(parseProcurementBrief('Please find H100 capacity'), {accelerator:'H100'});
  assert.equal(parseProcurementBrief('64 H100 GPUs for 3 months, total budget $210,000').monthlyBudget, undefined);
  const completed = parseProcurementBrief('Singapore, start 2027-01-01, no additional requirements', expected);
  assert.deepEqual(completed, completeBrief);
  assert.equal(validateProcurementBrief(expected).length, 3);
});

test('explicit opt-outs are accepted, and invalid or past requirements are blocked', () => {
  const brief = parseProcurementBrief('No region preference. Start ASAP. No other requirements.', completeBrief);
  assert.equal(brief.region, 'No region preference');
  assert.equal(brief.startDate, 'As soon as available');
  assert.equal(brief.requirements, 'No additional requirements');
  assert.deepEqual(validateProcurementBrief(brief), []);
  for (const override of [{quantity:0}, {quantity:1.5}, {months:0}, {months:6.5}, {months:13}, {monthlyBudget:NaN}, {monthlyBudget:-1}, {region:''}, {startDate:'2025-01-01'}, {startDate:'2027-02-30'}, {startDate:'2028-01-01'}, {requirements:''}, {requirements:'我的邮箱'}, {requirements:'Contact user@example.com'}]) {
    assert.ok(validateProcurementBrief({...completeBrief,...override}, '2026-09-14').length > 0, JSON.stringify(override));
  }
});

test('ASAP resolves to a concrete date displayed in the offer and accepted by the portfolio', () => {
  const now = Date.parse('2026-09-14T12:00:00Z');
  assert.equal(resolveReservationStart('As soon as available',now),'2026-09-15');
  assert.equal(resolveReservationStart('2026-10-01',now),'2026-10-01');
  assert.match(createSupplierOptions({...completeBrief,startDate:'As soon as available'})[2].timing,/^20\d{2}-\d{2}-\d{2}$/);
});

test('escrow exactly follows one-month and longer-than-six-month rules', () => {
  assert.equal(calculateEscrow(210000, 1).amount, 105000);
  for (const months of [2,3,4,5,6]) {
    assert.equal(calculateEscrow(210000, months).available, false);
    assert.equal(calculateEscrow(210000, months).amount, 0);
  }
  assert.equal(calculateEscrow(210000, 7).amount, 357000);
  assert.equal(calculateEscrow(210000, 12).amount, 462000);
  for (const [budget,months] of [[-1,1],[NaN,1],[210000,0],[210000,1.5]]) assert.throws(() => calculateEscrow(budget, months), RangeError);
});

test('payment reconciliation credits the fee once and applies escrow without double charging', () => {
  assert.deepEqual(calculateSettlement(198000,500,105000), {computeTotal:198000, feeCredit:500, escrowApplied:105000, escrowRefund:0, amountDue:92500});
  assert.equal(calculateSettlement(198000,500,0).amountDue,197500);
  const excess = calculateSettlement(1000,500,900);
  assert.equal(excess.amountDue,0);
  assert.equal(excess.escrowApplied,500);
  assert.equal(excess.escrowRefund,400);
  assert.throws(() => calculateSettlement(100,-500,0),RangeError);
  assert.throws(() => calculateSettlement(100,500,0),RangeError);
  assert.throws(() => calculateSettlement(NaN,500,0),RangeError);
});

test('supplier outcomes use the approved budget and only matching supplier can proceed', () => {
  const suppliers = createSupplierOptions(completeBrief);
  assert.equal(suppliers.length,3);
  assert.equal(suppliers[0].total,226800);
  assert.equal(suppliers[0].eligible,false);
  assert.equal(suppliers[1].eligible,false);
  assert.equal(suppliers[2].eligible,true);
  assert.equal(suppliers[2].total,198000);
  assert.equal(createSupplierOptions({...completeBrief,monthlyBudget:300000,months:3})[2].total,848571);
});

test('agent presentation uses English, gives a simulation disclosure, and does not start with prefilled missing parameters', () => {
  const html = renderAgentPanel();
  assert.doesNotMatch(html, /[\u3400-\u9fff]/u);
  assert.match(html,/Interactive simulation/);
  assert.match(html,/no data sent or charges made/);
  assert.match(html,/No active request/);
  assert.match(html,/\$210,000/);
  assert.doesNotMatch(html,/value="Singapore"|value="2026-/);
});

test('workflow requires both approvals, cancels timers and emits one reconciled reservation', async () => {
  const previous = {window:globalThis.window,document:globalThis.document,FormData:globalThis.FormData,CustomEvent:globalThis.CustomEvent,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
  const listeners = new Map(), windowListeners = new Map(), timers = new Map();
  let html = '', timerId = 0, finalApproval = false;
  const reservations = [];
  const context = {textContent:''}, log = {set innerHTML(value) {html=value;}};
  const panel = {querySelector:selector => selector === '#agentConversation' ? log : selector === '#agentContext' ? context : {scrollTop:0,scrollHeight:100},querySelectorAll:()=>[]};
  globalThis.window = {addEventListener:(name,handler)=>windowListeners.set(name,handler),dispatchEvent:event=>reservations.push(event.detail)};
  globalThis.document = {addEventListener:(name,handler)=>listeners.set(name,handler),querySelector:()=>panel,getElementById:id=>id === 'agentFinalApproval' ? {checked:finalApproval,focus(){},setCustomValidity(){},reportValidity(){}} : null};
  globalThis.FormData = class {constructor(form){this.values=form.values;}get(key){return this.values[key] ?? null;}has(key){return Object.hasOwn(this.values,key);}};
  globalThis.CustomEvent = class {constructor(name,{detail}){this.type=name;this.detail=detail;}};
  globalThis.setTimeout = callback => {timers.set(++timerId,callback);return timerId;};
  globalThis.clearTimeout = id => timers.delete(id);
  const click = action => listeners.get('click')({target:{closest:()=>({dataset:{agentAction:action},disabled:false})}});
  const submit = (id,values) => listeners.get('submit')({target:{id,values},preventDefault(){}});
  const advance = () => {const first=timers.entries().next().value;if(first){timers.delete(first[0]);first[1]();}};
  try {
    const {initializeAgentPanel} = await import('../opennext-agent.js?workflow-state-test');
    initializeAgentPanel();
    click('run');
    assert.match(html,/preferred deployment region/);
    assert.match(html,/When should the GPUs/);
    assert.equal(timers.size,0);
    submit('agentBriefForm', {...completeBrief,quantity:'64',months:'1',monthlyBudget:'210000'});
    assert.match(html,/Confirm RFQ/);
    click('guardrail');
    assert.match(html,/Guardrail analyzing/);
    advance();
    assert.match(html,/Guarded with VETA Guardrail/);
    assert.match(html,/non-refundable/);
    assert.equal(timers.size,0,'guardrail does not imply sourcing authorization');
    submit('agentAuthorizationForm',{});
    assert.equal(timers.size,0,'missing authorization is blocked');
    submit('agentAuthorizationForm',{authorize:'on',escrow:'on'});
    assert.equal(timers.size,1);
    click('stop');
    assert.equal(timers.size,0);
    assert.match(html,/Sourcing paused/);
    click('resume');
    while(timers.size) advance();
    assert.match(html,/Three supplier outcomes/);
    click('select-1');
    assert.doesNotMatch(html,/Review your payment/);
    click('select-3');
    assert.match(html,/\$92,500/);
    click('pay');
    assert.equal(timers.size,0,'final payment approval is separate');
    finalApproval = true;
    click('pay');click('pay');
    assert.equal(timers.size,1,'duplicate payment is ignored');
    advance();
    assert.match(html,/Reservation confirmed/);
    assert.equal(reservations.length,1);
    assert.equal(reservations[0].total,198000);
    assert.equal(reservations[0].quantity,64);
    assert.equal(reservations[0].status,'Reserved');
    click('pay');
    assert.equal(reservations.length,1);
    click('reset');click('run');
    submit('agentBriefForm', {...completeBrief,quantity:'64',months:'1',monthlyBudget:'210000'});
    click('guardrail');
    assert.equal(timers.size,1);
    windowListeners.get('opennext:signout')();
    assert.equal(timers.size,0,'sign-out cancels in-flight policy review');
  } finally {Object.assign(globalThis,previous);}
});
