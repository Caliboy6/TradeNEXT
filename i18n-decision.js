import * as runtime from "./i18n-a11y.js?v=opennext-20260912-3";

const ZH = "识别意图与优先级 · 调度决策";
const EN = "Identify intent and priority · Routing decision";
let locale = runtime.getLocale();

function translate(value, target = locale) {
  if (typeof value !== "string") return value;
  const normalized = value.trim().replace(/\s{2,}/g, " ");
  if (target === "en" && normalized === ZH) return value.replace(value.trim(), EN);
  if (target === "zh-CN" && normalized === EN) return value.replace(value.trim(), ZH);
  return value;
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
    for (const attr of ["aria-label", "title"]) {
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

export function getLocale() { return locale; }
export function getI18nDiagnostics() { return runtime.getI18nDiagnostics(); }
export function translateText(value, target = locale, options = {}) { return runtime.translateText(translate(value, target), target, options); }
export function localizeDocument(root = document) { apply(root); runtime.localizeDocument(root); apply(root); }
export function setLocale(next, options = {}) { locale = next; apply(document); const result = runtime.setLocale(next, options); apply(document); window.OpenNEXTI18n = api; return result; }
const api = { getLocale, getI18nDiagnostics, translateText, localizeDocument, setLocale };

export function initI18n() {
  locale = runtime.getLocale();
  const observer = new MutationObserver(() => apply(document));
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "title"] });
  apply(document);
  const result = runtime.initI18n();
  localizeDocument(document);
  window.OpenNEXTI18n = api;
  return result;
}
