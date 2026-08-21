import { state } from "./demo-core.js";
import { renderModels, renderGpus, renderData, renderRfq, renderSupply, renderDocs, renderScheduler } from "./procurement-pages.js";

const main = document.querySelector("#mainContent");
const renderers = { models: renderModels, gpus: renderGpus, data: renderData, rfq: renderRfq, supply: renderSupply, docs: renderDocs, scheduler: renderScheduler };

function normalizeRoute(route) {
  if (route === "overview" || route === "native") return "models";
  return renderers[route] ? route : "models";
}

function localize(root = document) {
  window.OpenNEXTI18n?.localizeDocument?.(root);
}

export function renderCurrentProcurement(route = state.route) {
  const normalized = normalizeRoute(route);
  state.route = normalized;
  main.innerHTML = renderers[normalized]();
  document.querySelectorAll("[data-nav]").forEach((item) => item.classList.toggle("is-active", item.dataset.nav === normalized));
  localize(main);
  return normalized;
}

export function navigateProcurement(route, options = {}) {
  const normalized = renderCurrentProcurement(route);
  if (location.hash !== `#${normalized}`) history.replaceState(null, "", `#${normalized}`);
  document.querySelector("#sidebar")?.classList.remove("is-open");
  if (options.scroll !== false) window.scrollTo({ top: 0, behavior: options.smooth ? "smooth" : "auto" });
  return normalized;
}

window.__openNextProcurementRender = renderCurrentProcurement;
window.__openNextProcurementNavigate = navigateProcurement;
window.__openNextPhase1Navigate = navigateProcurement;

document.addEventListener("click", (event) => {
  const target = event.target.closest?.("[data-route]");
  if (!target) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  navigateProcurement(target.dataset.route, { smooth: true });
}, true);

document.addEventListener("opennext:localechange", () => renderCurrentProcurement(state.route));