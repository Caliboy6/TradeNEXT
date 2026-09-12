import * as runtime from "./i18n-dispatch.js?v=opennext-20260912-7";

const api = {
  getLocale: () => runtime.getLocale(),
  getI18nDiagnostics: () => runtime.getI18nDiagnostics(),
  translateText: (...args) => runtime.translateText(...args),
  localizeDocument: (...args) => runtime.localizeDocument(...args),
  setLocale(next, options = {}) {
    const result = runtime.setLocale(next, options);
    window.OpenNEXTI18n = api;
    return result;
  },
};

export const getLocale = api.getLocale;
export const getI18nDiagnostics = api.getI18nDiagnostics;
export const translateText = api.translateText;
export const localizeDocument = api.localizeDocument;
export const setLocale = api.setLocale;

export function initI18n() {
  // The base runtime stores the current locale on <html>. Restrict language
  // switching to the actual EN/ZH buttons so normal clicks continue to the app.
  document.addEventListener("click", (event) => {
    const switcher = event.target.closest?.("button[data-locale]");
    if (switcher) {
      event.preventDefault();
      event.stopImmediatePropagation();
      api.setLocale(switcher.dataset.locale);
      return;
    }

    const root = document.documentElement;
    if (!root.hasAttribute("data-locale")) return;
    root.removeAttribute("data-locale");
    setTimeout(() => {
      if (!root.hasAttribute("data-locale")) root.dataset.locale = runtime.getLocale();
    }, 0);
  }, true);

  const result = runtime.initI18n();
  window.OpenNEXTI18n = api;
  return result;
}
