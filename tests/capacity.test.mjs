import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateReservation,calculateTokenFamily,addDemoAllocation,quoteDemoRenewal,confirmDemoRenewal,getCapacityLedgerRecords,renderCapacityPage} from '../opennext-capacity.js';
test('GPU time distinguishes reservation hours from aggregate GPU-hours and status',()=>{
  const now=Date.now();const g={startsAt:now-2*3600000,hours:10,quantity:8};
  assert.deepEqual(calculateReservation(g,now),{endsAt:now+8*3600000,elapsedHours:2,remainingHours:8,remainingGPUHours:64,status:'Running'});
  assert.equal(calculateReservation({...g,startsAt:now+3600000},now).status,'Scheduled');
  assert.equal(calculateReservation(g,now+24*3600000).remainingGPUHours,0);
});
test('token totals and weighted sample acquisition cost retain input/output units',()=>{
  const total=calculateTokenFamily({models:[{purchased:1e7,inputUsed:3e6,outputUsed:1e6,rate:2},{purchased:2e6,inputUsed:2e5,outputUsed:3e5,rate:10}]});
  assert.deepEqual(total,{purchased:12e6,used:4.5e6,remaining:7.5e6,cost:40});
  const added=addDemoAllocation({kind:'tokens',model:'Sample model',quantity:12e6,rate:999,inputTokens:1e7,outputTokens:2e6,inputRate:2,outputRate:10});
  assert.equal(added.ok,true);assert.equal(getCapacityLedgerRecords().find(x=>x.allocationId===added.id).amount,40);
});
test('reviewed renewal updates holdings and billing once and rejects stale confirmation',()=>{
  const created=addDemoAllocation({kind:'gpu',model:'H100',quantity:8,hours:24,rate:2,region:'Singapore'});
  const quote=quoteDemoRenewal(created.id,24);assert.equal(quote.amount,384);
  assert.equal(confirmDemoRenewal(quote).ok,true);assert.equal(confirmDemoRenewal(quote).ok,false);
  assert.equal(getCapacityLedgerRecords().filter(x=>x.allocationId===created.id).reduce((sum,r)=>sum+r.amount,0),768);
  assert.equal(addDemoAllocation({kind:'gpu',quantity:-1,rate:2,hours:24}).ok,false);
  for(const page of ['profile','tokens','my-gpus'])assert.doesNotMatch(renderCapacityPage(page),/[\u3400-\u9fff]/);
});

test('reopening the same sample quote does not duplicate a token allocation',()=>{
  const order={kind:'tokens',sourceKey:'RFQ-DEMO:Example supplier',model:'Sample model',quantity:12000000,rate:4.1};
  const first=addDemoAllocation(order);
  const again=addDemoAllocation(order);
  assert.equal(first.ok,true);assert.equal(again.id,first.id);
  assert.equal(getCapacityLedgerRecords().filter(r=>r.allocationId===first.id).length,1);
});
