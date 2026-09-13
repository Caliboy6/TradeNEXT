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
} from "./demo-core.js?v=opennext-20260913-2";
import {
  phase1Meta,
  provenanceCatalog,
  demandTape,
  quoteComparison,
  phaseRoadmap,
  phaseState,
  getProvenance,
  isNativeType,
} from "./phase1-data.js?v=opennext-20260913-2";
import {
  renderGpus as renderBaseGpus,
  renderScheduler as renderBaseScheduler,
  renderData as renderBaseData,
} from "./demo-pages.js?v=opennext-20260913-2";

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
    <div class="market-card-actions"><button class="secondary-button compact" type="button" data-phase-action="view-passport" data-model-id="${escapeHtml(raw.id)}">View provenance passport</button><button class="primary-button compact" type="button" data-phase-action="new-native-rfq" data-family="${escapeHtml(model.family)}">Start an RFQ</button></div>
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
        <h1>Find genuinely verified<br><span>native AI capacity</span></h1>
        <p>Post one request and compare Native Direct, Native Allocated and Enterprise Partner quotes. Price, capacity, provenance and the access you actually receive are visible up front.</p>
        <div class="intent-switch" role="tablist"><button class="is-active" type="button" data-phase-action="intent-buy">Buy capacity</button><button type="button" data-phase-action="sell-capacity">Sell capacity</button></div>
        <div class="native-intent-box">
          <label for="nativeIntent">Describe the capacity you need</label>
          <textarea id="nativeIntent">Need $100k of native Claude Sonnet capacity for 30 days, at least 2M TPM, US region, delivered this week.</textarea>
          <div class="intent-fields"><div><span>Model</span><strong>Claude Sonnet⌄</strong></div><div><span>Provenance</span><strong>Native only⌄</strong></div><div><span>Term</span><strong>30 days⌄</strong></div><div><span>Region</span><strong>US⌄</strong></div></div>
          <div class="intent-actions"><button class="primary-button native-cta" type="button" data-phase-action="new-native-rfq" data-family="Claude">Get verified quotes <span>→</span></button><button class="secondary-button" type="button" data-route="models">Browse verified supply</button></div>
        </div>
        <div class="trust-line"><span>✓ No public raw credentials</span><span>✓ Provenance evidence verified</span><span>✓ Standardized quotes</span><span>✓ Secure delivery and settlement</span></div>
      </div>
      <aside class="demand-tape-card">
        <div class="tape-head"><div><span class="eyebrow">LIVE DEMAND TAPE</span><h2>Buyer demand is entering the market</h2></div><span class="badge badge-green">Synthetic live</span></div>
        <div class="demand-tape">${demandTape.slice(0, 3).map(demandRow).join("")}</div>
        <div class="tape-summary"><div><strong>$2.8M</strong><span>Active RFQ notional</span></div><div><strong>14 min</strong><span>Median first response</span></div><div><strong>92%</strong><span>Capacity test pass</span></div></div>
        <button class="supplier-tape-cta" type="button" data-phase-action="sell-capacity"><span>Have deliverable native capacity?</span><strong>Verify supply and respond →</strong></button>
      </aside>
    </section>

    <div class="phase1-metrics"><div><span>Verified native capacity</span><strong>${compactMoney.format(nativeCapacity)}</strong><small>Synthetic · continuously tested</small></div><div><span>Native / partner suppliers</span><strong>31</strong><small>KYB + provenance evidence</small></div><div><span>Active buyer RFQs</span><strong>18</strong><small>Model + GPU capacity</small></div><div><span>Median quote response</span><strong>14m</strong><small>Last 24h · illustrative</small></div></div>

    <section class="section"><div class="section-header"><div><div class="eyebrow">PROVENANCE-FIRST MARKET</div><h2>See provenance before comparing price</h2><p>OpenNEXT does not hide every supply source behind one API. Buyers know where capacity comes from and what they will receive before quoting.</p></div><button class="text-link" type="button" data-route="models">View all Model Capacity →</button></div><div class="provenance-market-grid">${nativeModels.map((model) => modelProvenanceCard(model, "native")).join("")}</div></section>

    <section class="section provenance-section"><div class="section-header"><div><div class="eyebrow">SUPPLY PROVENANCE</div><h2>Four products with four clear delivery boundaries</h2><p>Native is the core market. Managed Gateway is an optional post-trade delivery capability, while Hosted Inference is supplemental supply.</p></div></div><div class="source-grid">${["native_direct", "native_allocated", "managed_gateway", "hosted_inference"].map(provenanceCard).join("")}</div></section>

    <section class="section phase1-flow"><div class="flow-copy"><div class="eyebrow">PHASE 1 CORE FLOW</div><h2>Turn fragmented private inquiries into a verifiable, comparable and settleable market</h2><p>A buyer posts one structured request. OpenNEXT opens it only to suppliers that meet provenance and capacity thresholds, keeping quotes out of scattered group chats.</p><button class="primary-button" type="button" data-route="rfq">Enter the Native RFQ Market</button></div><div class="flow-steps">${["Describe demand", "Verify provenance", "Standardize quotes", "Compare and allocate", "Deliver and settle"].map((step, index) => `<div><span>${String(index + 1).padStart(2, "0")}</span><strong>${step}</strong><small>${["Model, term, throughput and region", "Contract, authorization and capacity test", "Total price, provenance, SLA and delivery", "Choose native provenance or cost", "Fulfilment record and funds settlement"][index]}</small></div>`).join("")}</div></section>

    <section class="section optional-products"><div class="section-header"><div><div class="eyebrow">OPTIONAL CAPABILITIES</div><h2>The market is core; execution capabilities are optional</h2><p>These capabilities remain in the demo without displacing the Phase 1 product focus.</p></div></div><div class="optional-grid"><article><span class="badge badge-gray">Phase 2 · Optional</span><h3>Managed Gateway</h3><p>Optional managed delivery, metering and consolidated settlement. It is not Native Direct and is disabled by default.</p><button class="text-link" type="button" data-phase-action="managed-gateway">Explore optional delivery →</button></article><article><span class="badge badge-blue">Labs · Simulation</span><h3>Capacity Optimizer</h3><p>Simulates task decomposition and model + chip execution routes on capacity already purchased or connected; it does not take over production traffic.</p><button class="text-link" type="button" data-route="scheduler">Open Labs →</button></article><article><span class="badge badge-gray">Phase 2</span><h3>GPU Capacity</h3><p>Standard accelerator-hours and long-term cluster RFQs connect wholesale compute prices with the Model Capacity market.</p><button class="text-link" type="button" data-route="gpus">View the GPU market →</button></article></div></section>
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
    ["native", "Native only", "Core"],
    ["all", "All provenance", "All"],
    ["managed_gateway", "Managed Gateway", "Optional"],
    ["hosted_inference", "Hosted Inference", "Supplemental"],
  ];
  return `<div class="page phase1-models">
    <div class="page-head"><div><div class="eyebrow">MODEL CAPACITY · PROVENANCE FIRST</div><h1>See provenance before comparing price</h1><p>Native Direct, Native Allocated, Enterprise Partner, Managed Gateway and Hosted Inference are no longer collapsed into one lowest price. Verified Native supply is shown by default.</p></div><div class="page-actions"><button class="secondary-button" type="button" data-phase-action="sell-capacity">List capacity</button><button class="primary-button" type="button" data-phase-action="new-native-rfq">Post a Native RFQ</button></div></div>
    <section class="market-toolbar"><div class="provenance-filter">${filters.map(([id, label, hint]) => `<button class="${filter === id ? "is-active" : ""}" type="button" data-phase-action="filter-provenance" data-filter="${id}"><span>${label}</span><small>${hint}</small></button>`).join("")}</div><label class="market-search"><span>⌕</span><input id="modelSearch" value="${escapeHtml(state.modelQuery)}" placeholder="Search Claude, GPT, Gemini…"></label></section>
    <div class="provenance-explainer"><div><span class="shield-icon">✓</span><div><strong>Native does not mean a raw key</strong><p>OpenNEXT verifies provenance evidence and capacity tests. Buyers receive clearly defined project access, dedicated allocation or partner delivery; secret credentials are never published.</p></div></div><button class="text-link" type="button" data-phase-action="view-verification">View verification standards →</button></div>
    <section class="section" style="margin-top:18px"><div class="section-header"><div><h2>${filter === "native" ? "Verified Native Supply" : "Capacity by provenance"}</h2><p>${cards.length} model markets match the current provenance filter · all quotes and inventory are demo data</p></div><span class="badge badge-gray">${phase1Meta.dataMode}</span></div>${cards.length ? `<div class="provenance-market-grid">${cards.map((model) => modelProvenanceCard(model, filter)).join("")}</div>` : `<div class="empty-market"><strong>No displayable supply matches this filter</strong><span>Switch to All provenance to view managed and Hosted supply.</span><button class="secondary-button compact" type="button" data-phase-action="filter-provenance" data-filter="all">View all provenance</button></div>`}</section>
    <section class="section model-policy-grid"><div><span class="badge badge-green">CORE</span><h3>Native Direct / Allocated</h3><p>Price discovery, capacity discovery, RFQ, verification, allocation and settlement form OpenNEXT's Phase 1 core market.</p></div><div><span class="badge badge-amber">SEPARATE LANE</span><h3>Private OTC</h3><p>Large or complex supply enters private matching, with no public inventory and no inclusion in the Native benchmark.</p><button class="text-link" type="button" data-phase-action="private-otc">Enter the OTC Desk →</button></div><div><span class="badge badge-gray">OPTIONAL</span><h3>Managed Gateway</h3><p>Enabled only when the buyer opts in. It is labelled separately from Native supply and is not the platform's core wedge.</p></div></section>
  </div>`;
}

export function renderRfq() {
  return `<div class="page phase1-rfq">
    <div class="page-head"><div><div class="eyebrow">PHASE 1 · CORE TRANSACTION FLOW</div><h1>Native RFQ Market</h1><p>Post one request to receive standardized quotes from suppliers that have passed KYB, provenance verification and capacity testing. Compare provenance, allocation method, throughput and SLA—not price alone.</p></div><div class="page-actions"><span class="badge badge-green">Core MVP</span><button class="secondary-button" type="button" data-phase-action="sell-capacity">Onboard as a supplier</button></div></div>
    <section class="native-rfq-layout"><form class="native-rfq-form" data-phase-action="submit-inline-rfq"><div class="form-title"><div><span class="eyebrow">POST A CAPACITY REQUEST</span><h2>What capacity do you want to buy?</h2></div><span class="badge badge-gray">Draft · no login required</span></div><div class="rfq-form-grid"><label><span>Model and version</span><select><option>Claude Sonnet</option><option>GPT Enterprise</option><option>Gemini Capacity</option><option>Kimi</option></select></label><label><span>Required allocation</span><input value="$100,000"></label><label><span>Minimum throughput</span><input value="2M TPM / 1,200 RPM"></label><label><span>Term</span><select><option>30 days</option><option>90 days</option><option>Custom term</option></select></label><label><span>Start time</span><select><option>Within 7 days</option><option>Immediately</option><option>Custom date</option></select></label><label><span>Region and data requirements</span><select><option>US · standard retention</option><option>EU · regional processing</option><option>APAC</option></select></label></div><fieldset class="provenance-choice"><legend>Accepted supply provenance</legend><label class="is-recommended"><input type="checkbox" checked><span><strong>Native Direct / Allocated</strong><small>Recommended · original-provider project or dedicated enterprise allocation</small></span></label><label><input type="checkbox" checked><span><strong>Enterprise Partner</strong><small>Verified partner delivery</small></span></label><label><input type="checkbox"><span><strong>Managed Gateway</strong><small>Optional · disabled by default</small></span></label><label><input type="checkbox"><span><strong>Hosted Inference</strong><small>Supplemental supply</small></span></label></fieldset><div class="rfq-delivery-note"><span>Buyer receives</span><strong>Original-provider project access or dedicated enterprise allocation</strong><small>Final delivery is defined in the selected quote's Provenance Passport.</small></div><div class="form-footer"><p>Business contact details and KYB are completed on submission. This demo sends no real request.</p><button class="primary-button" type="submit">Submit and start matching →</button></div></form>
      <aside class="rfq-side"><div class="rfq-side-head"><span class="eyebrow">DEMAND TAPE</span><h3>Current buyer demand</h3><p>Anonymized structured demand helps qualified suppliers discover real buying intent.</p></div><div class="demand-tape compact-tape">${demandTape.map(demandRow).join("")}</div><button class="supplier-tape-cta" type="button" data-phase-action="sell-capacity"><span>Supply side</span><strong>Verify capacity and respond to RFQs →</strong></button></aside>
    </section>
    <section class="section"><div class="section-header"><div><div class="eyebrow">STANDARDIZED QUOTE ROOM</div><h2>Compare provenance and delivery terms for one request</h2><p>Example: Claude Sonnet · $100k allocation · 30 days · 2M TPM · US</p></div><span class="badge badge-blue">Synthetic responses</span></div><div class="table-wrap"><table class="data-table provenance-table"><thead><tr><th>Supplier</th><th>Supply provenance</th><th>Buyer receives</th><th>Rate / Total</th><th>Capacity</th><th>Delivery / SLA</th><th></th></tr></thead><tbody>${quoteComparison.map((quote) => { const meta = provenanceCatalog[quote.provenance]; return `<tr><td><span class="strong">${escapeHtml(quote.supplier)}</span><span class="subline">${escapeHtml(quote.highlight)}</span></td><td>${provenanceBadge({ ...meta, verified: true }, true)}<span class="subline">OpenNEXT Verified</span></td><td><span class="strong">${escapeHtml(meta.buyerReceives)}</span><span class="subline">Passport available</span></td><td class="numeric"><span class="strong">${quote.rate.toFixed(3)}×</span><span class="subline">${escapeHtml(quote.total)} total</span></td><td><span class="strong">${escapeHtml(quote.capacity)}</span><span class="subline">${escapeHtml(quote.throughput)}</span></td><td><span class="strong">${escapeHtml(quote.delivery)}</span><span class="subline">${escapeHtml(quote.sla)} SLA</span></td><td><button class="primary-button compact" type="button" data-phase-action="select-quote" data-supplier="${escapeHtml(quote.supplier)}">Select quote</button></td></tr>`; }).join("")}</tbody></table></div></section>
    <section class="section phase1-workflow"><div class="section-header"><div><h2>An auditable path from demand to settlement</h2><p>OpenNEXT provides market infrastructure without requiring buyers to adopt a unified API first.</p></div></div><div class="workflow-track">${["Structured demand", "KYB & provenance", "Capacity test", "Quote comparison", "Allocation", "Fulfilment record", "Settlement"].map((label, index) => `<div class="workflow-node"><span>${index + 1}</span><strong>${label}</strong></div>`).join("")}</div></section>
    <section class="section otc-separation"><div><span class="badge badge-amber">SEPARATE RISK LANE</span><h2>Private OTC / Brokered RFQ</h2><p>Large, anonymous or non-standard requests enter a separate private lane. Non-native and third-party provenance must be explicit, with no public inventory and no Native benchmark inclusion.</p></div><div class="button-row"><button class="secondary-button" type="button" data-phase-action="private-otc">Enter the Private OTC Desk</button></div></section>
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
    copy: "Standard accelerator-hours retain discovery and reservation flows; large clusters, long terms and private networks go through RFQ.",
    action: '<button class="secondary-button compact" type="button" data-phase-action="new-native-rfq" data-family="GPU">Post a GPU RFQ</button>',
  });
}

export function renderScheduler() {
  let html = renderBaseScheduler();
  html = html.replace("Smart Orchestrator", "Capacity Optimizer · Labs");
  return prependContext(html, {
    tone: "is-labs",
    badge: "Optional Preview",
    badgeClass: "badge-blue",
    title: "AI orchestration is an optional Phase 1 enhancement",
    copy: "It simulates task decomposition and model + chip routes on capacity already purchased or connected. It is neither the homepage acquisition path nor a default production traffic controller.",
  });
}

export function renderData() {
  return prependContext(renderBaseData(), {
    badge: "Phase 3 Preview",
    badgeClass: "badge-gray",
    title: "Market Data follows verified transactions",
    copy: "The Native benchmark includes only qualified, settled and verifiable transactions. Private OTC, Managed Gateway and Hosted supply remain separate.",
  });
}

export function renderPhaseRoadmap() {
  return phaseRoadmap.map((item) => `<div><span>${item.phase}</span><strong>${item.title}</strong><p>${item.description}</p><small>${item.status}</small></div>`).join("");
}
