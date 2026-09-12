import {
  demoMeta,
  modelMarkets,
  gpuOffers,
  providerDepth,
  routeCatalog,
  rfqExamples,
  indexSeries,
  marketStats
} from "./data.js?v=opennext-20260912-5";
import {
  createSchedule,
  overrideRoute,
  recalculatePlan,
  simulateFallback,
  getEligibleRoutes
} from "./scheduler.js?v=opennext-20260912-5";

export {
  demoMeta,
  modelMarkets,
  gpuOffers,
  providerDepth,
  routeCatalog,
  rfqExamples,
  indexSeries,
  marketStats,
  createSchedule,
  overrideRoute,
  recalculatePlan,
  simulateFallback,
  getEligibleRoutes
};

export const presets = {
  support: {
    label: "客服分析",
    text: "处理 2 万条客服记录：先进行隐私脱敏与语言识别，再完成主题分类、情绪识别和高风险投诉检测，最后生成中英双语的管理层报告，并对关键结论做事实校验。"
  },
  research: {
    label: "行业研究",
    text: "研究全球 AI 推理容量市场：检索近期资料，提取各地区 GPU 价格与模型容量价格，识别供需变化，计算趋势并生成带证据引用的投资委员会报告。"
  },
  software: {
    label: "代码迁移",
    text: "分析一个大型 Python 服务，生成依赖图，识别安全风险，将核心模块迁移到 TypeScript，运行测试并输出逐模块审查报告与上线计划。"
  },
  multimodal: {
    label: "多模态审核",
    text: "批量处理 5,000 条包含图片、语音和文本的商品内容，做内容安全分类、OCR、语音转写、重复检测和高风险复核，最后输出可审计的审核结果。"
  }
};

export const state = {
  route: "overview",
  modelQuery: "",
  gpuRegion: "all",
  gpuTerm: "all",
  scheduler: {
    preset: "support",
    text: presets.support.text,
    strategy: "balanced",
    budgetUSD: 0.5,
    deadlineSeconds: 30,
    region: "Singapore",
    plan: null,
    statuses: {},
    events: [],
    running: false,
    completed: false
  }
};

export const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
export const compactMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
export const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function pick(object, keys, fallback = undefined) {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return fallback;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function modelView(model) {
  const id = pick(model, ["id", "slug", "marketId"], "model");
  return {
    raw: model,
    id,
    name: pick(model, ["name", "model", "flagshipModel", "displayName", "family"], "Model Capacity"),
    family: pick(model, ["family", "name"], "Model"),
    provider: pick(model, ["provider", "vendor"], "Verified providers"),
    index: Number(pick(model, ["indexMultiple", "index", "priceMultiple", "officialMultiple"], 1)),
    change: Number(pick(model, ["change7d", "change7dPct", "change", "sevenDayChange"], 0)),
    suppliers: Number(pick(model, ["suppliers", "supplierCount", "exchangeSuppliers"], 0)),
    capacity: Number(pick(model, ["executableOEV", "executableOevUsd", "availableOEV", "availableCapacity", "capacityUSD"], 0)),
    rpm: Number(pick(model, ["maxRPM", "maxRpm", "rpm", "throughputRPM"], 0)),
    uptime: Number(pick(model, ["uptime", "uptimePct", "measuredUptime"], 0)),
    p95: Number(pick(model, ["p95LatencyMs", "latencyP95"], 0)),
    confidence: pick(model, ["confidence", "confidenceGrade"], model.status === "Deep market" ? "A" : "B"),
    sparkline: pick(model, ["sparkline", "history", "trend"], [1, 1, 1, 1]),
    accent: pick(model, ["accent", "color"], ({ claude: "#7651d6", gpt: "#0f9f9a", gemini: "#3157e8", deepseek: "#2563eb", kimi: "#db7c25", glm: "#c23b4b" })[id] || "#3157e8")
  };
}

export function gpuView(gpu) {
  const nestedPrice = typeof gpu?.price === "object" ? Number(gpu.price.amount || 0) : Number(gpu?.price || 0);
  const nestedTerm = typeof gpu?.term === "object" ? gpu.term.type : gpu?.term;
  const nestedTopology = typeof gpu?.topology === "object"
    ? [gpu.topology.node, gpu.topology.interconnect, gpu.topology.fabric].filter(Boolean).join(" · ")
    : gpu?.topology;
  const nestedSla = typeof gpu?.sla === "object" ? gpu.sla.uptimePct : gpu?.sla;
  return {
    raw: gpu,
    id: pick(gpu, ["id", "offerId", "slug"], "gpu-offer"),
    name: pick(gpu, ["name", "sku", "displayName", "hardware", "accelerator"], "GPU Capacity"),
    vendor: pick(gpu, ["vendor", "supplier", "provider"], "Verified operator"),
    region: pick(gpu, ["region", "location"], "Global"),
    price: Number(pick(gpu, ["pricePerHour", "hourlyTotal"], nestedPrice)),
    unitPrice: Number(pick(gpu, ["unitPrice", "gpuHourPrice", "pricePerGpuHour", "pricePerChipHour"], nestedPrice)),
    available: Number(pick(gpu, ["available", "availableUnits", "inventory"], 0)),
    start: pick(gpu, ["start", "availableFrom", "readyIn", "nextAvailableAt", "availability"], "Now"),
    topology: nestedTopology || pick(gpu, ["network", "interconnect"], "Verified topology"),
    term: nestedTerm || pick(gpu, ["rentalMode", "pricingMode"], "On-demand"),
    sla: Number(nestedSla ?? pick(gpu, ["uptime", "slaPct"], 99.9)),
    verified: Boolean(pick(gpu, ["verified", "exchangeGrade", "laneA"], true)),
    category: pick(gpu, ["category"], "GPU")
  };
}

export function formatCost(value) {
  const amount = Number(value || 0);
  if (amount >= 1) return money.format(amount);
  if (amount >= 0.01) return `$${amount.toFixed(3)}`;
  return `$${amount.toFixed(4)}`;
}

export function formatLatency(value) {
  const ms = Number(value || 0);
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10000 ? 1 : 2)} s`;
  return `${Math.round(ms)} ms`;
}

export function scheduleInput(overrides = {}) {
  return {
    text: state.scheduler.text,
    preset: state.scheduler.preset,
    strategy: state.scheduler.strategy,
    budgetUSD: state.scheduler.budgetUSD,
    deadlineSeconds: state.scheduler.deadlineSeconds,
    region: state.scheduler.region,
    ...overrides
  };
}

export function generatePlan() {
  state.scheduler.plan = createSchedule(scheduleInput(), routeCatalog);
  state.scheduler.statuses = Object.fromEntries(state.scheduler.plan.steps.map((step) => [step.id, "queued"]));
  state.scheduler.events = [];
  state.scheduler.running = false;
  state.scheduler.completed = false;
  return state.scheduler.plan;
}

export function currentPlan() {
  return state.scheduler.plan || generatePlan();
}

export function sparkline(values, accent = "#3157e8") {
  const nums = Array.isArray(values) && values.length > 1 ? values.map(Number) : [1, 1.01, 1];
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  const points = nums.map((value, index) => {
    const x = (index / (nums.length - 1)) * 88 + 2;
    const y = 30 - ((value - min) / range) * 24;
    return [x, y];
  });
  const line = points.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L90,34 L2,34 Z`;
  return `<svg class="sparkline" viewBox="0 0 92 36" role="img" aria-label="7 day price trend" style="--model-accent:${accent}"><path class="area" d="${area}"></path><path class="line" d="${line}"></path></svg>`;
}

export function modelCard(model) {
  const m = modelView(model);
  const deltaClass = m.change < 0 ? "trend-down" : m.change > 0 ? "trend-up" : "trend-neutral";
  return `<article class="model-card" role="button" tabindex="0" data-action="view-model" data-model-id="${escapeHtml(m.id)}" style="--model-accent:${m.accent}">
    <div class="model-card-head"><div class="model-identity"><div class="model-orb">${escapeHtml(m.family.slice(0,1))}</div><div><strong>${escapeHtml(m.name)}</strong><span>${escapeHtml(m.provider)} · ${escapeHtml(m.family)} market</span></div></div><div class="confidence">${escapeHtml(m.confidence)}</div></div>
    <div class="model-price-row"><div><div class="price-multiple">${m.index.toFixed(2)}×<small>official reference</small></div><span class="${deltaClass}" style="font-size:9px;font-weight:700">${m.change > 0 ? "+" : ""}${m.change.toFixed(1)}% · 7D</span></div>${sparkline(m.sparkline,m.accent)}</div>
    <div class="model-stats"><div><span>Executable OEV</span><strong>${compactMoney.format(m.capacity)}</strong></div><div><span>Lane A supply</span><strong>${m.suppliers} suppliers</strong></div><div><span>Measured SLA</span><strong>${m.uptime.toFixed(2)}%</strong></div></div>
  </article>`;
}

export function availabilityCells(gpu, index) {
  const g = gpuView(gpu);
  return Array.from({ length: 14 }, (_, i) => `<span class="${(i + index) % 7 === 5 ? "limited" : i < Math.min(11, Math.max(6, Math.round(g.available / 10))) ? "available" : ""}"></span>`).join("");
}

export function gpuCard(gpu, index) {
  const g = gpuView(gpu);
  const displayPrice = g.price || g.unitPrice;
  return `<article class="gpu-card"><div class="gpu-card-head"><h3>${escapeHtml(g.name)}<span>${escapeHtml(g.vendor)} · ${escapeHtml(g.region)}</span></h3><span class="badge ${g.verified ? "badge-green" : "badge-amber"}">${g.verified ? "Exchange-grade" : "RFQ only"}</span></div>
    <div class="gpu-price">${displayPrice ? money.format(displayPrice) : "Token-based"}<small>${displayPrice ? " / accelerator·h" : " capacity"}</small></div>
    <div class="gpu-specs"><div class="gpu-spec"><span>Availability</span><strong>${g.available} units</strong></div><div class="gpu-spec"><span>Ready</span><strong>${escapeHtml(g.start)}</strong></div><div class="gpu-spec"><span>Topology</span><strong>${escapeHtml(g.topology)}</strong></div><div class="gpu-spec"><span>SLA</span><strong>${g.sla.toFixed(2)}%</strong></div></div>
    <div class="availability-bar" aria-label="未来 14 天可用性">${availabilityCells(gpu,index)}</div><div class="gpu-card-actions"><span class="badge badge-gray">${escapeHtml(g.term)}</span><div class="button-row"><button class="ghost-button compact" type="button" data-action="gpu-detail" data-gpu-id="${escapeHtml(g.id)}">详情</button><button class="primary-button compact" type="button" data-action="reserve-gpu" data-gpu-id="${escapeHtml(g.id)}">预留</button></div></div></article>`;
}

export function lineChart(seriesA, seriesB = null, suffix = "×") {
  const a = Array.isArray(seriesA) ? seriesA : [];
  const b = Array.isArray(seriesB) ? seriesB : [];
  const all = [...a, ...b];
  if (!all.length) return "";
  const values = all.map((point) => Number(point.value ?? point.y ?? point));
  const pad = suffix === "×" ? .02 : .15;
  const min = Math.min(...values) - pad;
  const max = Math.max(...values) + pad;
  const width = 680, height = 220, left = 48, right = 16, top = 18, bottom = 30;
  const x = (index, length) => left + (index / Math.max(1, length - 1)) * (width - left - right);
  const y = (value) => top + ((max - value) / Math.max(.001, max - min)) * (height - top - bottom);
  const path = (series) => series.map((point,index) => `${index ? "L" : "M"}${x(index,series.length).toFixed(1)},${y(Number(point.value ?? point.y ?? point)).toFixed(1)}`).join(" ");
  const area = `${path(a)} L${x(a.length-1,a.length)},${height-bottom} L${left},${height-bottom} Z`;
  const grid = Array.from({ length: 5 }, (_, index) => { const value = max - (index / 4) * (max - min); const py = y(value); return `<line class="grid" x1="${left}" x2="${width-right}" y1="${py}" y2="${py}"></line><text class="axis-label" x="${left-8}" y="${py+3}" text-anchor="end">${value.toFixed(2)}${suffix}</text>`; }).join("");
  return `<svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Capacity index history"><path class="area" d="${area}"></path>${grid}<path class="series" d="${path(a)}"></path>${b.length ? `<path class="series-two" d="${path(b)}"></path>` : ""}<text class="axis-label" x="${left}" y="${height-8}">${escapeHtml(a[0]?.date || "Start")}</text><text class="axis-label" x="${width-right}" y="${height-8}" text-anchor="end">${escapeHtml(a.at(-1)?.date || "Now")}</text></svg>`;
}
