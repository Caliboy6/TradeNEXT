import * as runtime from "./i18n-final.js";

const canonicalPairs = [
  ["原厂 AI 容量市场", "Native AI Capacity Market"],
  ["原厂 AI 容量", "Native AI Capacity"],
  ["原厂 AI 容量", "native AI capacity"],
  ["可选能力", "Optional capabilities"],
  ["查看全部模型容量 →", "View all Model Capacity →"],
  ["Native 是核心市场；Managed Gateway 是成交后的可选交付能力；Hosted Inference 是补充供应。", "Native is the core market. Managed Gateway is an optional post-trade delivery capability, while Hosted Inference is supplemental supply."],
  ["进入原厂 RFQ 市场", "Enter the Native RFQ Market"],
  ["这些能力保留在演示中，但不会偏离第一阶段的产品主线。", "These capabilities remain in the demo without displacing the Phase 1 product focus."],
  ["原厂直连、原厂分配、企业合作方、托管网关与 Hosted Inference 不再混为一个最低价。默认仅显示可验证的原厂供应。", "Native Direct, Native Allocated, Enterprise Partner, Managed Gateway and Hosted Inference are no longer collapsed into one lowest price. Verified Native supply is shown by default."],
  ["Native 不是裸密钥", "Native does not mean a raw key"],
  ["价格发现、容量发现、RFQ、验证、分配和结算，是 OpenNEXT 第一阶段的核心市场。", "Price discovery, capacity discovery, RFQ, verification, allocation and settlement form OpenNEXT's Phase 1 core market."],
  ["大额或复杂供应进入私密撮合，不公开库存，也不进入原厂基准指数。", "Large or complex supply enters private matching, with no public inventory and no inclusion in the Native benchmark."],
  ["进入 OTC 服务台 →", "Enter the OTC Desk →"],
  ["只有买方主动选择时才启用；不与 Native 供应混标，也不是平台的核心切入点。", "Enabled only when the buyer opts in. It is labelled separately from Native supply and is not the platform's core wedge."],
  ["提交时再完成企业联系方式与 KYB。此演示不发送真实请求。", "Business contact details and KYB are completed on submission. This demo sends no real request."],
  ["示例：Claude Sonnet · $100k 配额 · 30 天 · 2M TPM · US", "Example: Claude Sonnet · $100k allocation · 30 days · 2M TPM · US"],
  ["大额、匿名或非标准需求进入独立私密通道。非原厂 / 第三方来源必须清晰标注，不公开库存，也不进入原厂基准。", "Large, anonymous or non-standard requests enter a separate private lane. Non-native and third-party provenance must be explicit, with no public inventory and no Native benchmark inclusion."],
  ["进入 Private OTC 服务台", "Enter the Private OTC Desk"],
  ["先验证连续可用时段、卡数和拓扑，再比较真实总价。长租、大集群与定制网络进入私密 RFQ。", "Verify continuous availability, accelerator count and topology before comparing true total cost. Long-term, large-cluster and custom-network needs enter Private RFQ."],
  ["原厂基准只纳入合格、已结算的可验证交易；Private OTC、Managed Gateway 与 Hosted 供应保持独立口径。", "The Native benchmark includes only qualified, settled and verifiable transactions. Private OTC, Managed Gateway and Hosted supply remain separate."],
  ["TMCI、TGPI 与 AI 容量曲线", "TMCI, TGPI and the AI Capacity Curve"],
  ["核心指数只使用合格的 Lane A 数据；Private RFQ 仅形成独立 OTC 指标。所有图表均为示例演示数据。", "The core index uses qualified Lane A data only. Private RFQ creates a separate OTC indicator. All charts use illustrative demo data."],
  ["2026 年 8 月 20 日 · 10:00 CST", "20 Aug 2026 · 10:00 CST"],
  ["私密 RFQ 名义金额", "Private RFQ notional"],
  ["低于阈值时显示“指示性”或“暂不发布”。", "Show Indicative or No Print when thresholds are not met."],
  ["已验证私密 RFQ", "Verified Private RFQ"],
  ["H100（蓝）对比 H200（青）· 严格按 SKU 分桶。", "H100 (blue) vs H200 (teal) · exact SKU buckets."],
  ["闭源模型只展示 GPU 与模型容量的价格相关性，不声称可以反推出其真实成本或利润率。", "Closed models show only price correlation between GPU and Model Capacity; no claim is made that true cost or margin can be inferred."],
  ["智能调度是第一阶段的锦上添花", "AI orchestration is an optional Phase 1 enhancement"],
  ["可选预览", "Optional Preview"],
  ["基准", "Baseline"],
  ["目标", "Target"],
  ["Rhein AI Fabric · 法兰克福", "Rhein AI Fabric · Frankfurt"],
  ["Rhein AI Fabric · 已披露路线", "Rhein AI Fabric · disclosed route"],
];

const zhAliases = new Map([
  ["原厂 AI Capacity 市场", "原厂 AI 容量市场"],
  ["原厂 AI Capacity", "原厂 AI 容量"],
  ["可选 capabilities", "可选能力"],
  ["查看全部 Model Capacity →", "查看全部模型容量 →"],
  ["进入 Native RFQ Market", "进入原厂 RFQ 市场"],
  ["这些能力保留在 Demo 中，但不会抢占 Phase 1 的产品主线。", "这些能力保留在演示中，但不会偏离第一阶段的产品主线。"],
  ["原厂直连、原厂分配、企业合作方、托管网关与 Hosted Inference 不再混成一个最低价。默认仅显示可验证的 Native 供应。", "原厂直连、原厂分配、企业合作方、托管网关与 Hosted Inference 不再混为一个最低价。默认仅显示可验证的原厂供应。"],
  ["Native 不是裸 Key", "Native 不是裸密钥"],
  ["5 个模型市场符合当前来源筛选 · 所有报价与库存均为 Demo 数据", "5 个模型市场符合当前来源筛选 · 所有报价与库存均为演示数据"],
  ["价格发现、容量发现、RFQ、验证、分配和结算，是 OpenNEXT 的 Phase 1 主市场。", "价格发现、容量发现、RFQ、验证、分配和结算，是 OpenNEXT 第一阶段的核心市场。"],
  ["大额或复杂供应进入私密撮合，不公开库存，不进入 Native 基准指数。", "大额或复杂供应进入私密撮合，不公开库存，也不进入原厂基准指数。"],
  ["进入 OTC Desk →", "进入 OTC 服务台 →"],
  ["只有买方主动选择时才启用；不与 Native 供应混标，也不是平台核心 wedge。", "只有买方主动选择时才启用；不与 Native 供应混标，也不是平台的核心切入点。"],
  ["提交时再完成企业联系方式与 KYB。此 Demo 不发送真实请求。", "提交时再完成企业联系方式与 KYB。此演示不发送真实请求。"],
  ["示例：Claude Sonnet · $100k allocation · 30 days · 2M TPM · US", "示例：Claude Sonnet · $100k 配额 · 30 天 · 2M TPM · US"],
  ["大额、匿名或非标准需求进入独立私密通道。非 Native / 第三方来源必须清晰标注，不公开库存，不进入 Native benchmark。", "大额、匿名或非标准需求进入独立私密通道。非原厂 / 第三方来源必须清晰标注，不公开库存，也不进入原厂基准。"],
  ["进入 Private OTC Desk", "进入 Private OTC 服务台"],
  ["先验证连续可用时段、卡数和拓扑，再比较真实总价。长租、大集群与定制网络进入 Private RFQ。", "先验证连续可用时段、卡数和拓扑，再比较真实总价。长租、大集群与定制网络进入私密 RFQ。"],
  ["Native benchmark 只纳入合格、已结算的可验证交易；Private OTC、Managed Gateway 与 Hosted 供应保持独立口径。", "原厂基准只纳入合格、已结算的可验证交易；Private OTC、Managed Gateway 与 Hosted 供应保持独立口径。"],
  ["TMCI、TGPI 与 AI Capacity Curve", "TMCI、TGPI 与 AI 容量曲线"],
  ["核心指数只使用合格 Lane A 数据；Private RFQ 只形成独立 OTC 指标。所有图表均为 illustrative demo data。", "核心指数只使用合格的 Lane A 数据；Private RFQ 仅形成独立 OTC 指标。所有图表均为示例演示数据。"],
  ["Private RFQ 名义金额", "私密 RFQ 名义金额"],
  ["不足阈值时显示 Indicative 或 No Print。", "低于阈值时显示“指示性”或“暂不发布”。"],
  ["已验证 Private RFQ", "已验证私密 RFQ"],
  ["闭源模型只展示 GPU 与 Model Capacity 的价格相关性，不声称可反推其真实成本或利润率。", "闭源模型只展示 GPU 与模型容量的价格相关性，不声称可以反推出其真实成本或利润率。"],
  ["智能调度是 Phase 1 的锦上添花", "智能调度是第一阶段的锦上添花"],
  ["可选 Preview", "可选预览"],
  ["Baseline $0.111", "基准 $0.111"],
  ["Target 30 s", "目标 30 s"],
  ["Rhein AI 互联 · 法兰克福", "Rhein AI Fabric · 法兰克福"],
  ["Rhein AI 互联 · 已披露路线", "Rhein AI Fabric · 已披露路线"],
]);

const toZh = new Map();
const toEn = new Map();
for (const [zh, en] of canonicalPairs) {
  if (!toZh.has(en)) toZh.set(en, zh);
  if (!toEn.has(zh)) toEn.set(zh, en);
}
for (const [alias, zh] of zhAliases) {
  if (!toEn.has(alias)) toEn.set(alias, toEn.get(zh) || alias);
}

let locale = runtime.getLocale();
let scheduled = false;

function translate(value, target = locale) {
  if (typeof value !== "string" || !value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const core = value.trim();
  let translated;
  if (target === "zh-CN") {
    translated = toZh.get(core) || zhAliases.get(core) || core;
    let match = translated.match(/^(\d+)\s*个模型市场符合当前来源筛选\s*·\s*所有报价与库存均为\s*Demo\s*数据$/u);
    if (match) translated = `${match[1]} 个模型市场符合当前来源筛选 · 所有报价与库存均为演示数据`;
  } else translated = toEn.get(core) || core;
  return `${leading}${translated}${trailing}`;
}

function translateElement(element) {
  if (!(element instanceof Element)) return;
  for (const attr of ["placeholder", "aria-label", "title", "data-tooltip"]) {
    if (!element.hasAttribute(attr)) continue;
    const current = element.getAttribute(attr);
    const next = translate(current);
    if (next !== current) element.setAttribute(attr, next);
  }
  if (element.matches("input,textarea")) {
    const current = element.value;
    const next = translate(current);
    if (next !== current) element.value = next;
  }
}

function apply(root = document) {
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = root.parentElement;
    if (!parent || parent.closest("script,style,noscript,template")) return;
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
      if (!parent || parent.closest("script,style,noscript,template")) continue;
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
  if (!new Set(["en", "zh-CN"]).has(next)) return locale;
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
