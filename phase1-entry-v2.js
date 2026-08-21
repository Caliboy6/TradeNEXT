// Prevent no-op title assignments from creating a MutationObserver feedback loop.
const titleDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "title");
if (titleDescriptor?.get && titleDescriptor?.set) {
  Object.defineProperty(document, "title", {
    configurable: true,
    get() { return titleDescriptor.get.call(document); },
    set(value) {
      if (titleDescriptor.get.call(document) !== value) titleDescriptor.set.call(document, value);
    },
  });
}

const { initI18n, localizeDocument } = await import("./i18n.js");

initI18n();
await import("./procurement-entry.js");
localizeDocument(document);
document.documentElement.classList.remove("i18n-loading");

console.info("OpenNEXT bilingual UI ready");
