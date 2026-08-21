import { state, providerDepth, escapeHtml } from "./demo-core.js";
import { rfqTypes, providerProfiles, provenanceCatalog, demandTape, quoteComparison, gpuSupplyListings, procurementState, ratingPolicy, completedTransactions, getSupplierReputation } from "./procurement-data.js";

const drawer = document.querySelector("#drawer-host");
const modal = document.querySelector("#modal-host");
const toast = document.querySelector("#toast-host");
let toastTimer;

function localize(root = document) { window.OpenNEXTI18n?.localizeDocument?.(root); }
function closeOverlays() { if (drawer) drawer.innerHTML = ""; if (modal) modal.innerHTML = ""; document.body.classList.remove("overlay-open"); }
function showToast(title, description = "Synthetic demo · no real transaction") {
  clearTimeout(toastTimer);
  toast.innerHTML = `<div class="toast"><div class="toast-icon">✓</div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></div><button type="button" data-proc-action="close-toast" aria-label="Close">×</button></div>`;
  localize(toast);
  toastTimer = setTimeout(() => { toast.innerHTML = ""; }, 4200);
}
function showModal(title, caption, body, footer = "") {
  modal.innerHTML = `<div class="modal-backdrop" data-proc-action="close-modal"><section class="modal procurement-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" data-modal-panel><header class="modal-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(caption)}</p></div><button class="close-button" type="button" data-proc-action="close-modal" aria-label="Close">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ""}</section></div>`;
  document.body.classList.add("overlay-open");
  localize(modal);
}

function typePicker() {
  const cards = Object.entries(rfqTypes).map(([key, item]) => `<button class="rfq-type-card" type="button" data-proc-action="select-rfq-type" data-rfq-type="${key}"><span>${item.icon}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.caption)}</p></div><em>→</em></button>`).join("");
  showModal("Post an RFQ", "Choose the capacity transaction first", `<div class="rfq-type-intro"><strong>One entry point, four clearly separated products.</strong><p>Each path uses its own fields, provenance boundary, execution method and risk record.</p></div><div class="rfq-type-grid">${cards}</div><div class="authorization-boundary"><span>i</span><div><strong>Private by default</strong><p>OpenNEXT does not publish your identity, requirements or supplier responses as a public order book.</p></div></div>`);
}

function commonFields(type, preset) {
  const amountLabel = type === "gpu" ? "Estimated budget" : type === "private_otc" ? "Notional / budget" : "Required allocation / OEV";
  return `<div class="form-field"><label>${amountLabel}</label><input class="input" name="amount" value="${type === "gpu" ? "$250,000" : "$100,000"}"></div><div class="form-field"><label>Term</label><select class="select" name="term"><option value="30d">30 days</option><option value="90d">90 days</option><option value="custom">Custom term</option></select></div><div class="form-field"><label>Region</label><select class="select" name="region"><option>US</option><option>Singapore</option><option>Europe</option><option>APAC</option></select></div><div class="form-field"><label>Required start</label><select class="select" name="start"><option>Within 7 days</option><option>Immediately</option><option>Custom date</option></select></div>`;
}

function typeFields(type, preset = "") {
  if (type === "gpu") return `<div class="form-field form-field-wide"><label>Accelerator / cluster</label><input class="input" name="product" value="${escapeHtml(preset || "H100 SXM × 64")}"></div><div class="form-field"><label>Quantity</label><input class="input" name="quantity" value="64 accelerators"></div><div class="form-field"><label>Topology / network</label><select class="select" name="network"><option>NVLink + 400G IB</option><option>PCIe</option><option>Private network required</option></select></div>`;
  if (type === "hosted") return `<div class="form-field form-field-wide"><label>Model or managed system</label><input class="input" name="product" value="${escapeHtml(preset || "Hosted inference capacity")}"></div><div class="form-field"><label>Minimum throughput</label><input class="input" name="throughput" value="2M TPM"></div><div class="form-field"><label>Delivery</label><select class="select" name="delivery"><option>Provider-hosted endpoint</option><option>OpenNEXT managed endpoint</option></select></div>`;
  if (type === "private_otc") return `<div class="form-field form-field-wide"><label>Capacity requirement</label><input class="input" name="product" value="${escapeHtml(preset || "Claude capacity · non-standard terms")}"></div><div class="form-field"><label>Minimum throughput</label><input class="input" name="throughput" value="2M TPM"></div><div class="form-field"><label>Authorization status</label><select class="select" name="authorization"><option>Unknown / to be investigated</option><option>Supplier claims allocation rights</option><option>Technically verified only</option></select></div>`;
  return `<div class="form-field form-field-wide"><label>Model and version</label><input class="input" name="product" value="${escapeHtml(preset || "Claude Sonnet")}"></div><div class="form-field"><label>Minimum throughput</label><input class="input" name="throughput" value="2M TPM / 1,200 RPM"></div><div class="form-field"><label>Accepted authorization class</label><select class="select" name="provenance"><option>Upstream-authorized resale only</option><option>Authorized enterprise allocation</option><option>Partner-delivered access</option></select></div>`;
}

function showRfqForm(type, preset = "") {
  const selected = rfqTypes[type] || rfqTypes.native_model;
  const privateWarning = type === "private_otc" ? `<div class="authorization-boundary is-warning"><span>!</span><div><strong>Non-authorized Private OTC</strong><p>Technical testing can verify delivery but does not prove upstream resale authorization. This request stays outside public inventory and Native benchmarks.</p></div></div>` : "";
  showModal("Post an RFQ", selected.title, `<button class="text-button rfq-back" type="button" data-proc-action="rfq-back">← Change transaction type</button><div class="rfq-selected-type"><span>${selected.icon}</span><div><strong>${escapeHtml(selected.title)}</strong><p>${escapeHtml(selected.caption)}</p></div></div>${privateWarning}<form id="unifiedRfqForm" class="form-grid unified-rfq-form">${typeFields(type, preset)}${commonFields(type, preset)}<div class="form-field form-field-wide"><label>Additional requirements</label><textarea class="textarea" name="notes" rows="3" placeholder="Security, data residency, delivery, revocation or acceptance criteria"></textarea></div><input type="hidden" name="type" value="${type}"></form>`, `<button class="secondary-button compact" type="button" data-proc-action="close-modal">Cancel</button><button class="primary-button compact" type="button" data-flow-action="submit-rfq-full">Submit private RFQ</button>`);
}

function findProvider(id) {
  for (const rows of Object.values(providerDepth)) { const row = rows.find((item) => item.id === id); if (row) return row; }
  return null;
}

function miniStars(score) {
  const width = Math.max(0, Math.min(100, Number(score) / 5 * 100));
  return `<span class="rating-stars rating-stars-large" aria-label="${Number(score).toFixed(2)} out of 5"><span>★★★★★</span><i style="width:${width}%">★★★★★</i></span>`;
}

function showRating(key) {
  const rating = getSupplierReputation(key);
  const row = findProvider(key);
  const name = row?.providerName || key;
  const dimensions = ratingPolicy.dimensions.map((item) => {
    const value = rating.dimensions[item.id];
    return `<div class="rating-dimension"><span>${escapeHtml(item.label)}</span><div><span class="rating-track"><i style="width:${value / 5 * 100}%"></i></span><strong>${value.toFixed(1)}</strong></div></div>`;
  }).join("");
  showModal("Verified transaction reputation", name, `<div class="rating-hero"><div>${miniStars(rating.overall)}<strong>${rating.overall.toFixed(2)}</strong><span>out of 5</span></div><dl><div><dt>Completed trades</dt><dd>${rating.completedTrades}</dd></div><div><dt>On-time delivery</dt><dd>${rating.onTimePct}%</dd></div><div><dt>Repeat buyers</dt><dd>${rating.repeatBuyerPct}%</dd></div></dl></div><div class="rating-breakdown">${dimensions}</div><div class="authorization-boundary"><span>i</span><div><strong>Verified reviews only</strong><p>Scores come from settled transactions after the service term ends. Public scores require at least ${ratingPolicy.minimumPublicReviews} verified reviews. Feedback remains blind until both sides submit or the 14-day window closes. Synthetic demo data.</p></div></div>`);
}

function showRateTransaction(id) {
  const trade = completedTransactions.find((item) => item.id === id);
  if (!trade || !trade.reviewEligible) return showToast("Review is still locked", "Feedback opens only after the service term ends");
  const fields = ratingPolicy.dimensions.map((item) => `<label class="rating-input-row"><span>${escapeHtml(item.label)}</span><div><input class="rating-range" type="range" min="1" max="5" step="0.5" value="5" data-rating-id="${item.id}"><output data-rating-output="${item.id}">5.0</output></div></label>`).join("");
  showModal("Rate counterparty", `${trade.id} · ${trade.counterparty}`, `<div class="rating-transaction"><strong>${escapeHtml(trade.product)}</strong><span>Service term ended ${escapeHtml(trade.usageEndedAt)}</span></div><form class="rating-form">${fields}<label class="form-field"><span>Private comment</span><textarea class="textarea" rows="3" placeholder="Describe the delivery, quality or support experience"></textarea></label></form><div class="authorization-boundary"><span>i</span><div><strong>Blind mutual review</strong><p>The counterparty cannot see this review until both sides submit or the 14-day window closes. One review per side per settled transaction.</p></div></div>`, `<button class="secondary-button compact" type="button" data-proc-action="close-modal">Cancel</button><button class="primary-button compact" type="button" data-proc-action="submit-rating">Submit review</button>`);
}

function showPassport(id) {
  const row = findProvider(id);
  const profile = providerProfiles[id] || { ...provenanceCatalog.unknown, method: "Pending", deliveryMode: "Pending", lastVerifiedAt: "Pending" };
  showModal("Provenance Passport", row?.providerName || "Supplier provenance", `<div class="passport-scope"><span class="provenance-badge provenance-${profile.tone}">${escapeHtml(profile.productLabel)}</span><h3>${escapeHtml(profile.category)}</h3><p>${escapeHtml(profile.authorization)}</p></div><dl class="passport-grid"><div><dt>Authorization class</dt><dd>${escapeHtml(profile.category)}</dd></div><div><dt>Evidence reviewed</dt><dd>${escapeHtml(profile.method || profile.verificationScope)}</dd></div><div><dt>Technical capacity test</dt><dd>${profile.technicalTested ? "Completed" : "Pending"}</dd></div><div><dt>Buyer receives</dt><dd>${escapeHtml(profile.deliveryMode || profile.buyerReceives)}</dd></div><div><dt>Last reviewed</dt><dd>${escapeHtml(profile.lastVerifiedAt || "Pending")}</dd></div><div><dt>Benchmark eligibility</dt><dd>${profile.indexEligible ? "Eligible only after qualified settlement" : "Excluded"}</dd></div></dl><div class="authorization-boundary"><span>i</span><div><strong>Scope of OpenNEXT review</strong><p>OpenNEXT records the evidence reviewed and test completed. Review does not imply endorsement by the original model provider, and technical verification never creates resale authorization.</p></div></div>`);
}

function showGateway() {
  showModal("Managed Gateway", "Optional delivery capability", `<div class="authorization-boundary"><span>i</span><div><strong>This is not Native Direct.</strong><p>A buyer receives an OpenNEXT-managed endpoint for optional metering, access control and settlement. It is not co-labelled with original-provider access and does not enter the Native benchmark.</p></div></div><div class="lane-stack"><div class="lane-row"><span>01</span><div><strong>Use only when requested</strong><span>Optional after procurement; disabled by default.</span></div></div><div class="lane-row"><span>02</span><div><strong>Separate provenance label</strong><span>Technically verified third-party delivery.</span></div></div><div class="lane-row"><span>03</span><div><strong>Separate data treatment</strong><span>Excluded from Native pricing and capacity benchmarks.</span></div></div></div>`);
}

function showQuote(supplier) {
  const quote = quoteComparison.find((item) => item.supplier === supplier) || quoteComparison[0];
  const meta = provenanceCatalog[quote.provenance];
  showModal("Review standardized quote", supplier, `<div class="quote-review"><div><span>Authorization class</span><strong>${escapeHtml(meta.category)}</strong></div><div><span>Indicative quote</span><strong>${quote.rate.toFixed(3)}× public API equivalent</strong></div><div><span>Total payable</span><strong>${quote.total}</strong></div><div><span>Available allocation</span><strong>${quote.capacity}</strong></div><div><span>Valid until</span><strong>${quote.validUntil}</strong></div><div><span>Delivery</span><strong>${escapeHtml(meta.buyerReceives)}</strong></div><div><span>Platform fee</span><strong>${quote.fee}</strong></div><div><span>Quote state</span><strong>${quote.quoteState} · bilateral confirmation required</strong></div></div><div class="authorization-boundary"><span>i</span><div><strong>No public order book</strong><p>The quote becomes firm only after evidence review, capacity lock and bilateral acceptance.</p></div></div>`, `<button class="secondary-button compact" type="button" data-proc-action="close-modal">Back</button><button class="primary-button compact" type="button" data-proc-action="confirm-quote">Start confirmation</button>`);
}

function showRfq(id) {
  const item = demandTape.find((row) => row.id === id) || demandTape[0];
  showModal(item.id, `${item.type} · ${item.status}`, `<div class="quote-review"><div><span>Requirement</span><strong>${escapeHtml(item.model)}</strong></div><div><span>Notional</span><strong>${escapeHtml(item.notional)}</strong></div><div><span>Term</span><strong>${escapeHtml(item.term)}</strong></div><div><span>Throughput</span><strong>${escapeHtml(item.throughput)}</strong></div><div><span>Region</span><strong>${escapeHtml(item.region)}</strong></div><div><span>Responses</span><strong>${item.responses} qualified</strong></div></div><div class="transaction-record compact-record"><div><span>01</span><strong>Request</strong><small>Structured</small></div><div><span>02</span><strong>Evidence</strong><small>Reviewed</small></div><div><span>03</span><strong>Capacity test</strong><small>In progress</small></div><div><span>04</span><strong>Firm terms</strong><small>Pending</small></div></div>`);
}

function showGpuReservation(id) {
  const item = gpuSupplyListings.find((row) => row.id === id) || gpuSupplyListings[0];
  showModal("Instant GPU reservation", `${item.accelerator} · ${item.supplier}`, `<div class="quote-review"><div><span>Rate</span><strong>$${item.pricePerHour.toFixed(2)} / accelerator·h</strong></div><div><span>Lockable quantity</span><strong>${item.units} units</strong></div><div><span>Availability</span><strong>${escapeHtml(item.availability)}</strong></div><div><span>Topology</span><strong>${escapeHtml(item.topology)}</strong></div><div><span>Region</span><strong>${escapeHtml(item.region)}</strong></div><div><span>SLA</span><strong>${item.sla}%</strong></div></div><div class="authorization-boundary"><span>i</span><div><strong>Instant Reserve</strong><p>This simulated inventory can be locked immediately. Scheduled, dedicated and managed capacity use RFQ instead.</p></div></div>`, `<button class="secondary-button compact" type="button" data-proc-action="close-modal">Cancel</button><button class="primary-button compact" type="button" data-proc-action="confirm-gpu">Reserve demo inventory</button>`);
}

function showSupplierReview(id = "") {
  showModal(id ? `Respond to ${id}` : "Supplier review", "Evidence before quotation", `<div class="supply-review-grid"><div><span>01</span><strong>Organization KYB</strong><p>Legal entity, ownership and authorized respondent.</p></div><div><span>02</span><strong>Rights and authorization</strong><p>Contract holder, allocation rights, expiry and revocation.</p></div><div><span>03</span><strong>Capacity evidence</strong><p>Quota, RPM / TPM, region, quantity, term and isolation.</p></div><div><span>04</span><strong>Controlled test</strong><p>Technical availability and delivery method, kept distinct from authorization.</p></div></div>`, `<button class="secondary-button compact" type="button" data-proc-action="close-modal">Cancel</button><button class="primary-button compact" type="button" data-proc-action="start-supplier-review">Start review</button>`);
}

function handleAction(action, element) {
  if (action === "close-modal" || action === "close-drawer") return closeOverlays();
  if (action === "close-toast") { toast.innerHTML = ""; return; }
  if (action === "post-rfq") return element.dataset.rfqType ? showRfqForm(element.dataset.rfqType, element.dataset.family || "") : typePicker();
  if (action === "select-rfq-type") return showRfqForm(element.dataset.rfqType, element.dataset.family || "");
  if (action === "rfq-back") return typePicker();
  if (action === "view-passport") return showPassport(element.dataset.providerId);
  if (action === "view-rating") return showRating(element.dataset.supplierKey);
  if (action === "rate-transaction") return showRateTransaction(element.dataset.transactionId);
  if (action === "managed-gateway") return showGateway();
  if (action === "select-quote") return showQuote(element.dataset.supplier);
  if (action === "view-rfq") return showRfq(element.dataset.rfqId);
  if (action === "supplier-onboarding") return showSupplierReview();
  if (action === "respond-rfq") return showSupplierReview(element.dataset.rfqId);
  if (action === "instant-gpu") return showGpuReservation(element.dataset.gpuListingId);
  if (action === "gpu-detail") return showGpuReservation(element.dataset.gpuListingId);
  if (action === "submit-rating") { closeOverlays(); return showToast("Review submitted", "It will publish after both sides submit or the review window closes"); }
  if (action === "submit-rfq") { closeOverlays(); return showToast("Private RFQ created", "Matching, evidence review and capacity testing are simulated"); }
  if (action === "confirm-quote") { closeOverlays(); return showToast("Quote moved to confirmation", "Capacity lock, contract and settlement remain simulated"); }
  if (action === "confirm-gpu") { closeOverlays(); return showToast("GPU inventory reserved", "Synthetic calendar and quantity updated"); }
  if (action === "start-supplier-review") { closeOverlays(); return showToast("Supplier review opened", "KYB, rights evidence and capacity test checklist created"); }
  if (action === "filter-provenance") { procurementState.provenanceFilter = element.dataset.filter || "native"; return window.__openNextProcurementRender?.("models"); }
}

document.addEventListener("click", (event) => {
  const element = event.target.closest?.("[data-proc-action]");
  if (!element) return;
  if (element.hasAttribute("data-modal-panel") && event.target === element) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  handleAction(element.dataset.procAction, element);
}, true);

document.addEventListener("input", (event) => {
  const range = event.target.closest?.(".rating-range");
  if (!range) return;
  const output = document.querySelector(`[data-rating-output="${range.dataset.ratingId}"]`);
  if (output) output.textContent = Number(range.value).toFixed(1);
}, true);

document.addEventListener("input", (event) => {
  if (event.target.id !== "nativeMarketSearch") return;
  procurementState.modelQuery = event.target.value;
  window.__openNextProcurementRender?.("models");
  document.querySelector("#nativeMarketSearch")?.focus();
}, true);

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.id === "gpuRegion") { event.stopImmediatePropagation(); state.gpuRegion = target.value; window.__openNextProcurementRender?.("gpus"); }
  if (target.id === "gpuTerm") { event.stopImmediatePropagation(); state.gpuTerm = target.value; window.__openNextProcurementRender?.("gpus"); }
}, true);

document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeOverlays(); }, true);