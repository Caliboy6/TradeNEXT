import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderLanding} from '../opennext-public-pages.js';

test('GCI is a public chapter between procurement and the supplier section',()=>{
  const html=renderLanding();
  const start=html.indexOf('id="public-gci"');
  assert.ok(start>html.indexOf('id="how-it-works"'));
  assert.ok(start<html.indexOf('id="suppliers"'));
  assert.match(html,/System Architecture and End-to-End Workflow for the GPU Compute Index/);
  assert.match(html,/data-section="public-gci"/);
  assert.match(html,/href="\.\/gci-index-factory\.html"/);
  assert.doesNotMatch(html,/[\u3400-\u9fff]/);
});

test('both public entry points ship prerendered GCI content without an authoring runtime',()=>{
  for(const path of ['../index.html','../gci-index-factory.html']){
    const html=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.match(html,/class="gci-factory/);
    assert.match(html,/Index Generation Master Agent/);
    assert.match(html,/Shared SLM/);
    assert.doesNotMatch(html,/__bundler|babel-standalone|text\/babel|unpkg\.com|claude\.ai/);
  }
});
