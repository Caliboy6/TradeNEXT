let activeDialog = null;
let returnFocus = null;
const focusable = 'button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';
function visibleControls(dialog) {
  return [...dialog.querySelectorAll(focusable)].filter(el => el.getClientRects().length);
}
const observer = new MutationObserver(() => {
  const dialog = document.querySelector('#modal-host [role="dialog"], #drawer-host [role="dialog"]');
  if (dialog === activeDialog) return;
  if (!activeDialog && dialog) returnFocus = document.activeElement;
  activeDialog = dialog;
  if (dialog) {
    dialog.tabIndex = -1;
    requestAnimationFrame(() => (visibleControls(dialog)[0] || dialog).focus({ preventScroll: true }));
  } else if (returnFocus?.isConnected) {
    returnFocus.focus({ preventScroll: true }); returnFocus = null;
  }
});
for (const id of ['modal-host', 'drawer-host']) observer.observe(document.getElementById(id), { childList: true, subtree: true });
document.addEventListener('keydown', event => {
  if (!activeDialog) return;
  if (event.key === 'Escape') {
    document.getElementById('modal-host').replaceChildren();
    document.getElementById('drawer-host').replaceChildren();
    document.body.classList.remove('overlay-open');
    return;
  }
  if (event.key !== 'Tab') return;
  const controls = visibleControls(activeDialog);
  if (!controls.length) { event.preventDefault(); activeDialog.focus(); return; }
  const first = controls[0], last = controls.at(-1);
  if (event.shiftKey && (document.activeElement === first || document.activeElement === activeDialog)) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}, true);
