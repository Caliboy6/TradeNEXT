import * as base from "./i18n-base.js";

// Extensions for the legacy GPU, Market Data and Orchestrator renderers that
// are still part of the Phase 1 demo. The extension observer is registered
// before the base observer so source copy is translated before safety checks.
const extraPairs = [
  ["AI 推理容量的流动性与执行层", "The liquidity and execution layer for AI inference capacity"],
  ["用统一市场连接 Model Capacity 的零售清算价格与 GPU Capacity 的上游批发价格，并把可执行深度直接变成智能调度的输入。", "Connect retail Model Capacity clearing prices with upstream wholesale GPU Capacity prices in one market, and turn executable depth directly into orchestration inputs."],
  ["查看市场数据", "View Market Data"],
  ["✦ 运行 AI 调度 Demo", "✦ Run AI orchestration demo"],
  ["不是只挑一个模型。", "Do more than choose one model."],
  ["先拆任务，再为每一步选择最合适的执行路线。", "Decompose the task, then choose the best execution route for each step."],
  ["OpenNEXT 同时考虑预期效果、可执行容量、价格、延迟、区域、SLA 和硬件适配。闭源模型只选择已验证的 Provider Capacity；开放模型则可以进一步选择 H100、H200、B200 或 Cerebras 等已披露执行路线。", "OpenNEXT considers expected quality, executable capacity, price, latency, region, SLA and hardware fit. Closed models use only verified provider capacity; open models can also select disclosed routes such as H100, H200, B200 or Cerebras."],
  ["生成优化执行计划", "Generate an optimized execution plan"],
  ["查看 4 分钟演示路径", "View the 4-minute demo flow"],
  ["示例调度计划", "Sample orchestration plan"],
  ["隐私脱敏 + 分类", "PII redaction + classification"],
  ["高风险快速筛查", "Rapid high-risk screening"],
  ["复杂综合与报告", "Complex synthesis and reporting"],
  ["事实校验", "Fact verification"],
  ["先比较模型市场，打开后再看 Exchange-grade provider depth。", "Compare model markets first, then open one to inspect exchange-grade provider depth."],
  ["查看全部市场 →", "View all markets →"],
  ["从上游算力批发价格到下游模型容量零售清算价格。", "From upstream wholesale compute prices to downstream retail Model Capacity clearing prices."],
  ["公开流动性与私域询价严格分池。", "Public liquidity and private RFQs are strictly segregated."],
  ["打开 Private RFQ", "Open Private RFQ"],
  ["按模型发现可执行容量", "Discover executable capacity by model"],
  ["公开展示的 Available、Provider Depth 与 Index 仅来自 Lane A。大额、长期或非标准需求进入独立 Private RFQ。", "Public availability, provider depth and index data come only from Lane A. Large, long-term or non-standard demand enters a separate Private RFQ."],
  ["没有匹配的模型市场", "No matching model markets"],
  ["调整搜索条件后重试。", "Adjust the search and try again."],
  ["为什么不直接展示 API Key？", "Why not display API keys directly?"],
  ["交易对象是可计量、可撤销、可结算的容量，不是上游账户或凭证。", "The traded asset is measurable, revocable and settleable capacity—not an upstream account or credential."],
  ["把关系型询价变成可审计的私域市场", "Turn relationship-driven inquiries into an auditable private market"],
  ["大额、长期或非标准供给不会伪装成公开库存。平台完成 KYB、容量验证、测试执行、报价比较与受控交付。", "Large, long-term or non-standard supply is never presented as public inventory. The platform handles KYB, capacity verification, test execution, quote comparison and controlled delivery."],
  ["创建 RFQ", "Create an RFQ"],
  ["查看私密报价", "View private quotes"],
  ["独立于公开 Market Depth，仅向获邀供应商开放。", "Separate from public market depth and visible only to invited suppliers."],
  ["合成报价、容量和 SLA；不代表模型厂商库存或背书。", "Synthetic quotes, capacity and SLA; not model-provider inventory or endorsement."],
  ["大额、长期或非标准吞吐进入邀请制报价；响应不会计入公开 Available 或核心指数。", "Large, long-term or non-standard throughput enters invite-only quoting; responses are excluded from public available capacity and the core index."],
  ["购买", "Buy"],
  ["受控容量交付", "Controlled capacity delivery"],
  ["买家通过 OpenNEXT Gateway 使用容量，不接触供应方裸 Key。", "The buyer accesses capacity through OpenNEXT Gateway and never receives the supplier's raw key."],
  ["供应路线", "Supply route"],
  ["容量成本", "Capacity cost"],
  ["平台服务费（1.5%）", "Platform service fee (1.5%)"],
  ["预估合计", "Estimated total"],
  ["创建 Private RFQ", "Create a Private RFQ"],
  ["与公开市场隔离", "Separate from the public market"],
  ["RFQ 不公开展示、不计入可执行库存，也不进入核心指数。", "The RFQ is not public, does not count as executable inventory and is excluded from the core index."],
  ["需求类型", "Requirement type"],
  ["预算 / OEV", "Budget / OEV"],
  ["周期", "Term"],
  ["受控交付", "Controlled delivery"],
  ["报价、测试与成交数据保留用于独立 OTC 指标，但绝不混入 Lane A 深度或核心 TMCI。", "Quote, test and transaction data may feed a separate OTC indicator but never Lane A depth or the core TMCI."],
  ["4 分钟 Demo 路线", "4-minute demo flow"],
  ["双市场", "Two markets"],
  ["Model Capacity 是推理零售，GPU Capacity 是算力批发。", "Model Capacity is inference retail; GPU Capacity is compute wholesale."],
  ["供应深度", "Supply depth"],
  ["打开 Claude，看 Lane A 即时交易与独立 Private RFQ。", "Open Claude to view Lane A instant execution and the separate Private RFQ."],
  ["智能调度", "Smart orchestration"],
  ["任务拆解后逐步选择模型、供应路线和可披露芯片。", "After task decomposition, select the model, supply route and disclosed chip for each step."],
  ["故障回执", "Failover receipt"],
  ["模拟健康下降、自动回退与 Plan vs Actual 审计。", "Simulate degraded health, automatic failover and Plan vs Actual auditing."],
  ["调度决策", "Routing decision"],
  ["满足区域、预算、质量和容量硬约束后，综合得分最高。", "Highest overall score after meeting hard constraints for region, budget, quality and capacity."],
  ["Policy、计量、错误与切换记录已包含", "Policy, metering, errors and failover records are included"],
  ["执行中…", "Running…"],
  ["可放宽时限或手动覆盖路线。", "Relax the deadline or override the route manually."],

  ["深度研究与报告", "Deep research and reporting"],
  ["理解目标与约束", "Understand goals and constraints"],
  ["将目标、受众、范围和交付标准结构化。", "Structure the objective, audience, scope and delivery criteria."],
  ["制定检索计划", "Build a research plan"],
  ["生成查询、证据标准与研究路径。", "Generate queries, evidence standards and a research path."],
  ["并行提取证据", "Extract evidence in parallel"],
  ["从多个来源提取事实、数字和可引用证据。", "Extract facts, figures and citable evidence from multiple sources."],
  ["交叉核验事实", "Cross-check facts"],
  ["识别冲突证据并检查关键事实。", "Identify conflicting evidence and verify critical facts."],
  ["综合推理", "Synthesize findings"],
  ["把证据组合为结论、权衡和建议。", "Combine evidence into conclusions, trade-offs and recommendations."],
  ["生成正式报告", "Generate the final report"],
  ["根据受众和格式生成完整成果。", "Produce the complete deliverable for the intended audience and format."],
  ["最终质量检查", "Final quality check"],
  ["检查完整性、逻辑、引用和风险表述。", "Check completeness, logic, citations and risk language."],
  ["软件开发 / Agent 任务", "Software development / agent task"],
  ["解析需求", "Parse requirements"],
  ["抽取验收标准、约束和非功能目标。", "Extract acceptance criteria, constraints and non-functional goals."],
  ["扫描代码与依赖", "Scan code and dependencies"],
  ["定位相关模块、接口和潜在影响范围。", "Locate relevant modules, interfaces and potential impact areas."],
  ["生成实施方案", "Create an implementation plan"],
  ["拆分改动并选择最小风险的实现路径。", "Break down the changes and choose the lowest-risk implementation path."],
  ["实现代码", "Implement the code"],
  ["完成核心代码与必要的集成改动。", "Complete the core code and required integration changes."],
  ["生成并运行测试", "Generate and run tests"],
  ["覆盖主路径、边界情况与回归风险。", "Cover primary paths, edge cases and regression risks."],
  ["代码审查与修复", "Review and fix the code"],
  ["检查正确性、安全性、性能和可维护性。", "Review correctness, security, performance and maintainability."],
  ["汇总交付", "Prepare the handoff"],
  ["整理变更、验证结果和后续建议。", "Summarize changes, verification results and next steps."],
  ["知识库 / RAG 查询", "Knowledge base / RAG query"],
  ["理解查询意图", "Understand query intent"],
  ["识别实体、时间范围和回答标准。", "Identify entities, time range and answer criteria."],
  ["拆分检索查询", "Decompose retrieval queries"],
  ["生成可并行执行的检索子查询。", "Generate retrieval subqueries that can run in parallel."],
  ["并行召回与初筛", "Retrieve and filter in parallel"],
  ["从知识源召回候选段落并快速过滤。", "Retrieve candidate passages from knowledge sources and filter them quickly."],
  ["重排与证据提取", "Rerank and extract evidence"],
  ["选择最相关证据并保留出处。", "Select the most relevant evidence while preserving its source."],
  ["基于证据合成", "Synthesize from evidence"],
  ["只依据已选证据生成答案。", "Generate the answer using only the selected evidence."],
  ["引用与事实校验", "Validate citations and facts"],
  ["检查回答是否被证据支持并修正引用。", "Check that the answer is supported by evidence and correct the citations."],
  ["多模态内容生产", "Multimodal content production"],
  ["解析创意简报", "Parse the creative brief"],
  ["提取品牌、受众、渠道和内容限制。", "Extract brand, audience, channel and content constraints."],
  ["理解视觉素材", "Understand visual assets"],
  ["分析图片、版式或视频关键帧。", "Analyze images, layouts or key video frames."],
  ["并行生成创意方向", "Generate creative directions in parallel"],
  ["快速探索多个主题、标题与叙事角度。", "Quickly explore multiple themes, headlines and narrative angles."],
  ["生成核心文案", "Generate core copy"],
  ["形成主文案、CTA 与不同渠道变体。", "Create primary copy, CTAs and channel-specific variants."],
  ["制定资产方案", "Plan creative assets"],
  ["描述视觉资产、尺寸与制作要求。", "Define visual assets, dimensions and production requirements."],
  ["品牌与安全检查", "Brand and safety check"],
  ["检查事实、品牌一致性和安全风险。", "Check facts, brand consistency and safety risks."],
  ["打包最终交付", "Package final deliverables"],
  ["生成可直接使用的渠道化成果包。", "Generate a channel-ready package that can be used immediately."],
  ["企业客服处理", "Enterprise customer support"],
  ["效果 / 成本 / 延迟平衡", "Balanced quality / cost / latency"],

  // English-origin interface labels translated in Chinese mode.
  ["语言", "Language"],
  ["切换至英文", "Switch to English"],
  ["切换至中文", "Switch to Chinese"],
  ["原厂 AI Capacity 市场", "Native AI Capacity Market"],
  ["正在加载 Native Capacity Market…", "Loading Native Capacity Market…"],
  ["演示工作区", "Demo Workspace"],
  ["阶段 1", "PHASE 1"],
  ["阶段 2", "Phase 2"],
  ["阶段 3 预览", "Phase 3 Preview"],
  ["可选预览", "Optional Preview"],
  ["实验室", "LABS"],
  ["开始", "START"],
  ["核心", "CORE"],
  ["可选", "OPTIONAL"],
  ["模拟", "Simulation"],
  ["演示", "DEMO"],
  ["模拟数据", "DEMO DATA"],
  ["合成数据", "SYNTHETIC DEMO"],
  ["原厂市场", "NATIVE MARKET"],
  ["核心原则", "CORE PRINCIPLE"],
  ["当前", "Current"],
  ["已完成", "Completed"],
  ["运行中", "Running"],
  ["排队中", "Queued"],
  ["已重路由", "Rerouted"],
  ["失败", "Failed"],
  ["计划", "Plan"],
  ["实际", "Actual"],
  ["基准", "Baseline"],
  ["全局", "Global"],
  ["新加坡", "Singapore"],
  ["欧洲", "Europe"],
  ["香港", "Hong Kong"],
  ["东京", "Tokyo"],
  ["法兰克福", "Frankfurt"],
  ["美国东部（弗吉尼亚）", "US East (Virginia)"],
  ["模型容量", "Model Capacity"],
  ["GPU 容量", "GPU Capacity"],
  ["市场数据", "Market Data"],
  ["智能编排器", "Smart Orchestrator"],
  ["容量优化器 · 实验室", "Capacity Optimizer · Labs"],
  ["原厂容量市场", "Native Capacity Market"],
  ["原厂容量", "Native Capacity"],
  ["原厂 RFQ 市场", "Native RFQ Market"],
  ["仅原厂", "Native only"],
  ["全部来源", "All provenance"],
  ["按来源查看容量", "Capacity by provenance"],
  ["已验证原厂供应", "Verified Native Supply"],
  ["交易所级", "Exchange-grade"],
  ["核心指数合格", "Core index eligible"],
  ["公开深度", "Provider depth"],
  ["官方参考价", "Official Reference"],
  ["供应商", "Provider"],
  ["供应商", "Supplier"],
  ["可用", "Available"],
  ["价格", "Price"],
  ["状态", "Status"],
  ["模型", "Model"],
  ["期限", "Term"],
  ["买方", "Buyer"],
  ["响应方", "Responder"],
  ["指示性报价", "Indicative"],
  ["已验证吞吐", "Verified throughput"],
  ["总计", "Total"],
  ["费率", "Rate"],
  ["日期", "Date"],
  ["方法", "Method"],
  ["样本", "Sample"],
  ["置信度", "Confidence"],
  ["更新于", "Updated"],
  ["阶段", "Stage"],
  ["路径", "Route"],
  ["硬件", "Hardware"],
  ["质量", "Quality"],
  ["成本", "Cost"],
  ["延迟", "Latency"],
  ["说明", "Reason"],
  ["步骤", "Step"],
  ["操作", "Action"],
  ["关闭模型边界：", "Closed-model boundary:"],
  ["供应商管理（不透明）", "Provider-managed (opaque)"],
  ["供应商管理 / 硬件未披露", "Provider-managed / hardware undisclosed"],
  ["开放 / 托管路线", "Open / hosted route"],
  ["闭源前沿 API", "Closed frontier API"],
  ["每卡小时", "per card-hour"],
  ["张卡", "cards"],
  ["已验证日历", "verified calendar"],
  ["已验证日历", "Verified calendar"],
  ["已验证运营方", "Verified operator"],
  ["当前可用", "Immediately"],
  ["任意可用时间", "Any availability"],
  ["未来 24 小时", "Next 24 hours"],
  ["连续 7 天", "7-day continuous"],
  ["全部地区", "All regions"],
  ["按需 / 预留", "On-demand / reserved"],
  ["计划预留", "Scheduled reservation"],
  ["预留 / 专属", "Reserved / dedicated"],
  ["自定义日期", "Custom date"],
  ["自定义期限", "Custom term"],
  ["7 天内", "Within 7 days"],
  ["立即", "Immediately"],
  ["标准留存", "standard retention"],
  ["区域处理", "regional processing"],
  ["结构化需求", "Structured demand"],
  ["KYB 与来源", "KYB & provenance"],
  ["容量测试", "Capacity test"],
  ["报价比较", "Quote comparison"],
  ["配额分配", "Allocation"],
  ["履约记录", "Fulfilment record"],
  ["结算", "Settlement"],
  ["供应来源", "Supply provenance"],
  ["费率 / 总价", "Rate / Total"],
  ["交付 / SLA", "Delivery / SLA"],
  ["可查看来源档案", "Passport available"],
  ["已验证", "Verified"],
  ["待验证", "Pending"],
  ["供应商声明", "Supplier declared"],
  ["OpenNEXT 已验证", "OpenNEXT Verified"],
  ["请求报价", "Request quote"],
  ["买方获得", "Buyer receives"],
  ["已验证容量", "Verified capacity"],
  ["已验证原厂容量", "Verified native capacity"],
  ["吞吐量", "Throughput"],
  ["参考费率", "reference rate"],
  ["来源先于价格", "Source before price"],
  ["验证并结算后可纳入指数", "Eligible after verified settlement"],
  ["不纳入原厂基准", "Excluded from Native benchmark"],
  ["独立风险通道", "SEPARATE RISK LANE"],
  ["仅限邀请", "INVITE ONLY"],
  ["合成响应", "Synthetic responses"],
  ["草稿 · 无需登录", "Draft · no login required"],
  ["供应侧", "Supply side"],
  ["原厂最佳来源", "Best native provenance"],
  ["最快交付", "Fastest delivery"],
  ["最高吞吐", "Highest throughput"],
  ["组织 KYB", "Organization KYB"],
  ["来源证据", "Provenance evidence"],
  ["响应 RFQ", "Respond to RFQ"],
  ["身份 + 能力", "Identity + capability"],
  ["短结算周期", "Short settlement cycle"],
  ["身份与权利", "Identity & rights"],
  ["容量证据", "Capacity evidence"],
  ["测试执行", "Test execution"],
  ["交付与撤销", "Delivery & revocation"],
  ["指数纳入资格", "Index eligibility"],
  ["执行目标", "Execution targets"],
  ["执行 DAG", "Execution DAG"],
  ["可解释路由", "EXPLAINABLE ROUTING"],
  ["预计质量", "Expected quality"],
  ["预计成本", "Estimated cost"],
  ["P95 延迟", "P95 latency"],
  ["为什么选择此目标？", "Why this target?"],
  ["所选路线", "Selected route"],
  ["估算 · 非保证", "estimate · not guarantee"],
  ["合成费率表", "synthetic rate card"],
  ["历史估算", "historical estimate"],
  ["模拟执行回执", "Simulated execution receipt"],
  ["实际关键路径", "Actual critical path"],
  ["实际模拟成本", "Actual simulated cost"],
  ["节省成本", "Cost saving"],
  ["关键路径 P95", "Critical path P95"],
  ["交叉检查", "Cross-check"],
  ["计算 / 交付", "Compute / delivery"],
  ["合成估算", "Synthetic estimates"],
  ["预留演示容量", "Reserve demo capacity"],
  ["运行模拟", "Run simulation"],
  ["自动回退", "Automatic fallback"],
  ["多目标", "Multi-objective"],
  ["硬件感知路由", "Hardware-aware routing"],
  ["每步质量门槛已满足", "Per-step floors met"],
  ["7 日价格趋势", "7 day price trend"],
  ["容量指数历史", "Capacity index history"],
  ["方法论元数据", "Methodology metadata"],
  ["指数发布门槛", "Index publication gate"],
  ["加权中位数", "Weighted median"],
  ["封顶 VWAP", "Capped VWAP"],
  ["复合指数", "Composite index"],
  ["最高权重", "Highest weight"],
  ["仅 Lane A", "Lane A only"],
  ["独立 OTC 指标", "Separate OTC indicator"],
  ["永不混合", "Never mixed"],
  ["永不进入核心指数", "Never in core index"],
  ["严格分桶的演示序列", "Strictly bucketed demo series"],
  ["确定可执行报价", "Firm executable quote"],
  ["已结算 Lane A 交易", "Settled Lane A trade"],
  ["本地测量", "Live measured"],
  ["供应商声明", "Provider stated"],
  ["过去估算", "Historical estimate"],
  ["模拟值", "Simulated"],
  ["原厂项目、账户或直接访问", "Original-provider project, account or direct access"],
  ["企业协议下的专属配额", "Dedicated allocation under an enterprise agreement"],
  ["合作方交付的企业配额", "Partner-delivered enterprise allocation"],
  ["OpenNEXT 托管 key 或 endpoint", "OpenNEXT-managed key or endpoint"],
  ["供应商托管 endpoint", "Provider-hosted endpoint"],
  ["原厂项目访问", "Original-provider project access"],
  ["专属企业配额", "Dedicated enterprise allocation"],
  ["合作方交付配额", "Partner-delivered allocation"],
  ["OpenNEXT 托管 endpoint", "OpenNEXT managed endpoint"],
  ["合同证据 + 实时容量测试", "Contract evidence + live capacity test"],
  ["企业配额函 + 配额遥测", "Enterprise allocation letter + quota telemetry"],
  ["Endpoint 健康 + 计量审计", "Endpoint health + metering audit"],
  ["渠道授权 + 项目测试", "Channel authorization + project test"],
  ["企业协议 + 配额遥测", "Enterprise agreement + quota telemetry"],
  ["网关审计 + 用量核对", "Gateway audit + usage reconciliation"],
  ["合作方授权 + 项目测试", "Partner authorization + project test"],
  ["合作方合同 + 容量测试", "Partner contract + capacity test"],
  ["模型哈希 + H200 性能测试", "Model hash + H200 performance test"],
  ["模型哈希 + H100 性能测试", "Model hash + H100 performance test"],
  ["模型哈希 + 路线性能测试", "Model hash + route performance test"],
  ["渠道证据 + 项目测试", "Channel evidence + project test"],
  ["企业配额 + 配额遥测", "Enterprise allocation + quota telemetry"],
  ["网关审计 + 容量测试", "Gateway audit + capacity test"],
];

const maps = { en: new Map(), "zh-CN": new Map() };
for (const [zh, en] of extraPairs) {
  if (!maps.en.has(zh)) maps.en.set(zh, en);
  if (!maps["zh-CN"].has(en)) maps["zh-CN"].set(en, zh);
}

let locale = base.getLocale();
let extensionObserver;
let extensionScheduled = false;

function dynamicTranslate(value, targetLocale) {
  if (targetLocale === "en") {
    let match = value.match(/^(\d+)\s*个模型市场符合当前来源筛选\s*·\s*所有报价与库存均为\s*Demo\s*数据$/u);
    if (match) return `${match[1]} model markets match the current provenance filter · all quotes and inventory are demo data`;
    match = value.match(/^选择\s+(.+)$/u);
    if (match) return `Select ${match[1]}`;
    match = value.match(/^(.+)\s*·\s*调度决策$/u);
    if (match) return `${translateExtra(match[1], "en")} · Routing decision`;
    match = value.match(/^(\d+)\s*个步骤\s*·\s*可编辑$/u);
    if (match) return `${match[1]} steps · editable`;
    match = value.match(/^(\d+)\s*个子任务\s*·\s*(.+)$/u);
    if (match) return `${match[1]} subtasks · ${match[2]}`;
  } else {
    let match = value.match(/^(\d+)\s+responses?$/i);
    if (match) return `${match[1]} 份响应`;
    match = value.match(/^(\d+)\s+min\s+ago$/i);
    if (match) return `${match[1]} 分钟前`;
    match = value.match(/^(\d+)\s+verified routes?$/i);
    if (match) return `${match[1]} 条已验证路线`;
    match = value.match(/^(\d+)\s+model markets match the current provenance filter\s*·\s*all quotes and inventory are demo data$/i);
    if (match) return `${match[1]} 个模型市场符合当前来源筛选 · 所有报价与库存均为 Demo 数据`;
    match = value.match(/^(.+) capacity market$/i);
    if (match) return `${match[1]} 容量市场`;
    match = value.match(/^(.+) capacity$/i);
    if (match && /^(Claude|GPT|Gemini|DeepSeek|Kimi|GLM)$/i.test(match[1])) return `${match[1]} 容量`;
    match = value.match(/^(.+) ago$/i);
    if (match && /^\d+\s*(min|h|day|days)$/i.test(match[1])) return `${match[1].replace(/min/i, "分钟").replace(/days?/i, "天").replace(/h/i, "小时")}前`;
  }
  return value;
}

function preserveWhitespace(original, translated) {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function translateExtra(original, targetLocale = locale) {
  if (typeof original !== "string" || !original.trim()) return original;
  const core = original.trim();
  const exact = maps[targetLocale].get(core);
  if (exact != null) return preserveWhitespace(original, exact);
  const dynamic = dynamicTranslate(core, targetLocale);
  return preserveWhitespace(original, dynamic);
}

function translateNode(node) {
  const parent = node.parentElement;
  if (!parent || parent.closest("script,style,noscript,template")) return;
  const translated = translateExtra(node.nodeValue);
  if (translated !== node.nodeValue) node.nodeValue = translated;
}

function translateAttributes(element) {
  if (!(element instanceof Element)) return;
  for (const attribute of ["placeholder", "aria-label", "title", "data-tooltip"]) {
    if (!element.hasAttribute(attribute)) continue;
    const current = element.getAttribute(attribute);
    const translated = translateExtra(current);
    if (translated !== current) element.setAttribute(attribute, translated);
  }
  if (element.matches("input,textarea")) {
    const current = element.value;
    const translated = translateExtra(current);
    if (translated !== current) element.value = translated;
  }
}

function localizeExtra(root = document) {
  if (root.nodeType === Node.TEXT_NODE) return translateNode(root);
  if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
  if (root instanceof Element) translateAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) translateNode(node);
    else translateAttributes(node);
  }
}

function scheduleExtension() {
  if (extensionScheduled) return;
  extensionScheduled = true;
  queueMicrotask(() => {
    extensionScheduled = false;
    localizeExtra(document);
  });
}

export function getLocale() {
  return locale;
}

export function translateText(original, targetLocale = locale, options = {}) {
  return base.translateText(translateExtra(original, targetLocale), targetLocale, options);
}

export function localizeDocument(root = document) {
  localizeExtra(root);
  base.localizeDocument(root);
  localizeExtra(root);
}

export function setLocale(nextLocale, options = {}) {
  if (!new Set(["en", "zh-CN"]).has(nextLocale)) return locale;
  locale = nextLocale;
  localizeExtra(document);
  base.setLocale(nextLocale, options);
  localizeExtra(document);
  window.OpenNEXTI18n = publicApi;
  return locale;
}

export function getI18nDiagnostics() {
  return base.getI18nDiagnostics();
}

const publicApi = { getLocale, setLocale, translateText, localizeDocument, getI18nDiagnostics };

export function initI18n() {
  locale = base.getLocale();
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-locale]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setLocale(button.dataset.locale);
  }, true);
  extensionObserver = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList" || record.type === "characterData" || record.type === "attributes")) scheduleExtension();
  });
  extensionObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "aria-label", "title", "data-tooltip"],
  });
  localizeExtra(document);
  base.initI18n();
  localizeDocument(document);
  window.OpenNEXTI18n = publicApi;
  return locale;
}
