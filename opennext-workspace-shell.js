import { renderAgentPanel, initializeAgentPanel } from './opennext-agent.js?v=opennext-20260912-7';

export function initializeWorkspaceShell() {
  const app = document.querySelector('#app');
  const panel = document.querySelector('#sidebar');
  const toggle = document.querySelector('#agentToggle');
  const backdrop = document.querySelector('.agent-panel-backdrop');
  const mobile = matchMedia('(max-width:1000px)');
  panel.innerHTML = renderAgentPanel();
  initializeAgentPanel();
  function closeMobileAgent() {
    panel.classList.remove('is-open');
    panel.inert = mobile.matches;
    backdrop.hidden = true;
    toggle.setAttribute('aria-expanded', String(!mobile.matches && !app.classList.contains('agent-collapsed')));
  }
  function closeMenus() {
    document.querySelectorAll('.workspace-more[open]').forEach(menu => { menu.open = false; });
  }
  window.OpenNEXTCloseTransientUi = () => { closeMenus(); closeMobileAgent(); };
  mobile.addEventListener('change', () => { app.classList.remove('agent-collapsed'); closeMobileAgent(); });
  closeMobileAgent();
  // Legacy actions stop propagation at document capture; clean up menus first.
  window.addEventListener('click', event => {
    if (!event.target.closest?.('.workspace-more') || event.target.closest?.('.workspace-more button,.workspace-more a')) closeMenus();
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
    if (document.querySelector('#modal-host [role="dialog"],#drawer-host [role="dialog"]')) return;
    closeMenus();
    if (mobile.matches && panel.classList.contains('is-open')) { closeMobileAgent(); toggle.focus(); }
  }, true);
}
