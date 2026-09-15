import test from 'node:test';
import assert from 'node:assert/strict';
import {createMarketplaceStore} from '../opennext-marketplace-state.js';

const current = '2026-09-15T12:00:00.000Z';
const options = {now: () => new Date(current)};
const gpuSupply = {
  market: 'gpu', model: 'H100', servers: 64, gpusPerServer: 8, region: 'United States',
  minimumMonths: 1, monthlyPrice: 210000, slaPercent: 99.95,
  availability: 'available', allowPartial: true,
};
const gpuRfq = {
  market: 'gpu', model: 'H100', gpuCount: 64, region: 'US', durationMonths: 1,
  monthlyBudget: 210000, minSlaPercent: 99.9, startDate: '2026-10-01',
};
const tokenSupply = {
  market: 'token', model: 'Claude Sonnet 4.5', quotaTokens: 200000000,
  inputPrice: 3, outputPrice: 15, deliveryHours: 6, sourceType: 'authorized',
};
const tokenRfq = {
  market: 'token', model: 'claude sonnet 4.5', quotaTokens: 100000000,
  maxInputPrice: 3, maxOutputPrice: 15, deliveryHours: 24, sourceRequirement: 'authorized',
};
const newStore = storage => createMarketplaceStore(storage, options);
const memoryStorage = () => {
  const values = new Map();
  return {values, getItem: key => values.get(key), setItem: (key, value) => values.set(key, value)};
};

test('new workspace contains no fabricated inventory or RFQs', () => {
  const store = newStore();
  assert.deepEqual(store.rfqs, []);
  assert.deepEqual(store.supplies, []);
  assert.deepEqual(store.matches, []);
  assert.deepEqual(store.notifications, []);
});

for (const direction of ['buyer first', 'seller first']) {
  test(`GPU matching works ${direction}, calculates 64 x 8 inventory, and notifies both roles`, () => {
    const store = newStore();
    let rfq;
    let supply;
    if (direction === 'buyer first') {
      rfq = store.createRfq(gpuRfq);
      assert.equal(store.notifications.length, 0);
      supply = store.createSupply({...gpuSupply, totalGpus: 64});
    } else {
      supply = store.createSupply(gpuSupply);
      assert.equal(store.notifications.length, 0);
      rfq = store.createRfq(gpuRfq);
    }
    assert.equal(supply.totalGpus, 512);
    assert.equal(supply.availableFrom, '2026-09-15');
    assert.equal(store.matches.length, 1);
    const match = store.matches[0];
    assert.equal(match.estimatedMonthlyCost, 26250);
    assert.deepEqual(store.getMatches('rfq', rfq.id), [match]);
    assert.deepEqual(store.getMatches('supply', supply.id), [match]);
    assert.equal(store.notifications.length, 2);
    assert.deepEqual(new Set(store.notifications.map(value => value.role)), new Set(['buyer', 'seller']));
    assert.ok(store.notifications.every(value => value.rfqId === rfq.id && value.supplyId === supply.id && !value.read));
  });
}

test('GPU matching respects capacity, model, region, dates, minimum term, SLA, and budget', () => {
  const failures = [
    {rfq: {gpuCount: 513}},
    {rfq: {model: 'H200'}},
    {rfq: {region: 'Singapore'}},
    {rfq: {minSlaPercent: 99.99}},
    {rfq: {monthlyBudget: 26249.99}},
    {supply: {minimumMonths: 2}},
    {supply: {availability: 'unavailable'}},
    {supply: {availability: 'scheduled', availableFrom: '2026-10-02'}},
    {supply: {status: 'paused'}},
    {rfq: {status: 'closed'}},
    {supply: {model: 'H100 NVL'}},
  ];
  for (const failure of failures) {
    const store = newStore();
    store.createSupply({...gpuSupply, ...failure.supply});
    store.createRfq({...gpuRfq, ...failure.rfq});
    assert.equal(store.matches.length, 0, JSON.stringify(failure));
    assert.equal(store.notifications.length, 0);
  }
  const any = newStore();
  any.createSupply({...gpuSupply, model: 'NVIDIA H100', region: 'Singapore'});
  any.createRfq({...gpuRfq, region: 'Any region'});
  assert.equal(any.matches.length, 1);
  const regional = newStore();
  regional.createSupply({...gpuSupply, region: 'US West'});
  regional.createRfq(gpuRfq);
  assert.equal(regional.matches.length, 1);
  const specific = newStore();
  specific.createSupply(gpuSupply);
  specific.createRfq({...gpuRfq, region: 'US East'});
  assert.equal(specific.matches.length, 0, 'Country-level inventory cannot promise a specific subregion');
});

test('whole-block inventory is never prorated or overbooked for a partial RFQ', () => {
  const store = newStore();
  store.createSupply({...gpuSupply, allowPartial: false});
  store.createRfq(gpuRfq);
  assert.equal(store.matches.length, 0);
  store.createRfq({...gpuRfq, gpuCount: 512});
  assert.equal(store.matches.length, 1);
  assert.equal(store.matches[0].estimatedMonthlyCost, 210000);
});

test('closing or pausing removes active matches and reopening does not repeat alerts', () => {
  const store = newStore();
  const rfq = store.createRfq(gpuRfq);
  const supply = store.createSupply(gpuSupply);
  const id = store.matches[0].id;
  store.updateStatus('rfq', rfq.id, 'paused');
  assert.equal(store.matches.length, 0);
  store.updateStatus('rfq', rfq.id, 'open');
  store.updateStatus('supply', supply.id, 'paused');
  assert.equal(store.matches.length, 0);
  store.updateStatus('supply', supply.id, 'active');
  assert.equal(store.matches[0].id, id);
  assert.equal(store.notifications.length, 2);
  assert.throws(() => store.updateStatus('supply', supply.id, 'open'), /valid status/);
  assert.throws(() => store.updateStatus('rfq', 'missing', 'open'), /no longer available/);
});

for (const direction of ['buyer first', 'seller first']) {
  test(`Token matching works ${direction} and separates input and output prices`, () => {
    const store = newStore();
    if (direction === 'buyer first') {
      store.createRfq(tokenRfq);
      store.createSupply(tokenSupply);
    } else {
      store.createSupply(tokenSupply);
      store.createRfq(tokenRfq);
    }
    assert.equal(store.matches.length, 1);
    assert.equal(store.notifications.length, 2);
    assert.equal(store.matches[0].estimatedMonthlyCost, undefined);
    assert.equal(store.supplies[0].sourceType, 'authorized');
    assert.equal(store.supplies[0].verified, undefined, 'A source declaration is not an independently verified credential');
  });
}

test('Token matching enforces quota, each price cap, delivery, model, and source requirements', () => {
  const failures = [
    {rfq: {quotaTokens: 200000001}},
    {rfq: {maxInputPrice: 2.99}},
    {rfq: {maxOutputPrice: 14.99}},
    {rfq: {deliveryHours: 5}},
    {rfq: {model: 'GPT-4o'}},
    {rfq: {sourceRequirement: 'original'}},
    {supply: {sourceType: 'independent'}},
    {supply: {availableFrom: '2026-09-17'}},
  ];
  for (const failure of failures) {
    const store = newStore();
    store.createSupply({...tokenSupply, ...failure.supply});
    store.createRfq({...tokenRfq, ...failure.rfq});
    assert.equal(store.matches.length, 0, JSON.stringify(failure));
  }
  const original = newStore();
  original.createSupply({...tokenSupply, sourceType: 'original'});
  original.createRfq(tokenRfq);
  assert.equal(original.matches.length, 1, 'Original provider satisfies authorized-or-original requirement');
  const independent = newStore();
  independent.createSupply({...tokenSupply, sourceType: 'independent'});
  independent.createRfq({...tokenRfq, sourceRequirement: 'any'});
  assert.equal(independent.matches.length, 1);
});

test('matches, status, read notifications, and unique IDs survive reload without duplicate alerts', () => {
  const storage = memoryStorage();
  const first = newStore(storage);
  const rfq = first.createRfq(gpuRfq);
  const supply = first.createSupply(gpuSupply);
  const firstMatch = first.matches[0];
  first.markRead(first.notifications[0].id);
  const second = newStore(storage);
  assert.deepEqual(second.rfqs, first.rfqs);
  assert.deepEqual(second.supplies, first.supplies);
  assert.deepEqual(second.matches, [firstMatch]);
  assert.deepEqual(second.notifications, first.notifications);
  second.updateStatus('supply', supply.id, 'paused');
  second.updateStatus('supply', supply.id, 'active');
  assert.equal(second.notifications.length, 2);
  assert.notEqual(second.createRfq({...gpuRfq, region: 'Japan'}).id, rfq.id);
  assert.equal(second.markAllRead(), 1);
  assert.ok(newStore(storage).notifications.every(value => value.read));
});

test('delivery deadlines remain fixed while a Token RFQ waits for supply', () => {
  let time = new Date(current);
  const store = createMarketplaceStore(undefined, {now: () => time});
  store.createRfq({...tokenRfq, deliveryHours: 24});
  time = new Date(time.getTime() + 25 * 3600000);
  store.createSupply({...tokenSupply, deliveryHours: 0});
  assert.equal(store.matches.length, 0, 'A supplier arriving after the original deadline must not match');
  const live = createMarketplaceStore(undefined, {now: () => time});
  live.createSupply({...tokenSupply, deliveryHours: 0});
  assert.throws(() => live.createRfq({...tokenRfq, deliveryHours: 0}), /Delivery window/);
  live.createRfq({...tokenRfq, deliveryHours: 1});
  assert.equal(live.matches.length, 1, 'Immediately available supply matches a one-hour delivery window');
  time = new Date(time.getTime() + 1);
  assert.equal(live.matches.length, 1, 'Advancing the real clock does not immediately invalidate eligible supply');
  time = new Date(time.getTime() + 3600000);
  assert.equal(live.matches.length, 0, 'Reading matches recalculates expired delivery windows');
});

test('new GPU RFQs reject past dates while historical RFQs restore without stale matches', () => {
  const storage = memoryStorage();
  let time = new Date(current);
  const store = createMarketplaceStore(storage, {now: () => time});
  assert.throws(() => store.createRfq({...gpuRfq, startDate: '2026-09-14'}), /today or later/);
  assert.throws(() => store.createRfq({...gpuRfq, startDate: '2035-01-01'}), /next five years/);
  store.createSupply(gpuSupply);
  store.createRfq({...gpuRfq, startDate: '2026-09-15'});
  assert.equal(store.matches.length, 1);
  time = new Date('2026-09-16T00:00:00.000Z');
  assert.equal(store.matches.length, 0);
  const restored = createMarketplaceStore(storage, {now: () => time});
  assert.equal(restored.rfqs.length, 1, 'Historical RFQ remains available in the account');
  assert.equal(restored.matches.length, 0);
});

test('malformed storage is ignored, unknown fields are dropped, and stored alert copy is reconstructed', () => {
  for (const value of ['invalid JSON', 'null', '[]', '{"version":1,"rfqs":[null,{},false],"supplies":[{}],"notifications":[{}]}']) {
    const store = newStore({getItem: () => value});
    assert.deepEqual(store.rfqs, []);
    assert.deepEqual(store.supplies, []);
  }
  const storage = memoryStorage();
  const first = newStore(storage);
  first.createRfq({...gpuRfq, notes: 'Private account: customer@example.com', apiKey: 'never-store-this'});
  first.createSupply(gpuSupply);
  const key = [...storage.values.keys()][0];
  const saved = JSON.parse(storage.values.get(key));
  assert.equal(saved.rfqs[0].apiKey, undefined);
  saved.rfqs.push({...saved.rfqs[0], id: 'RFQ-invalid', gpuCount: -4});
  saved.supplies[0].totalGpus = 9999999;
  saved.notifications[0].body = 'Injected secret and arbitrary markup';
  saved.notifications[0].title = '<script>Injected</script>';
  storage.values.set(key, JSON.stringify(saved));
  const restored = newStore(storage);
  assert.equal(restored.rfqs.length, 1);
  assert.equal(restored.supplies[0].totalGpus, 512);
  assert.ok(restored.notifications.every(notice => !JSON.stringify(notice).includes('customer@example.com')));
  assert.ok(restored.notifications.every(notice => !JSON.stringify(notice).includes('Injected')));
});

test('invalid numeric, date, text, and market inputs fail before publishing', () => {
  const store = newStore();
  for (const value of ['', ' ', -1, 0, NaN, Infinity, 'NaN', 'Infinity', [], {}, '1.5']) {
    assert.throws(() => store.createRfq({...gpuRfq, gpuCount: value}));
  }
  for (const startDate of ['', '2026-02-30', '2026-13-01', '2026-1-1', '<script>']) {
    assert.throws(() => store.createRfq({...gpuRfq, startDate}));
  }
  assert.throws(() => store.createSupply({...gpuSupply, availability: 'scheduled'}), /Availability date/);
  assert.throws(() => store.createSupply({...gpuSupply, slaPercent: 100.1}), /Uptime SLA/);
  assert.throws(() => store.createSupply({...gpuSupply, region: 'Any region'}), /where this inventory is hosted/);
  assert.throws(() => store.createSupply({...gpuSupply, model: '<img src=x>'}), /valid gpu model/);
  assert.throws(() => store.createRfq({...gpuRfq, market: 'unknown'}), /valid market/);
  assert.throws(() => store.createRfq({...tokenRfq, maxInputPrice: ''}), /required/);
  assert.equal(store.rfqs.length, 0);
  assert.equal(store.supplies.length, 0);
});

test('storage failures do not break publishing, and returned records cannot mutate stored inventory', () => {
  const store = newStore({getItem() { throw Error('Blocked'); }, setItem() { throw Error('Full'); }});
  const supply = store.createSupply(gpuSupply);
  supply.totalGpus = 0;
  store.supplies[0].status = 'withdrawn';
  store.createRfq(gpuRfq);
  assert.equal(store.supplies[0].totalGpus, 512);
  assert.equal(store.matches.length, 1);
  store.notifications[0].read = true;
  assert.equal(store.notifications[0].read, false);
});

test('old records and associated alerts are bounded and pruned together', () => {
  const store = newStore();
  store.createSupply(gpuSupply);
  const first = store.createRfq(gpuRfq);
  for (let index = 0; index < 104; index++) store.createRfq(gpuRfq);
  assert.equal(store.rfqs.length, 100);
  assert.equal(store.matches.length, 100);
  assert.ok(!store.rfqs.some(record => record.id === first.id));
  assert.ok(!store.notifications.some(notice => notice.rfqId === first.id));
  assert.ok(store.notifications.length <= 400);
});
