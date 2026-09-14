import {
  modelMarkets,
  providerDepth,
  compactMoney,
  compactNumber,
  escapeHtml,
  modelView,
} from "./demo-core.js?v=opennext-20260914-desk-1";
import {
  phaseState,
  provenanceCatalog,
  getProvenance,
  isNativeType,
} from "./phase1-data.js?v=opennext-20260914-desk-1";
import { renderModels } from "./phase1-pages.js?v=opennext-20260914-desk-1";

const drawerHost = document.querySelector("#drawer-host");
const modalHost = document.querySelector("#modal-host");
const toastHost = document.querySelector("#toast-host");
let phaseToastTimer;

function closePhaseOverlays() {
  if (drawerHost) drawerHost.innerHTML = "";
  if (modalHost) modalHost.innerHTML = "";
  document.body.classList.remove("overlay-open");
}

function toast(title, description = "Synthetic Demo · No real request was sent") {
  clearTimeout(phaseToastTimer);
  toastHost.innerHTML = `<div class="toast"><div class="toast-icon">✓</div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></div><button type="button" data-phase-action="close-toast">×</button></div>`;
  phaseToastTimer = setTimeout(() => { toastHost.innerHTML = ""; }, 4200);
}

function modal(title, caption, body, footer = "") {
  modalHost.innerHTML = `<div class="modal-backdrop" data-phase-action="close-overlay"><section class="modal phase1-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header class="modal-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(caption)}</p></div><button class="close-button" type="button" data-phase-action="close-overlay" aria-label="Close">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ""}</section></div>`;
  document.body.classList.add("overlay-open");
}

function provenanceBadge(meta) {
  return `<span class="provenance-badge provenance-${meta.tone} is-compact"><span>${escapeHtml(meta.label)}</span></span>`;
}

function showNativeRfq(family = "Claude") {
  modal(
    "Post a Native Capacity RFQ",
    "PHASE 1 CORE · VERIFIED SUPPLIERS · SYNTHETIC DEMO",
    `<div class="modal-core-note"><span>01</span><div><strong>Match Native / Enterprise supply by default</strong><p>Managed Gateway and Hosted Inference are included only when the buyer opts in. Raw keys are never uploaded, displayed or transferred.</p></div></div>
    <div class="form-grid phase1-modal-grid">
      <div class="form-field"><label>Model and version</label><select class="select"><option>${escapeHtml(family)} capacity</option><option>Claude Sonnet</option><option>GPT Enterprise</option><option>Gemini Capacity</option></select></div>
      <div class="form-field"><label>Required allocation</label><input class="input" value="$100,000"></div>
      <div class="form-field"><label>Minimum throughput</label><input class="input" value="2M TPM / 1,200 RPM"></div>
      <div class="form-field"><label>Term</label><select class="select"><option>30 days</option><option>90 days</option><option>Custom</option></select></div>
      <div class="form-field"><label>Region</label><select class="select"><option>US</option><option>EU</option><option>APAC</option></select></div>
      <div class="form-field"><label>Preferred delivery</label><select class="select"><option>Original-provider project access</option><option>Dedicated enterprise allocation</option><option>Partner-delivered allocation</option></select></div>
    </div>
    <div class="modal-provenance-choice"><label class="is-selected"><input type="checkbox" checked><span><strong>Native Direct / Allocated</strong><small>Core · original project or dedicated allocation</small></span></label><label class="is-selected"><input type="checkbox" checked><span><strong>Enterprise Partner</strong><small>Verified partner-delivered allocation</small></span></label><label><input type="checkbox"><span><strong>Managed Gateway · Optional</strong><small>Disabled by default</small></span></label></div>`,
    `<button class="secondary-button compact" type="button" data-phase-action="close-overlay">Save draft</button><button class="primary-button compact" type="button" data-phase-action="submit-native-rfq">Submit and match suppliers</button>`,
  );
}

function showSupplierOnboarding() {
  modal(
    "Sell verified native capacity",
    "SUPPLIER ONBOARDING · PROVENANCE BEFORE PRICE",
    `<div class="supplier-onboarding"><div class="modal-core-note"><span>✓</span><div><strong>Do not upload or publish raw credentials</strong><p>Contracts, authorizations, capacity evidence and test materials are submitted only through a secure data room.</p></div></div><div class="onboarding-steps"><div><span>01</span><strong>Organization KYB</strong><small>Business entity and ultimate beneficial owner</small></div><div><span>02</span><strong>Provenance evidence</strong><small>Contracts, authorization and allocation rights</small></div><div><span>03</span><strong>Capacity test</strong><small>Allocation, RPM / TPM, region and term</small></div><div><span>04</span><strong>Respond to RFQ</strong><small>Private standardized quotes and fulfilment</small></div></div><div class="form-grid phase1-modal-grid"><div class="form-field"><label>Supply type</label><select class="select"><option>Native Direct</option><option>Native Allocated</option><option>Enterprise Partner</option><option>Hosted Inference</option></select></div><div class="form-field"><label>Available market</label><select class="select"><option>Claude</option><option>GPT</option><option>Gemini</option><option>GPU Capacity</option></select></div></div></div>`,
    `<button class="secondary-button compact" type="button" data-phase-action="close-overlay">Cancel</button><button class="primary-button compact" type="button" data-phase-action="submit-supplier">Start supplier verification</button>`,
  );
}

function showPassport(modelId) {
  const raw = modelMarkets.find((item) => item.id === modelId) || modelMarkets[0];
  const model = modelView(raw);
  const rows = [...(providerDepth[raw.id] || [])].sort((a, b) => {
    const rank = { native_direct: 0, native_allocated: 1, enterprise_partner: 2, managed_gateway: 3, hosted_inference: 4, unknown: 5 };
    return (rank[getProvenance(a).type] ?? 9) - (rank[getProvenance(b).type] ?? 9) || Number(a.priceMultiple) - Number(b.priceMultiple);
  });
  const nativeCapacity = rows.filter((row) => isNativeType(getProvenance(row).type)).reduce((sum, row) => sum + Number(row.availableOevUsd || 0), 0);
  const rowHtml = rows.map((row) => {
    const meta = getProvenance(row);
    return `<tr><td><span class="strong">${escapeHtml(row.providerName)}</span><span class="subline">${escapeHtml(meta.method)}</span></td><td>${provenanceBadge(meta)}<span class="subline">${meta.verified ? "OpenNEXT Verified" : "Supplier declared"}</span></td><td><span class="strong">${escapeHtml(meta.deliveryMode)}</span><span class="subline">${escapeHtml(meta.lastVerifiedAt)}</span></td><td class="numeric"><span class="strong">${Number(row.priceMultiple).toFixed(3)}×</span><span class="subline">${compactMoney.format(row.availableOevUsd)}</span></td><td><span class="strong">${compactNumber.format(row.tpm)} TPM</span><span class="subline">${Number(row.uptimePct).toFixed(2)}% SLA</span></td><td><button class="${isNativeType(meta.type) ? "primary-button" : "secondary-button"} compact" type="button" data-phase-action="new-native-rfq" data-family="${escapeHtml(model.family)}">Request quote</button></td></tr>`;
  }).join("");
  drawerHost.innerHTML = `<div class="drawer-backdrop" data-phase-action="close-overlay"></div><aside class="drawer provenance-drawer" role="dialog" aria-modal="true"><header class="drawer-head"><div><h2>${escapeHtml(model.name)}</h2><p>SUPPLY PROVENANCE PASSPORT · SYNTHETIC DEMO</p></div><button class="close-button" type="button" data-phase-action="close-overlay">×</button></header><section class="drawer-section"><div class="passport-hero"><div><span class="eyebrow">NATIVE MARKET</span><strong>${compactMoney.format(nativeCapacity)}</strong><small>Verified native capacity</small></div><div><span class="eyebrow">CORE PRINCIPLE</span><strong>Source before price</strong><small>Original access, allocation or partner delivery stays visible</small></div></div><div class="modal-core-note"><span>✓</span><div><strong>What OpenNEXT verifies</strong><p>Submitted contract and authorization evidence, capacity tests, throughput, region, term and delivery conditions. Verification is not an endorsement by the original model provider.</p></div></div></section><section class="drawer-section"><div class="section-header"><div><h3>Provider depth by provenance</h3><p>Native, Gateway and Hosted supply are labelled and calculated separately.</p></div><span class="badge badge-gray">${rows.length} verified routes</span></div><div class="table-wrap" style="margin-top:12px"><table class="data-table provenance-table"><thead><tr><th>Supplier / verification</th><th>Provenance</th><th>Buyer receives</th><th>Rate / capacity</th><th>Throughput / SLA</th><th></th></tr></thead><tbody>${rowHtml}</tbody></table></div></section><section class="drawer-section"><div class="passport-boundaries"><div><strong>Native Direct / Allocated</strong><span>Core market · eligible after verified settlement</span></div><div><strong>Managed Gateway</strong><span>Optional delivery · not Native Direct</span></div><div><strong>Hosted Inference</strong><span>Supplemental endpoint · separately labelled</span></div></div></section></aside>`;
  document.body.classList.add("overlay-open");
}

function showPrivateOtc() {
  modal(
    "Private OTC / Brokered RFQ",
    "SEPARATE RISK LANE · INVITE ONLY",
    `<div class="otc-warning"><span>!</span><div><strong>Excluded from public inventory and the Native benchmark</strong><p>OpenNEXT provides KYB, capability verification, test execution, brokered matching and secure delivery. Non-native and third-party provenance must be explicit.</p></div></div><div class="otc-grid"><div><span>Best for</span><strong>Large or anonymous demand</strong><p>Complex contracts, non-standard terms, or identities and inventory that must remain private.</p></div><div><span>Verification</span><strong>Identity + capability</strong><p>Capability verification is never presented as original-provider authorization, and raw keys are never made public.</p></div><div><span>Delivery</span><strong>Short settlement cycle</strong><p>Test runs, risk labels, fallback delivery and refund boundaries.</p></div></div><div class="scheduler-note"><span>R</span><div><strong>Example RFQ</strong><br>Claude · $100k allocation · 30 days · 2M TPM · 6 qualified responses</div></div>`,
    `<button class="secondary-button compact" type="button" data-phase-action="close-overlay">Back</button><button class="primary-button compact" type="button" data-phase-action="submit-otc">Contact the Capacity Desk</button>`,
  );
}

function showGateway() {
  modal(
    "Managed Gateway · Optional",
    "PHASE 2 CAPABILITY · DISABLED BY DEFAULT",
    `<div class="gateway-boundary"><div><span class="badge badge-green">Core</span><strong>Native Capacity Market</strong><p>Price discovery, capacity discovery, RFQ, verification, allocation and settlement.</p></div><div class="boundary-arrow">→</div><div><span class="badge badge-gray">Optional</span><strong>Managed delivery</strong><p>Enabled only when a buyer needs unified metering, Hosted supply or controlled OTC delivery.</p></div></div><div class="modal-core-note"><span>i</span><div><strong>This is not Native Direct</strong><p>Quotes delivered through a OpenNEXT endpoint or key are explicitly labelled Managed Gateway and never blended with original-provider project access.</p></div></div>`,
    `<button class="primary-button compact" type="button" data-phase-action="close-overlay">Acknowledge boundary</button>`,
  );
}

function showVerification() {
  modal(
    "Supply Provenance verification standards",
    "WHAT OPENNEXT CHECKS · DEMO POLICY",
    `<div class="verification-list"><div><span>01</span><div><strong>Identity & rights</strong><p>KYB, contract holder, scope of authorization and allocation rights.</p></div></div><div><span>02</span><div><strong>Capacity evidence</strong><p>Allocation, throughput, region, term and isolation method.</p></div></div><div><span>03</span><div><strong>Test execution</strong><p>Validate availability, RPM / TPM and SLA in a controlled environment.</p></div></div><div><span>04</span><div><strong>Delivery & revocation</strong><p>What the buyer receives, when it expires, and how it can be revoked or renewed.</p></div></div><div><span>05</span><div><strong>Index eligibility</strong><p>Only qualified transactions that meet the rules and have settled enter the Native benchmark.</p></div></div></div>`,
    `<button class="primary-button compact" type="button" data-phase-action="close-overlay">Done</button>`,
  );
}

function showQuoteSelection(supplier) {
  modal(
    `Select ${supplier || "Native supplier"}`,
    "SECURE ALLOCATION · DEMO CHECKPOINT",
    `<div class="quote-checklist"><div class="is-done"><span>✓</span><strong>Supply provenance reviewed</strong><small>Verified evidence and buyer delivery method</small></div><div class="is-done"><span>✓</span><strong>Capacity test passed</strong><small>Throughput, region and term meet RFQ</small></div><div><span>3</span><strong>Finalize allocation agreement</strong><small>Price, SLA, revocation, refund and settlement</small></div></div><div class="modal-core-note"><span>i</span><div><strong>Demo checkpoint</strong><p>The production product proceeds here to contracting, escrow payment, allocation and fulfilment records. This demo creates no order and transfers no funds.</p></div></div>`,
    `<button class="secondary-button compact" type="button" data-phase-action="close-overlay">Back to comparison</button><button class="primary-button compact" type="button" data-phase-action="confirm-quote">Start secure delivery</button>`,
  );
}

function rerenderModels() {
  const main = document.querySelector("#mainContent");
  if (main) main.innerHTML = renderModels();
}

function handlePhaseAction(action, element) {
  if (action === "close-overlay") return closePhaseOverlays();
  if (action === "close-toast") { toastHost.innerHTML = ""; return; }
  if (action === "intent-buy") return toast("Buyer demand mode enabled", "Describe demand to generate a structured Native RFQ draft");
  if (action === "sell-capacity") return showSupplierOnboarding();
  if (action === "new-native-rfq") return showNativeRfq(element.dataset.family || "Claude");
  if (action === "view-passport") return showPassport(element.dataset.modelId || "claude");
  if (action === "private-otc") return showPrivateOtc();
  if (action === "managed-gateway") return showGateway();
  if (action === "view-verification") return showVerification();
  if (action === "select-quote") return showQuoteSelection(element.dataset.supplier);
  if (action === "filter-provenance") { phaseState.provenanceFilter = element.dataset.filter || "native"; rerenderModels(); return; }
  if (action === "submit-native-rfq" || action === "submit-inline-rfq") { closePhaseOverlays(); return toast("RFQ draft structured and queued for matching", "6 suppliers that passed KYB and provenance verification will be invited · Demo Simulation"); }
  if (action === "submit-supplier") { closePhaseOverlays(); return toast("Supplier verification checklist created", "Next: KYB, provenance evidence and capacity testing · Demo Simulation"); }
  if (action === "submit-otc") { closePhaseOverlays(); return toast("Capacity Desk received the private request", "This request will not enter public inventory or the Native benchmark · Demo Simulation"); }
  if (action === "confirm-quote") { closePhaseOverlays(); return toast("Secure delivery checklist created", "Contracting, allocation, escrow and settlement remain a Demo Simulation"); }
}

document.addEventListener("click", (event) => {
  const element = event.target.closest?.("[data-phase-action]");
  if (!element) return;
  if (element.classList.contains("modal-backdrop") && event.target !== element) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  handlePhaseAction(element.dataset.phaseAction, element);
}, true);

document.addEventListener("submit", (event) => {
  const form = event.target.closest?.("[data-phase-action='submit-inline-rfq']");
  if (!form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  handlePhaseAction("submit-inline-rfq", form);
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePhaseOverlays();
}, true);

console.info("OpenNEXT Phase 1 provenance interactions ready");
