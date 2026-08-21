import { procurementState } from "./procurement-data.js";

const main = document.querySelector("#mainContent");
const drawer = document.querySelector("#drawer-host");
const modal = document.querySelector("#modal-host");
let installed = false;
let finalized = false;
let handlingHistory = false;
let enhancementFrame = 0;

function normalizeSearch(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function closeTransientUi() {
  drawer?.replaceChildren();
  modal?.replaceChildren();
  document.body.classList.remove("overlay-open");
  document.body.style.removeProperty("overflow");
  document.querySelector("#sidebar")?.classList.remove("is-open");
}

function routeFromLocation() {
  return location.hash.slice(1) || "models";
}

function renderWithoutSearchNarrowing(route) {
  const query = procurementState.modelQuery;
  if (route === "models" && query) procurementState.modelQuery = "";
  try { return window.__openNextProcurementRender?.(route) || route; }
  finally { procurementState.modelQuery = query; }
}

function saveScrollPosition() {
  const route = routeFromLocation();
  const current = history.state && typeof history.state === "object" ? history.state : {};
  history.replaceState({ ...current, route, scrollY: window.scrollY }, "", location.href);
}

function navigateStable(route, options = {}) {
  if (!window.__openNextProcurementRender) return route;
  if (options.history !== "replace") saveScrollPosition();
  closeTransientUi();
  const normalized = renderWithoutSearchNarrowing(route);
  const nextHash = `#${normalized}`;
  const nextState = { route: normalized, scrollY: 0 };
  if (options.history === "replace") history.replaceState(nextState, "", nextHash);
  else if (location.hash !== nextHash) history.pushState(nextState, "", nextHash);
  if (options.scroll !== false) window.scrollTo({ top: 0, behavior: options.smooth ? "smooth" : "auto" });
  scheduleEnhancements();
  return normalized;
}

function restoreFromHistory(event) {
  handlingHistory = true;
  closeTransientUi();
  renderWithoutSearchNarrowing(routeFromLocation());
  const top = Number.isFinite(event?.state?.scrollY) ? event.state.scrollY : 0;
  requestAnimationFrame(() => {
    window.scrollTo({ top, behavior: "auto" });
    handlingHistory = false;
    scheduleEnhancements();
  });
}

function ensureClearButton(input) {
  const label = input.closest(".market-search");
  if (!label || label.querySelector("[data-search-clear]")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "search-clear";
  button.dataset.searchClear = input.id;
  button.setAttribute("aria-label", "Clear search");
  button.textContent = "×";
  label.append(button);
}

function ensureEmptyState(container, key, title, caption) {
  let empty = container?.querySelector(`[data-search-empty="${key}"]`);
  if (empty || !container) return empty;
  empty = document.createElement("div");
  empty.className = "empty-market search-empty";
  empty.dataset.searchEmpty = key;
  empty.hidden = true;
  empty.innerHTML = `<strong>${title}</strong><span>${caption}</span>`;
  container.append(empty);
  return empty;
}

function updateResultCount(input, count, total) {
  const toolbar = input.closest(".market-toolbar, .filter-bar");
  if (!toolbar) return;
  let result = toolbar.querySelector("[data-search-count]");
  if (!result) {
    result = document.createElement("span");
    result.className = "search-result-count";
    result.dataset.searchCount = "";
    toolbar.append(result);
  }
  result.textContent = input.value.trim() ? `${count} of ${total} results` : `${total} results`;
}

function filterNativeMarket() {
  const input = document.querySelector("#nativeMarketSearch");
  if (!input) return;
  input.value = procurementState.modelQuery || "";
  input.autocomplete = "off";
  input.setAttribute("aria-label", "Search model capacity and suppliers");
  ensureClearButton(input);
  const rows = [...document.querySelectorAll(".supply-board-table tbody tr")];
  const query = normalizeSearch(input.value);
  let visible = 0;
  for (const row of rows) {
    const matches = !query || normalizeSearch(row.innerText).includes(query);
    row.hidden = !matches;
    if (matches) visible += 1;
  }
  const board = input.closest(".market-board");
  const empty = ensureEmptyState(board, "native", "No matching capacity found.", "Try a model, supplier, provenance class, region or delivery term.");
  if (empty) empty.hidden = visible > 0;
  updateResultCount(input, visible, rows.length);
}

function ensureGpuSearch() {
  const filterBar = document.querySelector(".gpu-procurement .filter-bar");
  if (!filterBar) return null;
  let input = filterBar.querySelector("#gpuMarketSearch");
  if (!input) {
    const label = document.createElement("label");
    label.className = "market-search stability-search";
    label.innerHTML = '<span>⌕</span><input id="gpuMarketSearch" autocomplete="off" placeholder="Search accelerator, supplier, region…" aria-label="Search GPU supply">';
    filterBar.prepend(label);
    input = label.querySelector("input");
  }
  input.value = procurementState.gpuQuery || "";
  ensureClearButton(input);
  return input;
}

function filterGpuMarket() {
  const input = ensureGpuSearch();
  if (!input) return;
  const rows = [...document.querySelectorAll(".gpu-listing-table tbody tr")];
  const query = normalizeSearch(input.value);
  let visible = 0;
  let units = 0;
  for (const row of rows) {
    const matches = !query || normalizeSearch(row.innerText).includes(query);
    row.hidden = !matches;
    if (!matches) continue;
    visible += 1;
    const unitMatch = row.cells?.[3]?.innerText.match(/[\d,]+/);
    units += Number((unitMatch?.[0] || "0").replaceAll(",", ""));
  }
  const page = input.closest(".gpu-procurement");
  const empty = ensureEmptyState(page?.querySelector(".gpu-supply-board"), "gpu", "No matching GPU supply found.", "Try an accelerator, supplier, region, topology or workload keyword.");
  if (empty) empty.hidden = visible > 0;
  const metrics = page?.querySelectorAll(".procurement-metrics > div strong");
  if (metrics?.[0]) metrics[0].textContent = String(visible);
  if (metrics?.[2]) metrics[2].textContent = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(units);
  updateResultCount(input, visible, rows.length);
}

function enhanceCurrentPage() {
  enhancementFrame = 0;
  filterNativeMarket();
  filterGpuMarket();
  window.OpenNEXTI18n?.localizeDocument?.(main);
}

function scheduleEnhancements() {
  if (enhancementFrame) cancelAnimationFrame(enhancementFrame);
  enhancementFrame = requestAnimationFrame(enhanceCurrentPage);
}

function handleSearchInput(event) {
  const input = event.target;
  if (input.id === "nativeMarketSearch") {
    event.stopImmediatePropagation();
    procurementState.modelQuery = input.value;
    filterNativeMarket();
  }
  if (input.id === "gpuMarketSearch") {
    event.stopImmediatePropagation();
    procurementState.gpuQuery = input.value;
    filterGpuMarket();
  }
}

function clearSearch(button) {
  const input = document.getElementById(button.dataset.searchClear);
  if (!input) return;
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
}

export function installInteractionStability() {
  if (installed) return;
  installed = true;
  procurementState.gpuQuery ||= "";
  history.scrollRestoration = "manual";

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "./stability.css";
  document.head.append(style);

  // Registered before the legacy route and search listeners.
  document.addEventListener("click", (event) => {
    const clear = event.target.closest?.("[data-search-clear]");
    if (clear) {
      event.preventDefault();
      event.stopImmediatePropagation();
      clearSearch(clear);
      return;
    }
    const filter = event.target.closest?.("[data-proc-action='filter-provenance']");
    if (filter) {
      event.preventDefault();
      event.stopImmediatePropagation();
      procurementState.provenanceFilter = filter.dataset.filter || "native";
      renderWithoutSearchNarrowing("models");
      scheduleEnhancements();
      return;
    }
    const route = event.target.closest?.("[data-route]");
    if (!route) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigateStable(route.dataset.route, { smooth: false });
  }, true);

  document.addEventListener("input", handleSearchInput, true);
  window.addEventListener("popstate", restoreFromHistory);
  window.addEventListener("hashchange", () => {
    if (!handlingHistory && window.__openNextProcurementRender) restoreFromHistory({ state: history.state });
  });

  document.addEventListener("opennext:localechange", () => {
    const query = procurementState.modelQuery;
    if (query) procurementState.modelQuery = "";
    queueMicrotask(() => {
      procurementState.modelQuery = query;
      scheduleEnhancements();
    });
  });

  new MutationObserver(scheduleEnhancements).observe(main, { childList: true });
}

export function finalizeInteractionStability() {
  if (finalized) return;
  finalized = true;
  window.__openNextProcurementNavigate = navigateStable;
  window.__openNextPhase1Navigate = navigateStable;
  const route = routeFromLocation();
  history.replaceState({ route, scrollY: window.scrollY }, "", location.href);
  scheduleEnhancements();
}
