import { rfqExamples } from "./demo-core.js?v=opennext-20260912-2";

for (const rfq of rfqExamples) {
  if (rfq.indicativeRange && (!Number.isFinite(rfq.indicativeRange.lowMultiple) || !Number.isFinite(rfq.indicativeRange.highMultiple))) {
    rfq.indicativeRange = null;
  }
}

const cp1252 = new Map([
  ["€", 0x80], ["‚", 0x82], ["ƒ", 0x83], ["„", 0x84], ["…", 0x85], ["†", 0x86], ["‡", 0x87],
  ["ˆ", 0x88], ["‰", 0x89], ["Š", 0x8a], ["‹", 0x8b], ["Œ", 0x8c], ["Ž", 0x8e], ["‘", 0x91],
  ["’", 0x92], ["“", 0x93], ["”", 0x94], ["•", 0x95], ["–", 0x96], ["—", 0x97], ["˜", 0x98],
  ["™", 0x99], ["š", 0x9a], ["›", 0x9b], ["œ", 0x9c], ["ž", 0x9e], ["Ÿ", 0x9f],
]);
const utf8 = new TextDecoder("utf-8", { fatal: true });

function repairValue(value) {
  if (!/[ÃÂâæåäèéç]/.test(value)) return value;
  const bytes = [];
  for (const character of value) {
    const code = character.codePointAt(0);
    if (code <= 0xff) bytes.push(code);
    else if (cp1252.has(character)) bytes.push(cp1252.get(character));
    else return value;
  }
  try {
    const decoded = utf8.decode(Uint8Array.from(bytes));
    return /[\u3400-\u9fff·×–—−ⓘ↻]/.test(decoded) ? decoded : value;
  } catch {
    return value;
  }
}

function repairTree(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const repaired = repairValue(node.nodeValue || "");
    if (repaired !== node.nodeValue) node.nodeValue = repaired;
  }
}

const repairObserver = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node.nodeType === Node.TEXT_NODE) node.nodeValue = repairValue(node.nodeValue || "");
      else if (node instanceof Element) repairTree(node);
    }
  }
});
repairObserver.observe(document.documentElement, { childList: true, subtree: true });

await import("./standalone.js?v=opennext-20260912-2");
repairTree(document.body);
console.info("OpenNEXT release UI ready");
