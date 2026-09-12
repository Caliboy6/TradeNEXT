import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

function setup() {
  const listeners = new Map();
  const makeElement = () => {
    const classes = new Set();
    return { hidden: false, innerHTML: '', classList: { add: v => classes.add(v), remove: v => classes.delete(v), contains: v => classes.has(v) }, style: { removeProperty() {} }, replaceChildren() {}, setAttribute() {}, querySelector() { return null; } };
  };
  const elements = new Map(['publicContent', 'app', 'sidebar', 'drawer-host', 'modal-host', 'toast-host', 'startup-fallback', 'opennext-workspace-style', 'opennext-public-style', 'public-terms', 'public-auth-error'].map(id => [id, makeElement()]));
  globalThis.document = { body: makeElement(), documentElement: makeElement(), head: { append() {} }, querySelector: selector => elements.get(selector.slice(1)), getElementById: id => elements.get(id), addEventListener: (name, fn) => listeners.set(name, fn) };
  globalThis.location = { hash: '', href: 'https://demo.example/TradeNEXT/', reload() {} };
  const update = (state, _, url) => { history.state = state; location.href = new URL(url, location.href).href; location.hash = new URL(location.href).hash; };
  globalThis.history = { state: null, replaceState: update, pushState: update };
  const data = new Map();
  globalThis.sessionStorage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  globalThis.localStorage = { getItem: () => null, setItem() {} };
  globalThis.window = { scrollY: 0, scrollTo() {}, addEventListener() {} };
  return { elements, click(dataset) { const target = { dataset, classList: { contains: () => false }, closest: selector => selector === '[data-public-action]' ? target : null }; listeners.get('click')({ target, preventDefault() {}, stopImmediatePropagation() {} }); } };
}

test('homepage is present without JavaScript and preload targets all exist', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /AI capacity,<br>on your terms\./);
  assert.match(html, /See how supply meets demand/);
  assert.doesNotMatch(html, /OpenNEXT is loading/);
  assert.match(html, /id="startup-fallback"/);
  const preloads = [...html.matchAll(/rel="modulepreload" href="([^"]+)"/g)];
  assert.ok(preloads.length > 20);
  for (const [, url] of preloads) assert.ok(existsSync(new URL(`../${url.split('?')[0]}`, import.meta.url)), url);
});

test('public UI and deep-link sign-in work before procurement scripts arrive; failed workspace can be left safely', async () => {
  const { elements, click } = setup();
  const app = await import('../opennext-public.js?startup-test=1');
  app.initializePublicShell('home');
  assert.match(elements.get('publicContent').innerHTML, /AI capacity/);
  assert.equal(elements.get('app').hidden, true);
  app.navigatePublic('gpus');
  assert.equal(location.hash, '#login?next=gpus');
  assert.match(elements.get('publicContent').innerHTML, /Sign in to OpenNEXT/);
  elements.get('public-terms').checked = true;
  click({ publicAction: 'demo' });
  assert.equal(location.hash, '#gpus');
  assert.match(elements.get('publicContent').innerHTML, /Opening your workspace/);
  assert.equal(elements.get('app').hidden, true);
  app.reportWorkspaceFailure();
  assert.match(elements.get('publicContent').innerHTML, /Let’s reconnect/);
  assert.match(elements.get('publicContent').innerHTML, /Retry connection/);
  app.navigatePublic('home');
  assert.match(elements.get('publicContent').innerHTML, /AI capacity/);
});

test('startup completion preserves the latest user destination and GPU mode', async () => {
  const { elements, click } = setup();
  const app = await import('../opennext-public.js?startup-test=2');
  app.initializePublicShell('home');
  click({ publicAction: 'open-workspace', target: 'gpus', mode: 'hardware' });
  elements.get('public-terms').checked = true;
  click({ publicAction: 'demo' });
  let visited, gpuMode;
  window.__openNextProcurementRender = route => route;
  window.__openNextProcurementNavigate = route => { visited = route; };
  window.OpenNEXTSetGpuMode = mode => { gpuMode = mode; };
  location.hash = '#models'; // Legacy initialization may briefly normalize its own route.
  app.initializePublic('home');
  assert.equal(visited, 'gpus');
  assert.equal(gpuMode, 'hardware');
  assert.equal(elements.get('app').hidden, false);
  assert.equal(elements.get('publicContent').hidden, true);
});

test('provider sign-in requires consent and a separate demo confirmation', async () => {
  const { elements, click } = setup();
  const app = await import('../opennext-public.js?startup-test=3');
  app.initializePublicShell('login');
  click({ publicAction: 'provider', provider: 'google' });
  assert.match(elements.get('public-auth-error').textContent, /accept the demo policies/);
  assert.equal(elements.get('modal-host').innerHTML, '');
  assert.equal(location.hash, '#login?next=models');
  elements.get('public-terms').checked = true;
  click({ publicAction: 'provider', provider: 'google' });
  assert.match(elements.get('modal-host').innerHTML, /Google demo sign-in/);
  assert.equal(location.hash, '#login?next=models');
  click({ publicAction: 'confirm-provider' });
  assert.equal(location.hash, '#models');
  assert.match(elements.get('publicContent').innerHTML, /Opening your workspace/);
});
