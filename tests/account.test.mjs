import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAccountPage, accountCsv } from '../opennext-account.js';
import { getCapacityLedgerRecords } from '../opennext-capacity.js?v=opennext-20260913-2';

test('billing uses shared capacity purchases with valid dates and pagination', () => {
  const page = renderAccountPage('billing');
  assert.match(page, /Fees &amp; billing|Fees & billing/);
  assert.match(page, /Page 1 of 2/);
  assert.doesNotMatch(page, /Invalid Date|NaN|undefined/);
  assert.ok(getCapacityLedgerRecords().length >= 7);
  assert.match(page, /Money in/);
  assert.match(page, /Money out/);
});

test('account offers explicit demo security controls and sign-out', () => {
  const page = renderAccountPage('account');
  assert.match(page, /Two-factor authentication/);
  assert.match(page, /data-flow-action="logout"/);
  assert.match(page, /do not secure this public demo/);
  assert.doesNotMatch(page, /[\u3400-\u9fff]/);
});

test('CSV export neutralizes spreadsheet formulas and preserves quoting', () => {
  const csv = accountCsv([['=HYPERLINK("example")', '+12', '@command', 'comma,value', '"quoted"', 12.5]]);
  assert.equal(csv, '"\'=HYPERLINK(""example"")","\'+12","\'@command","comma,value","""quoted""","12.5"');
});
