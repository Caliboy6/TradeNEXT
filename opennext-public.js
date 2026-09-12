import { renderLanding, renderLogin } from './opennext-public-pages.js?v=opennext-20260912-2';
import { safeDestination, workspaceRoutes, readSession, writeSession, clearSession, DEMO_CODE } from './opennext-session.js?v=opennext-20260912-2';

const publicContent = document.querySelector('#publicContent');
const workspace = document.querySelector('#app');
const storage = (() => { try { return sessionStorage; } catch { return { getItem: () => null, setItem() {}, removeItem() {} }; } })();
let session = readSession(storage);
let ready = false;
let workspaceRender;
let workspaceNavigate;
let current = '';
let pending = 'models';
let ignoreNextHash = false;
let draft = { mode: 'email', email: '', name: '', company: '', error: '' };
const lang = () => window.OpenNEXTI18n?.getLocale?.() || 'en';
const copy = (en, zh) => lang() === 'zh-CN' ? zh : en;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function closeOverlays() {
  for (const id of ['drawer-host', 'modal-host', 'toast-host']) document.getElementById(id)?.replaceChildren();
  document.body.classList.remove('overlay-open');
  document.body.style.removeProperty('overflow');
  document.querySelector('#sidebar')?.classList.remove('is-open');
}

function showPublic(route) {
  current = route;
  workspace.hidden = true;
  publicContent.hidden = false;
  document.body.classList.add('is-public');
  publicContent.innerHTML = route === 'home' ? renderLanding(lang()) : renderLogin(lang(), { ...draft, mode: route === 'signup' ? 'register' : draft.mode });
  document.documentElement.classList.remove('i18n-loading');
}

function updateLocation(route, replace = false) {
  const hash = `#${route}`;
  if (!replace && location.hash !== hash) history.replaceState({ ...history.state, scrollY: window.scrollY }, '', location.href);
  if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState']({ route, scrollY: 0 }, '', hash);
}

function parseRoute(raw) {
  const [path, query] = String(raw || 'home').replace(/^#/, '').split('?');
  const params = new URLSearchParams(query || '');
  if (params.has('next')) pending = safeDestination(params.get('next'));
  return path === 'signin' ? 'login' : path === 'overview' || path === 'native' ? 'models' : path;
}

export function navigatePublic(raw = 'home', options = {}) {
  const route = parseRoute(raw);
  closeOverlays();
  if (workspaceRoutes.has(route)) {
    if (!session || session.expiresAt <= Date.now()) {
      session = null;
      pending = route;
      draft.mode = 'email';
      updateLocation(`login?next=${route}`, options.replace);
      showPublic('login');
    } else {
      current = route;
      publicContent.hidden = true;
      workspace.hidden = false;
      document.body.classList.remove('is-public');
      if (ready) workspaceNavigate(route, { ...options, history: options.replace ? 'replace' : undefined });
      else updateLocation(route, options.replace);
    }
  } else {
    const next = ['home', 'login', 'signup'].includes(route) ? route : 'home';
    updateLocation(next === 'home' ? 'home' : `${next}?next=${pending}`, options.replace);
    showPublic(next);
  }
  if (options.scroll !== false) window.scrollTo({ top: 0, behavior: 'auto' });
}

function completeDemo(profile) {
  session = writeSession(storage, profile);
  draft.error = '';
  draft.mode = 'email';
  navigatePublic(pending, { replace: true });
}

function showInfo(type) {
  const content = type === 'privacy'
    ? [copy('Demo privacy', '演示数据说明'), copy('This is a product demonstration. Sign-in details stay in this browser tab; no email is sent. Listings, messages and transactions are sample data. Please use demonstration details only.', '这是产品演示。登录信息仅保存在当前浏览器标签页，不会发送邮件。挂单、消息和交易均为示例数据，请使用演示信息。')]
    : [copy('Talk to the capacity desk', '联系算力服务台'), copy('Sign in to open Messages and start a demo conversation with the OpenNEXT Capacity Desk about capacity, delivery or commercial terms.', '登录后打开消息，与 OpenNEXT 算力服务台演示沟通容量、交付和商务条件。')];
  document.getElementById('modal-host').innerHTML = `<div class="modal-backdrop" data-public-action="close-info"><section class="modal public-info-dialog" role="dialog" aria-modal="true" aria-label="${escape(content[0])}"><header class="modal-head"><h2>${escape(content[0])}</h2><button type="button" class="close-button" data-public-action="close-info" aria-label="Close">×</button></header><div class="modal-body"><p>${escape(content[1])}</p></div><footer class="modal-footer"><button class="primary-button" type="button" data-public-action="close-info">${copy('Got it','知道了')}</button></footer></section></div>`;
  document.body.classList.add('overlay-open');
  document.querySelector('.public-info-dialog .close-button')?.focus();
}

// Register before legacy listeners so public routes never enter market renderers.
document.addEventListener('click', event => {
  const item = event.target.closest?.('[data-public-action]');
  const flow = event.target.closest?.('[data-flow-action]');
  if (flow?.dataset.flowAction === 'confirm-logout') {
    event.preventDefault(); event.stopImmediatePropagation();
    clearSession(storage); session = null; draft = { mode: 'email', email: '', error: '' }; pending = 'models';
    navigatePublic('login', { replace: true }); return;
  }
  if (flow?.dataset.flowAction === 'sign-in') {
    event.preventDefault(); event.stopImmediatePropagation(); navigatePublic('login'); return;
  }
  const nav = event.target.closest?.('[data-route]');
  if (!item && nav && ready) {
    event.preventDefault(); event.stopImmediatePropagation(); navigatePublic(nav.dataset.route); return;
  }
  if (!item) return;
  if (item.classList.contains('modal-backdrop') && item !== event.target) return;
  event.preventDefault(); event.stopImmediatePropagation();
  const action = item.dataset.publicAction;
  if (action === 'home') return navigatePublic('home');
  if (action === 'signin') { draft.mode = 'email'; draft.error = ''; return navigatePublic('login'); }
  if (action === 'register') { draft.error = ''; return navigatePublic('signup'); }
  if (action === 'demo') return completeDemo({});
  if (action === 'open-workspace') {
    pending = safeDestination(item.dataset.target);
    if (item.dataset.mode) window.OpenNEXTSetGpuMode?.(item.dataset.mode);
    return navigatePublic(pending);
  }
  if (action === 'locale') {
    const form = publicContent.querySelector('[data-auth-form]');
    if (form) {
      const values = new FormData(form);
      for (const [field, key] of [['email', 'email'], ['fullName', 'name'], ['company', 'company']]) if (values.has(field)) draft[key] = String(values.get(field));
    }
    const next = item.dataset.locale === 'zh-CN' ? 'zh-CN' : 'en';
    if (draft.error) draft.error = next === 'zh-CN' ? '请输入页面显示的演示验证码：123456。' : 'Use the displayed demo code: 123456.';
    window.OpenNEXTI18n?.setLocale?.(next);
    if (document.body.classList.contains('is-public')) showPublic(current === 'home' ? 'home' : current);
    return;
  }
  if (action === 'scroll') return document.getElementById(item.dataset.section)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  if (action === 'preview-tab') {
    const tab = item.dataset.tab || item.dataset.preview || item.dataset.mode;
    publicContent.querySelectorAll('[data-public-action="preview-tab"]').forEach(button => {
      const active = button === item; button.setAttribute('aria-selected', String(active)); button.classList.toggle('is-active', active);
    });
    publicContent.querySelectorAll('[data-preview-panel]').forEach(panel => { panel.hidden = panel.dataset.previewPanel !== tab; });
    return;
  }
  if (action === 'info') return showInfo(item.dataset.info);
  if (action === 'close-info') return closeOverlays();
  if (action === 'edit-email') { draft.mode = 'email'; draft.error = ''; return showPublic('login'); }
}, true);

document.addEventListener('submit', event => {
  const form = event.target.closest?.('[data-auth-form]');
  if (!form) return;
  event.preventDefault(); event.stopImmediatePropagation();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  if (form.dataset.authForm === 'code') {
    if (String(values.get('code') || '').trim() !== DEMO_CODE) {
      draft.error = copy('Use the displayed demo code: 123456.', '请输入页面显示的演示验证码：123456。');
      showPublic('login'); return;
    }
    return completeDemo(draft);
  }
  draft = { mode: 'code', email: String(values.get('email') || '').trim(), name: String(values.get('fullName') || ''), company: String(values.get('company') || ''), error: '' };
  updateLocation(`login?next=${pending}`, true);
  showPublic('login');
  document.querySelector('[name="code"]')?.focus();
}, true);

for (const eventName of ['popstate', 'hashchange']) window.addEventListener(eventName, event => {
  if (!ready) return;
  event.stopImmediatePropagation();
  if (eventName === 'hashchange' && ignoreNextHash) { ignoreNextHash = false; return; }
  const top = eventName === 'popstate' ? Number(event.state?.scrollY || 0) : 0;
  if (eventName === 'popstate') { ignoreNextHash = true; setTimeout(() => { ignoreNextHash = false; }, 0); }
  navigatePublic(location.hash.slice(1), { replace: true, scroll: false });
  requestAnimationFrame(() => window.scrollTo({ top, behavior: 'auto' }));
}, true);

document.addEventListener('opennext:localechange', () => {
  if (ready && document.body.classList.contains('is-public')) queueMicrotask(() => showPublic(current === 'home' ? 'home' : current));
});

export function initializePublic(initialRoute) {
  workspaceRender = window.__openNextProcurementRender;
  workspaceNavigate = window.__openNextProcurementNavigate;
  window.__openNextProcurementRender = route => {
    // Locale events on the public site must not reveal the workspace.
    if (document.body.classList.contains('is-public')) return route;
    if (!session || session.expiresAt <= Date.now()) { navigatePublic(route); return 'login'; }
    return workspaceRender(route);
  };
  window.__openNextProcurementNavigate = navigatePublic;
  window.__openNextPhase1Navigate = navigatePublic;
  ready = true;
  navigatePublic(initialRoute || 'home', { replace: true });
  // These files deliberately override legacy styles injected during startup.
  for (const id of ['opennext-workspace-style', 'opennext-public-style']) document.head.append(document.getElementById(id));
}
