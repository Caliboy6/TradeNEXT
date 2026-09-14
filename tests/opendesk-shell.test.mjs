import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8');

test('My OpenNEXT is the only primary market tab and OpenDesk precedes Profile',()=>{
  const nav=read('index.html').match(/<nav class="workspace-top-nav"[\s\S]*?<\/nav>/)[0];
  assert.match(nav,/data-route="opendesk"/);
  assert.doesNotMatch(nav,/data-route="(?:models|gpus|data)"/);
  assert.match(read('opennext-portal.js'),/\[\['opendesk','My OpenDesk'\],\['profile','Profile'\]/);
});

test('the agent is the trailing column and dark styling stays off public pages',()=>{
  const html=read('index.html');
  assert.ok(html.indexOf('id="mainContent"') < html.indexOf('id="sidebar"'));
  const css=read('opennext-theme.css');
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) var\(--agent-width\)/);
  assert.match(css,/> \.agent-panel \{ grid-column:2/);
  assert.match(css,/body\[data-theme="dark"\]:not\(\.is-public\)/);
  assert.match(css,/left:auto;right:0/);
  assert.match(html,/data-theme-toggle/);
});
