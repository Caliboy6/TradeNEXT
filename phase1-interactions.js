import {
  modelMarkets,
  providerDepth,
  compactMoney,
  compactNumber,
  escapeHtml,
  modelView,
} from "./demo-core.js";
import {
  phaseState,
  provenanceCatalog,
  getProvenance,
  isNativeType,
} from "./phase1-data.js";
import { renderModels } from "./phase1-pages.js";

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
  modalHost.innerHTML = `<div class="modal-backdrop" data-phase-action="close-overlay"><section class="modal phase1-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header class="modal-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(caption)}</p></div><button class="close-button" type="button" data-phase-action="close-overlay" aria-label="关闭">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ""}</section></div>`;
  document.body.classList.add("overlay-open");
}

function provenanceBadge(meta) {
  return `<span class="provenance-badge provenance-${meta.tone} is-compact"><span>${escapeHtml(meta.label)}</span></span>`;
}

function showNativeRfq(family = "Claude") {
  modal(
    "发布 Native Capacity RFQ",
    "PHASE 1 CORE · VERIFIED SUPPLIERS · SYNTHETIC DEMO",
    `<div class="modal-core-note"><span>01</span><div><strong>默认只匹配 Native / Enterprise 供应</strong><p>Managed Gateway 与 Hosted Inference 只有在买方主动选择时才会加入。不会上传、展示或转交裸 Key。</p></div></div>
    <div class="form-grid phase1-modal-grid">
      <div class="form-field"><label>模型与版本</label><select class="select"><option>${escapeHtml(family)} capacity</option><option>Claude Sonnet</option><option>GPT Enterprise</option><option>Gemini Capacity</option></select></div>
      <div class="form-field"><label>所需分配额度</label><input class="input" value="$100,000"></div>
      <div class="form-field"><label>最低吞吐</label><input class="input" value="2M TPM / 1,200 RPM"></div>
      <div class="form-field"><label>期限</label><select class="select"><option>30 days</option><option>90 days</option><option>Custom</option></select></div>
      <div class="form-field"><label>地区</label><select class="select"><option>US</option><option>EU</option><option>APAC</option></select></div>
      <div class="form-field"><label>期望交付</label><select class="select"><option>Original-provider project access</option><option>Dedicated enterprise allocation</option><option>Partner-delivered allocation</option></select></div>
    </div>
    <div class="modal-provenance-choice"><label class="is-selected"><input type="checkbox" checked><span><strong>Native Direct / Allocated</strong><small>Core · original project or dedicated allocation</small></span></label><label class="is-selected"><input type="checkbox" checked><span><strong>Enterprise Partner</strong><small>Verified partner-delivered allocation</small></span></label><label><input type="checkbox"><span><strong>Managed Gateway · Optional</strong><small>Disabled by default</small></span></label></div>`,
    `<button class="secondary-button compact" type="button" data-phase-action="close-overlay">保存草稿</button><button class="primary-button compact" type="button" data-phase-action="submit-native-rfq">提交并匹配供应方</button>`,
  );
}

function showSupplierOnboarding() {
  modal(
    "出售已验证的原厂容量",
    "SUPPLIER ONBOARDING · PROVENANCE BEFORE PRICE",
    `<div class="supplier-onboarding"><div class="modal-core-note"><span>✓</span><div><strong>不要上传或公开裸凭证</strong><p>合同、授权、容量证明与测试资料只通过安全资料室提交。</p></div></div><div class="onboarding-steps"><div><span>01</span><strong>Organization KYB</strong><small>企业主体与最终受益人</small></div><div><span>02</span><strong>Provenance evidence</strong><small>合同、授权与可分配权利</small></div><div><span>03</span><strong>Capacity test</strong><small>额度、RPM / TPM、区域与期限</small></div><div><span>04</span><strong>Respond to RFQ</strong><small>私密标准化报价与履约</small></div></div><div class="form-grid phase1-modal-grid"><div class="form-field"><label>供应类型</label><select class="select"><option>Native Direct</option><option>Native Allocated</option><option>Enterprise Partner</option><option>Hosted Inference</option></select></div><div class="form-field"><label>可交付市场</label><select class="select"><option>Claude</option><option>GPT</option><option>Gemini</option><option>GPU Capacity</option></select></div></div></div>`,
    `<button class="secondary-button compact" type="button" data-phase-action="close-overlay">取消</button><button class="primary-button compact" type="button" data-phase-action="submit-supplier">开始供应方验证</button>`,
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
    return `<tr><td><span class="strong">${escapeHtml(row.providerName)}</span><span class="subline">${escapeHtml(meta.method)}</span></td><td>${provenanceBadge(meta)}<span class="subline">${meta.verified ? "TradeNEXT Verified" : "Supplier declared"}</span></td><td><span class="strong">${escapeHtml(meta.deliveryMode)}</span><span class="subline">${escapeHtml(meta.lastVerifiedAt)}</span></td><td class="numeric"><span class="strong">${Number(row.priceMultiple).toFixed(3)}×</span><span class="subline">${compactMoney.format(row.availableOevUsd)}</span></td><td><span class="strong">${compactNumber.format(row.tpm)} TPM</span><span class="subline">${Number(row.uptimePct).toFixed(2)}% SLA</span></td><td><button class="${isNativeType(meta.type) ? "primary-button" : "secondary-button"} compact" type="button" data-phase-action="new-native-rfq" data-family="${escapeHtml(model.family)}">Request quote</button></td></tr>`;
  }).join("");
  drawerHost.innerHTML = `<div class="drawer-backdrop" data-phase-action="close-overlay"></div><aside class="drawer provenance-drawer" role="dialog" aria-modal="true"><header class="drawer-head"><div><h2>${escapeHtml(model.name)}</h2><p>SUPPLY PROVENANCE PASSPORT · SYNTHETIC DEMO</p></div><button class="close-button" type="button" data-phase-action="close-overlay">×</button></header><section class="drawer-section"><div class="passport-hero"><div><span class="eyebrow">NATIVE MARKET</span><strong>${compactMoney.format(nativeCapacity)}</strong><small>Verified native capacity</small></div><div><span class="eyebrow">CORE PRINCIPLE</span><strong>Source before price</strong><small>Original access, allocation or partner delivery stays visible</small></div></div><div class="modal-core-note"><span>✓</span><div><strong>TradeNEXT 验证什么</strong><p>提交的合同与授权证据、容量测试、吞吐、地区、期限和交付条件。验证不代表原模型厂商背书。</p></div></div></section><section class="drawer-section"><div class="section-header"><div><h3>Provider depth by provenance</h3><p>Native、Gateway 与 Hosted 供应不混标、不混算。</p></div><span class="badge badge-gray">${rows.length} verified routes</span></div><div class="table-wrap" style="margin-top:12px"><table class="data-table provenance-table"><thead><tr><th>Supplier / verification</th><th>Provenance</th><th>Buyer receives</th><th>Rate / capacity</th><th>Throughput / SLA</th><th></th></tr></thead><tbody>${rowHtml}</tbody></table></div></section><section class="drawer-section"><div class="passport-boundaries"><div><strong>Native Direct / Allocated</strong><span>Core market · eligible after verified settlement</span></div><div><strong>Managed Gateway</strong><span>Optional delivery · not Native Direct</span></div><div><strong>Hosted Inference</strong><span>Supplemental endpoint · separately labelled</span></div></div></section></aside>`;
  document.body.classList.add("overlay-open");
}

function showPrivateOtc() {
  modal(
    "Private OTC / Brokered RFQ",
    "SEPARATE RISK LANE · INVITE ONLY",
    `<div class="otc-warning"><span>!</span><div><strong>不进入公开库存或 Native benchmark</strong><p>TradeNEXT 提供 KYB、能力验证、测试执行、经纪撮合与安全交割。Non-native / third-party 来源必须显式标注。</p></div></div><div class="otc-grid"><div><span>适合</span><strong>大额或匿名需求</strong><p>复杂合同、非标准期限、不希望公开身份与库存。</p></div><div><span>验证</span><strong>Identity + capability</strong><p>不把能力验证包装成原厂授权，也不允许公开裸 Key。</p></div><div><span>交割</span><strong>Short settlement cycle</strong><p>试跑、风险标签、备用交付与退款边界。</p></div></div><div class="scheduler-note"><span>R</span><div><strong>Example RFQ</strong><br>Claude · $100k allocation · 30 days · 2M TPM · 6 qualified responses</div></div>`,
    `<button class="secondary-button compact" type="button" data-phase-action="close-overlay">返回</button><button class="primary-button compact" type="button" data-phase-action="submit-otc">联系 Capacity Desk</button>`,
  );
}

function showGateway() {
  modal(
    "Managed Gateway · Optional",
    "PHASE 2 CAPABILITY · DISABLED BY DEFAULT",
    `<div class="gateway-boundary"><div><span class="badge badge-green">Core</span><strong>Native Capacity Market</strong><p>价格发现、容量发现、RFQ、验证、分配与结算。</p></div><div class="boundary-arrow">→</div><div><span class="badge badge-gray">Optional</span><strong>Managed delivery</strong><p>只有买方需要统一计量、Hosted 供应或受控 OTC 交付时才启用。</p></div></div><div class="modal-core-note"><span>i</span><div><strong>这不是 Native Direct</strong><p>使用 TradeNEXT endpoint / key 的报价会明确显示 Managed Gateway，不会和原厂项目访问混标。</p></div></div>`,
    `<button class="primary-button compact" type="button" data-phase-action="close-overlay">理解边界</button>`,
  );
}

function showVerification() {
  modal(
    "Supply Provenance 验证标准",
    "WHAT TRADENEXT CHECKS · DEMO POLICY",
    `<div class="verification-list"><div><span>01</span><div><strong>Identity & rights</strong><p>KYB、合同持有人、授权范围与可分配性。</p></div></div><div><span>02</span><div><strong>Capacity evidence</strong><p>额度、速率、区域、期限与隔离方式。</p></div></div><div><span>03</span><div><strong>Test execution</strong><p>在受控环境验证可用性、RPM / TPM 与 SLA。</p></div></div><div><span>04</span><div><strong>Delivery & revocation</strong><p>买方获得什么、何时到期、如何撤销或续期。</p></div></div><div><span>05</span><div><strong>Index eligibility</strong><p>只有满足规则且已结算的合格交易才进入 Native benchmark。</p></div></div></div>`,
    `<button class="primary-button compact" type="button" data-phase-action="close-overlay">完成</button>`,
  );
}

function showQuoteSelection(supplier) {
  modal(
    `选择 ${supplier || "Native supplier"}`,
    "SECURE ALLOCATION · DEMO CHECKPOINT",
    `<div class="quote-checklist"><div class="is-done"><span>✓</span><strong>Supply provenance reviewed</strong><small>Verified evidence and buyer delivery method</small></div><div class="is-done"><span>✓</span><strong>Capacity test passed</strong><small>Throughput, region and term meet RFQ</small></div><div><span>3</span><strong>Finalize allocation agreement</strong><small>Price, SLA, revocation, refund and settlement</small></div></div><div class="modal-core-note"><span>i</span><div><strong>Demo checkpoint</strong><p>真实产品将在这里进入合同、托管支付、分配与履约记录；本演示不会创建订单或转移资金。</p></div></div>`,
    `<button class="secondary-button compact" type="button" data-phase-action="close-overlay">返回比较</button><button class="primary-button compact" type="button" data-phase-action="confirm-quote">发起安全交割</button>`,
  );
}

function rerenderModels() {
  const main = document.querySelector("#mainContent");
  if (main) main.innerHTML = renderModels();
}

function handlePhaseAction(action, element) {
  if (action === "close-overlay") return closePhaseOverlays();
  if (action === "close-toast") { toastHost.innerHTML = ""; return; }
  if (action === "intent-buy") return toast("买方需求模式已启用", "描述需求后可生成结构化 Native RFQ 草稿");
  if (action === "sell-capacity") return showSupplierOnboarding();
  if (action === "new-native-rfq") return showNativeRfq(element.dataset.family || "Claude");
  if (action === "view-passport") return showPassport(element.dataset.modelId || "claude");
  if (action === "private-otc") return showPrivateOtc();
  if (action === "managed-gateway") return showGateway();
  if (action === "view-verification") return showVerification();
  if (action === "select-quote") return showQuoteSelection(element.dataset.supplier);
  if (action === "filter-provenance") { phaseState.provenanceFilter = element.dataset.filter || "native"; rerenderModels(); return; }
  if (action === "submit-native-rfq" || action === "submit-inline-rfq") { closePhaseOverlays(); return toast("RFQ 草稿已结构化并进入匹配队列", "6 家通过 KYB 与来源验证的供应方将收到邀请 · Demo Simulation"); }
  if (action === "submit-supplier") { closePhaseOverlays(); return toast("供应方验证清单已创建", "下一步：KYB、来源证据与容量测试 · Demo Simulation"); }
  if (action === "submit-otc") { closePhaseOverlays(); return toast("Capacity Desk 已接收私密需求", "该需求不会进入公开库存或 Native benchmark · Demo Simulation"); }
  if (action === "confirm-quote") { closePhaseOverlays(); return toast("安全交割清单已创建", "合同、分配、托管支付与结算仍为 Demo Simulation"); }
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

console.info("TradeNEXT Phase 1 provenance interactions ready");
