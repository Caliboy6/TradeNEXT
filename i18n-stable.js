import * as runtime from "./i18n-procurement.js";

const SUPPORTED_LOCALES = new Set(["en", "zh-CN"]);
const observerOptions = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: ["aria-label", "title", "placeholder", "data-tooltip"],
};

let initialized = false;
let observer = null;
let observerPauseDepth = 0;
let localizationFrame = 0;
const pendingRoots = new Set();

function updateMetadata() {
  const chinese = runtime.getLocale() === "zh-CN";
  const title = chinese ? "OpenNEXT · 原厂 AI 容量市场" : "OpenNEXT · Native AI Capacity Market";
  if (document.title !== title) document.title = title;
  const description = document.querySelector('meta[name="description"]');
  const content = chinese
    ? "OpenNEXT 原厂 AI 容量市场与 RFQ MVP 演示"
    : "OpenNEXT Native AI Capacity Market and RFQ MVP demo";
  if (description && description.content !== content) description.content = content;
}

function pauseObserver() {
  observerPauseDepth += 1;
  observer?.disconnect();
}

function resumeObserver() {
  observerPauseDepth = Math.max(0, observerPauseDepth - 1);
  if (!observerPauseDepth && observer) observer.observe(document.documentElement, observerOptions);
}

function withoutObserver(callback) {
  pauseObserver();
  try { return callback(); }
  finally { resumeObserver(); }
}

export function getLocale() { return runtime.getLocale(); }
export function getI18nDiagnostics() { return runtime.getI18nDiagnostics(); }
export function translateText(...args) { return runtime.translateText(...args); }

export function localizeDocument(root = document) {
  return withoutObserver(() => {
    const result = runtime.localizeDocument(root);
    updateMetadata();
    return result;
  });
}

export function setLocale(next, options = {}) {
  if (!SUPPORTED_LOCALES.has(next)) return runtime.getLocale();
  if (runtime.getLocale() === next) {
    updateMetadata();
    return next;
  }
  const result = withoutObserver(() => runtime.setLocale(next, options));
  updateMetadata();
  window.OpenNEXTI18n = api;
  return result;
}

const api = { getLocale, getI18nDiagnostics, translateText, localizeDocument, setLocale };

function addPendingRoot(node) {
  const root = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
  pendingRoots.add(root);
}

function flushPendingLocalization() {
  localizationFrame = 0;
  const roots = [...pendingRoots].filter((root, index, all) => !all.some((other, otherIndex) => {
    return otherIndex !== index && other instanceof Element && other.contains(root);
  }));
  pendingRoots.clear();
  for (const root of roots) localizeDocument(root);
}

function schedulePendingLocalization() {
  if (localizationFrame) return;
  localizationFrame = requestAnimationFrame(flushPendingLocalization);
}

function initializeSingleObserver() {
  observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "childList") record.addedNodes.forEach(addPendingRoot);
      else addPendingRoot(record.target);
    }
    if (pendingRoots.size) schedulePendingLocalization();
  });
  observer.observe(document.documentElement, observerOptions);
}

export function initI18n() {
  if (initialized) return runtime.getLocale();
  initialized = true;
  window.OpenNEXTI18n = api;

  // This listener is registered before every legacy dictionary layer. It is
  // the single language switch, so all layers move to the same locale once.
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("button[data-locale]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setLocale(button.dataset.locale);
  }, true);

  document.addEventListener("opennext:localechange", updateMetadata);

  // The dictionaries used to install eleven document-wide observers. Keep
  // their translations but suppress those observers during initialization.
  const NativeMutationObserver = window.MutationObserver;
  class SilentMutationObserver {
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  }
  let result;
  window.MutationObserver = SilentMutationObserver;
  try { result = runtime.initI18n(); }
  finally { window.MutationObserver = NativeMutationObserver; }

  initializeSingleObserver();
  localizeDocument(document);
  updateMetadata();
  window.OpenNEXTI18n = api;
  return result;
}
