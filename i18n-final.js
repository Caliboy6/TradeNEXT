import * as runtime from "./i18n-runtime.js?v=opennext-20260912-3";

// Final terminology layer: Chinese UI uses Chinese product copy while keeping
// brands, model names, market acronyms and hardware SKUs in their native form.
const finalPairs = [
  ["标准卡时保留发现与预约演示；大集群、长期和专网需求进入 RFQ。", "Standard accelerator-hours retain discovery and reservation; large clusters, long-term commitments and private-network requirements go through RFQ."],
  ["Native benchmark 只纳入合格且已结算的可验证交易；OTC 与 Managed / Hosted 保持独立口径。", "The Native benchmark includes only qualified, settled and verifiable transactions; OTC and Managed / Hosted supply remain separate."],

  ["原厂 AI 容量市场", "Native AI Capacity Market"],
  ["原厂 AI 容量", "native AI capacity"],
  ["原厂 AI 容量", "Native AI Capacity"],
  ["来源", "Provenance"],
  ["仅原厂⌄", "Native only⌄"],
  ["实时需求流", "LIVE DEMAND TAPE"],
  ["原厂 / 合作方", "Native / Partner"],
  ["KYB + 来源证据", "KYB + provenance evidence"],
  ["来源优先市场", "PROVENANCE-FIRST MARKET"],
  ["查看全部模型容量 →", "View all Model Capacity →"],
  ["✓ 已验证", "✓ Verified"],
  ["GPT 前沿模型", "GPT frontier models"],
  ["Kimi 长上下文 / 智能体", "Kimi long-context / agent"],
  ["GLM 通用 / 编程", "GLM general / coding"],
  ["供应来源", "SUPPLY PROVENANCE"],
  ["Native 是核心市场；Managed Gateway 是成交后的可选交付能力；Hosted Inference 是补充供应。", "Native is the core market. Managed Gateway is an optional post-trade delivery capability, while Hosted Inference is supplemental supply."],
  ["OpenNEXT 托管密钥或端点", "OpenNEXT-managed key or endpoint"],
  ["OpenNEXT 托管密钥或端点", "OpenNEXT managed key or endpoint"],
  ["供应商托管端点", "Provider-hosted endpoint"],
  ["第一阶段核心流程", "PHASE 1 CORE FLOW"],
  ["进入原厂 RFQ 市场", "Enter the Native RFQ Market"],
  ["可选能力", "OPTIONAL CAPABILITIES"],
  ["这些能力保留在演示中，但不会偏离第一阶段的产品主线。", "These capabilities remain in the demo without displacing the Phase 1 product focus."],
  ["第二阶段 · 可选", "Phase 2 · Optional"],
  ["实验室 · 模拟", "Labs · Simulation"],

  ["模型容量 · 来源优先", "MODEL CAPACITY · PROVENANCE FIRST"],
  ["原厂直连、原厂分配、企业合作方、托管网关与 Hosted Inference 不再混为一个最低价。默认仅显示可验证的原厂供应。", "Native Direct, Native Allocated, Enterprise Partner, Managed Gateway and Hosted Inference are no longer collapsed into one lowest price. Verified Native supply is shown by default."],
  ["Native 不是裸密钥", "Native does not mean a raw key"],
  ["独立通道", "SEPARATE LANE"],
  ["大额或复杂供应进入私密撮合，不公开库存，也不进入原厂基准指数。", "Large or complex supply enters private matching, with no public inventory and no inclusion in the Native benchmark."],
  ["进入 OTC 服务台 →", "Enter the OTC Desk →"],
  ["只有买方主动选择时才启用；不与 Native 供应混标，也不是平台的核心切入点。", "Enabled only when the buyer opts in. It is labelled separately from Native supply and is not the platform's core wedge."],
  ["价格发现、容量发现、RFQ、验证、分配和结算，是 OpenNEXT 第一阶段的核心市场。", "Price discovery, capacity discovery, RFQ, verification, allocation and settlement form OpenNEXT's Phase 1 core market."],

  ["第一阶段 · 核心交易流程", "PHASE 1 · CORE TRANSACTION FLOW"],
  ["核心 MVP", "Core MVP"],
  ["发布容量需求", "POST A CAPACITY REQUEST"],
  ["需求流", "DEMAND TAPE"],
  ["专属", "Dedicated"],
  ["标准化报价室", "STANDARDIZED QUOTE ROOM"],
  ["示例：Claude Sonnet · $100k 配额 · 30 天 · 2M TPM · US", "Example: Claude Sonnet · $100k allocation · 30 days · 2M TPM · US"],
  ["Private OTC / 经纪 RFQ", "Private OTC / Brokered RFQ"],
  ["大额、匿名或非标准需求进入独立私密通道。非原厂 / 第三方来源必须清晰标注，不公开库存，也不进入原厂基准。", "Large, anonymous or non-standard requests enter a separate private lane. Non-native and third-party provenance must be explicit, with no public inventory and no Native benchmark inclusion."],
  ["进入 Private OTC 服务台", "Enter the Private OTC Desk"],
  ["US · 标准留存", "US · standard retention"],
  ["EU · 区域处理", "EU · regional processing"],

  ["GPU 容量是第二市场", "GPU Capacity is the second market"],
  ["● 已验证日历", "● Verified calendar"],
  ["就绪", "Ready"],
  ["现在", "Now"],
  ["拓扑", "Topology"],
  ["按需", "On-demand"],
  ["托管推理槽", "Managed inference slot"],
  ["模型 + H100 / H200 / B200 / L40S / 已披露 Cerebras 路线", "Model + H100 / H200 / B200 / L40S / disclosed Cerebras route"],
  ["Claude / GPT / Gemini 容量 · 服务商管理硬件", "Claude / GPT / Gemini capacity · provider-managed hardware"],
  ["US 中部", "US Central"],
  ["全部期限", "All terms"],
  ["立即开始", "Start now"],

  ["市场数据基于已验证交易", "Market Data follows verified transactions"],
  ["原厂基准只纳入合格、已结算的可验证交易；Private OTC、Managed Gateway 与 Hosted 供应保持独立口径。", "The Native benchmark includes only qualified, settled and verifiable transactions. Private OTC, Managed Gateway and Hosted supply remain separate."],
  ["TMCI、TGPI 与 AI 容量曲线", "TMCI, TGPI and the AI Capacity Curve"],
  ["核心指数只使用合格的 Lane A 数据；Private RFQ 仅形成独立 OTC 指标。所有图表均为示例演示数据。", "The core index uses qualified Lane A data only. Private RFQ creates a separate OTC indicator. All charts use illustrative demo data."],
  ["2026 年 8 月 20 日 · 10:00 CST", "20 Aug 2026 · 10:00 CST"],
  ["Private RFQ 名义金额", "Private RFQ notional"],
  ["仅 OTC", "OTC only"],
  ["模型容量指数 · 14 天", "Model Capacity Index · 14D"],
  ["Claude（蓝）对比 GPT（青）· 参考值 = 1.00×", "Claude (blue) vs GPT (teal) · reference = 1.00×"],
  ["演示", "Demo"],
  ["低于阈值时显示“指示性”或“暂不发布”。", "Show Indicative or No Print when thresholds are not met."],
  ["仅深度", "Depth only"],
  ["实时深度", "Live depth"],
  ["已验证 Private RFQ", "Verified Private RFQ"],
  ["GPU 价格指数 · 14 天", "GPU Price Index · 14D"],
  ["H100（蓝）对比 H200（青）· 严格按 SKU 分桶。", "H100 (blue) vs H200 (teal) · exact SKU buckets."],
  ["窗口", "Window"],
  ["滚动 7 天", "Rolling 7D"],
  ["刷新", "Refresh"],
  ["小时级演示", "Hourly demo"],
  ["统计口径", "Statistic"],
  ["闭源模型只展示 GPU 与模型容量的价格相关性，不声称可以反推出其真实成本或利润率。", "Closed models show only price correlation between GPU and Model Capacity; no claim is made that true cost or margin can be inferred."],

  ["智能调度是第一阶段的锦上添花", "AI orchestration is an optional Phase 1 enhancement"],
  ["✦ 可解释策略", "✦ Explainable policy"],
  ["必填", "Required"],
  ["▶ 运行模拟", "▶ Run simulation"],
  ["基准", "Baseline"],
  ["SLA 范围内", "Within SLA"],
  ["目标", "Target"],
  ["估算", "Estimate"],
  ["对比全前沿模型", "vs all-frontier"],
  ["预计节省", "estimated saving"],
  ["排队中", "queued"],
  ["运行中", "running"],
  ["已完成", "done"],
  ["回退", "fallback"],
  ["已重路由", "rerouted"],
  ["Llama 70B 开放模型", "Llama 70B open model"],
  ["DeepSeek 推理模型", "DeepSeek reasoning model"],
  ["子任务", "Subtask"],
  ["预计成本", "Est. cost"],
  ["决策", "Decision"],
  ["原因？", "Why?"],
  ["Velocity Inference · 已披露路线", "Velocity Inference · disclosed route"],
  ["Rhein AI Fabric · 已披露路线", "Rhein AI Fabric · disclosed route"],
  ["Claude Sonnet · 企业 API · 服务商管理（不透明）", "Claude Sonnet · enterprise API · Provider-managed (opaque)"],
  ["GPT 前沿模型 · 企业 API · 服务商管理（不透明）", "GPT frontier · enterprise API · Provider-managed (opaque)"],
  ["Gemini Flash · 低延迟 API · 服务商管理（不透明）", "Gemini Flash · low-latency API · Provider-managed (opaque)"],
  ["Kimi · 长上下文智能体 API · 服务商管理（不透明）", "Kimi · long-context agent API · Provider-managed (opaque)"],
  ["GLM · 均衡 API · 服务商管理（不透明）", "GLM · balanced API · Provider-managed (opaque)"],
  ["DeepSeek 推理 · H200 · 8× NVIDIA H200 SXM 141GB", "DeepSeek reasoning · H200 · 8× NVIDIA H200 SXM 141GB"],
  ["DeepSeek 对话 · H100 · 4× NVIDIA H100 SXM 80GB", "DeepSeek chat · H100 · 4× NVIDIA H100 SXM 80GB"],
  ["Qwen 32B · B200 快速批处理 · 2× NVIDIA B200 SXM 192GB", "Qwen 32B · B200 fast batch · 2× NVIDIA B200 SXM 192GB"],
  ["Llama 70B · Cerebras 超低延迟 · Cerebras CS-3 (WSE-3)", "Llama 70B · Cerebras ultra-low latency · Cerebras CS-3 (WSE-3)"],
  ["开放嵌入 · L40S · 1× NVIDIA L40S 48GB", "Open embedding · L40S · 1× NVIDIA L40S 48GB"],
];

const maps = { en: new Map(), "zh-CN": new Map() };
for (const [zh, en] of finalPairs) {
  if (!maps.en.has(zh)) maps.en.set(zh, en);
  if (!maps["zh-CN"].has(en)) maps["zh-CN"].set(en, zh);
}

let locale = runtime.getLocale();
let observer;
let scheduled = false;

function dynamic(value, target) {
  if (target === "zh-CN") {
    let match = value.match(/^(\d+)\s+days?([⌄]?)$/i);
    if (match) return `${match[1]} 天${match[2]}`;
    match = value.match(/^(\d+)\s+min$/i);
    if (match) return `${match[1]} 分钟`;
    match = value.match(/^(.+?)\s*·\s*(\d+)\s+min\s+ago$/i);
    if (match) return `${match[1]} · ${match[2]} 分钟前`;
    match = value.match(/^(\d+)\s+units?$/i);
    if (match) return `${match[1]} 台`;
    match = value.match(/^\$(.+)\s+total$/i);
    if (match) return `$${match[1]} 合计`;
    match = value.match(/^(\d+)\s+subtasks\s*·\s*(schedule-[\w-]+)\s*·\s*illustrative snapshot$/i);
    if (match) return `${match[1]} 个子任务 · ${match[2]} · 示例快照`;
    match = value.match(/^\$(.+)\s+estimated saving$/i);
    if (match) return `$${match[1]} 预计节省`;
    match = value.match(/^(classification|retrieval|extraction|generation|verification)\s*·\s*floor\s+(\d+)$/i);
    if (match) {
      const labels = { classification: "分类", retrieval: "检索", extraction: "提取", generation: "生成", verification: "校验" };
      return `${labels[match[1].toLowerCase()]} · 门槛 ${match[2]}`;
    }
    match = value.match(/^(.+?)\s*·\s*(Singapore|Frankfurt|Tokyo|Hong Kong|US Central|US East \(Virginia\))$/);
    if (match) {
      const places = { Singapore: "新加坡", Frankfurt: "法兰克福", Tokyo: "东京", "Hong Kong": "香港", "US Central": "US 中部", "US East (Virginia)": "US 东部（弗吉尼亚）" };
      return `${match[1]} · ${places[match[2]]}`;
    }
    return value
      .replace(/\bper node\b/gi, "每节点")
      .replace(/\bper VM\b/gi, "每台 VM")
      .replace(/\boptional\b/gi, "可选")
      .replace(/\bpairs\b/gi, "对")
      .replace(/\bfabric\b/gi, "互联")
      .replace(/Dedicated CS-3 inference allocation/gi, "专属 CS-3 推理配额")
      .replace(/Managed low-latency endpoint/gi, "托管低延迟端点");
  }
  return value;
}

function translateFinal(original, target = locale) {
  if (typeof original !== "string" || !original.trim()) return original;
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  const core = original.trim();
  return `${leading}${maps[target].get(core) ?? dynamic(core, target)}${trailing}`;
}

function translateAttributes(element) {
  if (!(element instanceof Element) || element.closest("#publicContent,.public-info-dialog")) return;
  for (const attribute of ["placeholder", "aria-label", "title", "data-tooltip"]) {
    if (!element.hasAttribute(attribute)) continue;
    const value = element.getAttribute(attribute);
    const translated = translateFinal(value);
    if (translated !== value) element.setAttribute(attribute, translated);
  }
  if (element.matches("input,textarea")) {
    const value = element.value;
    const translated = translateFinal(value);
    if (translated !== value) element.value = translated;
  }
}

function localizeFinal(root = document) {
  if (root.nodeType === Node.TEXT_NODE) {
    const parent = root.parentElement;
    if (!parent || parent.closest("script,style,noscript,template,#publicContent,.public-info-dialog")) return;
    const translated = translateFinal(root.nodeValue);
    if (translated !== root.nodeValue) root.nodeValue = translated;
    return;
  }
  if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
  if (root instanceof Element) translateAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script,style,noscript,template,#publicContent,.public-info-dialog")) continue;
      const translated = translateFinal(node.nodeValue);
      if (translated !== node.nodeValue) node.nodeValue = translated;
    } else translateAttributes(node);
  }
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    localizeFinal(document);
  });
}

export function getLocale() { return locale; }
export function getI18nDiagnostics() { return runtime.getI18nDiagnostics(); }
export function translateText(value, target = locale, options = {}) {
  return runtime.translateText(translateFinal(value, target), target, options);
}
export function localizeDocument(root = document) {
  localizeFinal(root);
  runtime.localizeDocument(root);
  localizeFinal(root);
}
export function setLocale(next, options = {}) {
  if (!new Set(["en", "zh-CN"]).has(next)) return locale;
  locale = next;
  localizeFinal(document);
  runtime.setLocale(next, options);
  localizeFinal(document);
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
  observer = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList" || record.type === "characterData" || record.type === "attributes")) schedule();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "aria-label", "title", "data-tooltip"],
  });
  localizeFinal(document);
  runtime.initI18n();
  localizeDocument(document);
  window.OpenNEXTI18n = api;
  return locale;
}
