import { routeCatalog } from "./data.js";

const CLOSED_FAMILY_PATTERN = /(claude|anthropic|gpt|openai|gemini|kimi|moonshot|glm)/i;
const OPAQUE_HARDWARE_PATTERN = /(provider[- ]managed|opaque|undisclosed|not disclosed)/i;
const PROVIDER_ACCESS_MODES = new Set(["provider-api", "managed-endpoint"]);
const STRATEGY_NAMES = new Set(["balanced", "cost", "latency"]);

export const STRATEGIES = Object.freeze({
  balanced: {
    id: "balanced",
    label: "效果 / 成本 / 延迟平衡",
    weights: { quality: 0.36, cost: 0.27, latency: 0.27, reliability: 0.1 },
  },
  cost: {
    id: "cost",
    label: "最低成本",
    weights: { quality: 0.22, cost: 0.57, latency: 0.13, reliability: 0.08 },
  },
  latency: {
    id: "latency",
    label: "最低延迟",
    weights: { quality: 0.24, cost: 0.14, latency: 0.54, reliability: 0.08 },
  },
});

const TEMPLATE_LIBRARY = {
  research: {
    label: "深度研究与报告",
    steps: [
      step("理解目标与约束", "将目标、受众、范围和交付标准结构化。", "planning", 1600, 500, [], { minQuality: 84 }),
      step("制定检索计划", "生成查询、证据标准与研究路径。", "reasoning", 2200, 750, [0], { minQuality: 86 }),
      step("并行提取证据", "从多个来源提取事实、数字和可引用证据。", "extraction", 3600, 850, [1], { calls: 4, concurrency: 4, latencyPriority: 1.2 }),
      step("交叉核验事实", "识别冲突证据并检查关键事实。", "verification", 3000, 700, [1], { calls: 3, concurrency: 3, minQuality: 86, qualityPriority: 1.2 }),
      step("综合推理", "把证据组合为结论、权衡和建议。", "reasoning", 5800, 1700, [2, 3], { minQuality: 90, qualityPriority: 1.35 }),
      step("生成正式报告", "根据受众和格式生成完整成果。", "generation", 4800, 2600, [4], { minQuality: 87 }),
      step("最终质量检查", "检查完整性、逻辑、引用和风险表述。", "verification", 3200, 650, [5], { minQuality: 88, qualityPriority: 1.25 }),
    ],
  },
  software: {
    label: "软件开发 / Agent 任务",
    steps: [
      step("解析需求", "抽取验收标准、约束和非功能目标。", "planning", 2200, 700, [], { minQuality: 86 }),
      step("扫描代码与依赖", "定位相关模块、接口和潜在影响范围。", "long-context", 5200, 650, [0], { calls: 2, concurrency: 2 }),
      step("生成实施方案", "拆分改动并选择最小风险的实现路径。", "reasoning", 4200, 1200, [1], { minQuality: 89, qualityPriority: 1.2 }),
      step("实现代码", "完成核心代码与必要的集成改动。", "coding", 5800, 2600, [2], { minQuality: 91, qualityPriority: 1.35 }),
      step("生成并运行测试", "覆盖主路径、边界情况与回归风险。", "coding", 3800, 1500, [3], { calls: 2, concurrency: 2, minQuality: 87 }),
      step("代码审查与修复", "检查正确性、安全性、性能和可维护性。", "verification", 5000, 1100, [4], { minQuality: 90, qualityPriority: 1.3 }),
      step("汇总交付", "整理变更、验证结果和后续建议。", "summarization", 2300, 700, [5], { latencyPriority: 1.15 }),
    ],
  },
  rag: {
    label: "知识库 / RAG 查询",
    steps: [
      step("理解查询意图", "识别实体、时间范围和回答标准。", "classification", 1300, 350, [], { latencyPriority: 1.3 }),
      step("拆分检索查询", "生成可并行执行的检索子查询。", "planning", 1800, 500, [0]),
      step("并行召回与初筛", "从知识源召回候选段落并快速过滤。", "retrieval", 2600, 450, [1], { calls: 6, concurrency: 6, latencyPriority: 1.55, preferredAccelerators: ["cerebras"] }),
      step("重排与证据提取", "选择最相关证据并保留出处。", "extraction", 4200, 750, [2], { calls: 3, concurrency: 3 }),
      step("基于证据合成", "只依据已选证据生成答案。", "reasoning", 5200, 1600, [3], { minQuality: 89, qualityPriority: 1.3 }),
      step("引用与事实校验", "检查回答是否被证据支持并修正引用。", "verification", 3200, 650, [4], { minQuality: 88 }),
    ],
  },
  multimodal: {
    label: "多模态内容生产",
    steps: [
      step("解析创意简报", "提取品牌、受众、渠道和内容限制。", "planning", 1900, 550, [], { minQuality: 84 }),
      step("理解视觉素材", "分析图片、版式或视频关键帧。", "vision", 2500, 700, [0], { capabilities: ["vision"], minQuality: 86 }),
      step("并行生成创意方向", "快速探索多个主题、标题与叙事角度。", "generation", 2400, 1000, [0], { calls: 4, concurrency: 4, latencyPriority: 1.35, preferredAccelerators: ["cerebras"] }),
      step("生成核心文案", "形成主文案、CTA 与不同渠道变体。", "generation", 4200, 1900, [1, 2], { minQuality: 88, qualityPriority: 1.2 }),
      step("制定资产方案", "描述视觉资产、尺寸与制作要求。", "reasoning", 3500, 1200, [1, 2], { minQuality: 87 }),
      step("品牌与安全检查", "检查事实、品牌一致性和安全风险。", "verification", 3600, 700, [3, 4], { minQuality: 89 }),
      step("打包最终交付", "生成可直接使用的渠道化成果包。", "summarization", 3000, 1100, [5]),
    ],
  },
  support: {
    label: "企业客服处理",
    steps: [
      step("识别意图与优先级", "判断问题类型、紧急程度与语言。", "classification", 1200, 280, [], { latencyPriority: 1.65, preferredAccelerators: ["cerebras"] }),
      step("检索账户与知识库", "查找政策、历史工单与相关知识。", "retrieval", 2200, 420, [0], { calls: 3, concurrency: 3, latencyPriority: 1.35 }),
      step("提取解决依据", "提取适用条款、操作步骤和限制。", "extraction", 2800, 600, [1]),
      step("生成解决方案", "形成可执行且符合语气要求的回复。", "generation", 3200, 950, [2], { minQuality: 87 }),
      step("合规与风险检查", "识别敏感信息、承诺和升级条件。", "verification", 2400, 450, [3], { minQuality: 88 }),
      step("个性化最终回复", "结合上下文输出最终回复和下一步。", "generation", 2600, 800, [4], { minQuality: 86 }),
    ],
  },
  general: {
    label: "通用复杂任务",
    steps: [
      step("理解任务", "提取目标、上下文、硬约束和验收标准。", "planning", 1800, 550, [], { minQuality: 84 }),
      step("拆分执行计划", "将任务拆为可验证、可并行的工作单元。", "reasoning", 2600, 800, [0], { minQuality: 87 }),
      step("快速处理标准步骤", "批量完成分类、提取或格式转换等标准工作。", "classification", 2800, 500, [1], { calls: 5, concurrency: 5, latencyPriority: 1.6, preferredAccelerators: ["cerebras"] }),
      step("执行深度推理", "处理需要更强推理能力的核心问题。", "reasoning", 5200, 1600, [1], { minQuality: 90, qualityPriority: 1.4 }),
      step("汇总多路结果", "合并快速处理与深度推理的输出。", "generation", 4300, 1500, [2, 3], { minQuality: 87 }),
      step("校验并交付", "验证完整性、一致性和风险后生成最终成果。", "verification", 3200, 700, [4], { minQuality: 88 }),
    ],
  },
};

export const SCHEDULER_PRESETS = Object.freeze(
  Object.fromEntries(
    Object.entries(TEMPLATE_LIBRARY).map(([id, template]) => [
      id,
      Object.freeze({ id, label: template.label, stepCount: template.steps.length }),
    ]),
  ),
);

function step(label, description, taskType, inputTokens, outputTokens, dependsOn = [], options = {}) {
  return {
    label,
    description,
    taskType,
    estimatedTokens: { input: inputTokens, output: outputTokens },
    dependsOn,
    calls: options.calls || 1,
    concurrency: options.concurrency || 1,
    minQuality: options.minQuality || 82,
    qualityWeight: options.qualityWeight || 1,
    qualityPriority: options.qualityPriority || 1,
    latencyPriority: options.latencyPriority || 1,
    capabilities: options.capabilities || [],
    preferredAccelerators: options.preferredAccelerators || [],
  };
}

function asFiniteNumber(value, fallback = null) {
  if (value === "" || value == null) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeRate(value) {
  const number = asFiniteNumber(value, 0);
  return number > 1 ? number / 100 : number;
}

function catalogToArray(catalog = routeCatalog) {
  if (Array.isArray(catalog)) return catalog;
  if (Array.isArray(catalog?.routes)) return catalog.routes;
  if (Array.isArray(catalog?.routeCatalog)) return catalog.routeCatalog;
  return Object.values(catalog || {}).filter((entry) => entry && typeof entry === "object" && entry.id);
}

function normalizeInput(input = {}) {
  const value = typeof input === "string" ? { text: input } : { ...input };
  const text = String(value.text ?? value.task ?? value.prompt ?? "").trim();
  const strategy = STRATEGY_NAMES.has(value.strategy) ? value.strategy : "balanced";
  const budgetUSD = asFiniteNumber(value.budgetUSD ?? value.budget ?? value.maxCostUSD, null);
  const deadlineMs = asFiniteNumber(
    value.deadlineMs ?? value.maxLatencyMs,
    asFiniteNumber(value.deadlineSeconds ?? value.timeLimitSeconds, null) == null
      ? null
      : asFiniteNumber(value.deadlineSeconds ?? value.timeLimitSeconds, null) * 1000,
  );
  const preset = resolvePreset(value.preset, text);

  return {
    text,
    preset,
    strategy,
    budgetUSD: budgetUSD != null && budgetUSD >= 0 ? budgetUSD : null,
    deadlineMs: deadlineMs != null && deadlineMs > 0 ? deadlineMs : null,
  };
}

function resolvePreset(requestedPreset, text = "") {
  const normalized = String(requestedPreset || "").toLowerCase().trim();
  const aliases = {
    "research-report": "research",
    report: "research",
    code: "software",
    coding: "software",
    "coding-agent": "software",
    "rag-pipeline": "rag",
    content: "multimodal",
    "customer-support": "support",
  };
  const resolved = aliases[normalized] || normalized;
  if (TEMPLATE_LIBRARY[resolved]) return resolved;

  const source = String(text).toLowerCase();
  if (/(研究|调研|报告|research|report|market analysis|due diligence)/i.test(source)) return "research";
  if (/(代码|编程|软件|网站|应用|开发|debug|code|software|repository|mvp|demo)/i.test(source)) return "software";
  if (/(知识库|检索增强|rag|retrieval|knowledge base)/i.test(source)) return "rag";
  if (/(图片|视频|视觉|广告|创意|多模态|image|video|creative|multimodal)/i.test(source)) return "multimodal";
  if (/(客服|工单|客户支持|customer support|ticket|helpdesk)/i.test(source)) return "support";
  return "general";
}

/**
 * Deterministically expands a task into a 5-7 step DAG. This MVP intentionally
 * uses transparent templates instead of pretending that a live LLM planned it.
 */
export function decomposeTask(input = {}) {
  const normalized = normalizeInput(input);
  const template = TEMPLATE_LIBRARY[normalized.preset];
  const ids = template.steps.map((_, index) => `step-${index + 1}`);

  return template.steps.map((templateStep, index) => ({
    ...templateStep,
    id: ids[index],
    order: index + 1,
    dependsOn: templateStep.dependsOn.map((dependencyIndex) => ids[dependencyIndex]),
    taskContext: normalized.text,
  }));
}

export function isProviderManagedRoute(route) {
  if (!route) return false;
  const family = `${route.modelFamily || ""} ${route.model || ""} ${route.provider || ""}`;
  const isClosed = route.modelClass === "closed" || CLOSED_FAMILY_PATTERN.test(family);
  if (!isClosed) return route.acceleratorClass === "opaque" || OPAQUE_HARDWARE_PATTERN.test(String(route.hardware || ""));
  return (
    PROVIDER_ACCESS_MODES.has(route.accessMode) &&
    route.acceleratorClass === "opaque" &&
    OPAQUE_HARDWARE_PATTERN.test(String(route.hardware || ""))
  );
}

/**
 * Enforces the product disclosure rule: closed-model APIs cannot be presented
 * as if OpenNEXT selected their underlying GPU or accelerator.
 */
export function validateRoute(route) {
  if (!route || !route.id) return { valid: false, reason: "Route is missing an id." };
  const family = `${route.modelFamily || ""} ${route.model || ""} ${route.provider || ""}`;
  const isClosed = route.modelClass === "closed" || CLOSED_FAMILY_PATTERN.test(family);

  if (isClosed && !isProviderManagedRoute(route)) {
    return {
      valid: false,
      reason: `${route.label || route.id} is a closed-model route and must use provider-managed opaque hardware disclosure.`,
    };
  }

  if (route.accessMode === "self-hosted" && isClosed) {
    return { valid: false, reason: "Closed models cannot be represented as self-hosted routes." };
  }

  return { valid: true, reason: null };
}

function taskTypeMatches(route, stepDefinition) {
  const types = (route.taskTypes || []).map((value) => String(value).toLowerCase());
  if (!types.length || types.includes("general") || types.includes("all")) return true;
  const wanted = String(stepDefinition.taskType || "general").toLowerCase();
  if (types.includes(wanted)) return true;

  const compatibleGroups = {
    planning: ["reasoning", "analysis", "agentic"],
    extraction: ["retrieval", "summarization", "analysis"],
    verification: ["reasoning", "analysis", "coding"],
    generation: ["writing", "summarization", "reasoning"],
    "long-context": ["coding", "analysis", "retrieval"],
    classification: ["extraction", "analysis"],
    retrieval: ["extraction", "rag", "analysis"],
  };
  return (compatibleGroups[wanted] || []).some((type) => types.includes(type));
}

/** Returns structurally legal routes, preferring task and quality matches. */
export function getEligibleRoutes(stepDefinition, catalog = routeCatalog) {
  const legal = catalogToArray(catalog).filter((route) => validateRoute(route).valid);
  const taskMatched = legal.filter((route) => taskTypeMatches(route, stepDefinition));
  const pool = taskMatched.length ? taskMatched : legal;
  const qualityMatched = pool.filter(
    (route) => asFiniteNumber(route.qualityScore, 0) >= asFiniteNumber(stepDefinition.minQuality, 0),
  );
  return qualityMatched.length ? qualityMatched : pool;
}

function routeCost(route, stepDefinition) {
  const inputTokens = asFiniteNumber(stepDefinition.estimatedTokens?.input, 0);
  const outputTokens = asFiniteNumber(stepDefinition.estimatedTokens?.output, 0);
  const calls = Math.max(1, asFiniteNumber(stepDefinition.calls, 1));
  const inputRate = asFiniteNumber(route.costPer1M?.input, null);
  const outputRate = asFiniteNumber(route.costPer1M?.output, null);
  const blended = asFiniteNumber(route.costPer1M?.blended, 0);
  const perCall = inputRate != null && outputRate != null
    ? (inputTokens * inputRate + outputTokens * outputRate) / 1_000_000
    : ((inputTokens + outputTokens) * blended) / 1_000_000;
  return perCall * calls;
}

function routeLatency(route, stepDefinition) {
  const p95 = asFiniteNumber(route.latencyMs?.p95, asFiniteNumber(route.latencyMs?.p50, 1800));
  const throughput = Math.max(1, asFiniteNumber(route.throughput?.tokensPerSecond, 80));
  const outputTokens = asFiniteNumber(stepDefinition.estimatedTokens?.output, 0);
  const calls = Math.max(1, asFiniteNumber(stepDefinition.calls, 1));
  const concurrency = Math.max(1, asFiniteNumber(stepDefinition.concurrency, 1));
  const serialBatches = Math.max(1, Math.ceil(calls / concurrency));
  return (p95 + (outputTokens / throughput) * 1000) * serialBatches;
}

function routeQuality(route) {
  return clamp(asFiniteNumber(route.qualityScore, 80), 0, 100);
}

function minMaxScore(value, min, max, invert = false) {
  if (max <= min) return 1;
  const normalized = clamp((value - min) / (max - min), 0, 1);
  return invert ? 1 - normalized : normalized;
}

function scoreCandidates(routes, stepDefinition, strategyName) {
  const rows = routes.map((route) => ({
    route,
    cost: routeCost(route, stepDefinition),
    latency: routeLatency(route, stepDefinition),
    quality: routeQuality(route),
    reliability: clamp((normalizeRate(route.uptime) + normalizeRate(route.availability)) / 2 || 0.95, 0, 1),
  }));
  const range = (field) => ({
    min: Math.min(...rows.map((row) => row[field])),
    max: Math.max(...rows.map((row) => row[field])),
  });
  const costRange = range("cost");
  const latencyRange = range("latency");
  const qualityRange = range("quality");
  const baseWeights = STRATEGIES[strategyName].weights;
  const weights = {
    ...baseWeights,
    quality: baseWeights.quality * asFiniteNumber(stepDefinition.qualityPriority, 1),
    latency: baseWeights.latency * asFiniteNumber(stepDefinition.latencyPriority, 1),
  };
  const weightTotal = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const desiredCapabilities = (stepDefinition.capabilities || []).map((item) => String(item).toLowerCase());
  const preferredAccelerators = (stepDefinition.preferredAccelerators || []).map((item) => String(item).toLowerCase());

  return rows
    .map((row) => {
      const routeCapabilities = (row.route.capabilities || []).map((item) => String(item).toLowerCase());
      const capabilityFit = desiredCapabilities.length
        ? desiredCapabilities.filter((item) => routeCapabilities.includes(item)).length / desiredCapabilities.length
        : 1;
      const accelerator = `${row.route.acceleratorClass || ""} ${row.route.hardware || ""}`.toLowerCase();
      const acceleratorBonus = preferredAccelerators.some((item) => accelerator.includes(item)) ? 0.08 : 0;
      const taskBonus = taskTypeMatches(row.route, stepDefinition) ? 0.04 : 0;
      const score =
        (minMaxScore(row.quality, qualityRange.min, qualityRange.max) * weights.quality +
          minMaxScore(row.cost, costRange.min, costRange.max, true) * weights.cost +
          minMaxScore(row.latency, latencyRange.min, latencyRange.max, true) * weights.latency +
          row.reliability * weights.reliability) /
          weightTotal +
        capabilityFit * 0.05 +
        acceleratorBonus +
        taskBonus;
      return { ...row, score };
    })
    .sort((a, b) => b.score - a.score || a.cost - b.cost || a.latency - b.latency);
}

function routeSummary(route) {
  const providerManaged = isProviderManagedRoute(route);
  return {
    id: route.id,
    label: route.label,
    modelFamily: route.modelFamily,
    model: route.model,
    modelClass: route.modelClass,
    provider: route.provider,
    accessMode: route.accessMode,
    deliveryLayer: providerManaged ? "provider-managed" : route.accessMode,
    hardware: providerManaged ? "Provider-managed (opaque)" : route.hardware,
    acceleratorClass: providerManaged ? "opaque" : route.acceleratorClass,
    region: route.region,
    lane: route.lane,
    qualityScore: routeQuality(route),
    uptime: route.uptime,
    availability: route.availability,
    sla: route.sla,
    disclosure: providerManaged
      ? "底层芯片由模型服务商管理且不披露；OpenNEXT 仅选择可验证的服务交付路线。"
      : "该路线允许选择并展示已验证的模型与加速硬件组合。",
  };
}

function selectionReason(stepDefinition, route, strategy) {
  const providerManaged = isProviderManagedRoute(route);
  const accelerator = String(route.hardware || route.acceleratorClass || "");
  if (!providerManaged && /cerebras/i.test(accelerator) && stepDefinition.latencyPriority > 1) {
    return "该子任务可并行且对延迟敏感，选择 Cerebras 交付路线以缩短执行时间。";
  }
  if (providerManaged) {
    return `${route.modelFamily || route.model} 采用服务商托管交付；底层芯片不可选择，按${STRATEGIES[strategy].label}评估价格、质量和 SLA。`;
  }
  return `在满足质量门槛后，该“模型 + ${route.hardware || route.acceleratorClass}”组合的${STRATEGIES[strategy].label}得分最高。`;
}

function buildAssignment(stepDefinition, route, strategy, catalog, metadata = {}) {
  const alternatives = scoreCandidates(getEligibleRoutes(stepDefinition, catalog), stepDefinition, strategy)
    .filter((candidate) => candidate.route.id !== route.id)
    .slice(0, 3)
    .map((candidate) => ({
      route: routeSummary(candidate.route),
      estimatedCostUSD: round(candidate.cost, 4),
      estimatedLatencyMs: Math.round(candidate.latency),
      qualityScore: round(candidate.quality, 1),
    }));

  return {
    routeId: route.id,
    route: routeSummary(route),
    estimatedCostUSD: round(routeCost(route, stepDefinition), 4),
    estimatedLatencyMs: Math.round(routeLatency(route, stepDefinition)),
    qualityScore: round(routeQuality(route), 1),
    selectionReason: selectionReason(stepDefinition, route, strategy),
    manualOverride: Boolean(metadata.manualOverride),
    fallbackFromRouteId: metadata.fallbackFromRouteId || null,
    alternatives,
  };
}

function selectInitialAssignments(steps, catalog, strategy) {
  return steps.map((stepDefinition) => {
    const candidates = scoreCandidates(getEligibleRoutes(stepDefinition, catalog), stepDefinition, strategy);
    if (!candidates.length) throw new Error(`No legal routes are available for ${stepDefinition.label}.`);
    return { ...stepDefinition, assignment: buildAssignment(stepDefinition, candidates[0].route, strategy, catalog) };
  });
}

function computeCriticalPath(steps, latencyAccessor = (item) => item.assignment.estimatedLatencyMs) {
  const finishTimes = new Map();
  const paths = new Map();
  for (const stepDefinition of steps) {
    let dependencyFinish = 0;
    let dependencyPath = [];
    for (const dependencyId of stepDefinition.dependsOn || []) {
      const finish = finishTimes.get(dependencyId) || 0;
      if (finish >= dependencyFinish) {
        dependencyFinish = finish;
        dependencyPath = paths.get(dependencyId) || [];
      }
    }
    const finish = dependencyFinish + Math.max(0, asFiniteNumber(latencyAccessor(stepDefinition), 0));
    finishTimes.set(stepDefinition.id, finish);
    paths.set(stepDefinition.id, [...dependencyPath, stepDefinition.id]);
  }
  let endId = null;
  let totalMs = 0;
  for (const [id, finish] of finishTimes.entries()) {
    if (finish >= totalMs) {
      totalMs = finish;
      endId = id;
    }
  }
  return { totalMs: Math.round(totalMs), stepIds: endId ? paths.get(endId) || [] : [] };
}

function calculateRawMetrics(steps) {
  const totalCostUSD = steps.reduce((sum, item) => sum + item.assignment.estimatedCostUSD, 0);
  const weightTotal = steps.reduce((sum, item) => sum + asFiniteNumber(item.qualityWeight, 1), 0) || 1;
  const qualityScore = steps.reduce(
    (sum, item) => sum + item.assignment.qualityScore * asFiniteNumber(item.qualityWeight, 1),
    0,
  ) / weightTotal;
  const criticalPath = computeCriticalPath(steps);
  return { totalCostUSD, qualityScore, criticalPath };
}

function optimizeForBudget(steps, catalog, input) {
  if (input.budgetUSD == null) return steps;
  let attempts = 0;
  while (calculateRawMetrics(steps).totalCostUSD > input.budgetUSD && attempts < 30) {
    attempts += 1;
    const swaps = [];
    for (const stepDefinition of steps) {
      if (stepDefinition.assignment.manualOverride) continue;
      const current = stepDefinition.assignment;
      for (const route of getEligibleRoutes(stepDefinition, catalog)) {
        if (route.id === current.routeId) continue;
        const nextCost = routeCost(route, stepDefinition);
        const saving = current.estimatedCostUSD - nextCost;
        const quality = routeQuality(route);
        if (saving <= 0 || quality < stepDefinition.minQuality) continue;
        const qualityLoss = Math.max(0, current.qualityScore - quality);
        swaps.push({
          stepDefinition,
          route,
          score: saving / (0.25 + qualityLoss),
          saving,
        });
      }
    }
    swaps.sort((a, b) => b.score - a.score || b.saving - a.saving);
    if (!swaps.length) break;
    const selected = swaps[0];
    selected.stepDefinition.assignment = buildAssignment(selected.stepDefinition, selected.route, input.strategy, catalog);
  }
  return steps;
}

function optimizeForDeadline(steps, catalog, input) {
  if (input.deadlineMs == null) return steps;
  let attempts = 0;
  while (calculateRawMetrics(steps).criticalPath.totalMs > input.deadlineMs && attempts < 30) {
    attempts += 1;
    const raw = calculateRawMetrics(steps);
    const criticalIds = new Set(raw.criticalPath.stepIds);
    const swaps = [];
    for (const stepDefinition of steps) {
      if (!criticalIds.has(stepDefinition.id) || stepDefinition.assignment.manualOverride) continue;
      const current = stepDefinition.assignment;
      for (const route of getEligibleRoutes(stepDefinition, catalog)) {
        if (route.id === current.routeId) continue;
        const nextLatency = routeLatency(route, stepDefinition);
        const latencySaving = current.estimatedLatencyMs - nextLatency;
        const quality = routeQuality(route);
        if (latencySaving <= 0 || quality < stepDefinition.minQuality) continue;
        const costIncrease = Math.max(0, routeCost(route, stepDefinition) - current.estimatedCostUSD);
        const qualityLoss = Math.max(0, current.qualityScore - quality);
        swaps.push({
          stepDefinition,
          route,
          score: latencySaving / (1 + costIncrease * 1000 + qualityLoss * 250),
          latencySaving,
        });
      }
    }
    swaps.sort((a, b) => b.score - a.score || b.latencySaving - a.latencySaving);
    if (!swaps.length) break;
    const selected = swaps[0];
    selected.stepDefinition.assignment = buildAssignment(selected.stepDefinition, selected.route, input.strategy, catalog);
  }
  return steps;
}

function selectFrontierRoute(stepDefinition, catalog) {
  const candidates = getEligibleRoutes(stepDefinition, catalog)
    .map((route) => ({ route, quality: routeQuality(route), cost: routeCost(route, stepDefinition) }))
    .sort((a, b) => {
      const aFrontier = a.route.modelClass === "closed" ? 1 : 0;
      const bFrontier = b.route.modelClass === "closed" ? 1 : 0;
      return bFrontier - aFrontier || b.quality - a.quality || b.cost - a.cost;
    });
  return candidates[0]?.route || null;
}

function buildBaseline(steps, catalog) {
  const baselineSteps = steps.map((stepDefinition) => {
    const route = selectFrontierRoute(stepDefinition, catalog);
    return {
      ...stepDefinition,
      assignment: route
        ? {
            routeId: route.id,
            estimatedCostUSD: routeCost(route, stepDefinition),
            estimatedLatencyMs: routeLatency(route, stepDefinition),
            qualityScore: routeQuality(route),
          }
        : stepDefinition.assignment,
    };
  });
  const raw = calculateRawMetrics(baselineSteps);
  return {
    label: "All-frontier baseline",
    definition: "每个子任务均使用目录中质量最高的合规 frontier 路线；仅用于本次 Demo 的相对比较。",
    totalCostUSD: round(raw.totalCostUSD, 4),
    criticalPathLatencyMs: raw.criticalPath.totalMs,
    qualityScore: round(raw.qualityScore, 1),
    routeIds: baselineSteps.map((item) => item.assignment.routeId),
  };
}

function buildMetrics(steps, catalog, input) {
  const raw = calculateRawMetrics(steps);
  const baseline = buildBaseline(steps, catalog);
  const costSavingUSD = baseline.totalCostUSD - raw.totalCostUSD;
  const latencySavingMs = baseline.criticalPathLatencyMs - raw.criticalPath.totalMs;
  const costSavingPercent = baseline.totalCostUSD > 0 ? (costSavingUSD / baseline.totalCostUSD) * 100 : 0;
  const latencySavingPercent = baseline.criticalPathLatencyMs > 0
    ? (latencySavingMs / baseline.criticalPathLatencyMs) * 100
    : 0;
  const qualityFloorsMet = steps.every((item) => item.assignment.qualityScore >= item.minQuality);
  const budgetMet = input.budgetUSD == null || raw.totalCostUSD <= input.budgetUSD + 0.00005;
  const deadlineMet = input.deadlineMs == null || raw.criticalPath.totalMs <= input.deadlineMs;
  const warnings = [];
  if (!budgetMet) warnings.push("当前目录中没有同时满足质量门槛与预算的路线组合。");
  if (!deadlineMet) warnings.push("当前目录中没有同时满足质量门槛与时限的路线组合。");
  if (!qualityFloorsMet) warnings.push("至少一个步骤未达到预设质量门槛，请人工确认路线。");

  return {
    totalCostUSD: round(raw.totalCostUSD, 4),
    criticalPathLatencyMs: raw.criticalPath.totalMs,
    criticalPathStepIds: raw.criticalPath.stepIds,
    qualityScore: round(raw.qualityScore, 1),
    baseline,
    savings: {
      costUSD: round(costSavingUSD, 4),
      costPercent: round(costSavingPercent, 1),
      latencyMs: Math.round(latencySavingMs),
      latencyPercent: round(latencySavingPercent, 1),
    },
    constraints: {
      budgetUSD: input.budgetUSD,
      budgetMet,
      deadlineMs: input.deadlineMs,
      deadlineMet,
      qualityFloorsMet,
    },
    warnings,
  };
}

function planId(input) {
  let hash = 2166136261;
  const source = `${input.text}|${input.preset}|${input.strategy}|${Date.now()}`;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `schedule-${(hash >>> 0).toString(36)}`;
}

/**
 * Creates a complete, constraint-aware execution plan.
 * Input accepts text/task/prompt, preset, strategy, budgetUSD and deadlineMs.
 */
export function createSchedule(input = {}, catalog = routeCatalog) {
  const normalized = normalizeInput(input);
  const steps = decomposeTask(normalized);
  let scheduledSteps = selectInitialAssignments(steps, catalog, normalized.strategy);
  scheduledSteps = optimizeForBudget(scheduledSteps, catalog, normalized);
  scheduledSteps = optimizeForDeadline(scheduledSteps, catalog, normalized);
  const metrics = buildMetrics(scheduledSteps, catalog, normalized);

  return {
    id: planId(normalized),
    version: 1,
    createdAt: new Date().toISOString(),
    input: normalized,
    preset: { id: normalized.preset, label: TEMPLATE_LIBRARY[normalized.preset].label },
    strategy: { id: normalized.strategy, label: STRATEGIES[normalized.strategy].label },
    steps: scheduledSteps,
    metrics,
    events: [],
    policy: {
      closedModelHardware: "provider-managed-opaque",
      qualityFloor: "per-step",
      fallback: "different-provider-preferred",
      disclosure: "Closed-model APIs never claim a selectable underlying chip.",
    },
  };
}

/** Recalculates costs, critical path and baseline after route changes. */
export function recalculatePlan(plan, catalog = routeCatalog) {
  if (!plan?.steps?.length) throw new TypeError("A schedule with steps is required.");
  const input = normalizeInput({ ...(plan.input || {}), strategy: plan.strategy?.id || plan.input?.strategy });
  const routes = new Map(catalogToArray(catalog).map((route) => [route.id, route]));
  const steps = plan.steps.map((stepDefinition) => {
    const route = routes.get(stepDefinition.assignment?.routeId || stepDefinition.routeId);
    if (!route) throw new RangeError(`Unknown route: ${stepDefinition.assignment?.routeId || stepDefinition.routeId}`);
    const validation = validateRoute(route);
    if (!validation.valid) throw new RangeError(validation.reason);
    return {
      ...stepDefinition,
      assignment: buildAssignment(stepDefinition, route, input.strategy, catalog, {
        manualOverride: stepDefinition.assignment?.manualOverride,
        fallbackFromRouteId: stepDefinition.assignment?.fallbackFromRouteId,
      }),
    };
  });
  return {
    ...plan,
    version: asFiniteNumber(plan.version, 1) + 1,
    input,
    steps,
    metrics: buildMetrics(steps, catalog, input),
  };
}

/**
 * Applies a user-selected route to one step and recalculates the full plan.
 * Any structurally legal catalog route can be selected; a quality warning is
 * surfaced if it falls below that step's recommended floor.
 */
export function overrideRoute(plan, stepId, routeId, catalog = routeCatalog) {
  if (!plan?.steps?.some((item) => item.id === stepId)) throw new RangeError(`Unknown step: ${stepId}`);
  const route = catalogToArray(catalog).find((item) => item.id === routeId);
  if (!route) throw new RangeError(`Unknown route: ${routeId}`);
  const validation = validateRoute(route);
  if (!validation.valid) throw new RangeError(validation.reason);

  const nextPlan = {
    ...plan,
    steps: plan.steps.map((stepDefinition) =>
      stepDefinition.id === stepId
        ? {
            ...stepDefinition,
            assignment: {
              ...stepDefinition.assignment,
              routeId,
              manualOverride: true,
              fallbackFromRouteId: null,
            },
          }
        : { ...stepDefinition, assignment: { ...stepDefinition.assignment } },
    ),
  };
  return recalculatePlan(nextPlan, catalog);
}

function stringHash(value) {
  let hash = 0;
  for (const character of String(value)) hash = (Math.imul(hash, 31) + character.charCodeAt(0)) | 0;
  return hash >>> 0;
}

function deterministicFraction(seed) {
  let state = stringHash(seed) || 1;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return (state >>> 0) / 4_294_967_296;
}

/**
 * Simulates a route incident and automatic fallback. Returns both the updated
 * plan and a timeline event so the UI can animate detection and recovery.
 */
export function simulateFallback(plan, options = {}, catalog = routeCatalog) {
  if (!plan?.steps?.length) throw new TypeError("A schedule with steps is required.");
  const seed = options.seed ?? `${plan.id}-${plan.events?.length || 0}`;
  const eligibleSteps = plan.steps.filter((item) => getEligibleRoutes(item, catalog).some((route) => route.id !== item.assignment.routeId));
  if (!eligibleSteps.length) throw new Error("No step has an eligible fallback route.");
  const selectedStep = options.stepId
    ? eligibleSteps.find((item) => item.id === options.stepId)
    : eligibleSteps[Math.floor(deterministicFraction(seed) * eligibleSteps.length)];
  if (!selectedStep) throw new RangeError(`Step ${options.stepId} has no eligible fallback route.`);

  const currentRoute = catalogToArray(catalog).find((route) => route.id === selectedStep.assignment.routeId);
  const alternatives = scoreCandidates(
    getEligibleRoutes(selectedStep, catalog).filter((route) => route.id !== selectedStep.assignment.routeId),
    selectedStep,
    plan.strategy?.id || plan.input?.strategy || "balanced",
  ).sort((a, b) => {
    const aDifferentProvider = a.route.provider !== currentRoute?.provider ? 1 : 0;
    const bDifferentProvider = b.route.provider !== currentRoute?.provider ? 1 : 0;
    return bDifferentProvider - aDifferentProvider || b.score - a.score;
  });
  const requestedFallback = options.fallbackRouteId
    ? alternatives.find((candidate) => candidate.route.id === options.fallbackRouteId)
    : null;
  const fallback = requestedFallback || alternatives[0];
  if (!fallback) throw new Error(`No fallback route is available for ${selectedStep.label}.`);

  const reasons = ["P95 latency exceeded policy", "Provider returned elevated 5xx rate", "Capacity availability dropped below SLA"];
  const reason = options.reason || reasons[Math.floor(deterministicFraction(`${seed}-reason`) * reasons.length)];
  const detectionMs = Math.round(220 + deterministicFraction(`${seed}-detect`) * 430);
  const rerouteMs = Math.round(310 + deterministicFraction(`${seed}-reroute`) * 690);
  const eventId = `fallback-${stringHash(`${seed}-${selectedStep.id}-${fallback.route.id}`).toString(36)}`;

  const nextSteps = plan.steps.map((stepDefinition) =>
    stepDefinition.id === selectedStep.id
      ? {
          ...stepDefinition,
          assignment: {
            ...stepDefinition.assignment,
            routeId: fallback.route.id,
            manualOverride: false,
            fallbackFromRouteId: selectedStep.assignment.routeId,
          },
        }
      : { ...stepDefinition, assignment: { ...stepDefinition.assignment } },
  );
  let updatedPlan = recalculatePlan({ ...plan, steps: nextSteps }, catalog);
  const event = {
    id: eventId,
    type: "automatic-fallback",
    status: "recovered",
    stepId: selectedStep.id,
    stepLabel: selectedStep.label,
    reason,
    detectedInMs: detectionMs,
    reroutedInMs: rerouteMs,
    totalRecoveryMs: detectionMs + rerouteMs,
    from: routeSummary(currentRoute),
    to: routeSummary(fallback.route),
    impact: {
      costDeltaUSD: round(fallback.cost - selectedStep.assignment.estimatedCostUSD, 4),
      plannedLatencyDeltaMs: Math.round(fallback.latency - selectedStep.assignment.estimatedLatencyMs),
      qualityDelta: round(fallback.quality - selectedStep.assignment.qualityScore, 1),
    },
    timeline: [
      { offsetMs: 0, state: "degraded", label: reason },
      { offsetMs: detectionMs, state: "detected", label: "Routing policy detected the incident" },
      { offsetMs: detectionMs + rerouteMs, state: "rerouted", label: `Traffic moved to ${fallback.route.label}` },
      { offsetMs: detectionMs + rerouteMs + 180, state: "recovered", label: "Execution resumed" },
    ],
  };
  updatedPlan = {
    ...updatedPlan,
    events: [...(plan.events || []), event],
    lastFallbackEvent: event,
  };
  return { plan: updatedPlan, event };
}

// Friendly aliases for UI code and external demos.
export const runScheduler = createSchedule;
export const applyRouteOverride = overrideRoute;
export const simulateFailover = simulateFallback;
