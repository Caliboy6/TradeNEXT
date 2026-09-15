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
  assert.doesNotMatch(html,/data-section="public-gci"/);
  assert.doesNotMatch(html,/Open full view/);
  assert.doesNotMatch(html,/[\u3400-\u9fff]/);
});

test('the landing page embeds the original composition without replacing it with a new interface',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<iframe class="gci-original-frame"/);
  assert.match(html,/src="\.\/gci-index-factory\.html\?v=opennext-20260915-original-1"/);
  assert.match(html,/sandbox="allow-scripts"/);
  assert.doesNotMatch(html,/gci-agent-grid|gci-stage-nav|gci-tabs|__bundler/);
  const standalone=readFileSync(new URL('../gci-index-factory.html',import.meta.url),'utf8');
  assert.match(standalone,/type="__bundler\/manifest"/);
  assert.match(standalone,/type="__bundler\/template"/);
  assert.doesNotMatch(standalone,/gci-stage-nav|gci-tabs/);
});
