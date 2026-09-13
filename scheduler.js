import { routeCatalog } from "./data.js?v=opennext-20260913-1";

const CLOSED_FAMILY_PATTERN = /(claude|anthropic|gpt|openai|gemini|kimi|moonshot|glm)/i;
const OPAQUE_HARDWARE_PATTERN = /(provider[- ]managed|opaque|undisclosed|not disclosed)/i;
const PROVIDER_ACCESS_MODES = new Set(["provider-api", "managed-endpoint"]);
const STRATEGY_NAMES = new Set(["balanced", "cost", "latency"]);

export const STRATEGIES = Object.freeze({
  balanced: {
    id: "balanced",
    label: "Balanced quality / cost / latency",
    weights: { quality: 0.36, cost: 0.27, latency: 0.27, reliability: 0.1 },
  },
  cost: {
    id: "cost",
    label: "Lowest cost",
    weights: { quality: 0.22, cost: 0.57, latency: 0.13, reliability: 0.08 },
  },
  latency: {
    id: "latency",
    label: "Lowest latency",
    weights: { quality: 0.24, cost: 0.14, latency: 0.54, reliability: 0.08 },
  },
});

const TEMPLATE_LIBRARY = {
  research: {
    label: "Deep research and reporting",
    steps: [
      step("Understand goals and constraints", "Structure the objective, audience, scope and delivery criteria.", "planning", 1600, 500, [], { minQuality: 84 }),
      step("Build a research plan", "Generate queries, evidence standards and a research path.", "reasoning", 2200, 750, [0], { minQuality: 86 }),
      step("Extract evidence in parallel", "Extract facts, figures and citable evidence from multiple sources.", "extraction", 3600, 850, [1], { calls: 4, concurrency: 4, latencyPriority: 1.2 }),
      step("Cross-check facts", "Identify conflicting evidence and verify critical facts.", "verification", 3000, 700, [1], { calls: 3, concurrency: 3, minQuality: 86, qualityPriority: 1.2 }),
      step("Synthesize findings", "Combine evidence into conclusions, trade-offs and recommendations.", "reasoning", 5800, 1700, [2, 3], { minQuality: 90, qualityPriority: 1.35 }),
      step("Generate the final report", "Produce the complete deliverable for the intended audience and format.", "generation", 4800, 2600, [4], { minQuality: 87 }),
      step("Final quality check", "Check completeness, logic, citations and risk language.", "verification", 3200, 650, [5], { minQuality: 88, qualityPriority: 1.25 }),
    ],
  },
  software: {
    label: "Software development / agent task",
    steps: [
      step("Parse requirements", "Extract acceptance criteria, constraints and non-functional goals.", "planning", 2200, 700, [], { minQuality: 86 }),
      step("Scan code and dependencies", "Locate relevant modules, interfaces and potential impact areas.", "long-context", 5200, 650, [0], { calls: 2, concurrency: 2 }),
      step("Create an implementation plan", "Break down the changes and choose the lowest-risk implementation path.", "reasoning", 4200, 1200, [1], { minQuality: 89, qualityPriority: 1.2 }),
      step("Implement the code", "Complete the core code and required integration changes.", "coding", 5800, 2600, [2], { minQuality: 91, qualityPriority: 1.35 }),
      step("Generate and run tests", "Cover primary paths, edge cases and regression risks.", "coding", 3800, 1500, [3], { calls: 2, concurrency: 2, minQuality: 87 }),
      step("Review and fix the code", "Review correctness, security, performance and maintainability.", "verification", 5000, 1100, [4], { minQuality: 90, qualityPriority: 1.3 }),
      step("Prepare the handoff", "Summarize changes, verification results and next steps.", "summarization", 2300, 700, [5], { latencyPriority: 1.15 }),
    ],
  },
  rag: {
    label: "Knowledge base / RAG query",
    steps: [
      step("Understand query intent", "Identify entities, time range and answer criteria.", "classification", 1300, 350, [], { latencyPriority: 1.3 }),
      step("Decompose retrieval queries", "Generate retrieval subqueries that can run in parallel.", "planning", 1800, 500, [0]),
      step("Retrieve and filter in parallel", "Retrieve candidate passages from knowledge sources and filter them quickly.", "retrieval", 2600, 450, [1], { calls: 6, concurrency: 6, latencyPriority: 1.55, preferredAccelerators: ["cerebras"] }),
      step("Rerank and extract evidence", "Select the most relevant evidence while preserving its source.", "extraction", 4200, 750, [2], { calls: 3, concurrency: 3 }),
      step("Synthesize from evidence", "Generate the answer using only the selected evidence.", "reasoning", 5200, 1600, [3], { minQuality: 89, qualityPriority: 1.3 }),
      step("Validate citations and facts", "Check that the answer is supported by evidence and correct the citations.", "verification", 3200, 650, [4], { minQuality: 88 }),
    ],
  },
  multimodal: {
    label: "Multimodal content production",
    steps: [
      step("Parse the creative brief", "Extract brand, audience, channel and content constraints.", "planning", 1900, 550, [], { minQuality: 84 }),
      step("Understand visual assets", "Analyze images, layouts or key video frames.", "vision", 2500, 700, [0], { capabilities: ["vision"], minQuality: 86 }),
      step("Generate creative directions in parallel", "Quickly explore multiple themes, headlines and narrative angles.", "generation", 2400, 1000, [0], { calls: 4, concurrency: 4, latencyPriority: 1.35, preferredAccelerators: ["cerebras"] }),
      step("Generate core copy", "Create primary copy, CTAs and channel-specific variants.", "generation", 4200, 1900, [1, 2], { minQuality: 88, qualityPriority: 1.2 }),
      step("Plan creative assets", "Define visual assets, dimensions and production requirements.", "reasoning", 3500, 1200, [1, 2], { minQuality: 87 }),
      step("Brand and safety check", "Check facts, brand consistency and safety risks.", "verification", 3600, 700, [3, 4], { minQuality: 89 }),
      step("Package final deliverables", "Generate a channel-ready package that can be used immediately.", "summarization", 3000, 1100, [5]),
    ],
  },
  support: {
    label: "Enterprise customer support",
    steps: [
      step("Identify intent and priority", "Determine issue type, urgency and language.", "classification", 1200, 280, [], { latencyPriority: 1.65, preferredAccelerators: ["cerebras"] }),
      step("Retrieve account and knowledge-base context", "Find policies, prior tickets and relevant knowledge.", "retrieval", 2200, 420, [0], { calls: 3, concurrency: 3, latencyPriority: 1.35 }),
      step("Extract resolution evidence", "Extract applicable terms, procedures and constraints.", "extraction", 2800, 600, [1]),
      step("Generate resolution", "Produce an actionable response in the required tone.", "generation", 3200, 950, [2], { minQuality: 87 }),
      step("Compliance and risk review", "Identify sensitive information, commitments and escalation conditions.", "verification", 2400, 450, [3], { minQuality: 88 }),
      step("Personalize final response", "Use context to produce the final response and next steps.", "generation", 2600, 800, [4], { minQuality: 86 }),
    ],
  },
  general: {
    label: "General complex task",
    steps: [
      step("Understand the task", "Extract goals, context, hard constraints and acceptance criteria.", "planning", 1800, 550, [], { minQuality: 84 }),
      step("Decompose the execution plan", "Split the task into verifiable, parallelizable work units.", "reasoning", 2600, 800, [0], { minQuality: 87 }),
      step("Process standard steps quickly", "Batch standard work such as classification, extraction and format conversion.", "classification", 2800, 500, [1], { calls: 5, concurrency: 5, latencyPriority: 1.6, preferredAccelerators: ["cerebras"] }),
      step("Perform deep reasoning", "Handle core questions that require stronger reasoning.", "reasoning", 5200, 1600, [1], { minQuality: 90, qualityPriority: 1.4 }),
      step("Synthesize parallel results", "Combine outputs from fast processing and deep reasoning.", "generation", 4300, 1500, [2, 3], { minQuality: 87 }),
      step("Validate and deliver", "Validate completeness, consistency and risk before producing the final deliverable.", "verification", 3200, 700, [4], { minQuality: 88 }),
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
      ? "The underlying chip is provider-managed and undisclosed; OpenNEXT selects only a verifiable service-delivery route."
      : "This route allows a verified model and accelerator combination to be selected and displayed.",
  };
}

function selectionReason(stepDefinition, route, strategy) {
  const providerManaged = isProviderManagedRoute(route);
  const accelerator = String(route.hardware || route.acceleratorClass || "");
  if (!providerManaged && /cerebras/i.test(accelerator) && stepDefinition.latencyPriority > 1) {
    return "This subtask is parallelizable and latency-sensitive, so a Cerebras delivery route is selected to reduce execution time.";
  }
  if (providerManaged) {
    return `${route.modelFamily || route.model} uses provider-managed hardware. The ${STRATEGIES[strategy].label.toLowerCase()} strategy evaluates the available service routes by price, quality and SLA.`;
  }
  return `This model and ${route.hardware || route.acceleratorClass} combination meets the quality floor and ranks highest under the ${STRATEGIES[strategy].label.toLowerCase()} strategy.`;
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
    definition: "Each subtask uses the highest-quality compliant frontier route in the catalog, solely for relative comparison in this demo.",
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
  if (!budgetMet) warnings.push("No route combination in the current catalog satisfies both the quality floor and budget.");
  if (!deadlineMet) warnings.push("No route combination in the current catalog satisfies both the quality floor and deadline.");
  if (!qualityFloorsMet) warnings.push("At least one step falls below the quality floor; review the route manually.");

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
