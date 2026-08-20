import * as runtime from "./i18n-brand.js";

const SAFE = "Rhein AI F\u2060abric";
let locale = runtime.getLocale();
let scheduled = false;

function translate(value, target = locale) {
  if (typeof value !== "string") return value;
  if (target === "zh-CN") {
    return value
      .replaceAll("Rhein AI Fabric · disclosed route", `${SAFE} · 已披露路线`)
      .replaceAll(`${SAFE} · disclosed route`, `${SAFE} · 已披露路线`);
  }
  return value.replaceAll(`${SAFE} · 已披露路线`, "Rhein AI Fabric · disclosed route");
}

function apply(root = document) {
  const processText = (node) => {
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,noscript,template")) return;
    const next = translate(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  };
  if (root.nodeType === Node.TEXT_NODE) return processText(root);
  if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) processText(node);
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; apply(document); });
}

export function getLocale() { return locale; }
export function getI18nDiagnostics() { return runtime.getI18nDiagnostics(); }
export function translateText(value, target = locale, options = {}) { return runtime.translateText(translate(value, target), target, options); }
export function localizeDocument(root = document) { apply(root); runtime.localizeDocument(root); apply(root); }
export function setLocale(next, options = {}) {
  locale = next;
  apply(document);
  runtime.setLocale(next, options);
  apply(document);
  window.TradeNEXTI18n = api;
  return locale;
}

const api = { getLocale, getI18nDiagnostics, translateText, localizeDocument, setLocale };

export function initI18n() {
  locale = runtime.getLocale();
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-locale]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setLocale(button.dataset.locale);
  }, true);
  const observer = new MutationObserver((records) => { if (records.some((record) => record.type === "childList" || record.type === "characterData")) schedule(); });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  apply(document);
  runtime.initI18n();
  localizeDocument(document);
  window.TradeNEXTI18n = api;
  return locale;
}
