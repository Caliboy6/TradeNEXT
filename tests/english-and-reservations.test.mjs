import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hasChinese = /[\u3400-\u9fff]/u;

test('legacy market, request, supply, data, documentation and scheduler render English before localization', async () => {
  globalThis.window = { OpenNEXTI18n: { getLocale: () => 'en' } };
  const pages = await import('../procurement-pages.js');
  for (const [name, render] of Object.entries(pages)) {
    if (!name.startsWith('render') || typeof render !== 'function') continue;
    const html = render();
    assert.equal(hasChinese.test(html), false, `${name} contains Chinese interface text`);
    assert.doesNotMatch(html, /Localized interface copy/);
  }
  const { createSchedule } = await import('../scheduler.js');
  const plan = createSchedule({ text: 'Process customer support records', strategy: 'balanced', region: 'Singapore' });
  assert.equal(hasChinese.test(JSON.stringify(plan)), false, 'dynamic scheduler decisions and warnings use English');
});

test('interface translations remain English with stale saved preferences and explicit Chinese requests', async () => {
  globalThis.localStorage = { getItem: () => 'zh-CN' };
  const { getLocale, translateText } = await import('../i18n-stable.js?english-release-test');
  assert.equal(getLocale(), 'en');
  assert.equal(translateText('供应方审核已开启', 'zh-CN'), 'Supplier review opened');
  const source = readFileSync(new URL('../procurement-workflows.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /David Lee|david@|Alex Chen|\+65 6000 2188/);
});

test('GPU reservations reject invalid values and overlapping protected booking or extension', async () => {
  globalThis.document = { querySelector: () => null, addEventListener() {} };
  const { calculateGpuReservation } = await import('../procurement-workflows.js');
  const args = {
    startValue: '2026-09-14T09:00:00Z', durationValue: '24', quantityValue: '8', extensionValue: '12',
    units: 32, rate: 2.28, earliestStart: new Date('2026-09-14T09:00:00Z'), protectedStart: new Date('2026-09-16T09:00:00Z'),
  };
  const result = calculateGpuReservation(args);
  assert.equal(result.invalid, false);
  assert.equal(result.baseConflict, false);
  assert.equal(result.extensionConflict, false);
  assert.equal(result.total, 437.76);
  for (const invalid of [
    { startValue: '' }, { startValue: '2026-09-14T08:00:00Z' },
    { quantityValue: '33' }, { quantityValue: '2.5' }, { quantityValue: '' },
    { durationValue: '0' }, { durationValue: '-2' }, { durationValue: 'NaN' },
    { extensionValue: '-1' }, { extensionValue: '169' },
  ]) assert.equal(calculateGpuReservation({ ...args, ...invalid }).invalid, true, JSON.stringify(invalid));
  assert.equal(calculateGpuReservation({ ...args, durationValue: '49' }).baseConflict, true);
  assert.equal(calculateGpuReservation({ ...args, extensionValue: '25' }).extensionConflict, true);
  assert.equal(calculateGpuReservation({ ...args, durationValue: '48', extensionValue: '0' }).baseConflict, false);
});
