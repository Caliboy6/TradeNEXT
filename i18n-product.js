import * as runtime from "./i18n-decision.js";

const pairs = [
  ["发布原厂容量 RFQ", "Post a Native Capacity RFQ"],
  ["第一阶段核心 · 已验证供应商 · 合成演示", "PHASE 1 CORE · VERIFIED SUPPLIERS · SYNTHETIC DEMO"],
  ["默认仅匹配原厂 / 企业合作方供应", "Match Native / Enterprise supply by default"],
  ["Managed Gateway 与 Hosted Inference 仅在买方主动选择时加入。不会上传、展示或转交裸密钥。", "Managed Gateway and Hosted Inference are included only when the buyer opts in. Raw keys are never uploaded, displayed or transferred."],
  ["自定义", "Custom"],
  ["已验证合作方交付配额", "Verified partner-delivered allocation"],
  ["供应商入驻 · 来源优先于价格", "SUPPLIER ONBOARDING · PROVENANCE BEFORE PRICE"],
  ["第二阶段能力 · 默认关闭", "PHASE 2 CAPABILITY · DISABLED BY DEFAULT"],
  ["托管交付", "Managed delivery"],
  ["只有买方需要统一计量、托管供应或受控 OTC 交付时才启用。", "Enabled only when a buyer needs unified metering, Hosted supply or controlled OTC delivery."],
  ["使用 TradeNEXT 端点 / 密钥的报价会明确显示 Managed Gateway，不会和原厂项目访问混标。", "Quotes delivered through a TradeNEXT endpoint or key are explicitly labelled Managed Gateway and never blended with original-provider project access."],
  ["供应来源档案 · 合成演示", "SUPPLY PROVENANCE PASSPORT · SYNTHETIC DEMO"],
  ["按来源展示供应商深度", "Provider depth by provenance"],
  ["原厂、网关与托管供应不混标、不混算。", "Native, Gateway and Hosted supply are labelled and calculated separately."],
  ["端点健康 + 计量审计", "Endpoint health + metering audit"],
  ["TradeNEXT 托管端点", "TradeNEXT managed endpoint"],
  ["可选交付 · 非 Native Direct", "Optional delivery · not Native Direct"],
  ["补充端点 · 单独标注", "Supplemental endpoint · separately labelled"],
  ["供应来源验证标准", "Supply Provenance verification standards"],
  ["TradeNEXT 核验内容 · 演示政策", "WHAT TRADENEXT CHECKS · DEMO POLICY"],
  ["只有满足规则且已结算的合格交易才进入原厂基准。", "Only qualified transactions that meet the rules and have settled enter the Native benchmark."],
  ["独立风险通道 · 仅限邀请", "SEPARATE RISK LANE · INVITE ONLY"],
  ["不进入公开库存或原厂基准", "Excluded from public inventory and the Native benchmark"],
  ["TradeNEXT 提供 KYB、能力验证、测试执行、经纪撮合与安全交割。非原厂 / 第三方来源必须显式标注。", "TradeNEXT provides KYB, capability verification, test execution, brokered matching and secure delivery. Non-native and third-party provenance must be explicit."],
  ["不把能力验证包装成原厂授权，也不允许公开裸密钥。", "Capability verification is never presented as original-provider authorization, and raw keys are never made public."],
  ["安全配额分配 · 演示检查点", "SECURE ALLOCATION · DEMO CHECKPOINT"],
  ["演示检查点", "Demo checkpoint"],
  ["GPU 容量 · 已验证日历 · 演示", "GPU CAPACITY · VERIFIED CALENDAR · DEMO"],
  ["创建 RFQ", "Create RFQ"],
  ["追踪 ID", "Trace ID"],
  ["合规与风险检查已自动恢复。", "Compliance and risk review recovered automatically."],
  ["导出脱敏追踪", "Export redacted Trace"],
];

const zhAliases = new Map([
  ["发布 Native Capacity RFQ", "发布原厂容量 RFQ"],
  ["默认只匹配 Native / Enterprise 供应", "默认仅匹配原厂 / 企业合作方供应"],
  ["Managed Gateway 与 Hosted Inference 只有在买方主动选择时才会加入。不会上传、展示或转交裸 Key。", "Managed Gateway 与 Hosted Inference 仅在买方主动选择时加入。不会上传、展示或转交裸密钥。"],
  ["只有买方需要统一计量、Hosted 供应或受控 OTC 交付时才启用。", "只有买方需要统一计量、托管供应或受控 OTC 交付时才启用。"],
  ["使用 TradeNEXT endpoint / key 的报价会明确显示 Managed Gateway，不会和原厂项目访问混标。", "使用 TradeNEXT 端点 / 密钥的报价会明确显示 Managed Gateway，不会和原厂项目访问混标。"],
  ["Native、Gateway 与 Hosted 供应不混标、不混算。", "原厂、网关与托管供应不混标、不混算。"],
  ["Endpoint 健康 + 计量审计", "端点健康 + 计量审计"],
  ["TradeNEXT 托管 endpoint", "TradeNEXT 托管端点"],
  ["可选 delivery · not Native Direct", "可选交付 · 非 Native Direct"],
  ["补充 endpoint · 单独标注", "补充端点 · 单独标注"],
  ["Supply Provenance 验证标准", "供应来源验证标准"],
  ["只有满足规则且已结算的合格交易才进入 Native benchmark。", "只有满足规则且已结算的合格交易才进入原厂基准。"],
  ["不进入公开库存或 Native benchmark", "不进入公开库存或原厂基准"],
  ["TradeNEXT 提供 KYB、能力验证、测试执行、经纪撮合与安全交割。Non-native / third-party 来源必须显式标注。", "TradeNEXT 提供 KYB、能力验证、测试执行、经纪撮合与安全交割。非原厂 / 第三方来源必须显式标注。"],
  ["不把能力验证包装成原厂授权，也不允许公开裸 Key。", "不把能力验证包装成原厂授权，也不允许公开裸密钥。"],
  ["安全配额分配 · DEMO 检查点", "安全配额分配 · 演示检查点"],
  ["Demo 检查点", "演示检查点"],
  ["合规与风险检查 recovered automatically.", "合规与风险检查已自动恢复。"],
  ["导出脱敏 Trace", "导出脱敏追踪"],
]);

const toZh = new Map(pairs.map(([zh, en]) => [en, zh]));
const toEn = new Map(pairs.map(([zh, en]) => [zh, en]));
for (const [alias, zh] of zhAliases) toEn.set(alias, toEn.get(zh) || alias);
let locale = runtime.getLocale();
let scheduled = false;

function translate(value, target = locale) {
  if (typeof value !== "string" || !value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const core = value.trim();
  let next = target === "zh-CN" ? (toZh.get(core) || zhAliases.get(core)) : toEn.get(core);
  if (!next && target === "zh-CN") {
    let match = core.match(/^Plan\s+(.+)$/i);
    if (match) next = `计划 ${match[1]}`;
  }
  if (!next && target === "en") {
    let match = core.match(/^计划\s+(.+)$/u);
    if (match) next = `Plan ${match[1]}`;
  }
  return next ? `${leading}${next}${trailing}` : value;
}

function apply(root = document) {
  const processText = (node) => {
    const parent = node.parentElement;
    if (!parent || parent.closest("script,style,noscript,template")) return;
    const next = translate(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  };
  const processElement = (element) => {
    if (!(element instanceof Element)) return;
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

function schedule() { if (scheduled) return; scheduled = true; queueMicrotask(() => { scheduled = false; apply(document); }); }
export function getLocale() { return locale; }
export function getI18nDiagnostics() { return runtime.getI18nDiagnostics(); }
export function translateText(value, target = locale, options = {}) { return runtime.translateText(translate(value, target), target, options); }
export function localizeDocument(root = document) { apply(root); runtime.localizeDocument(root); apply(root); }
export function setLocale(next, options = {}) { locale = next; apply(document); const result = runtime.setLocale(next, options); apply(document); window.TradeNEXTI18n = api; return result; }
const api = { getLocale, getI18nDiagnostics, translateText, localizeDocument, setLocale };

export function initI18n() {
  locale = runtime.getLocale();
  const observer = new MutationObserver((records) => { if (records.length) schedule(); });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "title", "placeholder"] });
  apply(document);
  const result = runtime.initI18n();
  localizeDocument(document);
  window.TradeNEXTI18n = api;
  return result;
}
