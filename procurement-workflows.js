
import { escapeHtml } from "./demo-core.js";
import {
  demandTape,
  quoteComparison,
  gpuSupplyListings,
  procurementState,
  currentBuyerReputation,
  getSupplierReputation,
} from "./procurement-data.js";

const modal = document.querySelector("#modal-host");
const toast = document.querySelector("#toast-host");
let toastTimer;
let supplierFlow = { rfqId: "", step: 0 };
let buyerFlow = { rfqId: "RFQ-8421", supplier: quoteComparison[0].supplier, step: 0 };
let gpuFlow = null;

const threads = new Map([
  ["Aurora Authorized Channel", [
    { side: "them", time: "09:12", text: "We can allocate the full $120k OEV under the reviewed channel agreement." },
    { side: "me", time: "09:18", text: "Please confirm whether the 2M TPM is committed or burst capacity." },
    { side: "them", time: "09:21", text: "2M TPM is committed. We can expose the quota telemetry during acceptance." },
  ]],
  ["Northstar Compute", [
    { side: "them", time: "08:42", text: "The 32-GPU H100 block is available from 21 Aug, 09:00 SGT." },
    { side: "me", time: "08:48", text: "Can the reservation be extended if the following protected booking remains unchanged?" },
  ]],
  ["OpenNEXT Capacity Desk", [
    { side: "them", time: "Yesterday", text: "RFQ-8412 is in supplier matching. Three qualified suppliers have accepted the invitation." },
  ]],
]);

function localize(root = document) {
  window.OpenNEXTI18n?.localizeDocument?.(root);
}

function closeFlow() {
  if (modal) modal.innerHTML = "";
  document.body.classList.remove("overlay-open");
}

function showToast(title, description = "Workspace updated") {
  clearTimeout(toastTimer);
  toast.innerHTML = `<div class="toast"><div class="toast-icon">✓</div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></div><button type="button" data-flow-action="close-toast" aria-label="Close">×</button></div>`;
  localize(toast);
  toastTimer = setTimeout(() => { toast.innerHTML = ""; }, 4200);
}

function showModal(title, caption, body, footer = "", className = "") {
  modal.innerHTML = `<div class="modal-backdrop" data-flow-action="close-flow"><section class="modal procurement-modal flow-modal ${className}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" data-modal-panel><header class="modal-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(caption)}</p></div><button class="close-button" type="button" data-flow-action="close-flow" aria-label="Close">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ""}</section></div>`;
  document.body.classList.add("overlay-open");
  localize(modal);
}

function progress(labels, active) {
  return `<div class="workflow-progress">${labels.map((label, index) => `<div class="${index < active ? "is-done" : index === active ? "is-active" : ""}"><span>${index < active ? "✓" : index + 1}</span><strong>${escapeHtml(label)}</strong></div>`).join("")}</div>`;
}

function rfqSummary(item) {
  return `<div class="quote-review compact-summary"><div><span>Requirement</span><strong>${escapeHtml(item.model)}</strong></div><div><span>Notional</span><strong>${escapeHtml(item.notional)}</strong></div><div><span>Term / region</span><strong>${escapeHtml(item.term)} · ${escapeHtml(item.region)}</strong></div><div><span>Throughput</span><strong>${escapeHtml(item.throughput)}</strong></div></div>`;
}

function buyerTrust() {
  const buyer = currentBuyerReputation;
  return `<div class="counterparty-trust-card"><div><span>Buyer reputation</span><strong>${buyer.overall.toFixed(2)} / 5</strong></div><div><span>Completed trades</span><strong>${buyer.completedTrades}</strong></div><div><span>On-time payment</span><strong>${buyer.paymentOnTimePct}%</strong></div><div><span>Scope clarity</span><strong>${buyer.dimensions.scopeClarity.toFixed(1)}</strong></div></div>`;
}

function supplierStepBody() {
  const item = demandTape.find((row) => row.id === supplierFlow.rfqId) || demandTape[0];
  const step = supplierFlow.step;
  if (step === 0) return `${progress(["Eligibility", "KYB", "Rights", "Capacity", "Test", "Approved"], 0)}${supplierFlow.rfqId ? rfqSummary(item) : ""}${buyerTrust()}<div class="workflow-callout"><span>✓</span><div><strong>Qualification before quotation</strong><p>Complete organization, authorization, capacity and controlled-test checks once. Approved evidence can be reused for future responses while it remains current.</p></div></div>`;
  if (step === 1) return `${progress(["Eligibility", "KYB", "Rights", "Capacity", "Test", "Approved"], 1)}<form class="flow-form"><label><span>Legal entity</span><input class="input" value="OpenNEXT Demo Supplier Pte. Ltd."></label><label><span>Registration number</span><input class="input" value="202612345N"></label><label><span>Authorized respondent</span><input class="input" value="Alex Chen"></label><label><span>Business email</span><input class="input" value="alex@capacity-demo.example"></label><label class="span-2 check-row"><input type="checkbox" checked> I confirm that the submitted entity and ownership information is current.</label></form>`;
  if (step === 2) return `${progress(["Eligibility", "KYB", "Rights", "Capacity", "Test", "Approved"], 2)}<form class="flow-form"><label><span>Authorization class</span><select class="select"><option>Upstream-authorized resale</option><option>Authorized enterprise allocation</option><option>Partner-delivered access</option><option>Technically verified third-party delivery</option><option>Non-authorized Private OTC</option></select></label><label><span>Rights holder</span><input class="input" value="OpenNEXT Demo Supplier Pte. Ltd."></label><label><span>Evidence reference</span><input class="input" value="AGREEMENT-2026-08-118"></label><label><span>Rights expiry</span><input class="input" type="date" value="2026-12-31"></label><label class="span-2"><span>Revocation and transfer limits</span><textarea class="textarea" rows="3">Allocation is revocable only for breach or upstream contract termination. Buyer receives project-level access; raw credentials are not transferred.</textarea></label></form>`;
  if (step === 3) return `${progress(["Eligibility", "KYB", "Rights", "Capacity", "Test", "Approved"], 3)}<form class="flow-form"><label><span>Available allocation</span><input class="input" value="$120,000 OEV"></label><label><span>Committed throughput</span><input class="input" value="2M TPM / 1,200 RPM"></label><label><span>Region</span><select class="select"><option>US</option><option>Singapore</option><option>Europe</option></select></label><label><span>Available term</span><input class="input" value="30 days"></label><label class="span-2"><span>Isolation and delivery</span><textarea class="textarea" rows="3">Ring-fenced project allocation with quota telemetry and named buyer access.</textarea></label></form>`;
  if (step === 4) return `${progress(["Eligibility", "KYB", "Rights", "Capacity", "Test", "Approved"], 4)}<div class="test-console"><div><span class="test-status-dot"></span><div><strong>Controlled capacity test passed</strong><p>Run ON-TEST-8824 · 21 Aug, 09:28 SGT</p></div></div><dl><div><dt>Availability</dt><dd>Passed</dd></div><div><dt>Sustained TPM</dt><dd>2.08M</dd></div><div><dt>P95 latency</dt><dd>1.42s</dd></div><div><dt>Region</dt><dd>US confirmed</dd></div><div><dt>Metering variance</dt><dd>0.18%</dd></div><div><dt>Delivery path</dt><dd>Project allocation</dd></div></dl></div><div class="workflow-callout is-neutral"><span>i</span><div><strong>Authorization remains a separate conclusion</strong><p>The test confirms technical delivery. It does not create or expand resale rights.</p></div></div>`;
  if (step === 5) return `${progress(["Eligibility", "KYB", "Rights", "Capacity", "Test", "Approved"], 5)}<div class="workflow-success"><span>✓</span><h3>Supplier qualification approved</h3><p>KYB, rights evidence and technical capacity checks are recorded under qualification ON-QA-2048.</p><div><span>Evidence valid until</span><strong>19 Sep 2026</strong></div><div><span>Approved authorization class</span><strong>Upstream-authorized resale</strong></div></div>`;
  if (step === 6) return `${progress(["Qualification", "Commercial terms", "Evidence", "Submit"], 1)}${rfqSummary(item)}<form class="flow-form"><label><span>Quote rate</span><input class="input" value="0.825× public API equivalent"></label><label><span>Total payable</span><input class="input" value="${item.notional === "$100k" ? "$82,500" : item.notional}"></label><label><span>Allocated capacity</span><input class="input" value="${item.notional}"></label><label><span>Committed throughput</span><input class="input" value="${item.throughput}"></label><label><span>Delivery lead time</span><input class="input" value="24 hours after confirmation"></label><label><span>Quote validity</span><input class="input" value="22 Aug · 18:00 SGT"></label><label><span>SLA</span><input class="input" value="99.97%"></label><label><span>Platform fee</span><select class="select"><option>Included</option><option>Added separately</option></select></label><label class="span-2"><span>Message to buyer</span><textarea class="textarea" rows="3">Capacity is ring-fenced for this RFQ. Quota telemetry and acceptance testing are included.</textarea></label></form>`;
  if (step === 7) return `${progress(["Qualification", "Commercial terms", "Evidence", "Submit"], 2)}<div class="response-preview"><span class="badge badge-green">Ready to submit</span><h3>Standardized response · ${escapeHtml(item.id)}</h3>${rfqSummary(item)}<div class="quote-review"><div><span>Quote</span><strong>0.825× · $82,500</strong></div><div><span>Authorization</span><strong>Upstream-authorized resale</strong></div><div><span>Delivery</span><strong>24 hours</strong></div><div><span>SLA</span><strong>99.97%</strong></div></div><label class="check-row"><input type="checkbox" checked> Publish my supplier reputation and verified qualification status to this buyer.</label></div>`;
  return `${progress(["Qualification", "Commercial terms", "Evidence", "Submit"], 3)}<div class="workflow-success"><span>✓</span><h3>Response submitted</h3><p>Your standardized response is now visible to the buyer in the private quote room.</p><div><span>Response ID</span><strong>ON-RSP-6814</strong></div><div><span>RFQ</span><strong>${escapeHtml(item.id)}</strong></div><div><span>Next step</span><strong>Buyer review and bilateral clarification</strong></div></div>`;
}

function showSupplierFlow(rfqId = "", step = 0) {
  supplierFlow = { rfqId, step };
  const title = rfqId ? `Respond to ${rfqId}` : "Supplier qualification";
  let footer = "";
  if (step < 8) {
    const back = step > 0 ? `<button class="secondary-button compact" type="button" data-flow-action="supplier-back">Back</button>` : `<button class="secondary-button compact" type="button" data-flow-action="close-flow">Cancel</button>`;
    const labels = ["Begin review", "Continue to rights", "Continue to capacity", "Run controlled test", "Review result", rfqId ? "Create response" : "Finish qualification", "Review response", "Submit response"];
    footer = `${back}<button class="primary-button compact" type="button" data-flow-action="supplier-next">${labels[step]}</button>`;
  } else {
    footer = `<button class="secondary-button compact" type="button" data-flow-action="close-flow">Close</button><button class="secondary-button compact" type="button" data-flow-action="open-chat" data-supplier="OpenNEXT Capacity Desk" data-context="${escapeHtml(rfqId)}">Message buyer</button><button class="primary-button compact" type="button" data-route="supply">View response queue</button>`;
  }
  showModal(title, step >= 6 ? "Standardized private response" : "Qualification and evidence workflow", supplierStepBody(), footer, "workflow-modal");
}

function showRfqOverview(id) {
  const item = demandTape.find((row) => row.id === id) || demandTape[0];
  const stage = item.status === "Supplier matching" ? 1 : item.status === "Capacity test" ? 2 : item.status === "Commercial review" ? 3 : 2;
  const body = `${rfqSummary(item)}${progress(["Request", "Matching", "Quotes", "Test", "Contract", "Active"], stage)}<section class="activity-timeline"><div><span>09:26</span><strong>Latest workflow event</strong><p>${escapeHtml(item.status)} is ready for the next buyer action.</p></div><div><span>08:58</span><strong>Evidence screening completed</strong><p>Authorization classes are visible per supplier response.</p></div><div><span>08:31</span><strong>RFQ published privately</strong><p>Qualified suppliers were invited under the selected scope.</p></div></section>`;
  const footer = `<button class="secondary-button compact" type="button" data-flow-action="open-chat" data-supplier="OpenNEXT Capacity Desk" data-context="${escapeHtml(item.id)}">Message capacity desk</button><button class="secondary-button compact" type="button" data-flow-action="invite-suppliers" data-rfq-id="${escapeHtml(item.id)}">Invite more suppliers</button><button class="primary-button compact" type="button" data-flow-action="start-buyer-flow" data-rfq-id="${escapeHtml(item.id)}">Continue workflow</button>`;
  showModal(item.id, `${item.type} · ${item.status}`, body, footer, "workflow-modal");
}

function buyerStepBody() {
  const item = demandTape.find((row) => row.id === buyerFlow.rfqId) || demandTape[0];
  const quote = quoteComparison.find((row) => row.supplier === buyerFlow.supplier) || quoteComparison[0];
  const step = buyerFlow.step;
  if (step === 0) return `${progress(["Quote", "Lock", "Test", "Contract", "Activate", "Receipt"], 0)}${rfqSummary(item)}<div class="quote-review"><div><span>Selected supplier</span><strong>${escapeHtml(quote.supplier)}</strong></div><div><span>Indicative quote</span><strong>${quote.rate.toFixed(3)}× · ${quote.total}</strong></div><div><span>Allocation</span><strong>${quote.capacity} · ${quote.throughput}</strong></div><div><span>Delivery / SLA</span><strong>${quote.delivery} · ${quote.sla}</strong></div></div><div class="supplier-score-inline"><span>Supplier reputation</span><strong>${getSupplierReputation(quote.supplier).overall.toFixed(2)} / 5</strong><small>Verified completed transactions</small></div>`;
  if (step === 1) return `${progress(["Quote", "Lock", "Test", "Contract", "Activate", "Receipt"], 1)}<form class="flow-form"><label><span>Allocation to lock</span><input class="input" value="${quote.capacity}"></label><label><span>Commercial total</span><input class="input" value="${quote.total}"></label><label><span>Service start</span><input class="input" type="datetime-local" value="2026-08-22T09:00"></label><label><span>Service term</span><input class="input" value="30 days"></label><label class="span-2 check-row"><input type="checkbox" checked> I accept the quote validity, delivery, revocation and refund boundaries.</label></form><div class="workflow-callout"><span>✓</span><div><strong>Allocation hold available</strong><p>The supplier will hold the quoted capacity for 45 minutes while acceptance testing is completed.</p></div></div>`;
  if (step === 2) return `${progress(["Quote", "Lock", "Test", "Contract", "Activate", "Receipt"], 2)}<div class="test-console"><div><span class="test-status-dot"></span><div><strong>Buyer acceptance test passed</strong><p>Acceptance run ON-TEST-8831</p></div></div><dl><div><dt>Authentication</dt><dd>Passed</dd></div><div><dt>Committed TPM</dt><dd>2.03M</dd></div><div><dt>P95 latency</dt><dd>1.47s</dd></div><div><dt>Metering</dt><dd>Passed</dd></div><div><dt>Region</dt><dd>US</dd></div><div><dt>Failover boundary</dt><dd>Recorded</dd></div></dl></div>`;
  if (step === 3) return `${progress(["Quote", "Lock", "Test", "Contract", "Activate", "Receipt"], 3)}<form class="flow-form"><label><span>Contract entity</span><input class="input" value="Demo Workspace Holdings Pte. Ltd."></label><label><span>Settlement method</span><select class="select"><option>Escrow · USD wire</option><option>Workspace balance</option></select></label><label><span>Billing contact</span><input class="input" value="finance@demo-workspace.example"></label><label><span>Purchase order</span><input class="input" value="PO-2026-0819"></label><label class="span-2 check-row"><input type="checkbox" checked> Contract, data processing terms and settlement instruction reviewed.</label></form>`;
  if (step === 4) return `${progress(["Quote", "Lock", "Test", "Contract", "Activate", "Receipt"], 4)}<div class="activation-panel"><div><span>1</span><strong>Allocation created</strong><small>Project ON-CAP-1938</small></div><div><span>2</span><strong>Buyer access assigned</strong><small>Two workspace administrators</small></div><div><span>3</span><strong>Metering connected</strong><small>OEV and TPM telemetry active</small></div><div><span>4</span><strong>Support channel opened</strong><small>Supplier response SLA enabled</small></div></div><label class="check-row"><input type="checkbox" checked> I confirm that access and metering are working as agreed.</label>`;
  return `${progress(["Quote", "Lock", "Test", "Contract", "Activate", "Receipt"], 5)}<div class="workflow-success"><span>✓</span><h3>Capacity activated</h3><p>The transaction now has a complete price, allocation, term, delivery and fulfilment record.</p><div><span>Order</span><strong>ON-ORDER-29496</strong></div><div><span>Allocation</span><strong>${quote.capacity}</strong></div><div><span>Service term</span><strong>22 Aug – 21 Sep 2026</strong></div><div><span>Review eligibility</span><strong>After service term ends</strong></div></div>`;
}

function showBuyerFlow(rfqId, supplier = quoteComparison[0].supplier, step = 0) {
  buyerFlow = { rfqId: rfqId || "RFQ-8421", supplier, step };
  const back = step > 0 ? `<button class="secondary-button compact" type="button" data-flow-action="buyer-back">Back</button>` : `<button class="secondary-button compact" type="button" data-flow-action="close-flow">Close</button>`;
  const labels = ["Lock commercial terms", "Run acceptance test", "Continue to contract", "Authorize activation", "Confirm access", "Done"];
  const message = `<button class="secondary-button compact" type="button" data-flow-action="open-chat" data-supplier="${escapeHtml(supplier)}" data-context="${escapeHtml(rfqId)}">Message supplier</button>`;
  const next = step < 5 ? `<button class="primary-button compact" type="button" data-flow-action="buyer-next">${labels[step]}</button>` : `<button class="primary-button compact" type="button" data-route="rfq">Return to My RFQs</button>`;
  showModal("RFQ execution", `${rfqId} · ${supplier}`, buyerStepBody(), `${back}${message}${next}`, "workflow-modal");
}

function showChat(supplier = "Aurora Authorized Channel", context = "") {
  const messages = threads.get(supplier) || [{ side: "them", time: "Now", text: "Hello. Share the capacity, term and delivery details you want to confirm." }];
  threads.set(supplier, messages);
  const list = [...threads.keys()].map((name) => `<button class="thread-item ${name === supplier ? "is-active" : ""}" type="button" data-flow-action="open-chat" data-supplier="${escapeHtml(name)}"><span>${escapeHtml(name.slice(0, 2).toUpperCase())}</span><div><strong>${escapeHtml(name)}</strong><small>${escapeHtml((threads.get(name) || []).at(-1)?.text || "No messages")}</small></div></button>`).join("");
  const bubbles = messages.map((message) => `<div class="message-bubble ${message.side === "me" ? "is-me" : ""}"><p>${escapeHtml(message.text)}</p><span>${escapeHtml(message.time)}</span></div>`).join("");
  const body = `<div class="message-center"><aside><div class="message-search">Conversations</div>${list}</aside><section><header><div><strong>${escapeHtml(supplier)}</strong><span>${context ? `${escapeHtml(context)} · ` : ""}Private transaction channel</span></div><button class="secondary-button compact" type="button" data-flow-action="share-quote" data-supplier="${escapeHtml(supplier)}">Share quote</button></header><div class="message-list">${bubbles}</div><div class="message-composer"><textarea id="messageComposer" class="textarea" rows="2" placeholder="Ask about capacity, price, delivery, SLA or contract details"></textarea><button class="primary-button compact" type="button" data-flow-action="send-message" data-supplier="${escapeHtml(supplier)}">Send</button></div></section></div>`;
  showModal("Messages", "Buyer and supplier negotiation", body, "", "message-modal");
  requestAnimationFrame(() => modal.querySelector(".message-list")?.scrollTo({ top: 99999 }));
}

function updateGpuSummary() {
  if (!gpuFlow) return;
  const startInput = modal.querySelector("#gpuStart");
  const durationInput = modal.querySelector("#gpuDuration");
  const quantityInput = modal.querySelector("#gpuQuantity");
  const extensionInput = modal.querySelector("#gpuExtension");
  if (!startInput || !durationInput || !quantityInput) return;
  const start = new Date(startInput.value);
  const duration = Math.max(1, Number(durationInput.value) || 1);
  const quantity = Math.max(1, Number(quantityInput.value) || 1);
  const extension = Math.max(0, Number(extensionInput?.value) || 0);
  const end = new Date(start.getTime() + duration * 3600000);
  const extensionEnd = new Date(end.getTime() + extension * 3600000);
  const protectedStart = new Date("2026-08-23T09:00:00+08:00");
  const baseConflict = end > protectedStart;
  const extensionConflict = !baseConflict && extensionEnd > protectedStart;
  const fmt = (value) => new Intl.DateTimeFormat("en-SG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Singapore" }).format(value) + " SGT";
  const total = quantity * duration * gpuFlow.item.pricePerHour;
  const summary = modal.querySelector("[data-gpu-summary]");
  if (summary) summary.innerHTML = `<div><span>Reservation end</span><strong>${fmt(end)}</strong></div><div><span>Estimated total</span><strong>$${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong></div><div><span>Protected next booking</span><strong>23 Aug, 09:00 SGT</strong></div><div><span>Extension window</span><strong>${Math.max(0, Math.floor((protectedStart - end) / 3600000))} hours</strong></div>`;
  const warning = modal.querySelector("[data-gpu-conflict]");
  if (warning) {
    warning.className = `booking-conflict ${baseConflict || extensionConflict ? "has-conflict" : "is-clear"}`;
    warning.innerHTML = baseConflict ? `<strong>Reservation conflict</strong><span>The requested usage overlaps the protected booking on 23 Aug at 09:00 SGT. Shorten the term or choose a different start.</span>` : extensionConflict ? `<strong>Extension would conflict</strong><span>The base reservation is available, but the requested extension would overlap the next booking.</span>` : `<strong>Calendar clear</strong><span>The reservation and requested extension fit before the next protected booking.</span>`;
  }
  gpuFlow.calculation = { start, end, duration, quantity, extension, baseConflict, total, fmt };
}

function showGpuReservation(id) {
  const item = gpuSupplyListings.find((row) => row.id === id) || gpuSupplyListings[0];
  gpuFlow = { item, calculation: null };
  const body = `<div class="reservation-product"><div><span class="badge badge-green">Calendar checked</span><h3>${escapeHtml(item.accelerator)}</h3><p>${escapeHtml(item.supplier)} · ${escapeHtml(item.region)} · ${escapeHtml(item.topology)}</p></div><strong>$${item.pricePerHour.toFixed(2)}<small> / accelerator·h</small></strong></div><form class="flow-form reservation-form"><label><span>Start time</span><input id="gpuStart" class="input gpu-reservation-input" type="datetime-local" value="2026-08-21T09:00"></label><label><span>Duration in hours</span><input id="gpuDuration" class="input gpu-reservation-input" type="number" min="1" max="720" value="24"></label><label><span>Accelerator quantity</span><input id="gpuQuantity" class="input gpu-reservation-input" type="number" min="1" max="${item.units}" value="${Math.min(8, item.units)}"></label><label><span>Possible extension in hours</span><input id="gpuExtension" class="input gpu-reservation-input" type="number" min="0" max="168" value="12"></label></form><div class="reservation-summary" data-gpu-summary></div><div class="booking-conflict" data-gpu-conflict></div><div class="calendar-strip"><div><span>21 Aug</span><i class="is-requested">Requested use</i></div><div><span>22 Aug</span><i class="is-extension">Extension window</i></div><div><span>23 Aug</span><i class="is-protected">Protected booking</i></div></div>`;
  const footer = `<button class="secondary-button compact" type="button" data-flow-action="open-chat" data-supplier="${escapeHtml(item.supplier)}" data-context="${escapeHtml(item.accelerator)}">Message operator</button><button class="secondary-button compact" type="button" data-flow-action="close-flow">Cancel</button><button class="primary-button compact" type="button" data-flow-action="confirm-gpu-reservation">Confirm reservation</button>`;
  showModal("Instant GPU reservation", `${item.accelerator} · ${item.supplier}`, body, footer, "workflow-modal");
  updateGpuSummary();
}

function confirmGpuReservation() {
  updateGpuSummary();
  if (!gpuFlow || gpuFlow.calculation.baseConflict) return showToast("Resolve the calendar conflict", "Adjust the start time or duration before confirming");
  const { item, calculation } = gpuFlow;
  const body = `<div class="workflow-success"><span>✓</span><h3>GPU reservation confirmed</h3><p>The calendar block, usage term and quantity are recorded together to prevent overbooking.</p><div><span>Reservation ID</span><strong>ON-GPU-7718</strong></div><div><span>Start</span><strong>${calculation.fmt(calculation.start)}</strong></div><div><span>End</span><strong>${calculation.fmt(calculation.end)}</strong></div><div><span>Quantity</span><strong>${calculation.quantity} × ${escapeHtml(item.accelerator)}</strong></div><div><span>Total</span><strong>$${calculation.total.toLocaleString("en-US", { maximumFractionDigits: 2 })}</strong></div><div><span>Extension availability</span><strong>${calculation.extension ? `Requested up to ${calculation.extension} hours` : "Not requested"}</strong></div></div>`;
  const footer = `<button class="secondary-button compact" type="button" data-flow-action="open-chat" data-supplier="${escapeHtml(item.supplier)}" data-context="ON-GPU-7718">Message operator</button><button class="primary-button compact" type="button" data-flow-action="close-flow">Done</button>`;
  showModal("Reservation receipt", "Calendar and commercial terms recorded", body, footer, "workflow-modal");
}

function showAccountMenu() {
  modal.innerHTML = `<div class="account-menu-scrim" data-flow-action="close-flow"><section class="account-popover" data-modal-panel><header><div class="avatar">DL</div><div><strong>David Lee</strong><span>Demo Workspace</span></div></header><button type="button" data-flow-action="account-profile"><span>◎</span><div><strong>Profile</strong><small>Personal details and contact</small></div></button><button type="button" data-flow-action="account-settings"><span>⚙</span><div><strong>Workspace settings</strong><small>Notifications, region and approvals</small></div></button><button type="button" data-route="docs"><span>?</span><div><strong>Help & documentation</strong><small>Operating guides and methodology</small></div></button><button class="is-danger" type="button" data-flow-action="logout"><span>↪</span><div><strong>Sign out</strong><small>End this workspace session</small></div></button></section></div>`;
  localize(modal);
}

function showProfile() {
  showModal("Profile", "Personal and business contact details", `<form class="flow-form"><label><span>Full name</span><input class="input" value="David Lee"></label><label><span>Job title</span><input class="input" value="Procurement Lead"></label><label><span>Business email</span><input class="input" value="david@demo-workspace.example"></label><label><span>Phone</span><input class="input" value="+65 6000 2188"></label><label class="span-2"><span>Organization</span><input class="input" value="Demo Workspace Holdings Pte. Ltd."></label></form>`, `<button class="secondary-button compact" type="button" data-flow-action="close-flow">Cancel</button><button class="primary-button compact" type="button" data-flow-action="save-profile">Save profile</button>`);
}

function showSettings() {
  showModal("Workspace settings", "Preferences, notifications and approval controls", `<form class="settings-list"><label><div><strong>RFQ response alerts</strong><span>Email and in-product notifications</span></div><input type="checkbox" checked></label><label><div><strong>Capacity test alerts</strong><span>Notify workspace approvers when results are ready</span></div><input type="checkbox" checked></label><label><div><strong>Default data region</strong><span>Used to prefill new RFQs</span></div><select class="select"><option>Singapore</option><option>US</option><option>Europe</option></select></label><label><div><strong>Approval threshold</strong><span>Require a second approver above this amount</span></div><input class="input" value="$100,000"></label><label><div><strong>Session security</strong><span>Require MFA for contract and settlement actions</span></div><input type="checkbox" checked></label></form>`, `<button class="secondary-button compact" type="button" data-flow-action="close-flow">Cancel</button><button class="primary-button compact" type="button" data-flow-action="save-settings">Save settings</button>`);
}

function showLogout() {
  showModal("Sign out", "End this OpenNEXT workspace session?", `<div class="logout-confirm"><span>↪</span><div><strong>Your saved RFQs and messages remain available.</strong><p>You will need to sign in again to access private transaction records.</p></div></div>`, `<button class="secondary-button compact" type="button" data-flow-action="close-flow">Cancel</button><button class="danger-button compact" type="button" data-flow-action="confirm-logout">Sign out</button>`);
}

function showSignedOut() {
  showModal("Signed out", "Your session has ended", `<div class="signed-out"><div class="brand-mark">ON</div><h3>OpenNEXT</h3><p>Sign back into the demo workspace to continue your procurement workflow.</p></div>`, `<button class="primary-button compact" type="button" data-flow-action="sign-in">Sign in to demo workspace</button>`);
}


function showRfqCreated() {
  const body = `<div class="workflow-success"><span>✓</span><h3>Private RFQ created</h3><p>The requirement is structured and ready for qualified supplier matching.</p><div><span>RFQ ID</span><strong>RFQ-8430</strong></div><div><span>Status</span><strong>Supplier matching</strong></div><div><span>Response deadline</span><strong>22 Aug · 18:00 SGT</strong></div><div><span>Visibility</span><strong>Invited suppliers only</strong></div></div>`;
  const footer = `<button class="secondary-button compact" type="button" data-flow-action="open-chat" data-supplier="OpenNEXT Capacity Desk" data-context="RFQ-8430">Message capacity desk</button><button class="primary-button compact" type="button" data-route="rfq">Open My RFQs</button>`;
  showModal("RFQ submitted", "Private matching has started", body, footer, "workflow-modal");
}

function handleAction(action, element) {
  if (action === "close-flow") return closeFlow();
  if (action === "close-toast") { toast.innerHTML = ""; return; }
  if (action === "submit-rfq-full") return showRfqCreated();
  if (action === "respond-rfq-full") return showSupplierFlow(element.dataset.rfqId || "", 0);
  if (action === "supplier-onboarding-full") return showSupplierFlow("", 0);
  if (action === "supplier-next") {
    if (supplierFlow.step === 4) showToast("Controlled test passed", "Availability, throughput, region and metering were recorded");
    if (!supplierFlow.rfqId && supplierFlow.step === 5) { closeFlow(); window.__openNextProcurementNavigate?.("supply"); return showToast("Supplier qualification approved", "You can now respond to eligible RFQs"); }
    return showSupplierFlow(supplierFlow.rfqId, Math.min(8, supplierFlow.step + 1));
  }
  if (action === "supplier-back") return showSupplierFlow(supplierFlow.rfqId, Math.max(0, supplierFlow.step - 1));
  if (action === "open-rfq-full") return showRfqOverview(element.dataset.rfqId);
  if (action === "start-buyer-flow") return showBuyerFlow(element.dataset.rfqId, quoteComparison[0].supplier, 0);
  if (action === "review-quote-full") return showBuyerFlow("RFQ-8421", element.dataset.supplier || quoteComparison[0].supplier, 0);
  if (action === "buyer-next") {
    if (buyerFlow.step === 1) showToast("Allocation locked", "The supplier hold is active for acceptance testing");
    if (buyerFlow.step === 2) showToast("Acceptance test passed", "The result is attached to the transaction record");
    return showBuyerFlow(buyerFlow.rfqId, buyerFlow.supplier, Math.min(5, buyerFlow.step + 1));
  }
  if (action === "buyer-back") return showBuyerFlow(buyerFlow.rfqId, buyerFlow.supplier, Math.max(0, buyerFlow.step - 1));
  if (action === "invite-suppliers") return showToast("Supplier invitations sent", "Two additional qualified suppliers were added to the private RFQ");
  if (action === "messages") return showChat("Aurora Authorized Channel", "RFQ-8421");
  if (action === "open-chat") return showChat(element.dataset.supplier || "Aurora Authorized Channel", element.dataset.context || "");
  if (action === "send-message") {
    const input = modal.querySelector("#messageComposer");
    const text = input?.value.trim();
    if (!text) return;
    const name = element.dataset.supplier || "Aurora Authorized Channel";
    const list = threads.get(name) || [];
    list.push({ side: "me", time: "Now", text });
    threads.set(name, list);
    return showChat(name);
  }
  if (action === "share-quote") {
    const name = element.dataset.supplier || "Aurora Authorized Channel";
    const list = threads.get(name) || [];
    list.push({ side: "me", time: "Now", text: "Shared quote: RFQ-8421 · 0.825× · $82,500 · 30 days · 2M TPM." });
    threads.set(name, list);
    return showChat(name, "RFQ-8421");
  }
  if (action === "gpu-reserve-full") return showGpuReservation(element.dataset.gpuListingId || element.dataset.gpuId);
  if (action === "confirm-gpu-reservation") return confirmGpuReservation();
  if (action === "market-tab") {
    procurementState.dataMarket = element.dataset.market === "gpu" ? "gpu" : "model";
    procurementState.dataAsset = procurementState.dataMarket === "gpu" ? "h100" : "claude";
    return window.__openNextProcurementRender?.("data");
  }
  if (action === "market-asset") {
    procurementState.dataAsset = element.dataset.asset;
    return window.__openNextProcurementRender?.("data");
  }
  if (action === "market-range") {
    procurementState.dataRange = Number(element.dataset.range) || 14;
    return window.__openNextProcurementRender?.("data");
  }
  if (action === "account-menu") return showAccountMenu();
  if (action === "account-profile") return showProfile();
  if (action === "account-settings") return showSettings();
  if (action === "save-profile") { closeFlow(); return showToast("Profile saved", "Your business contact details were updated"); }
  if (action === "save-settings") { closeFlow(); return showToast("Workspace settings saved", "Notification and approval preferences were updated"); }
  if (action === "logout") return showLogout();
  if (action === "confirm-logout") return showSignedOut();
  if (action === "sign-in") { closeFlow(); return showToast("Signed in", "Demo Workspace is ready"); }
}

document.addEventListener("click", (event) => {
  const element = event.target.closest?.("[data-flow-action]");
  if (!element) return;
  if (element.dataset.flowAction === "close-flow" && event.target !== element) {
    if (event.target.closest?.("[data-route]")) closeFlow();
    return;
  }
  event.preventDefault();
  event.stopImmediatePropagation();
  handleAction(element.dataset.flowAction, element);
}, true);

document.addEventListener("input", (event) => {
  if (event.target.closest?.(".gpu-reservation-input")) updateGpuSummary();
}, true);

document.addEventListener("change", (event) => {
  if (event.target.id !== "marketDataAsset") return;
  event.preventDefault();
  event.stopImmediatePropagation();
  procurementState.dataAsset = event.target.value;
  window.__openNextProcurementRender?.("data");
}, true);
