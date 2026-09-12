import * as runtime from "./i18n-cleanup.js?v=opennext-20260912-7";

// Preserve the supplier's proper name while preventing the generic word
// “fabric” in topology descriptions from translating the brand itself.
const WORD_JOINER = "\u2060";
const safeBrand = `Rhein AI F${WORD_JOINER}abric`;
let locale = runtime.getLocale();
let scheduled = false;

function translate(value, target = locale) {
  if (typeof value !== "string" || !value.includes("Rhein AI")) return value;
  if (target === "zh-CN") return value.replaceAll("Rhein AI Fabric", safeBrand);
  return value.replaceAll(safeBrand, "Rhein AI Fabric");
}

function translateElement(element) {
  if (!(element instanceof Element) || element.closest("#publicContent,.public-info-dialog")) return;
  for (const attr of ["placeholder", "aria-label", "title", "data-tooltip"]) {
    if (!element.hasAttribute(attr)) continue;
    const current = element.getAttribute(attr);
    const next = translate(current);
    if (next !== current) element.setAttribute(attr, next);
  }
}

function apply(root = document) {
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = root.parentElement;
    if (!parent || parent.closest("script,style,noscript,template,#publicContent,.public-info-dialog")) return;
    const next = translate(root.nodeValue);
    if (next !== root.nodeValue) root.nodeValue = next;
    return;
  }
  if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
  if (root instanceof Element) translateElement(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script,style,noscript,template,#publicContent,.public-info-dialog")) continue;
      const next = translate(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    } else translateElement(node);
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    apply(document);
  });
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
  window.OpenNEXTI18n = api;
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
  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList" || record.type === "characterData" || record.type === "attributes")) schedule();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title", "data-tooltip"] });
  apply(document);
  runtime.initI18n();
  localizeDocument(document);
  window.OpenNEXTI18n = api;
  return locale;
}
