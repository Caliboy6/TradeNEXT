import {
  state,
  presets,
  modelMarkets,
  gpuOffers,
  providerDepth,
  routeCatalog,
  rfqExamples,
  modelView,
  gpuView,
  escapeHtml,
  compactMoney,
  compactNumber,
  generatePlan,
  currentPlan,
  simulateFallback,
  overrideRoute,
  formatCost,
  formatLatency,
} from "./demo-core.js";
import { renderOverview, renderModels, renderGpus, renderScheduler, renderRfq, renderData } from "./demo-pages.js";

const pageRenderers = { overview: renderOverview, models: renderModels, gpus: renderGpus, scheduler: renderScheduler, rfq: renderRfq, data: renderData };
const main = document.querySelector("#mainContent");
const drawer = document.querySelector("#drawer-host");
const modal = document.querySelector("#modal-host");
const toast = document.querySelector("#toast-host");
let toastTimer;

function renderPage(route = state.route) {
  state.route = pageRenderers[route] ? route : "overview";
  main.innerHTML = pageRenderers[state.route]();
  document.querySelectorAll("[data-nav]").forEach((item) => item.classList.toggle("is-active", item.dataset.nav === state.route));
}

function navigate(route) {
  closeOverlays();
  state.route = pageRenderers[route] ? route : "overview";
  history.replaceState(null, "", `#${state.route}`);
  renderPage();
  document.querySelector("#sidebar")?.classList.remove("is-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeOverlays() {
  if (drawer) drawer.innerHTML = "";
  if (modal) modal.innerHTML = "";
  document.body.classList.remove("overlay-open");
}

function showToast(title, description = "Demo Simulation") {
  clearTimeout(toastTimer);
  toast.innerHTML = `<div class="toast"><div class="toast-icon">✓</div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></div><button type="button" data-final-action="close-toast">×</button></div>`;
  toastTimer = setTimeout(() => { toast.innerHTML = ""; }, 3600);
}

function showModal(title, caption, body, footer = "") {
  modal.innerHTML = `<div class="modal-backdrop" data-final-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}" data-modal-panel><header class="modal-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(caption)}</p></div><button class="close-button" type="button" data-final-action="close-modal" aria-label="关闭">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ""}</section></div>`;
  document.body.classList.add("overlay-open");
}

function showModelDepth(id) {
  const raw = modelMarkets.find((item) => item.id === id) || modelMarkets[0];
  const model = modelView(raw);
  const depth = providerDepth[raw.id] || [];
  const rows = depth.map((row, index) => `<tr><td><span class="strong">${escapeHtml(row.providerName)}</span><span class="subline">${escapeHtml(row.supplyType || "Verified provider")}</span></td><td class="numeric strong">${Number(row.priceMultiple).toFixed(2)}×</td><td class="numeric">${compactMoney.format(row.availableOevUsd)}</td><td>${compactNumber.format(row.rpm)} RPM<span class="subline">${compactNumber.format(row.tpm)} TPM</span></td><td>${Number(row.uptimePct).toFixed(2)}%<span class="subline">p95 ${compactNumber.format(row.p95LatencyMs)} ms</span></td><td><button class="${index === 0 ? "primary-button" : "secondary-button"} compact" type="button" data-final-action="buy-model" data-model-id="${escapeHtml(raw.id)}" data-provider-id="${escapeHtml(row.id)}">Buy</button></td></tr>`).join("");
  drawer.innerHTML = `<div class="drawer-backdrop" data-final-action="close-drawer"></div><aside class="drawer" role="dialog" aria-modal="true"><header class="drawer-head"><div><h2>${escapeHtml(model.name)}</h2><p>MODEL CAPACITY · EXCHANGE-GRADE LANE A</p></div><button class="close-button" type="button" data-final-action="close-drawer">×</button></header><section class="drawer-section"><div class="demo-ribbon"><span class="badge badge-blue">DEMO DATA</span><span>合成报价、容量和 SLA；不代表模型厂商库存或背书。</span></div><div class="summary-grid" style="margin-top:14px"><div class="summary-card is-highlight"><div class="summary-label">Clearing price</div><div class="summary-value">${model.index.toFixed(2)}×</div><div class="summary-context">Official Reference</div></div><div class="summary-card"><div class="summary-label">Executable OEV</div><div class="summary-value">${compactMoney.format(model.capacity)}</div><div class="summary-context">${model.suppliers} Lane A suppliers</div></div><div class="summary-card"><div class="summary-label">Max throughput</div><div class="summary-value">${compactNumber.format(model.rpm)}</div><div class="summary-context">RPM verified</div></div><div class="summary-card"><div class="summary-label">Measured SLA</div><div class="summary-value">${model.uptime.toFixed(2)}%</div><div class="summary-context">p95 ${compactNumber.format(model.p95)} ms</div></div></div></section><section class="drawer-section"><div class="section-header"><div><h3>Exchange-grade executable depth</h3><p>Firm quotes · reservable capacity · index eligible</p></div><span class="badge badge-green">Lane A</span></div><div class="table-wrap" style="margin-top:10px"><table class="data-table"><thead><tr><th>Provider</th><th>Price</th><th>Available</th><th>Throughput</th><th>SLA</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></section><section class="drawer-section"><div class="scheduler-note"><span>R</span><div><strong>Private RFQ is a separate lane.</strong> 大额、长期或非标准吞吐进入邀请制报价；响应不会计入公开 Available 或核心指数。</div></div><button class="secondary-button" style="width:100%;margin-top:10px" type="button" data-final-action="new-rfq" data-family="${escapeHtml(model.family)}">Start Private RFQ</button></section></aside>`;
  document.body.classList.add("overlay-open");
}

function showBuy(modelId, providerId) {
  const raw = modelMarkets.find((item) => item.id === modelId) || modelMarkets[0];
  const model = modelView(raw);
  const depth = providerDepth[raw.id] || [];
  const provider = depth.find((item) => item.id === providerId) || depth[0];
  const usage = 10000;
  const subtotal = usage * Number(provider?.priceMultiple || model.index);
  const fee = subtotal * .015;
  showModal(`购买 ${model.name} Capacity`, "INSTANT BUY · LANE A · SIMULATION", `<div class="scheduler-note"><span>ⓘ</span><div><strong>受控容量交付</strong> 买家通过 TradeNEXT Gateway 使用容量，不接触供应方裸 Key。</div></div><div class="form-grid" style="margin-top:14px"><div class="form-field"><label>Official-equivalent usage</label><input class="input" value="$10,000 OEV"></div><div class="form-field"><label>供应路线</label><select class="select">${depth.map((item) => `<option ${item.id === provider?.id ? "selected" : ""}>${escapeHtml(item.providerName)} · ${Number(item.priceMultiple).toFixed(2)}×</option>`).join("")}</select></div></div><div class="quote-summary"><div class="quote-line"><span>容量成本</span><strong>$${subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div><div class="quote-line"><span>平台服务费（1.5%）</span><strong>$${fee.toFixed(2)}</strong></div><div class="quote-line total"><span>预估合计</span><strong>$${(subtotal + fee).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></div></div>`, `<button class="secondary-button compact" type="button" data-final-action="close-modal">取消</button><button class="primary-button compact" type="button" data-final-action="confirm-order">Reserve & Continue</button>`);
}

function showGpu(id) {
  const raw = gpuOffers.find((item) => item.id === id) || gpuOffers[0];
  const gpu = gpuView(raw);
  showModal(`${gpu.name} · ${gpu.region}`, "GPU CAPACITY · VERIFIED CALENDAR · DEMO", `<div class="summary-grid"><div class="summary-card is-highlight"><div class="summary-label">Price</div><div class="summary-value">$${gpu.unitPrice.toFixed(2)}</div><div class="summary-context">per card-hour</div></div><div class="summary-card"><div class="summary-label">Available</div><div class="summary-value">${gpu.available}</div><div class="summary-context">cards</div></div><div class="summary-card"><div class="summary-label">Start</div><div class="summary-value" style="font-size:15px">${escapeHtml(String(gpu.start))}</div><div class="summary-context">verified calendar</div></div><div class="summary-card"><div class="summary-label">SLA</div><div class="summary-value">${gpu.sla.toFixed(2)}%</div><div class="summary-context">${escapeHtml(gpu.term)}</div></div></div><div class="scheduler-note" style="margin-top:14px"><span>G</span><div><strong>${escapeHtml(gpu.vendor)}</strong> · ${escapeHtml(gpu.topology)}<br>标准卡时可直接预留；大集群、长期、专网或定制镜像进入 Private RFQ。</div></div>`, `<button class="secondary-button compact" type="button" data-final-action="new-rfq" data-family="${escapeHtml(gpu.name)}">Create RFQ</button><button class="primary-button compact" type="button" data-final-action="confirm-gpu">Reserve demo capacity</button>`);
}

function showRfq(family = "Claude") {
  showModal("创建 Private RFQ", "BROKERED OTC · INVITE ONLY", `<div class="scheduler-note"><span>R</span><div><strong>与公开市场隔离</strong> RFQ 不公开展示、不计入可执行库存，也不进入核心指数。</div></div><div class="form-grid" style="margin-top:14px"><div class="form-field"><label>需求类型</label><select class="select"><option>${escapeHtml(family)} capacity</option><option>Custom AI capacity</option></select></div><div class="form-field"><label>预算 / OEV</label><input class="input" value="$100,000"></div><div class="form-field"><label>周期</label><select class="select"><option>30 days</option><option>90 days</option></select></div><div class="form-field"><label>最低吞吐</label><input class="input" value="2M TPM / 1,200 RPM"></div><div class="form-field"><label>数据区域</label><select class="select"><option>US</option><option>Singapore</option><option>Europe</option></select></div><div class="form-field"><label>受控交付</label><select class="select"><option>TradeNEXT managed gateway</option><option>Dedicated endpoint</option></select></div></div>`, `<button class="secondary-button compact" type="button" data-final-action="close-modal">取消</button><button class="primary-button compact" type="button" data-final-action="submit-rfq">Invite verified suppliers</button>`);
}

function showRfqResponses() {
  const rfq = rfqExamples[0];
  const low = rfq.indicativeRange.lowMultiple;
  const high = rfq.indicativeRange.highMultiple;
  const rows = Array.from({ length: 6 }, (_, index) => `<tr><td><span class="strong">Qualified supplier ${String(index + 1).padStart(2, "0")}</span><span class="subline">Identity protected</span></td><td class="numeric strong">${(low + (high - low) * index / 5).toFixed(2)}×</td><td>${compactNumber.format(rfq.request.minimumTpm + index * 250000)} TPM</td><td><span class="badge ${index < 3 ? "badge-green" : "badge-gray"}">${index < 3 ? "Test passed" : "Test scheduled"}</span></td></tr>`).join("");
  showModal(rfq.title, "PRIVATE QUOTE ROOM · SYNTHETIC RESPONSES", `<div class="table-wrap"><table class="data-table"><thead><tr><th>Responder</th><th>Indicative</th><th>Verified throughput</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div><div class="scheduler-note" style="margin-top:14px"><span>ⓘ</span><div>报价、测试与成交数据保留用于独立 OTC 指标，但绝不混入 Lane A 深度或核心 TMCI。</div></div>`);
}

function showGuide() {
  showModal("4 分钟 Demo 路线", "PRESENTER MODE", `<div class="lane-stack"><div class="lane-row"><span class="badge badge-blue">01</span><div><strong>双市场</strong><span>Model Capacity 是推理零售，GPU Capacity 是算力批发。</span></div></div><div class="lane-row"><span class="badge badge-blue">02</span><div><strong>供应深度</strong><span>打开 Claude，看 Lane A 即时交易与独立 Private RFQ。</span></div></div><div class="lane-row"><span class="badge badge-blue">03</span><div><strong>智能调度</strong><span>任务拆解后逐步选择模型、供应路线和可披露芯片。</span></div></div><div class="lane-row"><span class="badge badge-blue">04</span><div><strong>故障回执</strong><span>模拟健康下降、自动回退与 Plan vs Actual 审计。</span></div></div></div>`, `<button class="primary-button compact" type="button" data-final-action="start-guide">Start demo</button>`);
}

function showDecision(stepId) {
  const step = currentPlan().steps.find((item) => item.id === stepId);
  if (!step) return;
  const a = step.assignment;
  const route = a.route || routeCatalog.find((item) => item.id === a.routeId) || {};
  showModal(`${step.label} · 调度决策`, "EXPLAINABLE ROUTING", `<div class="summary-grid"><div class="summary-card is-highlight"><div class="summary-label">Selected route</div><div class="summary-value" style="font-size:14px">${escapeHtml(route.label || route.model || a.routeId)}</div><div class="summary-context">${escapeHtml(route.hardware || "Provider-managed")}</div></div><div class="summary-card"><div class="summary-label">Expected quality</div><div class="summary-value">${a.qualityScore}</div><div class="summary-context">estimate · not guarantee</div></div><div class="summary-card"><div class="summary-label">Est. cost</div><div class="summary-value">${formatCost(a.estimatedCostUSD)}</div><div class="summary-context">synthetic rate card</div></div><div class="summary-card"><div class="summary-label">P95 latency</div><div class="summary-value">${formatLatency(a.estimatedLatencyMs)}</div><div class="summary-context">historical estimate</div></div></div><div class="scheduler-note" style="margin-top:14px"><span>✦</span><div><strong>Why this target?</strong> ${escapeHtml(a.selectionReason || "满足区域、预算、质量和容量硬约束后，综合得分最高。")}</div></div><div class="scheduler-note" style="margin-top:10px"><span>ⓘ</span><div>闭源模型如果没有可验证硬件披露，会显示 Provider-managed / hardware undisclosed，不推测底层 GPU。</div></div>`);
}

function syncInputs() {
  const text = document.querySelector("#schedulerText");
  const budget = document.querySelector("#budgetRange");
  const deadline = document.querySelector("#deadlineRange");
  const region = document.querySelector("#schedulerRegion");
  if (text) state.scheduler.text = text.value;
  if (budget) state.scheduler.budgetUSD = Number(budget.value);
  if (deadline) state.scheduler.deadlineSeconds = Number(deadline.value);
  if (region) state.scheduler.region = region.value;
}

async function runSimulation() {
  if (state.scheduler.running) return;
  state.scheduler.running = true;
  state.scheduler.completed = false;
  renderPage("scheduler");
  let plan = currentPlan();
  let fallbackEvent = null;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  for (let index = 0; index < plan.steps.length; index += 1) {
    const step = plan.steps[index];
    state.scheduler.statuses[step.id] = "running";
    renderPage("scheduler");
    await wait(220);
    if (!fallbackEvent && index >= Math.floor(plan.steps.length / 2)) {
      try {
        const result = simulateFallback(plan, { seed: "tradenext-live-demo" }, routeCatalog);
        plan = result.plan;
        fallbackEvent = result.event;
        state.scheduler.plan = plan;
        state.scheduler.events.push(result.event);
        state.scheduler.statuses[result.event.stepId] = "fallback";
        renderPage("scheduler");
        showToast("主路线健康下降，已自动切换备用路线", `${result.event.detectedInMs + result.event.reroutedInMs} ms recovery · audit logged`);
        await wait(420);
      } catch (error) {
        console.warn("Fallback simulation unavailable", error);
      }
    }
    state.scheduler.statuses[step.id] = "done";
  }
  state.scheduler.running = false;
  state.scheduler.completed = true;
  state.scheduler.plan = plan;
  renderPage("scheduler");
  showToast("执行完成", "结果、逐步用量、故障切换和结算回执已生成");
  document.querySelector(".comparison-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleAction(action, element) {
  if (action === "close-drawer" || action === "close-modal") return closeOverlays();
  if (action === "close-toast") { toast.innerHTML = ""; return; }
  if (action === "view-model") return showModelDepth(element.dataset.modelId || element.dataset.model);
  if (action === "instant-buy-first") return showModelDepth(modelMarkets[0].id);
  if (action === "buy-model" || action === "instant-buy") return showBuy(element.dataset.modelId || element.dataset.model, element.dataset.providerId || element.dataset.provider);
  if (action === "gpu-detail" || action === "reserve-gpu") return showGpu(element.dataset.gpuId || element.dataset.gpu || element.dataset.id);
  if (action === "new-rfq") return showRfq(element.dataset.family || "Claude");
  if (action === "open-rfq-responses") return showRfqResponses();
  if (action === "open-demo-guide") return showGuide();
  if (action === "start-guide" || action === "guide-start") return navigate("models");
  if (action === "confirm-order") { closeOverlays(); return showToast("演示订单已创建", "容量已预留并从可执行库存实时扣减"); }
  if (action === "confirm-gpu") { closeOverlays(); return showToast("GPU 容量已预留", "Demo calendar updated"); }
  if (action === "submit-rfq") { closeOverlays(); return showToast("RFQ 已发送给 6 家合格供应方", "Broker 将协调容量测试与私密报价"); }
  if (action === "generate-plan" || action === "regenerate-plan") { syncInputs(); generatePlan(); renderPage("scheduler"); return; }
  if (action === "set-strategy") { syncInputs(); state.scheduler.strategy = element.dataset.strategy || "balanced"; generatePlan(); renderPage("scheduler"); return; }
  if (action === "set-preset") { state.scheduler.preset = element.dataset.preset || "support"; state.scheduler.text = presets[state.scheduler.preset].text; generatePlan(); renderPage("scheduler"); return; }
  if (action === "run-simulation") return runSimulation();
  if (action === "explain-route") return showDecision(element.dataset.stepId || element.dataset.step);
  if (action === "reserve-plan") return showToast("全部执行目标已预留", "Lane A capacity reservation · Demo Simulation");
  if (action === "export-trace") return showToast("脱敏 Trace 已准备导出", "Policy、计量、错误与切换记录已包含");
  if (action === "toggle-mobile-nav") return document.querySelector("#sidebar")?.classList.toggle("is-open");
}

document.addEventListener("click", (event) => {
  const routeElement = event.target.closest?.("[data-route]");
  if (routeElement) {
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(routeElement.dataset.route);
    return;
  }
  const element = event.target.closest?.("[data-final-action], [data-action]");
  if (!element) return;
  if (element.hasAttribute("data-modal-panel") && event.target === element) return;
  const action = element.dataset.finalAction || element.dataset.action;
  if (!action) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  handleAction(action, element);
}, true);

document.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches?.("[data-action='override-route']")) {
    event.stopImmediatePropagation();
    try {
      state.scheduler.plan = overrideRoute(currentPlan(), target.dataset.stepId, target.value, routeCatalog);
      state.scheduler.completed = false;
      renderPage("scheduler");
      showToast("已应用人工路线", "关键路径、成本与质量已重新计算");
    } catch (error) {
      showToast("路线不满足当前硬约束", error.message);
    }
  }
  if (target.id === "gpuRegion") { state.gpuRegion = target.value; renderPage("gpus"); }
  if (target.id === "gpuTerm") { state.gpuTerm = target.value; renderPage("gpus"); }
}, true);

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.id === "modelSearch") { state.modelQuery = target.value; renderPage("models"); }
  if (target.id === "schedulerText") state.scheduler.text = target.value;
  if (target.id === "budgetRange") { state.scheduler.budgetUSD = Number(target.value); const output = document.querySelector("#budgetOutput"); if (output) output.textContent = `$${Number(target.value).toFixed(2)}`; }
  if (target.id === "deadlineRange") { state.scheduler.deadlineSeconds = Number(target.value); const output = document.querySelector("#deadlineOutput"); if (output) output.textContent = `${target.value} s`; }
}, true);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeOverlays();
}, true);

renderPage(location.hash.slice(1) || state.route || "overview");
