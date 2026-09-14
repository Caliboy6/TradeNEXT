import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspaceStore} from '../opennext-portal-state.js';
import {safeDestination,workspaceRoutes} from '../opennext-session.js';
test('private workspace destinations remain protected known routes',()=>{
  for(const route of ['opendesk','profile','tokens','my-gpus','rfq','supply','messages','billing','account']){
    assert.ok(workspaceRoutes.has(route));assert.equal(safeDestination(route),route);
  }
  assert.equal(safeDestination('https://malicious.example'),'opendesk');
});
test('RFQs require valid commercial inputs and survive a demo reload',()=>{
  const memory=new Map();const storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
  const store=createWorkspaceStore(storage);const base={product:'H100 × 32',amount:'$6,500',region:'Singapore',type:'gpu',term:'custom',quantity:'32 accelerators',notes:'72 continuous hours'};
  for(const amount of ['',0,-10,'NaN','Infinity'])assert.equal(store.createRfq({...base,amount}),null);
  const record=store.createRfq(base);assert.equal(record.notional,'$6,500');assert.equal(record.type,'GPU Cluster');
  assert.equal(record.term,'Custom term');assert.equal(createWorkspaceStore(storage).rfqs[0].notes,base.notes);
  const other=store.createRfq(base);assert.notEqual(other.id,record.id);
});
test('demo messages persist per counterparty with bounded text and work when storage fails',()=>{
  const store=createWorkspaceStore({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
  assert.equal(store.send('Meridian Compute',''),false);
  assert.equal(store.send('Meridian Compute','Test delivery confirmation'),true);
  assert.match(store.thread('Meridian Compute')[1].text,/Test delivery/);
  assert.equal(store.thread('OpenNEXT Capacity Desk').length,1);
  assert.deepEqual(store.thread('__proto__'),[]);
});
