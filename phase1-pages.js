import {
  state,
  modelMarkets,
  gpuOffers,
  providerDepth,
  marketStats,
  compactMoney,
  compactNumber,
  escapeHtml,
  modelView,
  sparkline,
} from "./demo-core.js?v=opennext-20260912-5";
import {
  phase1Meta,
  provenanceCatalog,
  demandTape,
  quoteComparison,
  phaseRoadmap,
  phaseState,
  getProvenance,
  isNativeType,
} from "./phase1-data.js?v=opennext-20260912-5";
import {
  renderGpus as renderBaseGpus,
  renderScheduler as renderBaseScheduler,
  renderData as renderBaseData,
} from "./demo-pages.js?v=opennext-20260912-5";

const nativeTypes = new Set(["native_direct", "native_allocated", "enterprise_partner"]);

function provenanceBadge(meta, compact = false) {
  const verified = meta.verified ? '<span class="verification-mark">✓ Verified</span>' : '<span class="verification-mark pending">Pending</span>';
  return `<span class="provenance-badge provenance-${meta.tone} ${compact ? "is-compact" : ""}"><span>${escapeHtml(meta.label)}</span>${compact ? "" : verified}</span>`;
}

function rowsForModel(modelId, filter = "all") {
  const rows = providerDepth[modelId] || [];
  if (filter === "all") return rows;
  if (filter === "native") return rows.filter((row) => isNativeType(getProvenance(row).type));
  return rows.filter((row) => getProvenance(row).type === filter);
}

function primaryOffer(modelId, filter = "native") {
  const filtered = rowsForModel(modelId, filter);
  return filtered[0] || (providerDepth[modelId] || [])[0];
}

function modelProvenanceCard(raw, filter = "native") {
  const model = modelView(raw);
  const rows = rowsForModel(raw.id, filter);
  if (!rows.length) return "";
  const offer = rows[0];
  const provenance = getProvenance(offer);
  const allTypes = [...new Set((providerDepth[raw.id] || []).map((row) => getProvenance(row).type))];
  const nativeCapacity = rows
    .filter((row) => nativeTypes.has(getProvenance(row).type))
    .reduce((sum, row) => sum + Number(row.availableOevUsd || 0), 0);
  const shownCapacity = nativeCapacity || rows.reduce((sum, row) => sum + Number(row.availableOevUsd || 0), 0);
  const price = Number(offer.priceMultiple || model.index);
  return `<article class="provenance-market-card" style="--model-accent:${model.accent}">
    <div class="market-card-top">
      <div class="model-identity"><div class="model-orb">${escapeHtml(model.family.slice(0, 1))}</div><div><strong>${escapeHtml(model.name)}</strong><span>${escapeHtml(model.family)} capacity market</span></div></div>
      <span class="badge badge-gray">DEMO</span>
    </div>
    <div class="provenance-lead">${provenanceBadge(provenance)}<span class="role-pill">${escapeHtml(provenance.role)}</span></div>
    <div class="buyer-receives"><span>Buyer receives</span><strong>${escapeHtml(provenance.deliveryMode || provenance.buyerReceives)}</strong></div>
    <div class="market-rate-row"><div><strong>${price.toFixed(2)}×</strong><span>reference rate</span></div>${sparkline(model.sparkline, model.accent)}</div>
    <div class="market-facts"><div><span>Verified capacity</span><strong>${compactMoney.format(shownCapacity)}</strong></div><div><span>Throughput</span><strong>${compactNumber.format(offer.tpm)} TPM</strong></div><div><span>SLA</span><strong>${Number(offer.uptimePct).toFixed(2)}%</strong></div></div>
    <div class="provenance-strip">${allTypes.map((type) => provenanceBadge({ ...provenanceCatalog[type], verified: true }, true)).join("")}</div>
    <div class="market-card-actions"><button class="secondary-button compact" type="button" data-phase-action="view-passport" data-model-id="${escapeHtml(raw.id)}">查看来源档案</button><button class="primary-button compact" type="button" data-phase-action="new-native-rfq" data-family="${escapeHtml(model.family)}">发起 RFQ</button></div>
  </article>`;
}

function demandRow(item) {
  return `<div class="demand-row"><div class="demand-model"><span class="live-dot"></span><div><strong>${escapeHtml(item.model)}</strong><span>${escapeHtml(item.id)} · ${escapeHtml(item.age)} ago</span></div></div><div class="demand-notional"><strong>${escapeHtml(item.notional)}</strong><span>${escapeHtml(item.term)}</span></div><div class="demand-throughput"><strong>${escapeHtml(item.throughput)}</strong><span>${escapeHtml(item.region)}</span></div><div class="demand-source"><span class="badge badge-blue">${escapeHtml(item.provenance)}</span><small>${item.responses} responses</small></div></div>`;
}

function provenanceCard(type) {
  const meta = provenanceCatalog[type];
  return `<article class="source-card source-${meta.tone}"><div class="source-card-head">${provenanceBadge({ ...meta, verified: true }, true)}<span class="source-role">${escapeHtml(meta.role)}</span></div><h3>${escapeHtml(meta.zh)}</h3><p>${escapeHtml(meta.description)}</p><div class="source-output"><span>Buyer receives</span><strong>${escapeHtml(meta.buyerReceives)}</strong></div><div class="source-index">${meta.indexEligible ? "Eligible after verified settlement" : "Excluded from Native benchmark"}</div></article>`;
}

export function renderOverview() {
  const nativeModels = modelMarkets.filter((model) => rowsForModel(model.id, "native").length).slice(0, 4);
  const nativeCapacity = Object.values(providerDepth).flat().filter((row) => nativeTypes.has(getProvenance(row).type)).reduce((sum, row) => sum + Number(row.availableOevUsd || 0), 0);
  return `<div class="page phase1-overview">
    <section class="native-hero">
      <div class="native-hero-copy">
        <div class="eyebrow"><span class="phase-pulse"></span>${phase1Meta.label}</div>
        <h1>找到真正可验证的<br><span>原厂 AI Capacity</span></h1>
        <p>一次发布需求，比较 Native Direct、Native Allocated 与 Enterprise Partner 报价。价格、容量、来源和买方实际获得的访问方式全部清晰可见。</p>
        <div class="intent-switch" role="tablist"><button class="is-active" type="button" data-phase-action="intent-buy">我要买容量</button><button type="button" data-phase-action="sell-capacity">我要卖容量</button></div>
        <div class="native-intent-box">
          <label for="nativeIntent">描述你需要的容量</label>
          <textarea id="nativeIntent">需要 $100k Claude Sonnet 原厂容量，使用 30 天，至少 2M TPM，美国地区，希望本周交付。</textarea>
          <div class="intent-fields"><div><span>Model</span><strong>Claude Sonnet⌄</strong></div><div><span>Provenance</span><strong>Native only⌄</strong></div><div><span>Term</span><strong>30 days⌄</strong></div><div><span>Region</span><strong>US⌄</strong></div></div>
          <div class="intent-actions"><button class="primary-button native-cta" type="button" data-phase-action="new-native-rfq" data-family="Claude">获取已验证报价 <span>→</span></button><button class="secondary-button" type="button" data-route="models">浏览已验证供应</button></div>
        </div>
        <div class="trust-line"><span>✓ 不公开裸凭证</span><span>✓ 来源证据验证</span><span>✓ 标准化报价</span><span>✓ 安全交割与结算</span></div>
      </div>
      <aside class="demand-tape-card">
        <div class="tape-head"><div><span class="eyebrow">LIVE DEMAND TAPE</span><h2>买方需求正在进入市场</h2></div><span class="badge badge-green">Synthetic live</span></div>
        <div class="demand-tape">${demandTape.slice(0, 3).map(demandRow).join("")}</div>
        <div class="tape-summary"><div><strong>$2.8M</strong><span>Active RFQ notional</span></div><div><strong>14 min</strong><span>Median first response</span></div><div><strong>92%</strong><span>Capacity test pass</span></div></div>
        <button class="supplier-tape-cta" type="button" data-phase-action="sell-capacity"><span>有可交付的原厂容量？</span><strong>验证并响应买方需求 →</strong></button>
      </aside>
    </section>

    <div class="phase1-metrics"><div><span>Verified native capacity</span><strong>${compactMoney.format(nativeCapacity)}</strong><small>Synthetic · continuously tested</small></div><div><span>Native / partner suppliers</span><strong>31</strong><small>KYB + provenance evidence</small></div><div><span>Active buyer RFQs</span><strong>18</strong><small>Model + GPU capacity</small></div><div><span>Median quote response</span><strong>14m</strong><small>Last 24h · illustrative</small></div></div>

    <section class="section"><div class="section-header"><div><div class="eyebrow">PROVENANCE-FIRST MARKET</div><h2>先看来源，再比较价格</h2><p>OpenNEXT 不把所有供应抽象成同一种 API。买方在报价之前就知道容量从哪里来、最终拿到什么。</p></div><button class="text-link" type="button" data-route="models">查看全部 Model Capacity →</button></div><div class="provenance-market-grid">${nativeModels.map((model) => modelProvenanceCard(model, "native")).join("")}</div></section>

    <section class="section provenance-section"><div class="section-header"><div><div class="eyebrow">SUPPLY PROVENANCE</div><h2>四种产品，四种清晰的交付边界</h2><p>Native 是核心市场；Managed Gateway 是成交后的可选交付能力；Hosted Inference 是补充供应。</p></div></div><div class="source-grid">${["native_direct", "native_allocated", "managed_gateway", "hosted_inference"].map(provenanceCard).join("")}</div></section>

    <section class="section phase1-flow"><div class="flow-copy"><div class="eyebrow">PHASE 1 CORE FLOW</div><h2>把微信里的询价，变成可验证、可比较、可结算的市场</h2><p>买方发布一次结构化需求，平台只向满足来源与容量门槛的供应方开放。报价不再散落在群聊里。</p><button class="primary-button" type="button" data-route="rfq">进入 Native RFQ Market</button></div><div class="flow-steps">${["描述需求", "来源验证", "标准化报价", "比较与分配", "交割与结算"].map((step, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${step}</strong><small>${["模型、期限、速率、区域", "合同、授权、容量测试", "总价、来源、SLA、交付", "选择原厂来源或成本", "履约记录与资金结算"][index]}</small></div>`).join("")}</div></section>

    <section class="section optional-products"><div class="section-header"><div><div class="eyebrow">OPTIONAL CAPABILITIES</div><h2>核心是市场，执行能力按需启用</h2><p>这些能力保留在 Demo 中，但不会抢占 Phase 1 的产品主线。</p></div></div><div class="optional-grid"><article><span class="badge badge-gray">Phase 2 · Optional</span><h3>Managed Gateway</h3><p>用于可选托管交付、计量与统一结算；不代表 Native Direct，默认不会启用。</p><button class="text-link" type="button" data-phase-action="managed-gateway">了解可选交付 →</button></article><article><span class="badge badge-blue">Labs · Simulation</span><h3>Capacity Optimizer</h3><p>在已经采购或接入的容量上模拟任务拆解和「模型 + 芯片」执行路线，不接管生产流量。</p><button class="text-link" type="button" data-route="scheduler">打开实验室 →</button></article><article><span class="badge badge-gray">Phase 2</span><h3>GPU Capacity</h3><p>标准卡时与长期集群 RFQ，连接上游算力批发价格与模型容量市场。</p><button class="text-link" type="button" data-route="gpus">查看 GPU 市场 →</button></article></div></section>
  </div>`;
}

export function renderModels() {
  const query = String(state.modelQuery || "").trim().toLowerCase();
  const filter = phaseState.provenanceFilter;
  const cards = modelMarkets.filter((model) => {
    const view = modelView(model);
    const matchesQuery = !query || `${view.name} ${view.family}`.toLowerCase().includes(query);
    return matchesQuery && rowsForModel(model.id, filter).length;
  });
  const filters = [
    ["native", "Native only", "核心"],
    ["all", "All provenance", "全部"],
    ["managed_gateway", "Managed Gateway", "可选"],
    ["hosted_inference", "Hosted Inference", "补充"],
  ];
  return `<div class="page phase1-models">
    <div class="page-head"><div><div class="eyebrow">MODEL CAPACITY · PROVENANCE FIRST</div><h1>先看来源，再比较价格</h1><p>原厂直连、原厂分配、企业合作方、托管网关与 Hosted Inference 不再混成一个最低价。默认仅显示可验证的 Native 供应。</p></div><div class="page-actions"><button class="secondary-button" type="button" data-phase-action="sell-capacity">出售容量</button><button class="primary-button" type="button" data-phase-action="new-native-rfq">发布 Native RFQ</button></div></div>
    <section class="market-toolbar"><div class="provenance-filter">${filters.map(([id, label, hint]) => `<button class="${filter === id ? "is-active" : ""}" type="button" data-phase-action="filter-provenance" data-filter="${id}"><span>${label}</span><small>${hint}</small></button>`).join("")}</div><label class="market-search"><span>⌕</span><input id="modelSearch" value="${escapeHtml(state.modelQuery)}" placeholder="搜索 Claude、GPT、Gemini…"></label></section>
    <div class="provenance-explainer"><div><span class="shield-icon">✓</span><div><strong>Native 不是裸 Key</strong><p>OpenNEXT 验证来源证据与容量测试；买方获得清晰约定的项目访问、专属配额或合作方交付，不公开秘密凭证。</p></div></div><button class="text-link" type="button" data-phase-action="view-verification">查看验证标准 →</button></div>
    <section class="section" style="margin-top:18px"><div class="section-header"><div><h2>${filter === "native" ? "Verified Native Supply" : "Capacity by provenance"}</h2><p>${cards.length} 个模型市场符合当前来源筛选 · 所有报价与库存均为 Demo 数据</p></div><span class="badge badge-gray">${phase1Meta.dataMode}</span></div>${cards.length ? `<div class="provenance-market-grid">${cards.map((model) => modelProvenanceCard(model, filter)).join("")}</div>` : `<div class="empty-market"><strong>当前筛选暂无可展示供应</strong><span>切换到 All provenance 查看托管与 Hosted 供应。</span><button class="secondary-button compact" type="button" data-phase-action="filter-provenance" data-filter="all">查看全部来源</button></div>`}</section>
    <section class="section model-policy-grid"><div><span class="badge badge-green">CORE</span><h3>Native Direct / Allocated</h3><p>价格发现、容量发现、RFQ、验证、分配和结算，是 OpenNEXT 的 Phase 1 主市场。</p></div><div><span class="badge badge-amber">SEPARATE LANE</span><h3>Private OTC</h3><p>大额或复杂供应进入私密撮合，不公开库存，不进入 Native 基准指数。</p><button class="text-link" type="button" data-phase-action="private-otc">进入 OTC Desk →</button></div><div><span class="badge badge-gray">OPTIONAL</span><h3>Managed Gateway</h3><p>只有买方主动选择时才启用；不与 Native 供应混标，也不是平台核心 wedge。</p></div></section>
  </div>`;
}

export function renderRfq() {
  return `<div class="page phase1-rfq">
    <div class="page-head"><div><div class="eyebrow">PHASE 1 · CORE TRANSACTION FLOW</div><h1>Native RFQ Market</h1><p>一次发布需求，向通过 KYB、来源验证和容量测试的供应方获取标准化报价。比较的不只是价格，还有来源、分配方式、吞吐与 SLA。</p></div><div class="page-actions"><span class="badge badge-green">Core MVP</span><button class="secondary-button" type="button" data-phase-action="sell-capacity">供应方入驻</button></div></div>
    <section class="native-rfq-layout"><form class="native-rfq-form" data-phase-action="submit-inline-rfq"><div class="form-title"><div><span class="eyebrow">POST A CAPACITY REQUEST</span><h2>你要购买什么容量？</h2></div><span class="badge badge-gray">Draft · no login required</span></div><div class="rfq-form-grid"><label><span>模型与版本</span><select><option>Claude Sonnet</option><option>GPT Enterprise</option><option>Gemini Capacity</option><option>Kimi</option></select></label><label><span>所需分配额度</span><input value="$100,000"></label><label><span>最低吞吐</span><input value="2M TPM / 1,200 RPM"></label><label><span>使用期限</span><select><option>30 days</option><option>90 days</option><option>Custom term</option></select></label><label><span>开始时间</span><select><option>Within 7 days</option><option>Immediately</option><option>Custom date</option></select></label><label><span>地区与数据要求</span><select><option>US · standard retention</option><option>EU · regional processing</option><option>APAC</option></select></label></div><fieldset class="provenance-choice"><legend>接受的供应来源</legend><label class="is-recommended"><input type="checkbox" checked><span><strong>Native Direct / Allocated</strong><small>推荐 · 原厂项目或专属企业配额</small></span></label><label><input type="checkbox" checked><span><strong>Enterprise Partner</strong><small>经验证的合作方交付</small></span></label><label><input type="checkbox"><span><strong>Managed Gateway</strong><small>可选 · 默认不启用</small></span></label><label><input type="checkbox"><span><strong>Hosted Inference</strong><small>补充供应</small></span></label></fieldset><div class="rfq-delivery-note"><span>Buyer receives</span><strong>Original-provider project access or dedicated enterprise allocation</strong><small>最终交付由所选报价的 Provenance Passport 明确约定。</small></div><div class="form-footer"><p>提交时再完成企业联系方式与 KYB。此 Demo 不发送真实请求。</p><button class="primary-button" type="submit">提交并开始匹配 →</button></div></form>
      <aside class="rfq-side"><div class="rfq-side-head"><span class="eyebrow">DEMAND TAPE</span><h3>当前买方需求</h3><p>匿名展示的结构化需求，帮助合格供应方发现真实流量。</p></div><div class="demand-tape compact-tape">${demandTape.map(demandRow).join("")}</div><button class="supplier-tape-cta" type="button" data-phase-action="sell-capacity"><span>Supply side</span><strong>验证容量并响应 RFQ →</strong></button></aside>
    </section>
    <section class="section"><div class="section-header"><div><div class="eyebrow">STANDARDIZED QUOTE ROOM</div><h2>同一需求，按来源与交付条件横向比较</h2><p>示例：Claude Sonnet · $100k allocation · 30 days · 2M TPM · US</p></div><span class="badge badge-blue">Synthetic responses</span></div><div class="table-wrap"><table class="data-table provenance-table"><thead><tr><th>Supplier</th><th>Supply provenance</th><th>Buyer receives</th><th>Rate / Total</th><th>Capacity</th><th>Delivery / SLA</th><th></th></tr></thead><tbody>${quoteComparison.map((quote) => { const meta = provenanceCatalog[quote.provenance]; return `<tr><td><span class="strong">${escapeHtml(quote.supplier)}</span><span class="subline">${escapeHtml(quote.highlight)}</span></td><td>${provenanceBadge({ ...meta, verified: true }, true)}<span class="subline">OpenNEXT Verified</span></td><td><span class="strong">${escapeHtml(meta.buyerReceives)}</span><span class="subline">Passport available</span></td><td class="numeric"><span class="strong">${quote.rate.toFixed(3)}×</span><span class="subline">${escapeHtml(quote.total)} total</span></td><td><span class="strong">${escapeHtml(quote.capacity)}</span><span class="subline">${escapeHtml(quote.throughput)}</span></td><td><span class="strong">${escapeHtml(quote.delivery)}</span><span class="subline">${escapeHtml(quote.sla)} SLA</span></td><td><button class="primary-button compact" type="button" data-phase-action="select-quote" data-supplier="${escapeHtml(quote.supplier)}">选择报价</button></td></tr>`; }).join("")}</tbody></table></div></section>
    <section class="section phase1-workflow"><div class="section-header"><div><h2>从需求到结算的可审计链路</h2><p>OpenNEXT 负责市场基础设施，不要求买方先接受统一 API。</p></div></div><div class="workflow-track">${["Structured demand", "KYB & provenance", "Capacity test", "Quote comparison", "Allocation", "Fulfilment record", "Settlement"].map((label, index) => `<div class="workflow-node"><span>${index + 1}</span><strong>${label}</strong></div>`).join("")}</div></section>
    <section class="section otc-separation"><div><span class="badge badge-amber">SEPARATE RISK LANE</span><h2>Private OTC / Brokered RFQ</h2><p>大额、匿名或非标准需求进入独立私密通道。非 Native / 第三方来源必须清晰标注，不公开库存，不进入 Native benchmark。</p></div><div class="button-row"><button class="secondary-button" type="button" data-phase-action="private-otc">进入 Private OTC Desk</button></div></section>
  </div>`;
}

function prependContext(html, context) {
  return html.replace(/<div class="page([^\"]*)">/, `<div class="page$1"><section class="phase-context ${context.tone || ""}"><div><span class="badge ${context.badgeClass || "badge-gray"}">${context.badge}</span><strong>${context.title}</strong><p>${context.copy}</p></div>${context.action || ""}</section>`);
}

export function renderGpus() {
  return prependContext(renderBaseGpus(), {
    badge: "Phase 2",
    badgeClass: "badge-gray",
    title: "GPU Capacity is the second market",
    copy: "标准卡时保留现有发现与预约演示；大集群、长期和专网需求统一进入 RFQ。",
    action: '<button class="secondary-button compact" type="button" data-phase-action="new-native-rfq" data-family="GPU">发布 GPU RFQ</button>',
  });
}

export function renderScheduler() {
  let html = renderBaseScheduler();
  html = html.replace("Smart Orchestrator", "Capacity Optimizer · Labs");
  return prependContext(html, {
    tone: "is-labs",
    badge: "Optional Preview",
    badgeClass: "badge-blue",
    title: "智能调度是 Phase 1 的锦上添花",
    copy: "它在已经采购或接入的容量上模拟任务拆解与模型 + 芯片路线，不是首页流量入口，也不会默认接管生产流量。",
  });
}

export function renderData() {
  return prependContext(renderBaseData(), {
    badge: "Phase 3 Preview",
    badgeClass: "badge-gray",
    title: "Market Data follows verified transactions",
    copy: "Native benchmark 只纳入合格、已结算的可验证交易；Private OTC、Managed Gateway 与 Hosted 供应保持独立口径。",
  });
}

export function renderPhaseRoadmap() {
  return phaseRoadmap.map((item) => `<div><span>${item.phase}</span><strong>${item.title}</strong><p>${item.description}</p><small>${item.status}</small></div>`).join("");
}
