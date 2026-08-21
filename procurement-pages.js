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
} from "./demo-core.js";
import { renderScheduler as renderBaseScheduler } from "./demo-pages.js";
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
  procurementState,
  ratingPolicy,
  completedTransactions,
  currentBuyerReputation,
  currentSellerReputation,
  getSupplierReputation,
  getProvenance,
  isNativeType,
} from "./procurement-data.js";

const referenceByFamily = {
  Claude: "Anthropic public API equivalent",
  GPT: "OpenAI public API equivalent",
  Gemini: "Google public API equivalent",
  Kimi: "Moonshot public API equivalent",
  GLM: "Zhipu public API equivalent",
  DeepSeek: "DeepSeek public API equivalent",
};

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
  return `<section class="section feedback-section"><div class="section-header"><div><div class="eyebrow">VERIFIED MUTUAL FEEDBACK</div><h2>Reviews unlock after the service term</h2><p>Only settled transactions can be reviewed. Buyer and seller feedback stays blind until both submit or the 14-day review window closes.</p></div><span class="badge badge-blue">5-point scale</span></div><div class="table-wrap"><table class="data-table feedback-table"><thead><tr><th>Transaction</th><th>Product / counterparty</th><th>Service term ended</th><th>Review status</th><th></th></tr></thead><tbody>${completedTransactions.map((item) => `<tr><td><span class="strong">${escapeHtml(item.id)}</span><span class="subline">${escapeHtml(item.role)}</span></td><td><span class="strong">${escapeHtml(item.product)}</span><span class="subline">${escapeHtml(item.counterparty)}</span></td><td>${escapeHtml(item.usageEndedAt)}</td><td><span class="badge ${item.reviewEligible ? "badge-green" : "badge-gray"}">${escapeHtml(item.reviewStatus)}</span></td><td>${item.reviewEligible ? `<button class="primary-button compact" type="button" data-proc-action="rate-transaction" data-transaction-id="${item.id}">Rate counterparty</button>` : '<span class="rating-locked">Locked</span>'}</td></tr>`).join("")}</tbody></table></div><div class="rating-policy-grid"><div><strong>Communication & attitude</strong><span>Clarity, responsiveness and professional conduct</span></div><div><strong>Delivery speed</strong><span>Allocation or infrastructure delivered against commitment</span></div><div><strong>Operational / usage quality</strong><span>Availability, throughput, stability and specification match</span></div><div><strong>After-sales support</strong><span>Issue handling, remediation and service follow-through</span></div></div></section>`;
}



function sellerReputationSection() {
  const score = currentSellerReputation;
  const buyer = currentBuyerReputation;
  return `<section class="counterparty-scorecard"><div class="seller-score-overview"><span class="eyebrow">YOUR SELLER REPUTATION</span><div class="seller-score-main">${ratingStars(score.overall)}<strong>${score.overall.toFixed(2)}</strong></div><small>${score.completedTrades} completed trades · mutual feedback only</small></div><div><span>Communication</span><strong>${score.dimensions.communication.toFixed(1)}</strong></div><div><span>Delivery speed</span><strong>${score.dimensions.delivery.toFixed(1)}</strong></div><div><span>Usage quality</span><strong>${score.dimensions.quality.toFixed(1)}</strong></div><div><span>After-sales support</span><strong>${score.dimensions.support.toFixed(1)}</strong></div></section><section class="buyer-trust-strip"><div><span class="eyebrow">BUYER REPUTATION IS ALSO VISIBLE</span><strong>Counterparty trust before you respond</strong><p>Suppliers see the buyer's completed trades, communication, acceptance speed and payment reliability before quoting.</p></div><div class="buyer-trust-score">${ratingStars(buyer.overall)}<strong>${buyer.overall.toFixed(2)}</strong><small>${buyer.completedTrades} completed · ${buyer.paymentOnTimePct}% on-time payment</small></div></section>`;
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
  return `<tr>
    <td><span class="strong">${escapeHtml(model.name)}</span><span class="subline">${escapeHtml(offer.providerName)}</span>${ratingPill(offer.id)}</td>
    <td>${provenanceBadge(meta, true)}<span class="subline">${escapeHtml(meta.category)}</span></td>
    <td><span class="quote-state is-indicative">Indicative</span><span class="strong quote-rate">${rate.toFixed(3)}×</span><span class="subline">${escapeHtml(reference)}</span></td>
    <td class="numeric"><span class="strong">$${total.toLocaleString("en-US")}</span><span class="subline">Platform fee included</span></td>
    <td class="numeric"><span class="strong">${compactMoney.format(offer.availableOevUsd)}</span><span class="subline">${compactNumber.format(offer.tpm)} TPM</span></td>
    <td><span class="strong">${validityWindows[index % validityWindows.length]}</span><span class="subline">${escapeHtml(meta.buyerReceives)}</span></td>
    <td><div class="board-actions"><button class="ghost-button compact" type="button" data-proc-action="view-passport" data-provider-id="${escapeHtml(offer.id)}">Passport</button><button class="ghost-button compact" type="button" data-flow-action="open-chat" data-supplier="${escapeHtml(offer.providerName)}" data-context="${escapeHtml(model.name)}">Message</button><button class="primary-button compact" type="button" data-proc-action="post-rfq" data-rfq-type="native_model" data-family="${escapeHtml(model.name)}">Request quote</button></div></td>
  </tr>`;
}

function demandRow(item, responseAction = false) {
  return `<div class="demand-row procurement-demand-row"><div class="demand-model"><span class="live-dot"></span><div><strong>${escapeHtml(item.model)}</strong><span>${escapeHtml(item.id)} · ${escapeHtml(item.type)}</span></div></div><div class="demand-notional"><strong>${escapeHtml(item.notional)}</strong><span>${escapeHtml(item.term)}</span></div><div class="demand-throughput"><strong>${escapeHtml(item.throughput)}</strong><span>${escapeHtml(item.region)}</span></div><div class="demand-source"><span class="badge badge-blue">${escapeHtml(item.provenance)}</span><small>${item.responses} responses · ${escapeHtml(item.age)} ago</small></div>${responseAction ? `<button class="secondary-button compact" type="button" data-flow-action="respond-rfq-full" data-rfq-id="${escapeHtml(item.id)}">Respond</button>` : ""}</div>`;
}

function referenceGuide() {
  return `<section class="reference-guide"><div><span class="reference-step">1.00×</span><strong>Public API equivalent</strong><p>The model provider's public input and output rate card at the quote timestamp.</p></div><div><span class="reference-step">OEV</span><strong>Official-equivalent value</strong><p>Input and output usage are converted using the named public rate card and workload mix.</p></div><div><span class="reference-step">Total</span><strong>Payable amount</strong><p>Includes the OpenNEXT platform fee; taxes, FX and optional delivery services are excluded.</p></div><div><span class="reference-step">State</span><strong>Indicative until confirmed</strong><p>No public order book is implied. A quote becomes firm only after bilateral confirmation and allocation lock.</p></div></section>`;
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
    <div class="page-head procurement-head"><div><div class="eyebrow">AI CAPACITY PROCUREMENT SYSTEM</div><h1>Native Market</h1><p>Discover qualified supply signals, issue private RFQs, compare standardized terms and preserve a complete fulfilment record.</p></div><span class="market-mode-badge">${procurementMeta.marketMode}</span></div>
    <div class="procurement-metrics"><div><span>Qualified supply signals</span><strong>${listings.length}</strong><small>Rights evidence or partner mandate reviewed</small></div><div><span>Available allocation signals</span><strong>${compactMoney.format(nativeCapacity)}</strong><small>Indicative · market snapshot</small></div><div><span>Active buyer RFQs</span><strong>${demandTape.length}</strong><small>Model, GPU and Private OTC</small></div><div><span>Median first response</span><strong>14m</strong><small>Last 24h</small></div></div>
    <section class="market-board">
      <div class="market-board-head"><div><span class="eyebrow">QUALIFIED SUPPLY BOARD</span><h2>Available to quote</h2><p>Supplier options are visible for discovery, but execution remains a private RFQ—not a public order book.</p></div><span class="badge badge-gray">${procurementMeta.dataMode}</span></div>
      <div class="market-toolbar procurement-toolbar"><div class="provenance-filter">${filters.map(([id, label]) => `<button class="${procurementState.provenanceFilter === id ? "is-active" : ""}" type="button" data-proc-action="filter-provenance" data-filter="${id}"><span>${label}</span></button>`).join("")}</div><label class="market-search"><span>⌕</span><input id="nativeMarketSearch" value="${escapeHtml(procurementState.modelQuery)}" placeholder="Search Claude, GPT, Gemini…"></label></div>
      <div class="table-wrap supply-board-wrap"><table class="data-table supply-board-table"><thead><tr><th>Model / supplier</th><th>Supply provenance</th><th>Quote / reference</th><th>Total payable<br><small>$100k OEV</small></th><th>Available allocation</th><th>Valid until / delivery</th><th></th></tr></thead><tbody>${listings.map(quoteRow).join("")}</tbody></table></div>
      ${listings.length ? "" : '<div class="empty-market"><strong>No qualified supply matches this filter.</strong><span>Change the provenance filter or post a private RFQ.</span></div>'}
    </section>
    ${referenceGuide()}
    <section class="section demand-dashboard"><div class="section-header"><div><div class="eyebrow">LIVE DEMAND TAPE</div><h2>Structured buyer demand</h2><p>Demand is anonymized and available to qualified suppliers under the selected scope.</p></div><button class="secondary-button compact" type="button" data-route="supply">Supply / Respond to RFQs</button></div><div class="demand-tape procurement-tape"><div class="demand-grid-head"><span>Requirement</span><span>Notional / term</span><span>Throughput / region</span><span>Provenance / responses</span><span>Action</span></div>${demandTape.map((item) => demandRow(item, true)).join("")}</div></section>
  </div>`;
}

export function renderRfq() {
  return `<div class="page procurement-rfqs">
    <div class="page-head"><div><div class="eyebrow">BUY-SIDE WORKSPACE</div><h1>My RFQs</h1><p>Track every model, GPU and Private OTC request from matching through quote comparison, capacity testing, contracting and fulfilment.</p></div><span class="badge badge-green">5 active requests</span></div>
    <div class="procurement-metrics"><div><span>Active notional</span><strong>$1.57M</strong><small>Across model and GPU capacity</small></div><div><span>Qualified responses</span><strong>20</strong><small>Authorization class shown per response</small></div><div><span>Capacity tests</span><strong>3 / 4</strong><small>One test in progress</small></div><div><span>Median quote age</span><strong>22m</strong><small>Illustrative workspace data</small></div></div>
    <section class="section"><div class="section-header"><div><h2>Open requests</h2><p>Every request retains price, capacity, term, delivery method and fulfilment evidence.</p></div></div><div class="table-wrap"><table class="data-table rfq-ledger-table"><thead><tr><th>RFQ</th><th>Transaction type</th><th>Requirement</th><th>Term / region</th><th>Responses</th><th>Status</th><th></th></tr></thead><tbody>${demandTape.map((item) => `<tr><td><span class="strong">${escapeHtml(item.id)}</span><span class="subline">${escapeHtml(item.model)}</span></td><td>${escapeHtml(item.type)}</td><td><span class="strong">${escapeHtml(item.notional)}</span><span class="subline">${escapeHtml(item.throughput)}</span></td><td><span class="strong">${escapeHtml(item.term)}</span><span class="subline">${escapeHtml(item.region)}</span></td><td>${item.responses} qualified</td><td><span class="badge badge-blue">${escapeHtml(item.status)}</span></td><td><button class="secondary-button compact" type="button" data-flow-action="open-rfq-full" data-rfq-id="${escapeHtml(item.id)}">Continue</button></td></tr>`).join("")}</tbody></table></div></section>
    <section class="section"><div class="section-header"><div><div class="eyebrow">STANDARDIZED QUOTE ROOM · RFQ-8421</div><h2>Compare evidence, not price alone</h2><p>Claude Sonnet · $100k OEV · 30 days · 2M TPM · US</p></div><span class="badge badge-amber">Indicative responses</span></div><div class="table-wrap"><table class="data-table provenance-table"><thead><tr><th>Supplier</th><th>Authorization class</th><th>Quote / total</th><th>Allocation / throughput</th><th>Validity / delivery</th><th></th></tr></thead><tbody>${quoteComparison.map((quote) => { const meta = provenanceCatalog[quote.provenance]; return `<tr><td><span class="strong">${escapeHtml(quote.supplier)}</span><span class="subline">${escapeHtml(quote.highlight)}</span>${ratingPill(quote.supplier)}</td><td>${provenanceBadge(meta, true)}<span class="subline">${escapeHtml(meta.authorization)}</span></td><td><span class="quote-state is-indicative">${quote.quoteState}</span><span class="strong">${quote.rate.toFixed(3)}× · ${quote.total}</span><span class="subline">Platform fee ${quote.fee.toLowerCase()}</span></td><td><span class="strong">${quote.capacity}</span><span class="subline">${quote.throughput}</span></td><td><span class="strong">${quote.validUntil}</span><span class="subline">${quote.delivery} · ${quote.sla} SLA</span></td><td><div class="board-actions"><button class="ghost-button compact" type="button" data-flow-action="open-chat" data-supplier="${escapeHtml(quote.supplier)}" data-context="RFQ-8421">Message</button><button class="primary-button compact" type="button" data-flow-action="review-quote-full" data-supplier="${escapeHtml(quote.supplier)}">Review quote</button></div></td></tr>`; }).join("")}</tbody></table></div></section>
    <section class="transaction-record"><div><span>01</span><strong>Structured request</strong><small>Price basis, capacity, term and region</small></div><div><span>02</span><strong>Authorization review</strong><small>Rights class recorded without implied endorsement</small></div><div><span>03</span><strong>Capacity test</strong><small>Throughput, availability and delivery method</small></div><div><span>04</span><strong>Contract and allocation</strong><small>Firm terms, revocation and refund boundaries</small></div><div><span>05</span><strong>Fulfilment record</strong><small>Delivery events, SLA and settlement outcome</small></div></section>
    ${feedbackSection()}
  </div>`;
}

export function renderSupply() {
  return `<div class="page supply-workspace"><div class="page-head"><div><div class="eyebrow">SUPPLY-SIDE WORKSPACE</div><h1>Supply / Respond to RFQs</h1><p>Qualified suppliers and brokers discover structured demand, submit standardized responses and build a reusable fulfilment record.</p></div><button class="secondary-button" type="button" data-flow-action="supplier-onboarding-full">Start supplier review</button></div>
    <div class="procurement-metrics"><div><span>Open buyer demand</span><strong>$1.57M</strong><small>Visible after mandate and scope checks</small></div><div><span>Response deadline</span><strong>6h median</strong><small>Per-request expiry is explicit</small></div><div><span>Evidence freshness</span><strong>92%</strong><small>Reviewed within the last 30 days</small></div><div><span>Fulfilment score</span><strong>96.4%</strong><small>Workspace snapshot</small></div></div>
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

export function renderGpus() {
  const regions = [...new Set(gpuSupplyListings.map((item) => item.region))];
  const accelerators = [...new Set(gpuSupplyListings.map((item) => item.accelerator))];
  const filtered = gpuSupplyListings.filter((item) => (state.gpuRegion === "all" || item.region === state.gpuRegion) && (state.gpuTerm === "all" || item.accelerator === state.gpuTerm));
  return `<div class="page gpu-procurement"><div class="page-head"><div><div class="eyebrow">GPU PROCUREMENT</div><h1>GPU Market</h1><p>Demand-weighted supply discovery: high-demand chips carry more listings, while emerging and specialized systems remain visible through qualified RFQs.</p></div><span class="market-mode-badge">Reservation + private RFQ</span></div>
    <div class="procurement-metrics"><div><span>Visible supply listings</span><strong>${filtered.length}</strong><small>${gpuSupplyListings.length} total across 10 accelerator families</small></div><div><span>Verified operators</span><strong>12</strong><small>Qualified operator set</small></div><div><span>Units signalled</span><strong>${compactNumber.format(filtered.reduce((sum, item) => sum + item.units, 0))}</strong><small>Indicative availability</small></div><div><span>Demand-weighted mix</span><strong>5.0 → 3.0</strong><small>Based on the supplied demand rating</small></div></div>
    <div class="filter-bar"><select id="gpuRegion" class="select"><option value="all">All regions</option>${regions.map((item) => `<option value="${escapeHtml(item)}" ${state.gpuRegion === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select><select id="gpuTerm" class="select"><option value="all">All accelerators</option>${accelerators.map((item) => `<option value="${escapeHtml(item)}" ${state.gpuTerm === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select><span class="badge badge-green">Demand-weighted supply snapshot</span></div>
    <section class="market-board gpu-supply-board"><div class="market-board-head"><div><span class="eyebrow">QUALIFIED GPU SUPPLY BOARD</span><h2>Available to reserve or quote</h2><p>Inventory density follows demand: H100 and H200 lead, B200 follows, established inference and value chips remain broad, and new flagship clusters stay scarce but discoverable.</p></div><span class="badge badge-gray">${procurementMeta.dataMode}</span></div><div class="table-wrap"><table class="data-table gpu-listing-table"><thead><tr><th>Accelerator / topology</th><th>Supplier / region</th><th>Rate</th><th>Quantity / term</th><th>Availability / use case</th><th>Demand rating</th><th></th></tr></thead><tbody>${filtered.map(gpuListingRow).join("")}</tbody></table></div></section>
    <section class="gpu-demand-mix"><div class="section-header"><div><h2>Demand rating controls listing density</h2><p>The rating informs demo supply quantity; it does not claim to be a published market index.</p></div></div><div class="gpu-demand-grid">${gpuDemandRatings.map((item) => `<div><strong>${escapeHtml(item.accelerator)}</strong><span>${escapeHtml(item.memory)}</span>${demandStars(item.demandScore)}<small>${gpuSupplyListings.filter((offer) => offer.accelerator === item.accelerator).length} supplier listings · ${escapeHtml(item.marketPosition)}</small></div>`).join("")}</div></section>
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
  const chartCaption = market === "model" ? "Public API equivalent = 1.00× · selected market vs model-market median" : "Per accelerator-hour · selected market vs GPU-market median";
  const suffix = market === "model" ? "×" : "";
  return `<div class="page market-data-early"><div class="page-head"><div><div class="eyebrow">TRANSACTION-DERIVED MARKET DATA</div><h1>Market Data</h1><p>Model Capacity and GPU Capacity use separate datasets, units, observation rules and publication thresholds.</p></div><span class="market-mode-badge">${procurementMeta.updatedAt}</span></div>
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
  return `<div class="page docs-page"><div class="page-head"><div><div class="eyebrow">OPENNEXT DOCUMENTATION</div><h1>Product guide</h1><p>Operating guides for buyers, suppliers, qualification teams and workspace administrators.</p></div><button class="primary-button compact" type="button" data-proc-action="post-rfq">Post RFQ</button></div>
    <section class="docs-quick-grid"><button type="button" data-route="models"><span>01</span><strong>Buy Native Capacity</strong><p>Discover provenance, request quotes, compare evidence and confirm allocation.</p></button><button type="button" data-route="supply"><span>02</span><strong>Respond to RFQs</strong><p>Complete qualification, submit a standardized response and track fulfilment.</p></button><button type="button" data-route="gpus"><span>03</span><strong>Reserve GPU Capacity</strong><p>Select quantity, start time and duration while checking calendar conflicts.</p></button><button type="button" data-flow-action="messages"><span>04</span><strong>Messages & negotiation</strong><p>Confirm technical, commercial and delivery details with counterparties.</p></button></section>
    <section class="docs-section"><div><span class="eyebrow">BUYER WORKFLOW</span><h2>From demand to active capacity</h2></div><ol><li><strong>Post a structured RFQ</strong><span>Select Model, GPU, Hosted or Private OTC and define hard requirements.</span></li><li><strong>Compare qualified responses</strong><span>Review authorization class, rate, allocation, delivery, SLA and reputation.</span></li><li><strong>Confirm and test</strong><span>Lock commercial terms, run the capacity test and approve acceptance criteria.</span></li><li><strong>Contract and activate</strong><span>Complete contract, settlement instruction, allocation and access handover.</span></li><li><strong>Record fulfilment</strong><span>Track usage term, support events and mutual review eligibility.</span></li></ol></section>
    <section class="docs-section"><div><span class="eyebrow">SUPPLIER WORKFLOW</span><h2>Qualification and RFQ response</h2></div><ol><li><strong>Organization KYB</strong><span>Provide legal entity, ownership and authorized respondent details.</span></li><li><strong>Rights and provenance</strong><span>State the rights holder, allocation authority, expiry and revocation rules.</span></li><li><strong>Capacity evidence</strong><span>Declare quota, throughput, region, term, topology and isolation.</span></li><li><strong>Controlled test</strong><span>Verify technical delivery without overstating upstream authorization.</span></li><li><strong>Quote and fulfil</strong><span>Submit standardized terms, communicate with the buyer and maintain a fulfilment record.</span></li></ol></section>
    <section class="docs-faq"><h2>Frequently used controls</h2><details open><summary>How do I continue an RFQ?</summary><p>Open My RFQs and choose Continue. The workflow opens at the current stage with the next required action.</p></details><details><summary>How are GPU conflicts handled?</summary><p>Instant Reserve calculates the requested end time and checks it against protected future reservations before confirmation.</p></details><details><summary>Where can I contact a supplier?</summary><p>Use Message from a market row, quote room or workflow receipt, or open Messages from the sidebar.</p></details><details><summary>What does OpenNEXT review?</summary><p>The qualification record separates rights evidence, technical capacity testing and actual buyer delivery. Technical success never creates authorization.</p></details></section>
  </div>`;
}

export function renderScheduler() {
  const html = renderBaseScheduler().replace("Smart Orchestrator", "Capacity Optimizer · Optional");
  return html.replace(/<div class="page scheduler-page">/, '<div class="page scheduler-page"><section class="optional-tool-banner"><span class="badge badge-blue">Optional tool</span><div><strong>Procurement and execution records remain the core wedge.</strong><p>The optimizer demonstrates task decomposition on capacity already procured or connected; it does not promise to route every production workload.</p></div></section>');
}
