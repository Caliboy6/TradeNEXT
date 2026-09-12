const STORAGE_KEY = "opennext.locale";
const SUPPORTED_LOCALES = new Set(["en", "zh-CN"]);

// One bilingual source of truth. Brand names, model names, acronyms and
// market-structure terms intentionally remain in their native form.
const pairs = [
  ["主导航", "Main navigation"],
  ["找容量", "Find capacity"],
  ["发布 RFQ", "Post an RFQ"],
  ["账户菜单", "Account menu"],
  ["打开导航", "Open navigation"],
  ["关闭", "Close"],
  ["出售容量", "List capacity"],
  ["发布 Native RFQ", "Post a Native RFQ"],
  ["找到真正可验证的", "Find genuinely verified"],
  ["原厂 AI Capacity", "native AI capacity"],
  ["一次发布需求，比较 Native Direct、Native Allocated 与 Enterprise Partner 报价。价格、容量、来源和买方实际获得的访问方式全部清晰可见。", "Post one request and compare Native Direct, Native Allocated and Enterprise Partner quotes. Price, capacity, provenance and the access you actually receive are visible up front."],
  ["我要买容量", "Buy capacity"],
  ["我要卖容量", "Sell capacity"],
  ["描述你需要的容量", "Describe the capacity you need"],
  ["需要 $100k Claude Sonnet 原厂容量，使用 30 天，至少 2M TPM，美国地区，希望本周交付。", "Need $100k of native Claude Sonnet capacity for 30 days, at least 2M TPM, US region, delivered this week."],
  ["获取已验证报价", "Get verified quotes"],
  ["浏览已验证供应", "Browse verified supply"],
  ["✓ 不公开裸凭证", "✓ No public raw credentials"],
  ["✓ 来源证据验证", "✓ Provenance evidence verified"],
  ["✓ 标准化报价", "✓ Standardized quotes"],
  ["✓ 安全交割与结算", "✓ Secure delivery and settlement"],
  ["买方需求正在进入市场", "Buyer demand is entering the market"],
  ["有可交付的原厂容量？", "Have deliverable native capacity?"],
  ["验证并响应买方需求 →", "Verify supply and respond →"],
  ["先看来源，再比较价格", "See provenance before comparing price"],
  ["OpenNEXT 不把所有供应抽象成同一种 API。买方在报价之前就知道容量从哪里来、最终拿到什么。", "OpenNEXT does not hide every supply source behind one API. Buyers know where capacity comes from and what they will receive before quoting."],
  ["查看全部 Model Capacity →", "View all Model Capacity →"],
  ["四种产品，四种清晰的交付边界", "Four products with four clear delivery boundaries"],
  ["Native 是核心市场；Managed Gateway 是成交后的可选交付能力；Hosted Inference 是补充供应。", "Native is the core market. Managed Gateway is an optional post-trade delivery capability, while Hosted Inference is supplemental supply."],
  ["把微信里的询价，变成可验证、可比较、可结算的市场", "Turn fragmented private inquiries into a verifiable, comparable and settleable market"],
  ["买方发布一次结构化需求，平台只向满足来源与容量门槛的供应方开放。报价不再散落在群聊里。", "A buyer posts one structured request. OpenNEXT opens it only to suppliers that meet provenance and capacity thresholds, keeping quotes out of scattered group chats."],
  ["进入 Native RFQ Market", "Enter the Native RFQ Market"],
  ["描述需求", "Describe demand"],
  ["来源验证", "Verify provenance"],
  ["标准化报价", "Standardize quotes"],
  ["比较与分配", "Compare and allocate"],
  ["交割与结算", "Deliver and settle"],
  ["模型、期限、速率、区域", "Model, term, throughput and region"],
  ["合同、授权、容量测试", "Contract, authorization and capacity test"],
  ["总价、来源、SLA、交付", "Total price, provenance, SLA and delivery"],
  ["选择原厂来源或成本", "Choose native provenance or cost"],
  ["履约记录与资金结算", "Fulfilment record and funds settlement"],
  ["核心是市场，执行能力按需启用", "The market is core; execution capabilities are optional"],
  ["这些能力保留在 Demo 中，但不会抢占 Phase 1 的产品主线。", "These capabilities remain in the demo without displacing the Phase 1 product focus."],
  ["用于可选托管交付、计量与统一结算；不代表 Native Direct，默认不会启用。", "Optional managed delivery, metering and consolidated settlement. It is not Native Direct and is disabled by default."],
  ["了解可选交付 →", "Explore optional delivery →"],
  ["在已经采购或接入的容量上模拟任务拆解和「模型 + 芯片」执行路线，不接管生产流量。", "Simulates task decomposition and model + chip execution routes on capacity already purchased or connected; it does not take over production traffic."],
  ["打开实验室 →", "Open Labs →"],
  ["标准卡时与长期集群 RFQ，连接上游算力批发价格与模型容量市场。", "Standard accelerator-hours and long-term cluster RFQs connect wholesale compute prices with the Model Capacity market."],
  ["查看 GPU 市场 →", "View the GPU market →"],
  ["原厂直连、原厂分配、企业合作方、托管网关与 Hosted Inference 不再混成一个最低价。默认仅显示可验证的 Native 供应。", "Native Direct, Native Allocated, Enterprise Partner, Managed Gateway and Hosted Inference are no longer collapsed into one lowest price. Verified Native supply is shown by default."],
  ["搜索 Claude、GPT、Gemini…", "Search Claude, GPT, Gemini…"],
  ["Native 不是裸 Key", "Native does not mean a raw key"],
  ["OpenNEXT 验证来源证据与容量测试；买方获得清晰约定的项目访问、专属配额或合作方交付，不公开秘密凭证。", "OpenNEXT verifies provenance evidence and capacity tests. Buyers receive clearly defined project access, dedicated allocation or partner delivery; secret credentials are never published."],
  ["查看验证标准 →", "View verification standards →"],
  ["当前筛选暂无可展示供应", "No displayable supply matches this filter"],
  ["切换到 All provenance 查看托管与 Hosted 供应。", "Switch to All provenance to view managed and Hosted supply."],
  ["查看全部来源", "View all provenance"],
  ["价格发现、容量发现、RFQ、验证、分配和结算，是 OpenNEXT 的 Phase 1 主市场。", "Price discovery, capacity discovery, RFQ, verification, allocation and settlement form OpenNEXT's Phase 1 core market."],
  ["大额或复杂供应进入私密撮合，不公开库存，不进入 Native 基准指数。", "Large or complex supply enters private matching, with no public inventory and no inclusion in the Native benchmark."],
  ["进入 OTC Desk →", "Enter the OTC Desk →"],
  ["只有买方主动选择时才启用；不与 Native 供应混标，也不是平台核心 wedge。", "Enabled only when the buyer opts in. It is labelled separately from Native supply and is not the platform's core wedge."],
  ["核心", "Core"],
  ["全部", "All"],
  ["可选", "Optional"],
  ["补充", "Supplemental"],
  ["一次发布需求，向通过 KYB、来源验证和容量测试的供应方获取标准化报价。比较的不只是价格，还有来源、分配方式、吞吐与 SLA。", "Post one request to receive standardized quotes from suppliers that have passed KYB, provenance verification and capacity testing. Compare provenance, allocation method, throughput and SLA—not price alone."],
  ["供应方入驻", "Onboard as a supplier"],
  ["你要购买什么容量？", "What capacity do you want to buy?"],
  ["模型与版本", "Model and version"],
  ["所需分配额度", "Required allocation"],
  ["最低吞吐", "Minimum throughput"],
  ["使用期限", "Term"],
  ["开始时间", "Start time"],
  ["地区与数据要求", "Region and data requirements"],
  ["接受的供应来源", "Accepted supply provenance"],
  ["推荐 · 原厂项目或专属企业配额", "Recommended · original-provider project or dedicated enterprise allocation"],
  ["经验证的合作方交付", "Verified partner delivery"],
  ["可选 · 默认不启用", "Optional · disabled by default"],
  ["补充供应", "Supplemental supply"],
  ["最终交付由所选报价的 Provenance Passport 明确约定。", "Final delivery is defined in the selected quote's Provenance Passport."],
  ["提交时再完成企业联系方式与 KYB。此 Demo 不发送真实请求。", "Business contact details and KYB are completed on submission. This demo sends no real request."],
  ["提交并开始匹配 →", "Submit and start matching →"],
  ["当前买方需求", "Current buyer demand"],
  ["匿名展示的结构化需求，帮助合格供应方发现真实流量。", "Anonymized structured demand helps qualified suppliers discover real buying intent."],
  ["验证容量并响应 RFQ →", "Verify capacity and respond to RFQs →"],
  ["同一需求，按来源与交付条件横向比较", "Compare provenance and delivery terms for one request"],
  ["示例：Claude Sonnet · $100k allocation · 30 days · 2M TPM · US", "Example: Claude Sonnet · $100k allocation · 30 days · 2M TPM · US"],
  ["选择报价", "Select quote"],
  ["从需求到结算的可审计链路", "An auditable path from demand to settlement"],
  ["OpenNEXT 负责市场基础设施，不要求买方先接受统一 API。", "OpenNEXT provides market infrastructure without requiring buyers to adopt a unified API first."],
  ["大额、匿名或非标准需求进入独立私密通道。非 Native / 第三方来源必须清晰标注，不公开库存，不进入 Native benchmark。", "Large, anonymous or non-standard requests enter a separate private lane. Non-native and third-party provenance must be explicit, with no public inventory and no Native benchmark inclusion."],
  ["进入 Private OTC Desk", "Enter the Private OTC Desk"],
  ["查看来源档案", "View provenance passport"],
  ["发起 RFQ", "Start an RFQ"],
  ["原厂直连", "Native Direct"],
  ["原厂分配", "Native Allocated"],
  ["企业合作方", "Enterprise Partner"],
  ["托管网关", "Managed Gateway"],
  ["托管推理", "Hosted Inference"],
  ["来源待验证", "Provenance pending"],
  ["原厂合同或项目下的直接访问，由 OpenNEXT 验证来源、容量与交付条件。", "Direct access under an original-provider contract or project, with provenance, capacity and delivery terms verified by OpenNEXT."],
  ["企业协议下隔离的原厂配额，明确期限、速率、区域与撤销条件。", "Isolated native allocation under an enterprise agreement, with explicit term, throughput, region and revocation terms."],
  ["由经验证的企业合作方交付，买方清楚看到合同与服务责任边界。", "Delivered by a verified enterprise partner, with clear contractual and service-responsibility boundaries."],
  ["可选的托管交付、计量与结算能力，不代表 Native Direct，默认不启用。", "Optional managed delivery, metering and settlement. It is not Native Direct and is disabled by default."],
  ["第三方托管的开放或兼容模型端点，作为市场补充供应。", "A third-party hosted endpoint for open or compatible models, offered as supplemental market supply."],
  ["未完成来源证据与容量测试，不进入公开 Native 市场或基准指数。", "Provenance evidence and capacity testing are incomplete; excluded from the public Native market and benchmark."],
  ["按配置、时间与任务购买算力", "Buy compute by configuration, schedule and workload"],
  ["先验证连续可用时段、卡数和拓扑，再比较真实总价。长租、大集群与定制网络进入 Private RFQ。", "Verify continuous availability, accelerator count and topology before comparing true total cost. Long-term, large-cluster and custom-network needs enter Private RFQ."],
  ["按任务智能推荐", "Recommend by workload"],
  ["发布 GPU RFQ", "Post a GPU RFQ"],
  ["未来 14 天可用性", "Next 14 days availability"],
  ["详情", "Details"],
  ["预留", "Reserve"],
  ["标准卡时保留现有发现与预约演示；大集群、长期和专网需求统一进入 RFQ。", "Standard accelerator-hours retain discovery and reservation flows; large clusters, long terms and private networks go through RFQ."],
  ["标准卡时可直接预留；大集群、长期、专网或定制镜像进入 Private RFQ。", "Standard accelerator-hours can be reserved directly; large clusters, long terms, private networks and custom images enter Private RFQ."],
  ["智能调度是 Phase 1 的锦上添花", "AI orchestration is an optional Phase 1 enhancement"],
  ["它在已经采购或接入的容量上模拟任务拆解与模型 + 芯片路线，不是首页流量入口，也不会默认接管生产流量。", "It simulates task decomposition and model + chip routes on capacity already purchased or connected. It is neither the homepage acquisition path nor a default production traffic controller."],
  ["在已采购容量上模拟任务拆解与模型 + 芯片路线，不是首页流量入口，也不会默认接管生产流量。", "Simulates task decomposition and model + chip routes on purchased capacity. It is not the homepage acquisition path and does not control production traffic by default."],
  ["任务级「模型 + 执行芯片」智能调度", "Task-level model + execution-chip orchestration"],
  ["先拆复杂任务，再逐步匹配已验证容量。硬约束先过滤，随后在预期效果、成本、延迟与可靠性之间优化。", "Decompose complex work first, then match verified capacity step by step. Hard constraints are filtered before optimizing expected quality, cost, latency and reliability."],
  ["任务描述", "Task description"],
  ["客服分析", "Customer support analysis"],
  ["行业研究", "Industry research"],
  ["代码迁移", "Code migration"],
  ["多模态审核", "Multimodal review"],
  ["企业客服处理 · 效果 / 成本 / 延迟平衡", "Enterprise support workflow · quality / cost / latency balance"],
  ["处理 2 万条客服记录：先进行隐私脱敏与语言识别，再完成主题分类、情绪识别和高风险投诉检测，最后生成中英双语管理层报告，并对关键结论做事实校验。", "Process 20,000 support records: redact sensitive data and identify language, then classify topics, detect sentiment and high-risk complaints, generate an executive report in English and Chinese, and fact-check key conclusions."],
  ["处理 2 万条客服记录：先进行隐私脱敏与语言识别，再完成主题分类、情绪识别和高风险投诉检测，最后生成中英双语的管理层报告，并对关键结论做事实校验。", "Process 20,000 support records: redact sensitive data and identify language, then classify topics, detect sentiment and high-risk complaints, generate an executive report in English and Chinese, and fact-check key conclusions."],
  ["平衡", "Balanced"],
  ["最低成本", "Lowest cost"],
  ["最低延迟", "Lowest latency"],
  ["守住质量门槛", "Protect quality floors"],
  ["优先快速完成", "Prioritize fast completion"],
  ["预算上限", "Budget cap"],
  ["关键路径时限", "Critical-path deadline"],
  ["数据区域", "Data region"],
  ["优化目标", "Optimization objective"],
  ["效果 / 成本 / 延迟", "Quality / cost / latency"],
  ["✦ 拆解任务并生成计划", "✦ Decompose task and generate plan"],
  ["拆解任务并生成计划", "Generate execution plan"],
  ["三种策略即时对比", "Compare three strategies instantly"],
  ["同一任务、同一硬约束；长度表示相对预计成本。", "Same task and hard constraints; bar length represents relative estimated cost."],
  ["硬件选择边界", "Hardware selection boundary"],
  ["Claude / GPT / Gemini 的芯片由服务商管理；这里不会虚构 H100 或 Cerebras 映射。", "Claude, GPT and Gemini hardware is provider-managed; this demo never invents an H100 or Cerebras mapping."],
  ["只有可部署开放模型或供应商明确披露的路线，调度器才会选择具体芯片。", "The orchestrator selects a specific chip only for deployable open models or supplier-disclosed routes."],
  ["闭源模型如果没有可验证硬件披露，会显示 Provider-managed / hardware undisclosed，不推测底层 GPU。", "Closed models without verifiable hardware disclosure show Provider-managed / hardware undisclosed; the underlying GPU is never inferred."],
  ["可人工覆盖某一步；修改后自动重新计算关键路径、成本与质量。", "Any step can be overridden manually; the critical path, cost and quality are recalculated automatically."],
  ["依赖关系用于计算关键路径；并行步骤不会被简单相加。", "Dependencies determine the critical path; parallel steps are not simply added together."],
  ["重新规划", "Replan"],
  ["预留这组容量", "Reserve this capacity"],
  ["导出脱敏 Trace", "Export redacted Trace"],
  ["执行轨迹、故障回退与计量可审计；非真实调用。", "Execution traces, failover and metering are auditable; no real model call is made."],
  ["执行完成", "Execution complete"],
  ["结果、逐步用量、故障切换和结算回执已生成", "Results, per-step usage, failover and settlement receipt are ready"],
  ["合规与风险检查 recovered automatically.", "Compliance and risk review recovered automatically."],
  ["Capacity availability dropped below SLA；220 ms 检测，579 ms 完成重路由，事件已写入审计记录。", "Capacity availability dropped below SLA; detected in 220 ms, rerouted in 579 ms, and recorded in the audit log."],
  ["识别意图与优先级", "Identify intent and priority"],
  ["判断问题类型、紧急程度与语言。", "Determine issue type, urgency and language."],
  ["检索账户与知识库", "Retrieve account and knowledge-base context"],
  ["查找政策、历史工单与相关知识。", "Find policies, prior tickets and relevant knowledge."],
  ["提取解决依据", "Extract resolution evidence"],
  ["提取适用条款、操作步骤和限制。", "Extract applicable terms, procedures and constraints."],
  ["生成解决方案", "Generate resolution"],
  ["形成可执行且符合语气要求的回复。", "Produce an actionable response in the required tone."],
  ["合规与风险检查", "Compliance and risk review"],
  ["识别敏感信息、承诺和升级条件。", "Identify sensitive information, commitments and escalation conditions."],
  ["个性化最终回复", "Personalize final response"],
  ["结合上下文输出最终回复和下一步。", "Use context to produce the final response and next steps."],
  ["该子任务可并行且对延迟敏感，选择 Cerebras 交付路线以缩短执行时间。", "This subtask is parallelizable and latency-sensitive, so a Cerebras delivery route is selected to reduce execution time."],
  ["OpenNEXT 验证什么", "What OpenNEXT verifies"],
  ["提交的合同与授权证据、容量测试、吞吐、地区、期限和交付条件。验证不代表原模型厂商背书。", "Submitted contract and authorization evidence, capacity tests, throughput, region, term and delivery conditions. Verification is not an endorsement by the original model provider."],
  ["Native、Gateway 与 Hosted 供应不混标、不混算。", "Native, Gateway and Hosted supply are labelled and calculated separately."],
  ["不进入公开库存或 Native benchmark", "Excluded from public inventory and the Native benchmark"],
  ["OpenNEXT 提供 KYB、能力验证、测试执行、经纪撮合与安全交割。Non-native / third-party 来源必须显式标注。", "OpenNEXT provides KYB, capability verification, test execution, brokered matching and secure delivery. Non-native and third-party provenance must be explicit."],
  ["大额或匿名需求", "Large or anonymous demand"],
  ["复杂合同、非标准期限、不希望公开身份与库存。", "Complex contracts, non-standard terms, or identities and inventory that must remain private."],
  ["验证", "Verification"],
  ["不把能力验证包装成原厂授权，也不允许公开裸 Key。", "Capability verification is never presented as original-provider authorization, and raw keys are never made public."],
  ["交割", "Delivery"],
  ["试跑、风险标签、备用交付与退款边界。", "Test runs, risk labels, fallback delivery and refund boundaries."],
  ["不要上传或公开裸凭证", "Do not upload or publish raw credentials"],
  ["合同、授权、容量证明与测试资料只通过安全资料室提交。", "Contracts, authorizations, capacity evidence and test materials are submitted only through a secure data room."],
  ["企业主体与最终受益人", "Business entity and ultimate beneficial owner"],
  ["合同、授权与可分配权利", "Contracts, authorization and allocation rights"],
  ["额度、RPM / TPM、区域与期限", "Allocation, RPM / TPM, region and term"],
  ["私密标准化报价与履约", "Private standardized quotes and fulfilment"],
  ["供应类型", "Supply type"],
  ["可交付市场", "Available market"],
  ["取消", "Cancel"],
  ["开始供应方验证", "Start supplier verification"],
  ["发布 Native Capacity RFQ", "Post a Native Capacity RFQ"],
  ["默认只匹配 Native / Enterprise 供应", "Match Native / Enterprise supply by default"],
  ["Managed Gateway 与 Hosted Inference 只有在买方主动选择时才会加入。不会上传、展示或转交裸 Key。", "Managed Gateway and Hosted Inference are included only when the buyer opts in. Raw keys are never uploaded, displayed or transferred."],
  ["地区", "Region"],
  ["期望交付", "Preferred delivery"],
  ["保存草稿", "Save draft"],
  ["提交并匹配供应方", "Submit and match suppliers"],
  ["这不是 Native Direct", "This is not Native Direct"],
  ["使用 OpenNEXT endpoint / key 的报价会明确显示 Managed Gateway，不会和原厂项目访问混标。", "Quotes delivered through a OpenNEXT endpoint or key are explicitly labelled Managed Gateway and never blended with original-provider project access."],
  ["理解边界", "Acknowledge boundary"],
  ["适合", "Best for"],
  ["接受", "Accept"],
  ["返回", "Back"],
  ["联系 Capacity Desk", "Contact the Capacity Desk"],
  ["选择原厂来源或成本", "Choose native provenance or cost"],
  ["主路线健康下降，已自动切换备用路线", "Primary route health declined; switched automatically to fallback"],
  ["演示订单已创建", "Demo order created"],
  ["容量已预留并从可执行库存实时扣减", "Capacity reserved and deducted from executable inventory in real time"],
  ["GPU 容量已预留", "GPU capacity reserved"],
  ["RFQ 已发送给 6 家合格供应方", "RFQ sent to 6 qualified suppliers"],
  ["Broker 将协调容量测试与私密报价", "The broker will coordinate capacity tests and private quotes"],
  ["全部执行目标已预留", "All execution targets reserved"],
  ["脱敏 Trace 已准备导出", "Redacted Trace ready to export"],
  ["已应用人工路线", "Manual route applied"],
  ["关键路径、成本与质量已重新计算", "Critical path, cost and quality recalculated"],
  ["路线不满足当前硬约束", "Route does not satisfy current hard constraints"],
  ["RFQ 草稿已结构化并进入匹配队列", "RFQ draft structured and queued for matching"],
  ["6 家通过 KYB 与来源验证的供应方将收到邀请 · Demo Simulation", "6 suppliers that passed KYB and provenance verification will be invited · Demo Simulation"],
  ["供应方验证清单已创建", "Supplier verification checklist created"],
  ["下一步：KYB、来源证据与容量测试 · Demo Simulation", "Next: KYB, provenance evidence and capacity testing · Demo Simulation"],
  ["Capacity Desk 已接收私密需求", "Capacity Desk received the private request"],
  ["该需求不会进入公开库存或 Native benchmark · Demo Simulation", "This request will not enter public inventory or the Native benchmark · Demo Simulation"],
  ["安全交割清单已创建", "Secure delivery checklist created"],
  ["合同、分配、托管支付与结算仍为 Demo Simulation", "Contracting, allocation, escrow and settlement remain a Demo Simulation"],
  ["买方需求模式已启用", "Buyer demand mode enabled"],
  ["描述需求后可生成结构化 Native RFQ 草稿", "Describe demand to generate a structured Native RFQ draft"],
  ["闭源模型只展示 GPU 与 Model Capacity 的价格相关性，不声称可反推其真实成本或利润率。", "Closed models show only price correlation between GPU and Model Capacity; no claim is made that true cost or margin can be inferred."],
  ["核心指数只使用合格 Lane A 数据；Private RFQ 只形成独立 OTC 指标。所有图表均为 illustrative demo data。", "The core index uses qualified Lane A data only. Private RFQ creates a separate OTC indicator. All charts use illustrative demo data."],
  ["每个数字都带样本、时效与置信度。", "Every number includes sample, recency and confidence context."],
  ["不足阈值时显示 Indicative 或 No Print。", "Show Indicative or No Print when thresholds are not met."],
  ["TMCI、TGPI 与 AI Capacity Curve", "TMCI, TGPI and the AI Capacity Curve"],
  ["Native benchmark 只纳入合格、已结算的可验证交易；Private OTC、Managed Gateway 与 Hosted 供应保持独立口径。", "The Native benchmark includes only qualified, settled and verifiable transactions. Private OTC, Managed Gateway and Hosted supply remain separate."],
  ["GPU Capacity is the second market", "GPU Capacity is the second market"],
  ["按配置、时间与任务购买算力", "Buy compute by configuration, schedule and workload"],
  ["原厂项目或专属企业配额", "Original-provider project or dedicated enterprise allocation"],
  ["可部署开放模型", "Deployable open model"],
  ["底层芯片由模型服务商管理且不披露；OpenNEXT 仅选择可验证的服务交付路线。", "The underlying chip is provider-managed and undisclosed; OpenNEXT selects only a verifiable service-delivery route."],
  ["该路线允许选择并展示已验证的模型与加速硬件组合。", "This route allows a verified model and accelerator combination to be selected and displayed."],
  ["当前目录中没有同时满足质量门槛与预算的路线组合。", "No route combination in the current catalog satisfies both the quality floor and budget."],
  ["当前目录中没有同时满足质量门槛与时限的路线组合。", "No route combination in the current catalog satisfies both the quality floor and deadline."],
  ["至少一个步骤未达到预设质量门槛，请人工确认路线。", "At least one step falls below the quality floor; review the route manually."],
  ["每个子任务均使用目录中质量最高的合规 frontier 路线；仅用于本次 Demo 的相对比较。", "Each subtask uses the highest-quality compliant frontier route in the catalog, solely for relative comparison in this demo."],

  // English-origin interface copy that should become Chinese in zh-CN mode.
  ["企业买方 · 模拟数据", "Enterprise buyer · Synthetic"],
  ["市场结构", "Market structure"],
  ["核心市场", "Core market"],
  ["独立通道", "Separate lane"],
  ["模拟数据 · 无真实交易", "Synthetic data · No real transaction"],
  ["可选能力", "Optional capabilities"],
  ["买方实际获得", "Buyer receives"],
  ["参考价格倍数", "reference rate"],
  ["已验证容量", "Verified capacity"],
  ["吞吐", "Throughput"],
  ["活跃买方 RFQ", "Active buyer RFQs"],
  ["活跃 RFQ 名义金额", "Active RFQ notional"],
  ["首次响应中位时间", "Median first response"],
  ["容量测试通过率", "Capacity test pass"],
  ["原厂 / 合作方供应商", "Native / partner suppliers"],
  ["RFQ 响应中位时间", "Median quote response"],
  ["持续测试的模拟数据", "Synthetic · continuously tested"],
  ["模型 + GPU 容量", "Model + GPU capacity"],
  ["过去 24 小时 · 示例", "Last 24h · illustrative"],
  ["验证后结算可纳入", "Eligible after verified settlement"],
  ["不纳入 Native 基准", "Excluded from Native benchmark"],
  ["所有来源", "All provenance"],
  ["仅 Native", "Native only"],
  ["来源优先市场", "Provenance-first market"],
  ["来源维度的容量", "Capacity by provenance"],
  ["已验证 Native 供应", "Verified Native Supply"],
  ["草稿 · 无需登录", "Draft · no login required"],
  ["结构化需求", "Structured demand"],
  ["KYB 与来源验证", "KYB & provenance"],
  ["容量测试", "Capacity test"],
  ["报价比较", "Quote comparison"],
  ["分配", "Allocation"],
  ["履约记录", "Fulfilment record"],
  ["结算", "Settlement"],
  ["供应方", "Supplier"],
  ["供应来源", "Supply provenance"],
  ["容量", "Capacity"],
  ["交付 / SLA", "Delivery / SLA"],
  ["价格倍数 / 总价", "Rate / Total"],
  ["来源档案可用", "Passport available"],
  ["OpenNEXT 已验证", "OpenNEXT Verified"],
  ["合成响应", "Synthetic responses"],
  ["供应侧", "Supply side"],
  ["原厂项目、账户或直接访问", "Original-provider project, account or direct access"],
  ["企业协议下的专属配额", "Dedicated allocation under an enterprise agreement"],
  ["合作方交付的企业配额", "Partner-delivered enterprise allocation"],
  ["OpenNEXT 托管的 key 或 endpoint", "OpenNEXT-managed key or endpoint"],
  ["供应商托管 endpoint", "Provider-hosted endpoint"],
  ["原厂项目访问", "Original-provider project access"],
  ["专属企业配额", "Dedicated enterprise allocation"],
  ["合作方交付配额", "Partner-delivered allocation"],
  ["默认关闭", "Disabled by default"],
  ["按价格、SLA 与区域路由", "Route by price, SLA & region"],
  ["按效果路由 · 硬件未披露", "Hardware undisclosed · route by outcome"],
  ["原厂最佳来源", "Best native provenance"],
  ["最快交付", "Fastest delivery"],
  ["最高吞吐", "Highest throughput"],
  ["确定可执行报价", "Firm executable quote"],
  ["已结算 Lane A 交易", "Settled Lane A trade"],
  ["永不进入核心指数", "Never in core index"],
  ["严格分桶的模拟序列", "Strictly bucketed demo series"],
  ["仅 Lane A", "Lane A only"],
  ["独立 OTC 指标", "Separate OTC indicator"],
  ["方法论元数据", "Methodology metadata"],
  ["指数发布门槛", "Index publication gate"],
  ["加权中位数", "Weighted median"],
  ["封顶 VWAP", "Capped VWAP"],
  ["复合指数", "Composite index"],
  ["最大权重", "Highest weight"],
  ["7 日价格趋势", "7 day price trend"],
  ["容量指数历史", "Capacity index history"],
  ["执行目标", "Execution targets"],
  ["执行 DAG", "Execution DAG"],
  ["可编辑", "editable"],
  ["可解释策略", "Explainable policy"],
  ["多目标", "Multi-objective"],
  ["每步质量门槛已满足", "Per-step floors met"],
  ["硬件感知路由", "Hardware-aware routing"],
  ["自动回退", "Automatic fallback"],
  ["预计质量", "Expected quality"],
  ["预计成本", "Estimated cost"],
  ["P95 延迟", "P95 latency"],
  ["为什么选择这个目标？", "Why this target?"],
  ["所选路线", "Selected route"],
  ["估算 · 不构成保证", "estimate · not guarantee"],
  ["模拟费率表", "synthetic rate card"],
  ["历史估算", "historical estimate"],
  ["模拟执行回执", "Simulated execution receipt"],
  ["实际关键路径", "Actual critical path"],
  ["实际模拟成本", "Actual simulated cost"],
  ["成本节省", "Cost saving"],
  ["关键路径 P95", "Critical path P95"],
  ["交叉检查", "Cross-check"],
  ["执行芯片 / 交付", "Compute / delivery"],
  ["模拟估算", "Synthetic estimates"],
  ["执行目标", "Execution targets"],
  ["预留演示容量", "Reserve demo capacity"],
  ["运行模拟", "Run simulation"],
  ["可用性", "Availability"],
  ["任何可用时间", "Any availability"],
  ["未来 24 小时", "Next 24 hours"],
  ["连续 7 天", "7-day continuous"],
  ["所有区域", "All regions"],
  ["立即", "Immediately"],
  ["7 天内", "Within 7 days"],
  ["自定义日期", "Custom date"],
  ["自定义期限", "Custom term"],
  ["按需 / 预留", "On-demand / reserved"],
  ["预约预留", "Scheduled reservation"],
  ["预留 / 专属", "Reserved / dedicated"],
  ["每卡时", "per card-hour"],
  ["每加速器·小时", "/ accelerator·h"],
  ["美元 / 加速器小时", "USD / accelerator-hour"],
  ["卡", "cards"],
  ["价格", "Price"],
  ["可用", "Available"],
  ["开始", "Start"],
  ["已验证日历", "verified calendar"],
  ["已验证运营商", "Verified operator"],
  ["立即可用", "Immediately"],
  ["大型集群 RFQ", "Large cluster RFQ"],
  ["小时级 Demo", "Hourly demo"],
  ["关闭模型边界：", "Closed-model boundary:"],
  ["闭源前沿 API", "Closed frontier API"],
  ["开放 / 托管路线", "Open / hosted route"],
  ["服务商管理（不透明）", "Provider-managed (opaque)"],
  ["响应 RFQ", "Respond to RFQ"],
  ["组织 KYB", "Organization KYB"],
  ["来源证据", "Provenance evidence"],
  ["合同证据 + 实时容量测试", "Contract evidence + live capacity test"],
  ["企业配额函 + 配额遥测", "Enterprise allocation letter + quota telemetry"],
  ["endpoint 健康 + 计量审计", "Endpoint health + metering audit"],
  ["身份 + 能力", "Identity + capability"],
  ["短结算周期", "Short settlement cycle"],
  ["示例 RFQ", "Example RFQ"],
  ["私密报价室 · 合成响应", "PRIVATE QUOTE ROOM · SYNTHETIC RESPONSES"],
  ["供应商 / 验证", "Supplier / verification"],
  ["买方获得", "Buyer receives"],
  ["价格 / 容量", "Rate / capacity"],
  ["吞吐 / SLA", "Throughput / SLA"],
  ["请求报价", "Request quote"],
  ["服务商声明", "Supplier declared"],
  ["已验证路线", "verified routes"],
  ["来源先于价格", "Source before price"],
  ["原始访问、配额或合作方交付始终可见", "Original access, allocation or partner delivery stays visible"],
  ["可选交付 · 非 Native Direct", "Optional delivery · not Native Direct"],
  ["补充 endpoint · 单独标注", "Supplemental endpoint · separately labelled"],
  ["只在验证结算后具备资格", "Core market · eligible after verified settlement"],
  ["原厂项目或专属配额", "Core · original project or dedicated allocation"],
  ["原厂项目访问或专属企业配额", "Original-provider project access or dedicated enterprise allocation"],
  ["模拟数据", "Synthetic demo data"],
  ["模拟实时", "Synthetic live"],
  ["独立风险通道", "Separate risk lane"],
  ["仅限邀请", "Invite only"],
  ["安全配额分配 · DEMO 检查点", "SECURE ALLOCATION · DEMO CHECKPOINT"],
  ["真实容量来源已审查", "Supply provenance reviewed"],
  ["已验证证据与买方交付方式", "Verified evidence and buyer delivery method"],
  ["容量测试已通过", "Capacity test passed"],
  ["吞吐、区域与期限符合 RFQ", "Throughput, region and term meet RFQ"],
  ["最终确定配额协议", "Finalize allocation agreement"],
  ["价格、SLA、撤销、退款与结算", "Price, SLA, revocation, refund and settlement"],
  ["Demo 检查点", "Demo checkpoint"],
  ["返回比较", "Back to comparison"],
  ["发起安全交割", "Start secure delivery"],
  ["完成", "Done"],
];

const segmentPairs = [
  [" 个模型市场符合当前来源筛选 · 所有报价与库存均为 Demo 数据", " model markets match the current provenance filter · all quotes and inventory are demo data"],
  [" 个步骤 · 可编辑", " steps · editable"],
  [" 个子任务", " subtasks"],
  [" 个响应", " responses"],
  [" 家通过 KYB 与来源验证的供应方将收到邀请", " suppliers that passed KYB and provenance verification will be invited"],
  [" 响应", " responses"],
  ["已验证路线", "verified routes"],
  ["检测", "detected in"],
  ["完成重路由，事件已写入审计记录", "rerouted; event recorded in the audit log"],
  ["研究全球 AI 推理容量市场：检索近期资料，提取各地区 GPU 与模型容量价格，识别供需变化，计算趋势并生成带证据引用的投资委员会报告。", "Research the global AI inference capacity market: retrieve recent sources, extract regional GPU and Model Capacity prices, identify supply-demand shifts, calculate trends and produce an evidence-backed investment committee report."],
  ["研究全球 AI 推理容量市场：检索近期资料，提取各地区 GPU 价格与模型容量价格，识别供需变化，计算趋势并生成带证据引用的投资委员会报告。", "Research the global AI inference capacity market: retrieve recent sources, extract regional GPU and Model Capacity prices, identify supply-demand shifts, calculate trends and produce an evidence-backed investment committee report."],
  ["分析大型 Python 服务，生成依赖图，识别安全风险，将核心模块迁移到 TypeScript，运行测试并输出逐模块审查报告与上线计划。", "Analyze a large Python service, generate a dependency graph, identify security risks, migrate core modules to TypeScript, run tests and produce a module-by-module review and launch plan."],
  ["分析一个大型 Python 服务，生成依赖图，识别安全风险，将核心模块迁移到 TypeScript，运行测试并输出逐模块审查报告与上线计划。", "Analyze a large Python service, generate a dependency graph, identify security risks, migrate core modules to TypeScript, run tests and produce a module-by-module review and launch plan."],
  ["批量处理 5,000 条包含图片、语音和文本的商品内容，完成内容安全分类、OCR、语音转写、重复检测和高风险复核，并输出可审计结果。", "Process 5,000 listings containing images, audio and text; perform safety classification, OCR, transcription, duplicate detection and high-risk review; then produce auditable results."],
  ["批量处理 5,000 条包含图片、语音和文本的商品内容，做内容安全分类、OCR、语音转写、重复检测和高风险复核，最后输出可审计的审核结果。", "Process 5,000 listings containing images, audio and text; perform safety classification, OCR, transcription, duplicate detection and high-risk review; then produce auditable results."],
  ["通用复杂任务", "General complex task"],
  ["理解任务", "Understand the task"],
  ["提取目标、上下文、硬约束和验收标准。", "Extract goals, context, hard constraints and acceptance criteria."],
  ["拆分执行计划", "Decompose the execution plan"],
  ["将任务拆为可验证、可并行的工作单元。", "Split the task into verifiable, parallelizable work units."],
  ["快速处理标准步骤", "Process standard steps quickly"],
  ["批量完成分类、提取或格式转换等标准工作。", "Batch standard work such as classification, extraction and format conversion."],
  ["执行深度推理", "Perform deep reasoning"],
  ["处理需要更强推理能力的核心问题。", "Handle core questions that require stronger reasoning."],
  ["汇总多路结果", "Synthesize parallel results"],
  ["合并快速处理与深度推理的输出。", "Combine outputs from fast processing and deep reasoning."],
  ["校验并交付", "Validate and deliver"],
  ["验证完整性、一致性和风险后生成最终成果。", "Validate completeness, consistency and risk before producing the final deliverable."],
  ["底层芯片不可选择", "the underlying chip is not selectable"],
  ["采用服务商托管交付", "uses provider-managed delivery"],
  ["在满足质量门槛后", "After meeting the quality floor"],
  ["组合的", " combination has the highest "],
  ["得分最高", "score"],
];

const exactMaps = { en: new Map(), "zh-CN": new Map() };
for (const [zh, en] of pairs) {
  if (!exactMaps.en.has(zh)) exactMaps.en.set(zh, en);
  if (!exactMaps["zh-CN"].has(en)) exactMaps["zh-CN"].set(en, zh);
}

let locale = readStoredLocale();
let observer;
let scheduled = false;
const diagnostics = { fallbackEnglish: new Set(), untranslatedEnglish: new Set() };

function readStoredLocale() {
  // English-only demo release, including visitors with a saved Chinese locale.
  return "en";
}

function preserveOuterWhitespace(original, translated) {
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  return `${leading}${translated}${trailing}`;
}

function applySegments(value, targetLocale) {
  const sourceIndex = targetLocale === "en" ? 0 : 1;
  const targetIndex = targetLocale === "en" ? 1 : 0;
  const candidates = segmentPairs
    .map((pair) => [pair[sourceIndex], pair[targetIndex]])
    .filter(([source]) => source && value.includes(source))
    .sort((a, b) => b[0].length - a[0].length);
  if (!candidates.length) return value;
  const slots = [];
  let output = value;
  for (const [source, target] of candidates) {
    const token = `\uE000${slots.length}\uE001`;
    if (!output.includes(source)) continue;
    output = output.split(source).join(token);
    slots.push([token, target]);
  }
  for (const [token, target] of slots) output = output.split(token).join(target);
  return output;
}

function englishSafetyFallback(value) {
  if (!/[\u3400-\u9FFF\uF900-\uFAFF]/u.test(value)) return value;
  diagnostics.fallbackEnglish.add(value);
  const latin = value
    .replace(/[\u3400-\u9FFF\uF900-\uFAFF]+/gu, " ")
    .replace(/\s*([，。；：、])\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (/[A-Za-z0-9$%]/.test(latin) && latin.length > 3) return latin;
  return "Localized interface copy";
}

export function translateText(original, targetLocale = locale, options = {}) {
  if (typeof original !== "string" || !original.trim()) return original;
  const core = original.trim();
  const exact = exactMaps[targetLocale].get(core);
  let translated = exact ?? applySegments(core, targetLocale);
  if (targetLocale === "en" && !options.noFallback) translated = englishSafetyFallback(translated);
  return preserveOuterWhitespace(original, translated);
}

function translateTextNode(node) {
  const parent = node.parentElement;
  if (!parent || parent.closest("script, style, noscript, template, #publicContent, .public-info-dialog")) return;
  const translated = translateText(node.nodeValue);
  if (translated !== node.nodeValue) node.nodeValue = translated;
}

function translateElementAttributes(element) {
  if (!(element instanceof Element) || element.closest("#publicContent,.public-info-dialog")) return;
  for (const attribute of ["placeholder", "aria-label", "title", "data-tooltip"]) {
    if (!element.hasAttribute(attribute)) continue;
    const current = element.getAttribute(attribute);
    const translated = translateText(current);
    if (translated !== current) element.setAttribute(attribute, translated);
  }
  if (element.matches("input, textarea")) {
    const current = element.value;
    const translated = translateText(current, locale, { noFallback: true });
    if (translated !== current) element.value = translated;
  }
}

function translateRoot(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root);
    return;
  }
  if (!(root instanceof Element || root instanceof Document || root instanceof DocumentFragment)) return;
  if (root instanceof Element) translateElementAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
    else translateElementAttributes(node);
  }
}

function updateLocaleChrome() {
  document.documentElement.lang = locale;
  document.documentElement.dataset.locale = locale;
  document.querySelectorAll("[data-locale]").forEach((button) => {
    if (button.closest("#publicContent,.public-info-dialog")) return;
    const active = button.dataset.locale === locale;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.title = locale === "en"
    ? "OpenNEXT · Native AI Capacity Market"
    : "OpenNEXT · 原厂 AI Capacity 市场";
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = locale === "en"
    ? "OpenNEXT Native AI Capacity Market and RFQ MVP demo"
    : "OpenNEXT 原厂 AI Capacity 市场与 RFQ MVP 演示";
}

export function localizeDocument(root = document) {
  translateRoot(root);
  updateLocaleChrome();
}

function scheduleLocalization() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    localizeDocument(document);
  });
}

export function getLocale() {
  return locale;
}

export function setLocale(nextLocale, options = {}) {
  if (!SUPPORTED_LOCALES.has(nextLocale)) return locale;
  const changed = locale !== nextLocale;
  locale = nextLocale;
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* no-op */ }
  localizeDocument(document);
  if (changed && options.announce !== false) {
    document.dispatchEvent(new CustomEvent("opennext:localechange", { detail: { locale } }));
  }
  return locale;
}

export function getI18nDiagnostics() {
  return {
    fallbackEnglish: [...diagnostics.fallbackEnglish],
    untranslatedEnglish: [...diagnostics.untranslatedEnglish],
  };
}

export function initI18n() {
  updateLocaleChrome();
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-locale]");
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setLocale(button.dataset.locale);
  }, true);
  observer = new MutationObserver((records) => {
    if (records.some((record) => record.type === "childList" || record.type === "characterData" || record.type === "attributes")) {
      scheduleLocalization();
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "aria-label", "title", "data-tooltip"],
  });
  localizeDocument(document);
  window.OpenNEXTI18n = { getLocale, setLocale, translateText, localizeDocument, getI18nDiagnostics };
  return locale;
}
