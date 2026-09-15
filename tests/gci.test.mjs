import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GCI_DURATION, GCI_STAGES, createGciState, transitionGciState, getGciSnapshot, renderGciFactory, initializeGciFactory, disposeGciFactory } from '../opennext-gci.js';

test('GCI walks through eight stages and ends at its approved publication without looping', () => {
  let state = createGciState();
  assert.equal(state.playing, false);
  state = transitionGciState(state, {type:'play'});
  const visited = [];
  for(let i=0; i<8; i++) {
    visited.push(GCI_STAGES[getGciSnapshot(state).stage].name);
    state = transitionGciState(state, {type:'tick',delta:2500});
  }
  assert.deepEqual(visited,['Collect','Normalize','Dedupe','Surveil','Evidence','Calculate','Review','Publish']);
  assert.equal(state.elapsed,GCI_DURATION);
  assert.equal(state.playing,false);
  assert.equal(getGciSnapshot(state).published,true);
  assert.equal(getGciSnapshot(state).signoffs,2);
  assert.equal(getGciSnapshot(state).value,'$2.418');
  assert.deepEqual(transitionGciState(state,{type:'tick',delta:10000}),state);
});

test('GCI excludes the duplicate before calculation, records a lesson and requires two sign-offs',()=>{
  let state=transitionGciState(createGciState(),{type:'select',stage:2});
  assert.equal(getGciSnapshot(state).duplicate,'Flagged');
  assert.equal(getGciSnapshot(state).lessons,1284);
  assert.equal(getGciSnapshot(state).value,'—');
  state=transitionGciState(state,{type:'select',stage:4});
  assert.equal(getGciSnapshot(state).duplicate,'Rejected');
  assert.equal(getGciSnapshot(state).lessons,1285);
  assert.equal(getGciSnapshot(state).published,false);
  state=transitionGciState(state,{type:'select',stage:6});
  assert.equal(getGciSnapshot(state).signoffs,1);
  assert.equal(getGciSnapshot(state).published,false);
  state=transitionGciState(state,{type:'play'});
  state=transitionGciState(state,{type:'tick',delta:1200});
  assert.equal(getGciSnapshot(state).signoffs,2);
  assert.equal(getGciSnapshot(state).published,false);
  state=transitionGciState(state,{type:'tick',delta:1300});
  assert.equal(getGciSnapshot(state).published,true);
});

test('GCI pause, manual selection and replay preserve clear local playback semantics',()=>{
  let state=transitionGciState(createGciState(),{type:'play'});
  state=transitionGciState(state,{type:'tick',delta:3456});
  state=transitionGciState(state,{type:'pause'});
  assert.equal(transitionGciState(state,{type:'tick',delta:1000}).elapsed,3456);
  assert.equal(transitionGciState(state,{type:'select',stage:-1}),state);
  assert.equal(transitionGciState(state,{type:'select',stage:8}),state);
  state=transitionGciState(state,{type:'select',stage:5});
  assert.equal(state.elapsed,12500);
  assert.equal(state.playing,false);
  state=transitionGciState(state,{type:'replay'});
  assert.equal(state.elapsed,0);
  assert.equal(state.playing,true);
  assert.equal(getGciSnapshot(state).lessons,1284);
  assert.equal(transitionGciState(state,{type:'tick',delta:-500}).elapsed,0);
  assert.equal(transitionGciState(state,{type:'tick',delta:Infinity}).elapsed,0);
});

test('GCI release-family selection changes labels only, with no invented sampling cadence',()=>{
  const state={...createGciState(),elapsed:8750};
  for(const cadence of ['1s','1h','24h']) {
    const next=transitionGciState(state,{type:'cadence',value:cadence});
    assert.equal(next.cadence,cadence);assert.equal(next.elapsed,8750);
  }
  assert.equal(transitionGciState(state,{type:'cadence',value:'0s'}),state);
});

test('GCI output is English, accessible, source-grounded and independent of external services',async()=>{
  const html=renderGciFactory();
  assert.match(html,/role="tablist"/);
  assert.match(html,/System Architecture/);
  assert.match(html,/End-to-End Workflow/);
  assert.match(html,/Shared SLM/);
  assert.match(html,/Methodology/);
  assert.match(html,/Compliance/);
  assert.match(html,/CASE-8813/);
  assert.match(html,/CASE-8811/);
  assert.match(html,/Illustrative scenario/);
  assert.doesNotMatch(html,/[\u3400-\u9fff]|<iframe|<script|https?:\/\//);
  const source=await readFile(new URL('../opennext-gci.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|WebSocket|postMessage|HBM3e\s*(?:→|=)\s*HBM3/);
  initializeGciFactory(null);initializeGciFactory({});disposeGciFactory();disposeGciFactory();
});
