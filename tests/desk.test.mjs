import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeskSeries, normalizeDeskReservation, renderOpenDesk } from '../opennext-desk.js';

test('OpenDesk uses a deterministic, positive, time-ordered index series', () => {
  const series = createDeskSeries('H100', 'Singapore', '1M');
  assert.equal(series.length, 73);
  assert.deepEqual(series, createDeskSeries('H100', 'Singapore', '1M'));
  assert.equal(series.at(-1).value, 2.72);
  assert.ok(series.every((point, i) => Number.isFinite(point.value) && point.value > 0 && (!i || point.time > series[i - 1].time)));
  assert.notDeepEqual(series, createDeskSeries('H200', 'Singapore', '1M'));
  assert.notDeepEqual(series, createDeskSeries('H100', 'US East', '1M'));
  assert.notDeepEqual(series, createDeskSeries('H100', 'Singapore', '1D'));
});

test('reservation event fields normalize to bounded positions with one-month cost', () => {
  const row = normalizeDeskReservation({ id: 'ON-NEW', gpu: 'H100', quantity: 64, durationDays: 30, totalPrice: 198000, region: 'Singapore', startDate: '2026-10-01', supplier: 'Example Compute' });
  assert.equal(row.quantity, 64);
  assert.equal(row.status, 'Reserved');
  assert.equal(row.totalPrice, 198000);
  assert.equal(row.hourlyRate, 198000 / 64 / 30 / 24);
  assert.equal(row.startDate, Date.parse('2026-10-01'));
  assert.equal(normalizeDeskReservation(null), null);
  assert.equal(normalizeDeskReservation([]), null);
  const invalid = normalizeDeskReservation({ quantity: -10, total: Infinity, startDate: 'invalid', durationDays: -1 });
  assert.ok(Number.isFinite(invalid.startDate));
  assert.equal(invalid.quantity, 64);
  assert.equal(invalid.totalPrice, 198000);
  assert.equal(invalid.durationDays, 30);
});

test('OpenDesk is English, line-index only, and includes accessible actionable sections', () => {
  const html = renderOpenDesk();
  assert.doesNotMatch(html, /[\u3400-\u9fff]|candlestick|executable ask|executable bid|orderbook/i);
  assert.match(html, /od-chart-line/);
  assert.match(html, /Recent matches/);
  assert.match(html, /Indicative pricing/);
  assert.match(html, /Simulation/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-label="Delivery region"/);
  assert.match(html, /data-desk-action="pause"/);
});
