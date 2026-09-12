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
