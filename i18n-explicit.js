import * as runtime from "./i18n-click.js?v=opennext-20260912-2";

const pairs = [
  ["出售已验证的原厂容量", "Sell verified native capacity"],
  ["价格发现、容量发现、RFQ、验证、分配与结算。", "Price discovery, capacity discovery, RFQ, verification, allocation and settlement."],
  ["只有买方需要统一计量、Hosted 供应或受控 OTC 交付时才启用。", "Enabled only when a buyer needs unified metering, Hosted supply or controlled OTC delivery."],
  ["Supply Provenance 验证标准", "Supply Provenance verification standards"],
  ["KYB、合同持有人、授权范围与可分配性。", "KYB, contract holder, scope of authorization and allocation rights."],
  ["额度、速率、区域、期限与隔离方式。", "Allocation, throughput, region, term and isolation method."],
  ["在受控环境验证可用性、RPM / TPM 与 SLA。", "Validate availability, RPM / TPM and SLA in a controlled environment."],
  ["买方获得什么、何时到期、如何撤销或续期。", "What the buyer receives, when it expires, and how it can be revoked or renewed."],
  ["只有满足规则且已结算的合格交易才进入 Native benchmark。", "Only qualified transactions that meet the rules and have settled enter the Native benchmark."],
  ["真实产品将在这里进入合同、托管支付、分配与履约记录；本演示不会创建订单或转移资金。", "The production product proceeds here to contracting, escrow payment, allocation and fulfilment records. This demo creates no order and transfers no funds."],
  ["识别意图与优先级 · Routing decision", "Identify intent and priority · Routing decision"],
];

const toEn = new Map(pairs);
const toZh = new Map(pairs.map(([zh, en]) => [en, zh]));
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
  const result = runtime.setLocale(next, options);
  apply(document);
  window.OpenNEXTI18n = api;
  return result;
}

const api = { getLocale, getI18nDiagnostics, translateText, localizeDocument, setLocale };

export function initI18n() {
  locale = runtime.getLocale();
  const observer = new MutationObserver((records) => { if (records.some((record) => record.type === "childList" || record.type === "characterData")) schedule(); });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  apply(document);
  const result = runtime.initI18n();
  localizeDocument(document);
  window.OpenNEXTI18n = api;
  return result;
}
