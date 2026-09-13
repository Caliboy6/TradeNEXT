import { state } from "./demo-core.js?v=opennext-20260913-4";
import { renderOverview, renderModels, renderGpus, renderScheduler, renderRfq, renderData } from "./phase1-pages.js?v=opennext-20260913-4";

const renderers = {
  overview: renderOverview,
  models: renderModels,
  gpus: renderGpus,
  scheduler: renderScheduler,
  rfq: renderRfq,
  data: renderData,
};

const main = document.querySelector("#mainContent");

export function navigatePhase(route = "overview", options = {}) {
  const next = renderers[route] ? route : "overview";
  state.route = next;
  if (main) main.innerHTML = renderers[next]();
  document.querySelectorAll("[data-nav]").forEach((item) => item.classList.toggle("is-active", item.dataset.nav === next));
  document.querySelector("#drawer-host")?.replaceChildren();
  document.querySelector("#modal-host")?.replaceChildren();
  document.body.classList.remove("overlay-open");
  document.querySelector("#sidebar")?.classList.remove("is-open");
  if (!options.keepHash) history.replaceState(null, "", `#${next}`);
  if (!options.keepScroll) window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });
}

function contextMarkup(route) {
  if (route === "scheduler") return `<section class="phase-context is-labs"><div><span class="badge badge-blue">Optional Preview</span><strong>AI orchestration is an optional Phase 1 enhancement</strong><p>Simulates task decomposition and model + chip routes on purchased capacity. It is not the homepage acquisition path and does not control production traffic by default.</p></div></section>`;
  if (route === "gpus") return `<section class="phase-context"><div><span class="badge badge-gray">Phase 2</span><strong>GPU Capacity is the second market</strong><p>Standard accelerator-hours retain discovery and reservation; large clusters, long-term commitments and private-network requirements go through RFQ.</p></div></section>`;
  if (route === "data") return `<section class="phase-context"><div><span class="badge badge-gray">Phase 3 Preview</span><strong>Market Data follows verified transactions</strong><p>The Native benchmark includes only qualified, settled and verifiable transactions; OTC and Managed / Hosted supply remain separate.</p></div></section>`;
  return "";
}

document.addEventListener("click", (event) => {
  const routeElement = event.target.closest?.("[data-route]");
  if (!routeElement) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  navigatePhase(routeElement.dataset.route);
}, true);

document.addEventListener("input", (event) => {
  if (event.target?.id !== "modelSearch") return;
  event.stopImmediatePropagation();
  state.modelQuery = event.target.value;
  const cursor = event.target.selectionStart;
  if (main) main.innerHTML = renderModels();
  const next = document.querySelector("#modelSearch");
  next?.focus();
  next?.setSelectionRange?.(cursor, cursor);
}, true);

const contextObserver = new MutationObserver(() => {
  if (!["scheduler", "gpus", "data"].includes(state.route)) return;
  const page = main?.querySelector(":scope > .page");
  if (!page || page.querySelector(":scope > .phase-context")) return;
  page.insertAdjacentHTML("afterbegin", contextMarkup(state.route));
});

if (main) contextObserver.observe(main, { childList: true, subtree: false });

window.__openNextPhase1Navigate = navigatePhase;

