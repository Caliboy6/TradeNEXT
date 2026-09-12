import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAgentRequest, analyzeAgentRequest } from '../opennext-agent.js';

test('agent interprets quantity, region, duration and budget into one brief', () => {
  const request = parseAgentRequest('16 H200 in Singapore for 3 days, budget $12k');
  assert.equal(request.accelerator, 'H200');
  assert.equal(request.quantity, 16);
  assert.equal(request.region, 'Singapore');
  assert.equal(request.hours, 72);
  assert.equal(request.budget, 12000);
  assert.equal(parseAgentRequest('Tell me about the weather'), null);
});

test('agent quote estimates use real demo catalog rates and respect region and available quantity', () => {
  const request = parseAgentRequest('32 H100 in Singapore for 72 hours, budget $6500');
  const result = analyzeAgentRequest(request);
  assert.ok(result.matches.length > 0);
  const best = result.matches[0];
  assert.equal(best.region, request.region);
  assert.ok(best.units >= request.quantity);
  assert.equal(best.estimatedTotal, Math.round(best.pricePerHour * 32 * 72 * 100) / 100);
  assert.equal(analyzeAgentRequest({ ...request, quantity:100000 }).matches.length, 0);
});

test('agent RFQ handoff waits through a browser listener microtask checkpoint before prefilling the newly opened form', async () => {
  const windowListeners = new Map();
  let form = null;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = { addEventListener: (name, handler) => windowListeners.set(name, handler) };
  globalThis.document = {
    addEventListener() {},
    querySelector: () => null,
    getElementById: id => id === 'unifiedRfqForm' ? form : null,
  };
  try {
    const { initializeAgentPanel } = await import('../opennext-agent.js?rfq-handoff-test=1');
    initializeAgentPanel();
    const click = () => windowListeners.get('click')({ target: { closest: () => ({}) } });
    click();
    // Browsers can process microtasks after the window capture listener and
    // before the document capture listener creates the legacy RFQ modal.
    await Promise.resolve();
    const fields = {
      quantity: { value: '64 accelerators' }, amount: { value: '$250,000' },
      term: { value: '30d' }, notes: { value: '' },
      region: { value: 'US', options: [{ value: 'US' }, { value: 'Singapore' }] },
    };
    form = { elements: { namedItem: name => fields[name] } };
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(fields.quantity.value, '32 accelerators');
    assert.equal(fields.amount.value, '$6,500');
    assert.equal(fields.term.value, 'custom');
    assert.equal(fields.region.value, 'Singapore');
    assert.match(fields.notes.value, /Continuous duration: 72 hours/);
    assert.match(fields.notes.value, /Agent spending cap: \$25/);

    fields.quantity.value = 'unchanged';
    click();
    windowListeners.get('opennext:signout')();
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(fields.quantity.value, 'unchanged', 'signout cancels a pending RFQ prefill');
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});
