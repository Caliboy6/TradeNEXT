import { state } from "./demo-core.js?v=opennext-20260912-7";
import { renderOverview, renderModels, renderGpus, renderScheduler, renderRfq, renderData } from "./phase1-pages.js?v=opennext-20260912-7";

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
  if (route === "scheduler") return '<section class="phase-context is-labs"><div><span class="badge badge-blue">Optional Preview</span><strong>智能调度是 Phase 1 的锦上添花</strong><p>在已采购容量上模拟任务拆解与模型 + 芯片路线，不是首页流量入口，也不会默认接管生产流量。</p></div></section>';
  if (route === "gpus") return '<section class="phase-context"><div><span class="badge badge-gray">Phase 2</span><strong>GPU Capacity is the second market</strong><p>标准卡时保留发现与预约演示；大集群、长期和专网需求进入 RFQ。</p></div></section>';
  if (route === "data") return '<section class="phase-context"><div><span class="badge badge-gray">Phase 3 Preview</span><strong>Market Data follows verified transactions</strong><p>Native benchmark 只纳入合格且已结算的可验证交易；OTC 与 Managed / Hosted 保持独立口径。</p></div></section>';
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

