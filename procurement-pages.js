import {
  state,
  modelMarkets,
  gpuOffers,
  providerDepth,
  indexSeries,
  marketStats,
  compactMoney,
  compactNumber,
  escapeHtml,
  modelView,
  gpuView,
  lineChart,
} from "./demo-core.js?v=opennext-20260912-3";
import { renderScheduler as renderBaseScheduler } from "./demo-pages.js?v=opennext-20260912-3";
import {
  procurementMeta,
  provenanceCatalog,
  demandTape,
  quoteComparison,
  marketDataSignals,
  modelMarketData,
  gpuMarketData,
  gpuDemandRatings,
  gpuSupplyListings,
  gpuHardwareListings,
  procurementState,
  ratingPolicy,
  completedTransactions,
  currentBuyerReputation,
  currentSellerReputation,
  getSupplierReputation,
  getProvenance,
  isNativeType,
} from "./procurement-data.js?v=opennext-20260912-3";

// Page copy is explicit in both supported languages. The existing localization
// layer continues to handle all transaction data, controls and workflow content.
function ui(en, zh) {
  return globalThis.OpenNEXTI18n?.getLocale?.() === "zh-CN" ? zh : en;
}

const referenceByFamily = {
  Claude: "Anthropic public API equivalent",
  GPT: "OpenAI public API equivalent",
  Gemini: "Google public API equivalent",
  Kimi: "Moonshot public API equivalent",
  GLM: "Zhipu public API equivalent",
  DeepSeek: "DeepSeek public API equivalent",
};

const tokenRateCards = {
  Claude: { referenceModel: "Claude Sonnet 4", input: 3, output: 15 },
  GPT: { referenceModel: "GPT-5.6 Terra", input: 1.25, output: 7.5 },
  Gemini: { referenceModel: "Gemini 2.5 Flash", input: 0.3, output: 2.5 },
  DeepSeek: { referenceModel: "DeepSeek Reasoner", input: 0.7, output: 2.8 },
  Kimi: { referenceModel: "Kimi long-context", input: 1, output: 4 },
  GLM: { referenceModel: "GLM general", input: 0.6, output: 2.5 },
};

function offerTps(offer) {
  return Number(offer.tps || Math.round(Number(offer.tpm || 0) / 60));
}

function tokenPrice(model, offer) {
  const card = tokenRateCards[model.family] || { referenceModel: model.name, input: 1, output: 1 };
  const multiple = Number(offer.priceMultiple || model.index);
  return { referenceModel: card.referenceModel, input: card.input * multiple, output: card.output * multiple, tps: offerTps(offer) };
}

function formatTokenPrice(value) {
  return `$${Number(value).toFixed(Number(value) < 1 ? 3 : 2)}`;
}

const validityWindows = [
  "21 Aug · 18:00 SGT",
  "21 Aug · 16:30 SGT",
  "21 Aug · 20:00 SGT",
  "22 Aug · 10:00 SGT",
  "22 Aug · 12:00 SGT",
  "22 Aug · 15:30 SGT",
  "23 Aug · 09:00 SGT",
  "23 Aug · 14:00 SGT",
  "23 Aug · 18:00 SGT",
];

function provenanceBadge(meta, detail = false) {
  return `<span class="provenance-badge provenance-${meta.tone} ${detail ? "" : "is-compact"}"><span>${escapeHtml(meta.productLabel)}</span>${detail ? `<small>${escapeHtml(meta.shortCategory)}</small>` : ""}</span>`;
}


function ratingStars(score) {
  const width = Math.max(0, Math.min(100, Number(score) / 5 * 100));
  return `<span class="rating-stars" aria-label="${Number(score).toFixed(2)} out of 5"><span>★★★★★</span><i style="width:${width}%">★★★★★</i></span>`;
}

function ratingPill(key) {
  const rating = getSupplierReputation(key);
  return `<button class="rating-pill" type="button" data-proc-action="view-rating" data-supplier-key="${escapeHtml(key)}"><span>${ratingStars(rating.overall)}<strong>${rating.overall.toFixed(2)}</strong></span><small>${rating.completedTrades} completed · ${rating.onTimePct}% on-time</small></button>`;
}

function feedbackSection() {
  return `<section class="section feedback-section"><div class="section-header"><div><div class="eyebrow">VERIFIED MUTUAL FEEDBACK</div><h2>${ui("Completed trades & feedback.", "已完成交易与评价。")}</h2><p>Only settled transactions can be reviewed. Buyer and seller feedback stays blind until both submit or the 14-day review window closes.</p></div><span class="badge badge-blue">5-point scale</span></div><div class="table-wrap"><table class="data-table feedback-table"><thead><tr><th>Transaction</th><th>Product / counterparty</th><th>Service term ended</th><th>Review status</th><th></th></tr></thead><tbody>${completedTransactions.map((item) => `<tr><td><span class="strong">${escapeHtml(item.id)}</span><span class="subline">${escapeHtml(item.role)}</span></td><td><span class="strong">${escapeHtml(item.product)}</span><span class="subline">${escapeHtml(item.counterparty)}</span></td><td>${escapeHtml(item.usageEndedAt)}</td><td><span class="badge ${item.reviewEligible ? "badge-green" : "badge-gray"}">${escapeHtml(item.reviewStatus)}</span></td><td>${item.reviewEligible ? `<button class="primary-button compact" type="button" data-proc-action="rate-transaction" data-transaction-id="${item.id}">Rate counterparty</button>` : '<span class="rating-locked">Locked</span>'}</td></tr>`).join("")}</tbody></table></div><div class="rating-policy-grid"><div><strong>Communication & attitude</strong><span>Clarity, responsiveness and professional conduct</span></div><div><strong>Delivery speed</strong><span>Allocation or infrastructure delivered against commitment</span></div><div><strong>Operational / usage quality</strong><span>Availability, throughput, stability and specification match</span></div><div><strong>After-sales support</strong><span>Issue handling, remediation and service follow-through</span></div></div></section>`;
}



function sellerReputationSection() {
  const score = currentSellerReputation;
  const buyer = currentBuyerReputation;
  return `<section class="counterparty-scorecard"><div class="seller-score-overview"><span class="eyebrow">YOUR SELLER REPUTATION</span><div class="seller-score-main">${ratingStars(score.overall)}<strong>${score.overall.toFixed(2)}</strong></div><small>${score.completedTrades} completed trades · mutual feedback only</small></div><div><span>Communication</span><strong>${score.dimensions.communication.toFixed(1)}</strong></div><div><span>Delivery speed</span><strong>${score.dimensions.delivery.toFixed(1)}</strong></div><div><span>Usage quality</span><strong>${score.dimensions.quality.toFixed(1)}</strong></div><div><span>After-sales support</span><strong>${score.dimensions.support.toFixed(1)}</strong></div></section><section class="buyer-trust-strip"><div><span class="eyebrow">BUYER REPUTATION IS ALSO VISIBLE</span><strong>Counterparty trust before you respond</strong><p>${ui("Review completed trades, communication, acceptance speed and payment reliability before quoting.", "报价前查看买方历史成交、沟通、验收与付款表现。")}</p></div><div class="buyer-trust-score">${ratingStars(buyer.overall)}<strong>${buyer.overall.toFixed(2)}</strong><small>${buyer.completedTrades} completed · ${buyer.paymentOnTimePct}% on-time payment</small></div></section>`;
}

function rowsForModel(modelId, filter = "native") {
  const rows = providerDepth[modelId] || [];
  if (filter === "native") return rows.filter((row) => isNativeType(getProvenance(row).type));
  if (filter === "all") return rows;
  return rows.filter((row) => getProvenance(row).type === filter);
}

function nativeListings() {
  const query = procurementState.modelQuery.trim().toLowerCase();
  const filter = procurementState.provenanceFilter;
  const rows = [];
  for (const rawModel of modelMarkets) {
    const model = modelView(rawModel);
    if (query && !`${model.name} ${model.family} ${model.provider}`.toLowerCase().includes(query)) continue;
    for (const offer of rowsForModel(rawModel.id, filter)) rows.push({ rawModel, model, offer, meta: getProvenance(offer) });
  }
  return rows.sort((a, b) => Number(a.offer.priceMultiple) - Number(b.offer.priceMultiple));
}

function quoteRow(item, index) {
  const { model, offer, meta } = item;
  const rate = Number(offer.priceMultiple || model.index);
  const total = Math.round(rate * 100000);
  const reference = referenceByFamily[model.family] || `${model.family} public API equivalent`;
  const pricing = tokenPrice(model, offer);
  return `<tr>
    <td><span class="strong">${escapeHtml(model.name)}</span><span class="subline">${escapeHtml(offer.providerName)}</span>${ratingPill(offer.id)}</td>
    <td>${provenanceBadge(meta, true)}<span class="subline">${escapeHtml(meta.category)}</span></td>
    <td><span class="quote-state is-indicative">Indicative</span><span class="strong quote-rate">${rate.toFixed(3)}×</span><span class="subline"><span>Seller discount vs</span> ${escapeHtml(reference)}</span></td>
    <td class="token-price-cell"><span class="token-price-line"><small>Input</small><strong>${formatTokenPrice(pricing.input)}</strong></span><span class="token-price-line"><small>Output</small><strong>${formatTokenPrice(pricing.output)}</strong></span><span class="subline"><span>USD / 1M tokens</span> · ${escapeHtml(pricing.referenceModel)}</span></td>
    <td class="numeric"><span class="strong">$${total.toLocaleString("en-US")}</span><span class="subline">Platform fee included</span></td>
    <td class="numeric"><span class="strong">${compactMoney.format(offer.availableOevUsd)}</span><span class="subline">Available to quote</span></td>
    <td class="numeric throughput-cell"><span class="strong">${compactNumber.format(pricing.tps)} TPS</span><span class="subline">Committed throughput</span></td>
    <td><span class="strong">${validityWindows[index % validityWindows.length]}</span><span class="subline">${escapeHtml(meta.buyerReceives)}</span></td>
    <td><div class="board-actions"><button class="ghost-button compact" type="button" data-proc-action="view-passport" data-provider-id="${escapeHtml(offer.id)}">Passport</button><button class="ghost-button compact" type="button" data-flow-action="open-chat" data-supplier="${escapeHtml(offer.providerName)}" data-context="${escapeHtml(model.name)}">Message</button><button class="primary-button compact" type="button" data-proc-action="post-rfq" data-rfq-type="native_model" data-family="${escapeHtml(model.name)}">Request quote</button></div></td>
  </tr>`;
}

function demandRow(item, responseAction = false) {
  return `<div class="demand-row procurement-demand-row"><div class="demand-model"><span class="live-dot"></span><div><strong>${escapeHtml(item.model)}</strong><span>${escapeHtml(item.id)} · ${escapeHtml(item.type)}</span></div></div><div class="demand-notional"><strong>${escapeHtml(item.notional)}</strong><span>${escapeHtml(item.term)}</span></div><div class="demand-throughput"><strong>${escapeHtml(item.throughput)}</strong><span>${escapeHtml(item.region)}</span></div><div class="demand-source"><span class="badge badge-blue">${escapeHtml(item.provenance)}</span><small>${item.responses} responses · ${escapeHtml(item.age)} ago</small></div>${responseAction ? `<button class="secondary-button compact" type="button" data-flow-action="respond-rfq-full" data-rfq-id="${escapeHtml(item.id)}">Respond</button>` : ""}</div>`;
}

function referenceGuide() {
  return `<details class="workspace-reference pricing-reference"><summary>${ui("Pricing reference & quote terms", "定价基准与报价条款")}<span aria-hidden="true">+</span></summary><section class="reference-guide"><div><span class="reference-step">1.00×</span><strong>Public API reference</strong><p>The named model's public input and output rate card at the quote timestamp.</p></div><div><span class="reference-step">$ / 1M</span><strong>Input and output unit prices</strong><p>Supplier unit prices equal the named public rate card multiplied by the quoted discount; input and output remain separate.</p></div><div><span class="reference-step">OEV</span><strong>Official-equivalent value</strong><p>Input and output usage are converted using the named public rate card and workload mix.</p></div><div><span class="reference-step">State</span><strong>Indicative until confirmed</strong><p>No public order book is implied. A quote becomes firm only after bilateral confirmation and allocation lock.</p></div></section></details>`;
}

export function renderOverview() {
  return renderModels();
}

export function renderModels() {
  const listings = nativeListings();
  const nativeCapacity = Object.values(providerDepth).flat().filter((row) => isNativeType(getProvenance(row).type)).reduce((sum, row) => sum + Number(row.availableOevUsd || 0), 0);
  const filters = [
    ["native", "All Native"],
    ["native_direct", "Native Direct"],
    ["native_allocated", "Native Allocated"],
    ["enterprise_partner", "Enterprise Partner"],
  ];
  return `<div class="page procurement-market">
    <div class="page-head procurement-head"><div><div class="eyebrow">${ui("MARKETPLACE / MODELS", "市场 / 模型容量")}</div><h1>${ui("Model capacity.", "模型容量市场。")}</h1><p>${ui("Compare the source, price and delivery of qualified model capacity.", "比较合格模型容量的来源、价格与交付条件。")}</p></div><div class="page-actions"><span class="market-mode-badge">Demo environment</span><button class="primary-button" type="button" data-proc-action="post-rfq" data-rfq-type="native_model">Post RFQ</button></div></div>
    <div class="procurement-metrics"><div><span>Qualified supply signals</span><strong>${listings.length}</strong><small>Rights evidence or partner mandate reviewed</small></div><div><span>Available allocation signals</span><strong>${compactMoney.format(nativeCapacity)}</strong><small>Indicative · market snapshot</small></div><div><span>Active buyer RFQs</span><strong>${demandTape.length}</strong><small>Model, GPU and Private OTC</small></div><div><span>Median first response</span><strong>14m</strong><small>Last 24h</small></div></div>
    <section class="market-board">
      <div class="market-board-head"><div><span class="eyebrow">QUALIFIED SUPPLY BOARD</span><h2>Available to quote</h2><p>${ui("Indicative supply. Confirm price, capacity and delivery through a private quote.", "当前为指示性供应；价格、容量和交付通过私密报价确认。")}</p></div><span class="badge badge-gray">${procurementMeta.dataMode}</span></div>
      <div class="market-toolbar procurement-toolbar"><div class="provenance-filter">${filters.map(([id, label]) => `<button class="${procurementState.provenanceFilter === id ? "is-active" : ""}" type="button" data-proc-action="filter-provenance" data-filter="${id}" aria-pressed="${procurementState.provenanceFilter === id}"><span>${label}</span></button>`).join("")}</div><label class="market-search"><span>⌕</span><input aria-label="${ui("Search model capacity", "搜索模型容量")}" id="nativeMarketSearch" value="${escapeHtml(procurementState.modelQuery)}" placeholder="Search Claude, GPT, Gemini…"></label></div>
      <div class="table-wrap supply-board-wrap"><table class="data-table supply-board-table"><thead><tr><th>Model / supplier</th><th>Supply provenance</th><th>Discount / public reference</th><th>Token price<br><small>USD / 1M tokens</small></th><th>Total payable<br><small>$100k OEV</small></th><th>Available allocation</th><th>TPS</th><th>Valid until / delivery</th><th></th></tr></thead><tbody>${listings.map(quoteRow).join("")}</tbody></table></div>
      ${listings.length ? "" : '<div class="empty-market"><strong>No qualified supply matches this filter.</strong><span>Change the provenance filter or post a private RFQ.</span></div>'}
    </section>
    ${referenceGuide()}
    <section class="section demand-dashboard"><div class="section-header"><div><div class="eyebrow">${ui("DEMAND BOARD", "采购需求")}</div><h2>Structured buyer demand</h2><p>Demand is anonymized and available to qualified suppliers under the selected scope.</p></div><button class="secondary-button compact" type="button" data-route="supply">Supply / Respond to RFQs</button></div><div class="demand-tape procurement-tape"><div class="demand-grid-head"><span>Requirement</span><span>Notional / term</span><span>TPS / region</span><span>Provenance / responses</span><span>Action</span></div>${demandTape.map((item) => demandRow(item, true)).join("")}</div></section>
  </div>`;
}

export function renderRfq() {
  return `<div class="page procurement-rfqs">
    <div class="page-head"><div><div class="eyebrow">${ui("WORKSPACE / REQUESTS", "工作台 / 采购需求")}</div><h1>${ui("Your requests.", "我的采购需求。")}</h1><p>${ui("Quotes, tests and delivery. Follow every purchase from one place.", "集中跟进每笔采购的报价、测试与交付。")}</p></div><div class="page-actions"><span class="badge badge-gray">5 active requests</span><button class="primary-button" type="button" data-proc-action="post-rfq">Post RFQ</button></div></div>
    <div class="procurement-metrics"><div><span>Active notional</span><strong>$1.57M</strong><small>Across model and GPU capacity</small></div><div><span>Qualified responses</span><strong>20</strong><small>Authorization class shown per response</small></div><div><span>Capacity tests</span><strong>3 / 4</strong><small>One test in progress</small></div><div><span>Median quote age</span><strong>22m</strong><small>Illustrative workspace data</small></div></div>
    <section class="section"><div class="section-header"><div><h2>Open requests</h2><p>Every request retains price, capacity, term, delivery method and fulfilment evidence.</p></div></div><div class="table-wrap"><table class="data-table rfq-ledger-table"><thead><tr><th>RFQ</th><th>Transaction type</th><th>Requirement</th><th>Term / region</th><th>Responses</th><th>Status</th><th></th></tr></thead><tbody>${demandTape.map((item) => `<tr><td><span class="strong">${escapeHtml(item.id)}</span><span class="subline">${escapeHtml(item.model)}</span></td><td>${escapeHtml(item.type)}</td><td><span class="strong">${escapeHtml(item.notional)}</span><span class="subline">${escapeHtml(item.throughput)}</span></td><td><span class="strong">${escapeHtml(item.term)}</span><span class="subline">${escapeHtml(item.region)}</span></td><td>${item.responses} qualified</td><td><span class="badge badge-blue">${escapeHtml(item.status)}</span></td><td><button class="secondary-button compact" type="button" data-flow-action="open-rfq-full" data-rfq-id="${escapeHtml(item.id)}">Continue</button></td></tr>`).join("")}</tbody></table></div></section>
    <section class="section"><div class="section-header"><div><div class="eyebrow">STANDARDIZED QUOTE ROOM · RFQ-8421</div><h2>${ui("Compare your quotes.", "比较供应方报价。")}</h2><p>Claude Sonnet · $100k OEV · 30 days · 33.3K TPS · US</p></div><span class="badge badge-amber">Indicative responses</span></div><div class="table-wrap"><table class="data-table provenance-table quote-room-table"><thead><tr><th>Supplier</th><th>Authorization class</th><th>Discount / total</th><th>Token price<br><small>USD / 1M tokens</small></th><th>Available allocation</th><th>TPS</th><th>Validity / delivery</th><th></th></tr></thead><tbody>${quoteComparison.map((quote) => { const meta = provenanceCatalog[quote.provenance]; return `<tr><td><span class="strong">${escapeHtml(quote.supplier)}</span><span class="subline">${escapeHtml(quote.highlight)}</span>${ratingPill(quote.supplier)}</td><td>${provenanceBadge(meta, true)}<span class="subline">${escapeHtml(meta.authorization)}</span></td><td><span class="quote-state is-indicative">${quote.quoteState}</span><span class="strong">${quote.rate.toFixed(3)}× · ${quote.total}</span><span class="subline">Platform fee ${quote.fee.toLowerCase()}</span></td><td class="token-price-cell"><span class="token-price-line"><small>Input</small><strong>${formatTokenPrice(quote.inputPer1MUsd)}</strong></span><span class="token-price-line"><small>Output</small><strong>${formatTokenPrice(quote.outputPer1MUsd)}</strong></span><span class="subline">USD / 1M tokens</span></td><td><span class="strong">${quote.capacity}</span><span class="subline">Available to quote</span></td><td class="throughput-cell"><span class="strong">${compactNumber.format(quote.tps)} TPS</span><span class="subline">Committed throughput</span></td><td><span class="strong">${quote.validUntil}</span><span class="subline">${quote.delivery} · ${quote.sla} SLA</span></td><td><div class="board-actions"><button class="ghost-button compact" type="button" data-flow-action="open-chat" data-supplier="${escapeHtml(quote.supplier)}" data-context="RFQ-8421">Message</button><button class="primary-button compact" type="button" data-flow-action="review-quote-full" data-supplier="${escapeHtml(quote.supplier)}">Review quote</button></div></td></tr>`; }).join("")}</tbody></table></div></section>
    <section class="transaction-record"><div><span>01</span><strong>Structured request</strong><small>Price basis, capacity, term and region</small></div><div><span>02</span><strong>Authorization review</strong><small>Rights class recorded without implied endorsement</small></div><div><span>03</span><strong>Capacity test</strong><small>Throughput, availability and delivery method</small></div><div><span>04</span><strong>Contract and allocation</strong><small>Firm terms, revocation and refund boundaries</small></div><div><span>05</span><strong>Fulfilment record</strong><small>Delivery events, SLA and settlement outcome</small></div></section>
    ${feedbackSection()}
  </div>`;
}

export function renderSupply() {
  const approved = procurementState.supplierReviewStatus === "approved";
  return `<div class="page supply-workspace"><div class="page-head"><div><div class="eyebrow">${ui("WORKSPACE / SUPPLY", "工作台 / 供应管理")}</div><h1>${ui("Your supply desk.", "我的供应工作台。")}</h1><p>${ui("Publish capacity, respond to buyers and manage your supplier profile.", "发布供应、响应采购需求，管理企业供应资质。")}</p></div><div class="button-row"><button class="secondary-button" type="button" data-flow-action="supplier-onboarding-full">${approved ? "View Supplier Review" : "Complete Supplier Review"}</button><button class="primary-button" type="button" data-flow-action="add-supply-picker">+ Add Supply</button></div></div>
    <section class="supplier-review-strip ${approved ? "is-approved" : "is-required"}"><div class="supplier-review-icon">${approved ? "✓" : "!"}</div><div><span class="eyebrow">REUSABLE SUPPLIER REVIEW</span><h2>${approved ? "Supplier profile approved" : "Supplier review required for first publication or response"}</h2><p><strong>First time:</strong> Eligibility → KYB → Rights. <strong>Every supply or response:</strong> Capacity → OpenNEXT Test → Approved.</p></div><div class="supplier-review-meta"><span>Status</span><strong>${approved ? "Approved · ON-QA-2048" : "Not started"}</strong><small>${approved ? "Reusable while evidence remains current" : "Usually completed once per legal entity"}</small></div></section>
    <div class="procurement-metrics"><div><span>Open buyer demand</span><strong>$1.57M</strong><small>Visible after mandate and scope checks</small></div><div><span>Response deadline</span><strong>6h median</strong><small>Per-request expiry is explicit</small></div><div><span>Evidence freshness</span><strong>92%</strong><small>Reviewed within the last 30 days</small></div><div><span>Fulfilment score</span><strong>96.4%</strong><small>Workspace snapshot</small></div></div>
    <section class="section add-supply-section"><div class="section-header"><div><div class="eyebrow">PUBLISH SUPPLY</div><h2>Add a new supply listing</h2><p>${ui("Choose what you supply. Set the specifications, price and delivery terms.", "选择供应类型，填写规格、价格与交付条件。")}</p></div><span class="badge badge-blue">Private quote workflow</span></div><div class="supply-type-grid"><article><span class="supply-type-icon">M</span><div><h3>Model Capacity</h3><p>Native access, enterprise allocation or partner-delivered model capacity with quota and committed TPS.</p></div><button class="secondary-button compact" type="button" data-flow-action="add-supply" data-supply-type="model">Add model supply</button></article><article><span class="supply-type-icon">A</span><div><h3>Accelerator Rental</h3><p>On-demand, scheduled or dedicated accelerator capacity with calendar, topology and hourly rate.</p></div><button class="secondary-button compact" type="button" data-flow-action="add-supply" data-supply-type="accelerator">Add accelerator rental</button></article><article><span class="supply-type-icon">G</span><div><h3>Physical GPU Sale</h3><p>Whole-GPU inventory with condition, form factor, quantity, location, lead time and warranty.</p></div><button class="secondary-button compact" type="button" data-flow-action="add-supply" data-supply-type="hardware">Add GPU inventory</button></article></div></section>
    ${sellerReputationSection()}
    <section class="section supply-demand-board"><div class="section-header"><div><h2>RFQs accepting responses</h2><p>Respond only when authorization class, capacity, term and delivery method can be stated precisely.</p></div><span class="badge badge-gray">Invite and mandate controls apply</span></div><div class="demand-tape procurement-tape"><div class="demand-grid-head"><span>Requirement</span><span>Notional / term</span><span>Throughput / region</span><span>Provenance / responses</span><span>Action</span></div>${demandTape.map((item) => demandRow(item, true)).join("")}</div></section>
    <section class="section supply-rules"><div><span class="badge badge-green">Authorized supply</span><h3>Evidence before quotation</h3><p>State the rights holder, allocation authority, expiry, revocation rules and the exact access the buyer receives.</p></div><div><span class="badge badge-blue">Technical delivery</span><h3>Do not imply upstream endorsement</h3><p>A successful capacity test proves technical delivery only. It does not create resale authorization.</p></div><div><span class="badge badge-amber">Private OTC</span><h3>Separate risk lane</h3><p>Non-authorized supply remains private, carries an explicit risk label and is excluded from public inventory and benchmarks.</p></div></section>
  </div>`;
}

function formatAvailability(raw) {
  const value = String(raw.nextAvailableAt || raw.availability || "Available now");
  if (value === "Now" || /available now/i.test(value)) return "Available now";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):\d{2}([+-]\d{2}):?\d{2}$/);
  if (!match) return value;
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(match[2]) - 1];
  const zone = match[6] === "+09" ? "JST" : match[6] === "+08" ? "SGT" : "Local";
  return `Available ${Number(match[3])} ${month}, ${match[4]}:${match[5]} ${zone}`;
}

function gpuAction(raw, g) {
  const term = String(g.term).toLowerCase();
  const startsNow = String(raw.nextAvailableAt || "").toLowerCase() === "now";
  if (term.includes("managed inference")) return { label: "Managed Slot Inquiry", type: "hosted", className: "secondary-button" };
  if (term.includes("dedicated")) return { label: "Private Cluster RFQ", type: "gpu", className: "secondary-button" };
  if (term.includes("scheduled") || !startsNow) return { label: "Request Quote", type: "gpu", className: "secondary-button" };
  return { label: "Instant Reserve", type: "instant", className: "primary-button" };
}

function gpuCard(raw, index) {
  const g = gpuView(raw);
  const action = gpuAction(raw, g);
  const cta = action.type === "instant"
    ? `<button class="${action.className} compact" type="button" data-flow-action="gpu-reserve-full" data-gpu-id="${escapeHtml(g.id)}">${action.label}</button>`
    : `<button class="${action.className} compact" type="button" data-proc-action="post-rfq" data-rfq-type="${action.type}" data-family="${escapeHtml(g.name)}">${action.label}</button>`;
  const availability = Array.from({ length: 14 }, (_, cell) => `<span class="${(cell + index) % 7 === 5 ? "limited" : cell < Math.min(11, Math.max(6, Math.round(g.available / 10))) ? "available" : ""}"></span>`).join("");
  return `<article class="gpu-card procurement-gpu-card"><div class="gpu-card-head"><h3>${escapeHtml(g.name)}<span>${escapeHtml(g.vendor)} · ${escapeHtml(g.region)}</span></h3><span class="badge badge-green">Calendar checked</span></div><div class="gpu-price">$${Number(g.price || g.unitPrice).toFixed(2)}<small> / accelerator·h</small></div><div class="gpu-specs"><div class="gpu-spec"><span>Availability</span><strong>${g.available} units</strong></div><div class="gpu-spec"><span>Ready</span><strong>${escapeHtml(formatAvailability(raw))}</strong></div><div class="gpu-spec"><span>Topology</span><strong>${escapeHtml(g.topology)}</strong></div><div class="gpu-spec"><span>SLA</span><strong>${g.sla.toFixed(2)}%</strong></div></div><div class="availability-bar" aria-label="Next 14 days availability">${availability}</div><div class="gpu-card-actions"><span class="badge badge-gray">${escapeHtml(g.term)}</span><div class="button-row"><button class="ghost-button compact" type="button" data-proc-action="gpu-detail" data-gpu-id="${escapeHtml(g.id)}">Details</button>${cta}</div></div></article>`;
}

function demandStars(score) {
  const full = Math.floor(score);
  const half = score % 1 ? "½" : "";
  return `<span class="demand-stars" aria-label="${score} out of 5 demand rating">${"★".repeat(full)}${half}</span>`;
}

function gpuListingAction(item) {
  if (item.transactionMode === "instant") return { label: "Instant Reserve", action: "gpu-reserve-full", actionScope: "flow", className: "primary-button", type: "gpu" };
  if (item.transactionMode === "cluster") return { label: "Private Cluster RFQ", action: "post-rfq", className: "secondary-button", type: "gpu" };
  if (item.transactionMode === "managed") return { label: "Managed Slot Inquiry", action: "post-rfq", className: "secondary-button", type: "hosted" };
  return { label: "Request Quote", action: "post-rfq", className: "secondary-button", type: "gpu" };
}

function gpuListingRow(item) {
  const demand = gpuDemandRatings.find((row) => row.accelerator === item.accelerator) || { demandScore: 3, marketPosition: "Developing", useCase: "AI compute" };
  const action = gpuListingAction(item);
  return `<tr>
    <td><span class="strong">${escapeHtml(item.accelerator)}</span><span class="subline">${escapeHtml(item.memory)} · ${escapeHtml(item.topology)}</span></td>
    <td><span class="strong">${escapeHtml(item.supplier)}</span><span class="subline">${escapeHtml(item.region)} · ${item.sla}% SLA</span>${ratingPill(item.supplier)}</td>
    <td class="numeric"><span class="strong">$${item.pricePerHour.toFixed(2)}</span><span class="subline">per accelerator·h</span></td>
    <td class="numeric"><span class="strong">${item.units} units</span><span class="subline">${escapeHtml(item.term)}</span></td>
    <td><span class="strong">${escapeHtml(item.availability)}</span><span class="subline">${escapeHtml(demand.useCase)}</span></td>
    <td>${demandStars(demand.demandScore)}<span class="subline">${escapeHtml(demand.marketPosition)}</span></td>
    <td><button class="${action.className} compact" type="button" data-${action.actionScope || "proc"}-action="${action.action}" data-rfq-type="${action.type}" data-family="${escapeHtml(item.accelerator)}" data-gpu-listing-id="${escapeHtml(item.id)}">${action.label}</button></td>
  </tr>`;
}

function hardwareListingRow(item) {
  return `<tr>
    <td><span class="strong">${escapeHtml(item.accelerator)}</span><span class="subline">${escapeHtml(item.memory)} · ${escapeHtml(item.formFactor)}</span></td>
    <td><span class="hardware-condition">${escapeHtml(item.condition)}</span><span class="subline">${escapeHtml(item.inspection)}</span></td>
    <td><span class="strong">${escapeHtml(item.supplier)}</span><span class="subline">${escapeHtml(item.region)} · ${item.verified ? "Verified supplier" : "Review pending"}</span>${ratingPill(item.supplier)}</td>
    <td class="numeric"><span class="strong hardware-price">$${item.unitPriceUsd.toLocaleString("en-US")}</span><span class="subline">whole GPU · indicative ask</span></td>
    <td class="numeric"><span class="strong">${item.quantity} GPUs</span><span class="subline">MOQ ${item.minOrder}</span></td>
    <td><span class="strong">${escapeHtml(item.leadTime)}</span><span class="subline">${escapeHtml(item.warranty)}</span></td>
    <td><div class="board-actions"><button class="ghost-button compact" type="button" data-flow-action="hardware-detail" data-hardware-id="${escapeHtml(item.id)}">Details</button><button class="primary-button compact" type="button" data-flow-action="hardware-rfq" data-hardware-id="${escapeHtml(item.id)}">Request hardware quote</button></div></td>
  </tr>`;
}

export function renderGpus() {
  const hardwareMode = procurementState.gpuMode === "hardware";
  if (hardwareMode) {
    const regions = [...new Set(gpuHardwareListings.map((item) => item.region))];
    const conditions = [...new Set(gpuHardwareListings.map((item) => item.condition))];
    const filtered = gpuHardwareListings
      .filter((item) => (procurementState.hardwareRegion === "all" || item.region === procurementState.hardwareRegion) && (procurementState.hardwareCondition === "all" || item.condition === procurementState.hardwareCondition))
      .sort((a, b) => procurementState.hardwareSort === "price_desc" ? b.unitPriceUsd - a.unitPriceUsd : procurementState.hardwareSort === "quantity_desc" ? b.quantity - a.quantity : a.unitPriceUsd - b.unitPriceUsd);
    const sellers = new Set(filtered.map((item) => item.supplier)).size;
    const units = filtered.reduce((sum, item) => sum + item.quantity, 0);
    const h100 = gpuHardwareListings.filter((item) => item.accelerator.startsWith("H100")).map((item) => item.unitPriceUsd).sort((a,b) => a-b);
    const medianH100 = Math.round((h100[0] + h100[h100.length - 1]) / 2);
    return `<div class="page gpu-procurement"><div class="page-head"><div><div class="eyebrow">${ui("MARKETPLACE / GPU", "市场 / GPU")}</div><h1>${ui("GPU market.", "GPU 市场。")}</h1><p>${ui("Cloud capacity or physical hardware. Find the right supply for your workload.", "云端算力与实体设备，为业务寻找合适的 GPU 供应。")}</p></div><button class="primary-button compact" type="button" data-flow-action="add-supply" data-supply-type="hardware">+ Sell GPU inventory</button></div>
      <div class="gpu-market-tabs" role="tablist"><button type="button" data-flow-action="gpu-market-mode" data-mode="rental">Cloud Rental</button><button class="is-active" type="button" data-flow-action="gpu-market-mode" data-mode="hardware">Buy Physical GPUs</button></div>
      <div class="procurement-metrics"><div><span>Hardware listings</span><strong>${filtered.length}</strong><small>${gpuHardwareListings.length} indicative opportunities</small></div><div><span>Verified sellers</span><strong>${sellers}</strong><small>KYB and contact authority reviewed</small></div><div><span>Whole GPUs listed</span><strong>${compactNumber.format(units)}</strong><small>Across visible inventory</small></div><div><span>Median H100 ask</span><strong>$${compactNumber.format(medianH100)}</strong><small>Per whole GPU · indicative</small></div></div>
      <div class="filter-bar hardware-filter-bar"><select aria-label="${ui("Hardware location", "设备所在地")}" id="hardwareRegion" class="select"><option value="all">All locations</option>${regions.map((item) => `<option value="${escapeHtml(item)}" ${procurementState.hardwareRegion === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select><select aria-label="${ui("Hardware condition", "设备成色")}" id="hardwareCondition" class="select"><option value="all">All conditions</option>${conditions.map((item) => `<option value="${escapeHtml(item)}" ${procurementState.hardwareCondition === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select><select aria-label="${ui("Sort hardware", "设备排序")}" id="hardwareSort" class="select"><option value="price_asc" ${procurementState.hardwareSort === "price_asc" ? "selected" : ""}>Price: low to high</option><option value="price_desc" ${procurementState.hardwareSort === "price_desc" ? "selected" : ""}>Price: high to low</option><option value="quantity_desc" ${procurementState.hardwareSort === "quantity_desc" ? "selected" : ""}>Available quantity</option></select><span class="badge badge-green">Whole-GPU purchase</span></div>
      <section class="market-board gpu-hardware-board"><div class="market-board-head"><div><span class="eyebrow">QUALIFIED HARDWARE SUPPLY</span><h2>Available physical GPU inventory</h2><p>${ui("Per-unit hardware prices. Confirm condition, warranty, logistics and acceptance in the final quote.", "按实体设备计价；成色、保修、物流与验收要求在最终报价中确认。")}</p></div><span class="badge badge-gray">${procurementMeta.dataMode}</span></div><div class="table-wrap"><table class="data-table gpu-hardware-table"><thead><tr><th>GPU / form factor</th><th>Condition / inspection</th><th>Seller / location</th><th>Whole GPU price</th><th>Quantity / MOQ</th><th>Lead time / warranty</th><th></th></tr></thead><tbody>${filtered.map(hardwareListingRow).join("") || `<tr><td colspan="7" class="empty-market">${ui("No inventory matches these filters. Try another location or condition.", "没有符合筛选的库存，请调整所在地或设备成色。")}</td></tr>`}</tbody></table></div></section>
      <section class="gpu-action-legend"><div><strong>Verified supplier</strong><span>KYB, business contact authority and listing ownership evidence reviewed.</span></div><div><strong>Inspection evidence</strong><span>Serial, condition and test evidence stay distinct from manufacturer authorization.</span></div><div><strong>Hardware RFQ</strong><span>Quantity, target price, delivery location, warranty and acceptance criteria are confirmed privately.</span></div></section></div>`;
  }
  const regions = [...new Set(gpuSupplyListings.map((item) => item.region))];
  const accelerators = [...new Set(gpuSupplyListings.map((item) => item.accelerator))];
  const filtered = gpuSupplyListings.filter((item) => (state.gpuRegion === "all" || item.region === state.gpuRegion) && (state.gpuTerm === "all" || item.accelerator === state.gpuTerm));
  return `<div class="page gpu-procurement"><div class="page-head"><div><div class="eyebrow">${ui("MARKETPLACE / GPU", "市场 / GPU")}</div><h1>${ui("GPU market.", "GPU 市场。")}</h1><p>${ui("Cloud capacity or physical hardware. Find the right supply for your workload.", "云端算力与实体设备，为业务寻找合适的 GPU 供应。")}</p></div><button class="primary-button compact" type="button" data-flow-action="add-supply" data-supply-type="accelerator">+ Add accelerator supply</button></div>
    <div class="gpu-market-tabs" role="tablist"><button class="is-active" type="button" data-flow-action="gpu-market-mode" data-mode="rental">Cloud Rental</button><button type="button" data-flow-action="gpu-market-mode" data-mode="hardware">Buy Physical GPUs</button></div>
    <div class="procurement-metrics"><div><span>Visible supply listings</span><strong>${filtered.length}</strong><small>${gpuSupplyListings.length} total across 10 accelerator families</small></div><div><span>Verified operators</span><strong>12</strong><small>Qualified operator set</small></div><div><span>Units signalled</span><strong>${compactNumber.format(filtered.reduce((sum, item) => sum + item.units, 0))}</strong><small>Indicative availability</small></div><div><span>Demand-weighted mix</span><strong>5.0 → 3.0</strong><small>Based on the supplied demand rating</small></div></div>
    <div class="filter-bar"><select aria-label="${ui("GPU region", "GPU 地区")}" id="gpuRegion" class="select"><option value="all">All regions</option>${regions.map((item) => `<option value="${escapeHtml(item)}" ${state.gpuRegion === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select><select aria-label="${ui("Accelerator model", "加速器型号")}" id="gpuTerm" class="select"><option value="all">All accelerators</option>${accelerators.map((item) => `<option value="${escapeHtml(item)}" ${state.gpuTerm === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select><span class="badge badge-green">Demand-weighted supply snapshot</span></div>
    <section class="market-board gpu-supply-board"><div class="market-board-head"><div><span class="eyebrow">QUALIFIED GPU SUPPLY BOARD</span><h2>Available to reserve or quote</h2><p>${ui("Compare hourly rates, topology, availability and supplier terms.", "比较小时费率、网络拓扑、可用时间与供应条款。")}</p></div><span class="badge badge-gray">${procurementMeta.dataMode}</span></div><div class="table-wrap"><table class="data-table gpu-listing-table"><thead><tr><th>Accelerator / topology</th><th>Supplier / region</th><th>Rate</th><th>Quantity / term</th><th>Availability / use case</th><th>Demand rating</th><th></th></tr></thead><tbody>${filtered.map(gpuListingRow).join("") || `<tr><td colspan="7" class="empty-market">${ui("No capacity matches these filters. Try another region or accelerator.", "没有符合筛选的容量，请调整地区或加速器型号。")}</td></tr>`}</tbody></table></div></section>
    <details class="gpu-demand-mix workspace-reference"><summary>${ui("Accelerator demand overview", "加速器需求概览")}<span aria-hidden="true">+</span></summary><div class="section-header"><div><p>${ui("Illustrative demand scores on a five-point scale. These are not published market indices.", "五分制演示需求评级，不代表公开市场指数。")}</p></div></div><div class="gpu-demand-grid">${gpuDemandRatings.map((item) => `<div><strong>${escapeHtml(item.accelerator)}</strong><span>${escapeHtml(item.memory)}</span>${demandStars(item.demandScore)}<small>${gpuSupplyListings.filter((offer) => offer.accelerator === item.accelerator).length} supplier listings · ${escapeHtml(item.marketPosition)}</small></div>`).join("")}</div></details>
    <section class="gpu-action-legend"><div><strong>Instant Reserve</strong><span>Inventory can be locked and paid immediately.</span></div><div><strong>Request Quote</strong><span>Scheduled or non-immediate standard GPU capacity.</span></div><div><strong>Private Cluster RFQ</strong><span>Large clusters, long terms, dedicated networks or custom images.</span></div><div><strong>Managed Slot Inquiry</strong><span>Provider-managed systems such as an NVL72 managed allocation.</span></div></section></div>`;
}


function marketCoverageRow(item, market) {
  const value = market === "model" ? `${item.value.toFixed(2)}×` : `${item.value.toFixed(2)} / h`;
  const sample = market === "model" ? `${item.quotes} quotes · ${item.settled} settled` : `${item.observations} observations · ${item.reservations} reservations`;
  return `<tr><td><span class="strong">${escapeHtml(item.name)}</span><span class="subline">${escapeHtml(item.family || "GPU capacity")}</span></td><td class="numeric"><span class="strong">${value}</span><span class="subline">${item.change7d > 0 ? "+" : ""}${item.change7d.toFixed(1)}% · 7D</span></td><td>${escapeHtml(item.volume)}</td><td>${escapeHtml(sample)}</td><td><span class="quote-state ${item.state.includes("Firm") ? "is-firm" : "is-indicative"}">${escapeHtml(item.state)}</span></td><td>${escapeHtml(item.confidence)}</td><td><button class="secondary-button compact" type="button" data-flow-action="market-asset" data-asset="${escapeHtml(item.id)}">Open</button></td></tr>`;
}

export function renderData() {
  const market = procurementState.dataMarket === "gpu" ? "gpu" : "model";
  const catalog = market === "model" ? modelMarketData : gpuMarketData;
  if (!catalog.some((item) => item.id === procurementState.dataAsset)) procurementState.dataAsset = catalog[0].id;
  const selected = catalog.find((item) => item.id === procurementState.dataAsset) || catalog[0];
  const range = [7, 14, 30].includes(Number(procurementState.dataRange)) ? Number(procurementState.dataRange) : 14;
  const primary = selected.series.slice(-range);
  const benchmark = primary.map((_, index) => {
    const absoluteIndex = 30 - range + index;
    return Number((catalog.reduce((sum, item) => sum + item.series[absoluteIndex], 0) / catalog.length).toFixed(3));
  });
  const value = market === "model" ? `${selected.value.toFixed(2)}×` : `${selected.value.toFixed(2)} / h`;
  const sample = market === "model" ? `${selected.quotes} qualified quotes` : `${selected.observations} observations`;
  const settled = market === "model" ? `${selected.settled} settled trades` : `${selected.reservations} reservations`;
  const chartTitle = market === "model" ? `${selected.name} capacity pricing` : `${selected.name} reservation pricing`;
  const chartCaption = market === "model"
    ? ui("Public API equivalent = 1.00× · selected market vs model-market average", "公开 API 等值基准 = 1.00× · 所选市场与模型市场均值")
    : ui("Per accelerator-hour · selected market vs GPU-market average", "加速器·小时单价 · 所选市场与 GPU 市场均值");
  const suffix = market === "model" ? "×" : "";
  return `<div class="page market-data-early"><div class="page-head"><div><div class="eyebrow">${ui("MARKETPLACE / INTELLIGENCE", "市场 / 数据洞察")}</div><h1>${ui("Market intelligence.", "市场数据洞察。")}</h1><p>${ui("Price trends with clear units, sample sizes and publication criteria.", "查看价格趋势、计价单位、样本规模与发布标准。")}</p></div><span class="market-mode-badge">${procurementMeta.updatedAt}</span></div>
    <div class="market-data-tabs" role="tablist"><button class="${market === "model" ? "is-active" : ""}" type="button" data-flow-action="market-tab" data-market="model">Model Capacity</button><button class="${market === "gpu" ? "is-active" : ""}" type="button" data-flow-action="market-tab" data-market="gpu">GPU Capacity</button></div>
    <section class="market-data-console"><div class="market-data-controls"><label><span>Market</span><select id="marketDataAsset" class="select">${catalog.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selected.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label><div><span>Observation window</span><div class="range-switch">${[7,14,30].map((days) => `<button class="${range === days ? "is-active" : ""}" type="button" data-flow-action="market-range" data-range="${days}">${days}D</button>`).join("")}</div></div><button class="secondary-button compact" type="button" data-route="docs">Methodology & data guide</button></div>
      <div class="market-focus-grid"><article><span>Current signal</span><strong>${value}</strong><small>${selected.change7d > 0 ? "+" : ""}${selected.change7d.toFixed(1)}% over 7D</small></article><article><span>Sample</span><strong>${sample}</strong><small>${settled}</small></article><article><span>Observed volume</span><strong>${escapeHtml(selected.volume)}</strong><small>${range}-day view</small></article><article><span>Publication state</span><strong>${escapeHtml(selected.state)}</strong><small>${escapeHtml(selected.confidence)} confidence</small></article></div>
      <div class="panel market-data-chart"><div class="section-header"><div><h2>${escapeHtml(chartTitle)} · ${range}D</h2><p>${chartCaption}</p></div><span class="quote-state ${selected.state.includes("Firm") ? "is-firm" : "is-indicative"}">${escapeHtml(selected.state)}</span></div>${lineChart(primary, benchmark, suffix)}</div>
    </section>
    <section class="section market-coverage"><div class="section-header"><div><h2>${market === "model" ? "Model Capacity coverage" : "GPU Capacity coverage"}</h2><p>${market === "model" ? "Claude, GPT, Gemini, DeepSeek, Kimi and GLM are tracked independently." : "Coverage follows the ten accelerator families used in the procurement market."}</p></div><span class="badge badge-blue">${catalog.length} markets</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Market</th><th>Current / 7D</th><th>Volume</th><th>Sample</th><th>State</th><th>Confidence</th><th></th></tr></thead><tbody>${catalog.map((item) => marketCoverageRow(item, market)).join("")}</tbody></table></div></section>
    <section class="publication-gate"><div><span class="status-dot status-dot-green"></span><strong>Settled transaction</strong><small>Eligible after integrity checks</small></div><div><span class="status-dot status-dot-green"></span><strong>Firm quote</strong><small>Shown as depth, not counted as a trade</small></div><div><span class="status-dot status-dot-amber"></span><strong>Indicative observation</strong><small>Published with confidence and sample</small></div><div><span class="status-dot"></span><strong>Below threshold</strong><small>No Print until the publication gate is met</small></div></section>
  </div>`;
}

export function renderDocs() {
  return `<div class="page docs-page"><div class="page-head"><div><div class="eyebrow">${ui("RESOURCES / DOCUMENTATION", "资源 / 操作指南")}</div><h1>${ui("A practical guide.", "OpenNEXT 操作指南。")}</h1><p>${ui("Everything you need to buy, supply and manage capacity.", "了解容量采购、供应发布与工作台管理。")}</p></div><button class="primary-button compact" type="button" data-proc-action="post-rfq">Post RFQ</button></div>
    <section class="docs-quick-grid"><button type="button" data-route="models"><span>01</span><strong>Buy Native Capacity</strong><p>Discover provenance, request quotes, compare evidence and confirm allocation.</p></button><button type="button" data-route="supply"><span>02</span><strong>Respond to RFQs</strong><p>Complete qualification, submit a standardized response and track fulfilment.</p></button><button type="button" data-route="gpus"><span>03</span><strong>Reserve GPU Capacity</strong><p>Select quantity, start time and duration while checking calendar conflicts.</p></button><button type="button" data-flow-action="messages"><span>04</span><strong>Messages & negotiation</strong><p>Confirm technical, commercial and delivery details with counterparties.</p></button></section>
    <section class="docs-section"><div><span class="eyebrow">BUYER WORKFLOW</span><h2>From demand to active capacity</h2></div><ol><li><strong>Post a structured RFQ</strong><span>Select Model, GPU, Hosted or Private OTC and define hard requirements.</span></li><li><strong>Compare qualified responses</strong><span>Review authorization class, rate, allocation, delivery, SLA and reputation.</span></li><li><strong>Confirm and test</strong><span>Lock commercial terms, run the capacity test and approve acceptance criteria.</span></li><li><strong>Contract and activate</strong><span>Complete contract, settlement instruction, allocation and access handover.</span></li><li><strong>Record fulfilment</strong><span>Track usage term, support events and mutual review eligibility.</span></li></ol></section>
    <section class="docs-section"><div><span class="eyebrow">SUPPLIER WORKFLOW</span><h2>Qualification and RFQ response</h2></div><ol><li><strong>Organization KYB</strong><span>Provide legal entity, ownership and authorized respondent details.</span></li><li><strong>Rights and provenance</strong><span>State the rights holder, allocation authority, expiry and revocation rules.</span></li><li><strong>Capacity evidence</strong><span>Declare quota, throughput, region, term, topology and isolation.</span></li><li><strong>Controlled test</strong><span>Verify technical delivery without overstating upstream authorization.</span></li><li><strong>Quote and fulfil</strong><span>Submit standardized terms, communicate with the buyer and maintain a fulfilment record.</span></li></ol></section>
    <section class="docs-faq"><h2>Frequently used controls</h2><details open><summary>How do I continue an RFQ?</summary><p>Open My RFQs and choose Continue. The workflow opens at the current stage with the next required action.</p></details><details><summary>How are GPU conflicts handled?</summary><p>Instant Reserve calculates the requested end time and checks it against protected future reservations before confirmation.</p></details><details><summary>Where can I contact a supplier?</summary><p>Use Message from a market row, quote room or workflow receipt, or open Messages from the sidebar.</p></details><details><summary>What does OpenNEXT review?</summary><p>The qualification record separates rights evidence, technical capacity testing and actual buyer delivery. Technical success never creates authorization.</p></details></section>
  </div>`;
}

export function renderScheduler() {
  const html = renderBaseScheduler()
    .replace("Smart Orchestrator", ui("WORKSPACE / CAPACITY OPTIMIZER", "工作台 / 容量优化"))
    .replace("任务级「模型 + 执行芯片」智能调度", ui("A better execution plan.", "为任务选择合适的算力。"))
    .replace("先拆复杂任务，再逐步匹配已验证容量。硬约束先过滤，随后在预期效果、成本、延迟与可靠性之间优化。", ui("Match each task with capacity that fits your quality, cost and latency targets.", "根据效果、成本与延迟要求，为每一步任务匹配容量。"))
    .replaceAll("✦ ", "");
  return html.replace(/<div class="page scheduler-page">/, `<div class="page scheduler-page"><section class="optional-tool-banner"><span class="badge badge-gray">${ui("SIMULATION", "模拟环境")}</span><div><strong>${ui("Plan before you run.", "执行前，先验证计划。")}</strong><p>${ui("Explore task routes, fallback and estimated usage on demo capacity. No production traffic is sent.", "使用演示容量查看任务路线、回退与预计用量，不会调用生产服务。")}</p></div></section>`);
}
