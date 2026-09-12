import * as runtime from "./i18n-explicit.js?v=opennext-20260912-2";

const PAIRS = [
  ["出售已验证的原厂容量", "Sell verified native capacity"],
  ["Supply Provenance 验证标准", "Supply Provenance verification standards"],
  ["识别意图与优先级 · Routing decision", "Identify intent and priority · Routing decision"],
];
const toEn = new Map(PAIRS);
const toZh = new Map(PAIRS.map(([zh, en]) => [en, zh]));
let locale = runtime.getLocale();
let scheduled = false;

function translate(value, target = locale) {
  if (typeof value !== "string" || !value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const core = value.trim().replace(/\s{2,}/g, " ");
  const translated = target === "en" ? toEn.get(core) : toZh.get(core);
  return translated ? `${leading}${translated}${trailing}` : value;
}

function apply(root = document) {
  const processText = (node) => {
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,noscript,template,#publicContent,.public-info-dialog")) return;
    const next = translate(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  };
  const processElement = (element) => {
    if (!(element instanceof Element) || element.closest("#publicContent,.public-info-dialog")) return;
    for (const attr of ["aria-label", "title", "placeholder"]) {
      if (!element.hasAttribute(attr)) continue;
      const current = element.getAttribute(attr);
      const next = translate(current);
      if (next !== current) element.setAttribute(attr, next);
    }
  };
  if (root.nodeType === Node.TEXT_NODE) return processText(root);
  if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
  if (root instanceof Element) processElement(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) processText(node);
    else processElement(node);
  }
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
export function setLocale(next, options = {}) { locale = next; apply(document); const result = runtime.setLocale(next, options); apply(document); window.OpenNEXTI18n = api; return result; }

const api = { getLocale, getI18nDiagnostics, translateText, localizeDocument, setLocale };

export function initI18n() {
  locale = runtime.getLocale();
  const observer = new MutationObserver((records) => { if (records.length) schedule(); });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "title", "placeholder"] });
  apply(document);
  const result = runtime.initI18n();
  localizeDocument(document);
  window.OpenNEXTI18n = api;
  return result;
}
