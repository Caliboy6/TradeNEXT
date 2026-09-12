const main = document.querySelector("#mainContent");
let frame = 0;

function isChinese() {
  return window.OpenNEXTI18n?.getLocale?.() === "zh-CN";
}

function visibleRows(selector) {
  const rows = [...document.querySelectorAll(selector)].filter(row => row.cells?.length > 1);
  return { total: rows.length, visible: rows.filter((row) => !row.hidden && !row.classList.contains("is-market-filtered")).length };
}

function setCount(input, selector) {
  const output = input?.closest(".market-toolbar, .filter-bar")?.querySelector("[data-search-count]");
  if (!input || !output) return;
  const { total, visible } = visibleRows(selector);
  const filtered = Boolean(input.value.trim()) || visible !== total;
  output.textContent = isChinese()
    ? filtered ? `显示 ${visible} / ${total} 条结果` : `共 ${total} 条结果`
    : filtered ? `${visible} of ${total} results` : `${total} results`;
}

function setText(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

function setAttribute(element, name, value) {
  if (element && element.getAttribute(name) !== value) element.setAttribute(name, value);
}

function updateSearchCopy() {
  frame = 0;
  if (document.body.classList.contains("is-public")) return;
  const chinese = isChinese();
  const nativeInput = document.querySelector("#nativeMarketSearch");
  setAttribute(nativeInput, "aria-label", chinese ? "搜索模型容量和供应商" : "Search model capacity and suppliers");
  const gpuInput = document.querySelector("#gpuMarketSearch");
  if (gpuInput) {
    if (gpuInput.placeholder !== (chinese ? "搜索芯片、供应商、地区…" : "Search accelerator, supplier, region…")) gpuInput.placeholder = chinese ? "搜索芯片、供应商、地区…" : "Search accelerator, supplier, region…";
    setAttribute(gpuInput, "aria-label", chinese ? "搜索 GPU 供应" : "Search GPU supply");
  }
  document.querySelectorAll("[data-search-clear]").forEach((button) => setAttribute(button, "aria-label", chinese ? "清除搜索" : "Clear search"));
  setCount(nativeInput, ".supply-board-table tbody tr");
  setCount(gpuInput, ".gpu-listing-table tbody tr, .gpu-hardware-table tbody tr");

  const nativeEmpty = document.querySelector('[data-search-empty="native"]');
  if (nativeEmpty) {
    setText(nativeEmpty.querySelector("strong"), chinese ? "未找到匹配的模型容量。" : "No matching capacity found.");
    setText(nativeEmpty.querySelector("span"), chinese ? "可尝试搜索模型、供应商、来源类别、地区或交付条件。" : "Try a model, supplier, provenance class, region or delivery term.");
  }
  const gpuEmpty = document.querySelector('[data-search-empty="gpu"]');
  if (gpuEmpty) {
    setText(gpuEmpty.querySelector("strong"), chinese ? "未找到匹配的 GPU 供应。" : "No matching GPU supply found.");
    setText(gpuEmpty.querySelector("span"), chinese ? "可尝试搜索芯片、供应商、地区、拓扑或工作负载关键词。" : "Try an accelerator, supplier, region, topology or workload keyword.");
  }
}

function schedule() {
  if (frame) cancelAnimationFrame(frame);
  frame = requestAnimationFrame(updateSearchCopy);
}

export function installSearchCopyFix() {
  // Window capture runs before the legacy document listener that intentionally
  // stops propagation after applying the filter.
  window.addEventListener("input", (event) => {
    if (["nativeMarketSearch", "gpuMarketSearch"].includes(event.target.id)) queueMicrotask(schedule);
  }, true);
  document.addEventListener("opennext:localechange", schedule);
  new MutationObserver(schedule).observe(main, { childList: true });
  schedule();
}
