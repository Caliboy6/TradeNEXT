import { renderAgentPanel, initializeAgentPanel } from './opennext-agent.js?v=opennext-20260915-marketplace-1';

export function initializeWorkspaceShell() {
  const app = document.querySelector('#app');
  const panel = document.querySelector('#sidebar');
  const toggle = document.querySelector('#agentToggle');
  const backdrop = document.querySelector('.agent-panel-backdrop');
  const mobile = matchMedia('(max-width:1000px)');
  const header = app.querySelector('.workspace-header');
  // The compact navigation can wrap or scale with browser zoom. Keep the agent
  // aligned to the actual header edge, including when the public shell reveals it.
  function updateHeaderHeight() {
    const height = Math.ceil(header.getBoundingClientRect().height);
    if (height) app.style.setProperty('--workspace-header-height', `${height}px`);
  }
  if (typeof ResizeObserver === 'function') new ResizeObserver(updateHeaderHeight).observe(header);
  window.addEventListener('resize', updateHeaderHeight, { passive:true });
  updateHeaderHeight();
  panel.innerHTML = renderAgentPanel();
  initializeAgentPanel();
  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    const button=document.querySelector('[data-theme-toggle]');
    button?.setAttribute('aria-pressed',String(theme==='dark'));
    button?.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode');
    button?.setAttribute('title',theme==='dark'?'Switch to light mode':'Switch to dark mode');
    const label=button?.querySelector('[data-theme-label]');
    if(label) label.textContent=theme==='dark'?'Light mode':'Dark mode';
  }
  let theme='light';
  try { if(localStorage.getItem('opennext.theme')==='dark') theme='dark'; } catch {}
  applyTheme(theme);
  window.addEventListener('click',event=>{
    if(!event.target.closest?.('[data-theme-toggle]')) return;
    theme=theme==='dark'?'light':'dark';
    applyTheme(theme);
    try { localStorage.setItem('opennext.theme',theme); } catch {}
  },true);
  window.addEventListener('opennext:open-agent',()=>{
    app.classList.remove('agent-collapsed');
    if(mobile.matches){panel.classList.add('is-open');panel.inert=false;backdrop.hidden=false;}
    toggle.setAttribute('aria-expanded','true');
    panel.querySelector('textarea')?.focus({preventScroll:true});
  });
  function closeMobileAgent() {
    panel.classList.remove('is-open');
    panel.inert = mobile.matches;
    backdrop.hidden = true;
    toggle.setAttribute('aria-expanded', String(!mobile.matches && !app.classList.contains('agent-collapsed')));
  }
  function closeMenus(except) {
    document.querySelectorAll('.workspace-more[open]').forEach(menu => { if (menu !== except) menu.open = false; });
  }
  window.OpenNEXTCloseTransientUi = () => { closeMenus(); closeMobileAgent(); };
  mobile.addEventListener('change', () => { app.classList.remove('agent-collapsed'); closeMobileAgent(); });
  closeMobileAgent();
  // Legacy actions stop propagation at document capture; clean up menus first.
  window.addEventListener('click', event => {
    const menu = event.target.closest?.('.workspace-more');
    if (!menu || event.target.closest?.('.workspace-more button,.workspace-more a')) closeMenus();
    else if (event.target.closest?.('summary')) closeMenus(menu);
  }, true);
  document.addEventListener('click', event => {
    const control = event.target.closest?.('[data-shell-action]');
    if (control) {
      event.preventDefault();
      if (control.dataset.shellAction === 'close-agent') return closeMobileAgent();
      if (mobile.matches) {
        const open = panel.classList.toggle('is-open');
        panel.inert = !open;
        backdrop.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        if (open) panel.querySelector('textarea')?.focus({ preventScroll:true });
      } else {
        const collapsed = app.classList.toggle('agent-collapsed');
        toggle.setAttribute('aria-expanded', String(!collapsed));
      }
    }
  });
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    // Let a dialog consume Escape before dismissing the panel beneath it.
    if (document.querySelector('#modal-host [role="dialog"],#drawer-host [role="dialog"],dialog[open]')) return;
    const openMenu = document.querySelector('.workspace-more[open]');
    closeMenus();
    openMenu?.querySelector('summary')?.focus({ preventScroll:true });
    if (mobile.matches && panel.classList.contains('is-open')) { closeMobileAgent(); toggle.focus(); }
  }, true);
}
