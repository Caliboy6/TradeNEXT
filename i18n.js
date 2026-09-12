import * as runtime from "./i18n-procurement.js?v=opennext-20260912-5";

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

export function getLocale() { return runtime.getLocale(); }
export function getI18nDiagnostics() { return runtime.getI18nDiagnostics(); }
export function translateText(...args) { return runtime.translateText(...args); }
export function localizeDocument(...args) { const result = runtime.localizeDocument(...args); updateMetadata(); return result; }
export function setLocale(next, options = {}) { const result = runtime.setLocale(next, options); updateMetadata(); window.OpenNEXTI18n = api; return result; }
const api = { getLocale, getI18nDiagnostics, translateText, localizeDocument, setLocale };

export function initI18n() {
  document.addEventListener("opennext:localechange", updateMetadata);
  const result = runtime.initI18n();
  updateMetadata();
  window.OpenNEXTI18n = api;
  return result;
}
