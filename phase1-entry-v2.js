// Prevent no-op title assignments from creating a DOM mutation feedback loop.
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

const { initI18n, localizeDocument } = await import("./i18n-stable.js");
const { installInteractionStability, finalizeInteractionStability } = await import("./interaction-stability.js");
const { installSearchCopyFix } = await import("./search-copy-fix-v2.js");

initI18n();
installInteractionStability();
installSearchCopyFix();
await import("./procurement-entry.js");
finalizeInteractionStability();
localizeDocument(document);
document.documentElement.classList.remove("i18n-loading");

console.info("OpenNEXT stable bilingual UI ready");
