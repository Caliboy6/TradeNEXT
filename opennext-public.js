import { renderLanding, renderLogin, logoMarkup } from './opennext-public-pages.js?v=opennext-20260912-6';
import { safeDestination, workspaceRoutes, readSession, writeSession, clearSession, DEMO_CODE } from './opennext-session.js?v=opennext-20260912-6';

const publicContent = document.querySelector('#publicContent');
const workspace = document.querySelector('#app');
const storage = (() => { try { return sessionStorage; } catch { return { getItem: () => null, setItem() {}, removeItem() {} }; } })();
let session = readSession(storage);
let ready = false;
let shellReady = false;
let startupFailed = false;
let pendingGpuMode = '';
let pendingProvider = '';
let workspaceRender;
let workspaceNavigate;
let current = '';
let pending = 'models';
let ignoreNextHash = false;
let draft = { mode: 'account', email: '', name: '', company: '', terms: false, error: '' };
const lang = () => 'en';
const copy = (en, zh) => lang() === 'zh-CN' ? zh : en;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function closeOverlays() {
  for (const id of ['drawer-host', 'modal-host', 'toast-host']) document.getElementById(id)?.replaceChildren();
  document.body.classList.remove('overlay-open');
  document.body.style.removeProperty('overflow');
  document.querySelector('#sidebar')?.classList.remove('is-open');
  window.OpenNEXTCloseTransientUi?.();
}

function showPublic(route) {
  current = route;
  workspace.hidden = true;
  publicContent.hidden = false;
  document.body.classList.add('is-public');
  publicContent.innerHTML = route === 'home' ? renderLanding(lang()) : renderLogin(lang(), { ...draft, mode: route === 'signup' ? 'register' : draft.mode });
  document.documentElement.classList.remove('i18n-loading');
}

function showWorkspaceStartup() {
  workspace.hidden = true;
  publicContent.hidden = false;
  document.body.classList.add('is-public');
  document.documentElement.classList.remove('i18n-loading');
  publicContent.innerHTML = `<div class="public-startup public-container"><header>${logoMarkup()}<button type="button" class="on-button on-button-text" data-public-action="home">${copy('Back to homepage', '返回首页')}</button></header><section role="status"><p class="on-eyebrow">OPENNEXT WORKSPACE</p><h1>${startupFailed ? copy('Let’s reconnect.', '重新连接工作台。') : copy('Opening your workspace.', '正在打开工作台。')}</h1><p>${startupFailed ? copy('The workspace could not finish loading. Your session is safe. Retry the connection or return to the homepage.', '工作台未能完成加载，登录状态仍会保留。你可以重试连接，或返回首页。') : copy('The homepage is ready. We are connecting the procurement workspace; this may take a moment on a slow connection.', '首页已就绪，正在连接采购工作台。网络较慢时可能需要一点时间。')}</p><div><button type="button" class="on-button on-button-primary" data-public-action="retry">${copy('Retry connection', '重试连接')}</button><button type="button" class="on-button on-button-outline" data-public-action="home">${copy('Back to homepage', '返回首页')}</button></div></section></div>`;
}

export function initializePublicShell(initialRoute) {
  try { localStorage.setItem('opennext.locale', 'en'); } catch { /* Storage can be disabled. */ }
  shellReady = true;
  window.OpenNEXTPublicReady = true;
  navigatePublic(initialRoute || 'home', { replace: true });
  document.getElementById('startup-fallback')?.setAttribute('hidden', '');
}

export function reportWorkspaceFailure() {
  if (ready) return;
  startupFailed = true;
  if (workspaceRoutes.has(current)) showWorkspaceStartup();
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
      draft.mode = 'account';
      updateLocation(`login?next=${route}`, options.replace);
      showPublic('login');
    } else {
      current = route;
      if (ready) {
        publicContent.hidden = true;
        workspace.hidden = false;
        document.body.classList.remove('is-public');
        workspaceNavigate(route, { ...options, history: options.replace ? 'replace' : undefined });
      } else {
        updateLocation(route, options.replace);
        showWorkspaceStartup();
      }
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
  draft.mode = 'account';
  navigatePublic(pending, { replace: true });
}

function showInfo(type) {
  const policies = {
    terms: ['Terms of Service · Demo preview', 'OpenNEXT is currently a product demonstration. Accounts, listings, quotes and transactions are illustrative. No purchase, payment or delivery is executed. Production service terms will be presented before real trading is enabled.'],
    usage: ['Usage Policy · Demo preview', 'Use sample business details and procurement requirements in this demo. Do not enter production passwords, API keys, recovery phrases or confidential documents.'],
    regions: ['Supported Countries and Regions · Demo preview', 'Locations in the market describe sample delivery regions. They do not represent a published eligibility list. Account and service availability will be confirmed before production onboarding.'],
    service: ['Service-Specific Terms · Demo preview', 'Model capacity, GPU rental and physical hardware use different price units and delivery conditions. The production quote will specify capacity, duration, region, acceptance and payment terms before confirmation.'],
  };
  const content = policies[type] || (type === 'privacy'
    ? [copy('Demo privacy', '演示数据说明'), copy('This is a product demonstration. Sign-in details stay in this browser tab; no email is sent. Listings, messages and transactions are sample data. Please use demonstration details only.', '这是产品演示。登录信息仅保存在当前浏览器标签页，不会发送邮件。挂单、消息和交易均为示例数据，请使用演示信息。')]
    : [copy('Talk to the capacity desk', '联系算力服务台'), copy('Sign in to open Messages and start a demo conversation with the OpenNEXT Capacity Desk about capacity, delivery or commercial terms.', '登录后打开消息，与 OpenNEXT 算力服务台演示沟通容量、交付和商务条件。')]);
  document.getElementById('modal-host').innerHTML = `<div class="modal-backdrop" data-public-action="close-info"><section class="modal public-info-dialog" role="dialog" aria-modal="true" aria-label="${escape(content[0])}"><header class="modal-head"><h2>${escape(content[0])}</h2><button type="button" class="close-button" data-public-action="close-info" aria-label="Close">×</button></header><div class="modal-body"><p>${escape(content[1])}</p></div><footer class="modal-footer"><button class="primary-button" type="button" data-public-action="close-info">${copy('Got it','知道了')}</button></footer></section></div>`;
  document.body.classList.add('overlay-open');
  document.querySelector('.public-info-dialog .close-button')?.focus();
}

function requireConsent() {
  const checkbox = document.getElementById('public-terms');
  draft.terms = checkbox ? checkbox.checked === true : draft.terms;
  if (draft.terms) { draft.error = ''; return true; }
  draft.error = 'Please review and accept the demo policies to continue.';
  const error = document.getElementById('public-auth-error');
  if (error) { error.textContent = draft.error; error.hidden = false; }
  checkbox?.focus?.();
  return false;
}

function captureAuthDraft() {
  const form = publicContent.querySelector('[data-auth-form]');
  if (form) for (const [field, key] of [['email', 'email'], ['fullName', 'name'], ['company', 'company']]) {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) draft[key] = input.value.trim();
  }
  const checkbox = document.getElementById('public-terms');
  if (checkbox) draft.terms = checkbox.checked;
}

const providers = { google:'Google', github:'GitHub', lark:'Lark', walletconnect:'WalletConnect', binance:'Binance Wallet', metamask:'MetaMask' };
function showProvider(provider) {
  if (!providers[provider]) return;
  pendingProvider = provider;
  const name = providers[provider];
  document.getElementById('modal-host').innerHTML = `<div class="modal-backdrop" data-public-action="close-info"><section class="modal public-info-dialog" role="dialog" aria-modal="true" aria-label="${name} demo sign-in"><header class="modal-head"><h2>${name} demo sign-in</h2><button type="button" class="close-button" data-public-action="close-info" aria-label="Close">×</button></header><div class="modal-body"><p>Preview the workspace as a ${name} user. No external account or wallet will be connected, and no password or signature is requested.</p></div><footer class="modal-footer"><button class="secondary-button" type="button" data-public-action="close-info">Cancel</button><button class="primary-button" type="button" data-public-action="confirm-provider">Continue in demo</button></footer></section></div>`;
  document.body.classList.add('overlay-open');
  document.querySelector('.public-info-dialog .close-button')?.focus();
}

// Register before legacy listeners so public routes never enter market renderers.
document.addEventListener('click', event => {
  const item = event.target.closest?.('[data-public-action]');
  const flow = event.target.closest?.('[data-flow-action]');
  if (flow?.dataset.flowAction === 'confirm-logout') {
    event.preventDefault(); event.stopImmediatePropagation();
    clearSession(storage); session = null; draft = { mode: 'account', email: '', terms: false, error: '' }; pending = 'models'; pendingProvider = '';
    window.dispatchEvent?.(new Event('opennext:signout'));
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
  if (action === 'retry') return location.reload();
  if (action === 'home') return navigatePublic('home');
  if (action === 'signin') { captureAuthDraft(); draft.mode = 'account'; draft.error = ''; return navigatePublic('login'); }
  if (action === 'register') { captureAuthDraft(); draft.error = ''; return navigatePublic('signup'); }
  if (action === 'email-code' || action === 'forgot-password') { captureAuthDraft(); draft.mode = 'email'; draft.error = ''; return navigatePublic('login'); }
  if (action === 'demo') { if (!requireConsent()) return; return completeDemo({}); }
  if (action === 'provider') { if (!requireConsent()) return; return showProvider(item.dataset.provider); }
  if (action === 'confirm-provider') {
    if (!pendingProvider || !draft.terms) return;
    const provider = pendingProvider; pendingProvider = '';
    return completeDemo({ email:`${provider}.user@demo.example`, name:`${providers[provider]} demo user` });
  }
  if (action === 'open-workspace') {
    pending = safeDestination(item.dataset.target);
    if (item.dataset.mode) {
      pendingGpuMode = item.dataset.mode;
      window.OpenNEXTSetGpuMode?.(pendingGpuMode);
    }
    return navigatePublic(pending);
  }
  if (action === 'locale') {
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
  if (!requireConsent()) return;
  const values = new FormData(form);
  if (form.dataset.authForm === 'account') {
    // The password input belongs to the visual demo. Never store or transmit it.
    return completeDemo({ email:String(values.get('email') || '').trim() });
  }
  if (form.dataset.authForm === 'code') {
    if (String(values.get('code') || '').trim() !== DEMO_CODE) {
      draft.error = copy('Use the displayed demo code: 123456.', '请输入页面显示的演示验证码：123456。');
      showPublic('login'); return;
    }
    return completeDemo(draft);
  }
  draft = { mode: 'code', email: String(values.get('email') || '').trim(), name: String(values.get('fullName') || ''), company: String(values.get('company') || ''), terms:true, error: '' };
  updateLocation(`login?next=${pending}`, true);
  showPublic('login');
  document.querySelector('[name="code"]')?.focus();
}, true);

document.addEventListener('change', event => {
  if (event.target.id !== 'public-terms') return;
  draft.terms = event.target.checked;
  if (draft.terms) {
    draft.error = '';
    const error = document.getElementById('public-auth-error');
    if (error) error.hidden = true;
  }
});

for (const eventName of ['popstate', 'hashchange']) window.addEventListener(eventName, event => {
  if (!shellReady) return;
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
  if (typeof workspaceRender !== 'function' || typeof workspaceNavigate !== 'function') throw new Error('Workspace router did not initialize');
  window.__openNextProcurementRender = route => {
    // Locale events on the public site must not reveal the workspace.
    if (document.body.classList.contains('is-public')) return route;
    if (!session || session.expiresAt <= Date.now()) { navigatePublic(route); return 'login'; }
    return workspaceRender(route);
  };
  window.__openNextProcurementNavigate = navigatePublic;
  window.__openNextPhase1Navigate = navigatePublic;
  ready = true;
  window.OpenNEXTWorkspaceReady = true;
  if (pendingGpuMode) window.OpenNEXTSetGpuMode?.(pendingGpuMode);
  navigatePublic(current || initialRoute || 'home', { replace: true });
  // These files deliberately override legacy styles injected during startup.
  for (const id of ['opennext-workspace-style', 'opennext-public-style', 'opennext-agent-style', 'opennext-shell-style']) {
    const style = document.getElementById(id);
    if (style) document.head.append(style);
  }
}
