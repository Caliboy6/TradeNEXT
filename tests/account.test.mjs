import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAccountPage, accountCsv, buildAccountTransactions } from '../opennext-account.js';
import { getCapacityLedgerRecords, addDemoAllocation } from '../opennext-capacity.js?v=opennext-20260915-marketplace-1';

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
  assert.doesNotMatch(page, /Demo account|Current demo session/);
  assert.doesNotMatch(page, /[\u3400-\u9fff]/);
});

test('CSV export neutralizes spreadsheet formulas and preserves quoting', () => {
  const csv = accountCsv([['=HYPERLINK("example")', '+12', '@command', 'comma,value', '"quoted"', 12.5]]);
  assert.equal(csv, '"\'=HYPERLINK(""example"")","\'+12","\'@command","comma,value","""quoted""","12.5"');
});

test('externally settled Agent checkout is recorded once without spending workspace credit again', () => {
  const rows = [
    {id:'INV-FIRST',date:'2026-09-01T10:00:00Z',description:'Existing GPU reservation',kind:'gpu',amount:2300},
    {id:'INV-AGENT',date:'2026-09-02T10:00:00Z',description:'64 H100 GPUs',kind:'gpu',amount:198000,sourceKey:'ON-AGENT-CHECKOUT'},
    {id:'INV-RENEWAL',date:'2026-09-03T10:00:00Z',description:'GPU renewal',kind:'renewal',amount:200},
  ];
  const ledger = buildAccountTransactions(rows);
  const agent = ledger.find(row => row.id === 'INV-AGENT');
  assert.equal(agent.amount,198000,'the complete order price remains in purchase history');
  assert.equal(agent.channel,'External checkout (simulation)');
  assert.equal(agent.status,'Settled (simulation)');
  assert.equal(agent.workspaceImpact,0);
  assert.equal(agent.balance,7700);
  assert.equal(agent.sourceKey,'ON-AGENT-CHECKOUT');
  assert.equal(ledger.find(row => row.id === 'INV-RENEWAL').balance,7500,'separately purchased renewals still debit workspace credit');
  assert.equal(ledger.filter(row => row.direction === 'in').length,1,'no artificial funding record is invented to cover external checkout');
  assert.equal(ledger.filter(row => row.id === 'INV-AGENT').length,1);
  assert.equal(ledger.filter(row => row.direction === 'out').reduce((total,row)=>total+row.amount,0),200500,'fee credits and escrow are not added to the order amount a second time');
});

test('Agent allocation retains source reference across capacity and billing while preserving idempotency', () => {
  const before = getCapacityLedgerRecords();
  const priorBalance = Math.round((10000 - before.reduce((total,row)=>total+row.amount,0))*100)/100;
  const order = {kind:'gpu',sourceKey:'ON-ACCOUNT-LEDGER-TEST',model:'H100',quantity:64,hours:720,rate:198000/(64*720),supplier:'Supplier 03',region:'Singapore'};
  const first = addDemoAllocation(order), duplicate = addDemoAllocation(order);
  assert.equal(first.ok,true);
  assert.equal(duplicate.id,first.id);
  const capacityRecords = getCapacityLedgerRecords();
  const records = capacityRecords.filter(row=>row.allocationId === first.id);
  assert.equal(records.length,1);
  assert.equal(records[0].sourceKey,'ON-ACCOUNT-LEDGER-TEST');
  const billing = buildAccountTransactions(capacityRecords).find(row=>row.raw?.allocationId === first.id);
  assert.equal(billing.amount,198000);
  assert.equal(billing.balance,priorBalance);
  assert.equal(billing.workspaceImpact,0);
  assert.equal(billing.direction,'out');
});
