import { modelMarkets, providerDepth, modelView, compactMoney, compactNumber, escapeHtml } from "./demo-core.js?v=opennext-20260912-5";
import { gpuSupplyListings, gpuDemandRatings, procurementState, getProvenance, getSupplierReputation } from "./procurement-data.js?v=opennext-20260912-5";

const main = document.querySelector("#mainContent");
const modal = document.querySelector("#modal-host");
const toast = document.querySelector("#toast-host");
const STORAGE_KEY = "opennext.market-selections.v1";
let activeOverlay = null;
let enhancementFrame = 0;
let toastTimer = 0;
let installed = false;

const zh = () => window.OpenNEXTI18n?.getLocale?.() === "zh-CN";
const copy = (en, cn) => zh() ? cn : en;
const number = (value) => new Intl.NumberFormat(zh() ? "zh-CN" : "en-US").format(Number(value) || 0);

function hash(value) {
  return [...String(value || "")].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 9973, 17);
}

function normalizeSelection(value) {
  return Array.isArray(value) ? [...new Set(value.filter((item) => typeof item === "string"))] : [];
}

function restoreSelections() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    procurementState.starredOfferIds = normalizeSelection(stored.saved);
    procurementState.cartOfferIds = normalizeSelection(stored.cart);
  } catch {
    procurementState.starredOfferIds = normalizeSelection(procurementState.starredOfferIds);
    procurementState.cartOfferIds = normalizeSelection(procurementState.cartOfferIds);
  }
  procurementState.modelFilter ||= "all";
  procurementState.modelSort ||= "price_asc";
  procurementState.gpuSort ||= "price_asc";
}

function persistSelections() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      saved: procurementState.starredOfferIds,
      cart: procurementState.cartOfferIds,
    }));
  } catch {
    // The demo remains fully usable when storage is unavailable.
  }
}

function keyList(listType) {
  return listType === "cart" ? procurementState.cartOfferIds : procurementState.starredOfferIds;
}

function listLabel(listType) {
  return listType === "cart" ? copy("Quote Cart", "询价清单") : copy("Saved", "收藏");
}

function isSelected(listType, key) {
  return keyList(listType).includes(key);
}

function modelContexts() {
  return modelMarkets.flatMap((rawModel) => {
    const model = modelView(rawModel);
    return (providerDepth[rawModel.id] || []).map((offer, index) => {
      const rating = getSupplierReputation(offer.id);
      const provenance = getProvenance(offer);
      const seed = hash(offer.id);
      const deliveryHours = 12 + seed % 37;
      const responseMinutes = 5 + seed % 24;
      const rate = Number(offer.priceMultiple || model.index || 1);
      return {
        kind: "model", key: `model:${offer.id}`, id: offer.id, familyKey: rawModel.id,
        product: model.name, supplier: offer.providerName, vendor: rawModel.vendor || model.provider || model.family,
        rateValue: rate, rate: `${rate.toFixed(3)}×`, total: `$${Math.round(rate * 100000).toLocaleString("en-US")}`,
        capacityValue: Number(offer.availableOevUsd || 0), capacity: compactMoney.format(offer.availableOevUsd),
        tpmValue: Number(offer.tpm || 0), tpm: `${compactNumber.format(offer.tpm)} TPM`, rpmValue: Number(offer.rpm || 0), rpm: `${number(offer.rpm)} RPM`,
        deliveryHours, delivery: `${deliveryHours}h`, responseMinutes, response: `${responseMinutes} min`,
        ratingValue: rating.overall, rating, provenance, sla: offer.sla || `${offer.uptimePct}%`,
        uptimeValue: Number(offer.uptimePct || 0), uptime: `${Number(offer.uptimePct || 0).toFixed(2)}%`, latency: `${number(offer.p95LatencyMs)} ms P95`,
        regions: (offer.regions || []).join(" · "), settlement: offer.settlement || "Private confirmation",
        dataPolicy: offer.dataPolicy || "Policy on request",
        validity: `${21 + seed % 3} Aug · ${String(14 + seed % 7).padStart(2, "0")}:00 SGT`, index,
      };
    });
  });
}

function gpuContexts() {
  return gpuSupplyListings.map((item) => {
    const rating = getSupplierReputation(item.supplier);
    const demand = gpuDemandRatings.find((row) => row.accelerator === item.accelerator) || { demandScore: 3, useCase: "AI compute" };
    const seed = hash(item.id);
    return {
      kind: "gpu", key: `gpu:${item.id}`, id: item.id, familyKey: item.accelerator,
      product: item.accelerator, supplier: item.supplier,
      rateValue: Number(item.pricePerHour || 0), rate: `$${Number(item.pricePerHour || 0).toFixed(2)} / h`,
      total: copy("Usage based", "按用量计费"), capacityValue: Number(item.units || 0), capacity: `${item.units} ${copy("units", "张")}`,
      tpmValue: 0, tpm: copy("Workload dependent", "取决于工作负载"), rpm: copy("Workload dependent", "取决于工作负载"),
      deliveryHours: item.availability === "Available now" ? 0 : 24 + seed % 72, delivery: item.availability,
      responseMinutes: 6 + seed % 26, response: `${6 + seed % 26} min`, ratingValue: rating.overall, rating,
      provenance: { productLabel: "Verified Operator", category: "Qualified GPU operator", buyerReceives: item.term },
      sla: `${item.sla}%`, uptimeValue: Number(item.sla || 0), uptime: `${item.sla}% SLA`, latency: copy("Benchmark on request", "可申请基准测试"),
      regions: item.region, settlement: item.transactionMode === "instant" ? "Instant reservation" : "Private RFQ",
      dataPolicy: demand.useCase, validity: item.availability, topology: item.topology, term: item.term,
      demandScore: demand.demandScore,
    };
  });
}

function allContexts() {
  return [...modelContexts(), ...gpuContexts()];
}

function contextForKey(key) {
  return allContexts().find((item) => item.key === key) || null;
}

function closeMarketModal() {
  if (activeOverlay && modal?.querySelector(".market-tools-modal")) modal.replaceChildren();
  activeOverlay = null;
  document.body.classList.remove("overlay-open");
}

function showToast(title, description) {
  clearTimeout(toastTimer);
  toast.innerHTML = `<div class="toast"><div class="toast-icon">✓</div><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></div><button type="button" data-market-action="close-market-toast" aria-label="${copy("Close", "关闭")}">×</button></div>`;
  toastTimer = setTimeout(() => toast.replaceChildren(), 3600);
}

function showMarketModal(title, caption, body, footer = "", className = "") {
  modal.innerHTML = `<div class="modal-backdrop market-modal-backdrop"><section class="modal procurement-modal market-tools-modal ${className}" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header class="modal-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(caption)}</p></div><button class="close-button" type="button" data-market-action="close-market-modal" aria-label="${copy("Close", "关闭")}">×</button></header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-footer">${footer}</footer>` : ""}</section></div>`;
  document.body.classList.add("overlay-open");
}

function detailBody(item) {
  const authorization = item.provenance?.category || copy("Operator qualification reviewed", "已审核运营商资质");
  const delivery = item.provenance?.buyerReceives || item.term || item.delivery;
  const reviewOne = copy("Delivery matched the quoted capacity and activation window.", "交付容量与报价及启用时间一致。");
  const reviewTwo = copy("Responsive during verification, contracting and activation.", "在验证、签约和启用过程中响应及时。");
  return `<div class="offer-detail-hero"><div><span class="offer-type-chip">${escapeHtml(item.kind === "model" ? authorization : "Verified GPU operator")}</span><h3>${escapeHtml(item.product)}</h3><p>${escapeHtml(item.supplier)} · ${escapeHtml(item.regions)}</p></div><div class="offer-detail-price"><strong>${escapeHtml(item.rate)}</strong><span>${item.kind === "model" ? copy("public API equivalent", "公开 API 等值基准") : copy("per accelerator-hour", "每加速器·小时")}</span></div></div>
  <div class="offer-kpi-grid"><div><span>${copy("Available capacity", "可用容量")}</span><strong>${escapeHtml(item.capacity)}</strong></div><div><span>${copy("Throughput / quantity", "吞吐 / 数量")}</span><strong>${escapeHtml(item.kind === "model" ? `${item.tpm} · ${item.rpm}` : item.capacity)}</strong></div><div><span>${copy("Earliest delivery", "最快交付")}</span><strong>${escapeHtml(item.delivery)}</strong></div><div><span>${copy("Average response", "平均响应")}</span><strong>${escapeHtml(item.response)}</strong></div></div>
  <dl class="offer-detail-grid"><div><dt>${copy("Supply class", "供应类别")}</dt><dd>${escapeHtml(authorization)}</dd></div><div><dt>${copy("Buyer receives", "买方获得")}</dt><dd>${escapeHtml(delivery)}</dd></div><div><dt>${copy("SLA / uptime", "SLA / 可用率")}</dt><dd>${escapeHtml(item.uptime)}</dd></div><div><dt>${copy("Latency", "延迟")}</dt><dd>${escapeHtml(item.latency)}</dd></div><div><dt>${copy("Validity / availability", "有效期 / 可用时间")}</dt><dd>${escapeHtml(item.validity)}</dd></div><div><dt>${copy("Settlement", "结算方式")}</dt><dd>${escapeHtml(item.settlement)}</dd></div><div><dt>${copy("Data policy / workload", "数据政策 / 用途")}</dt><dd>${escapeHtml(item.dataPolicy)}</dd></div><div><dt>${copy("Seller reputation", "卖家信誉")}</dt><dd>${item.rating.overall.toFixed(2)} / 5 · ${item.rating.completedTrades} ${copy("trades", "笔交易")}</dd></div></dl>
  <section class="offer-review-block"><div class="offer-review-head"><div><span>${copy("Verified transaction reviews", "已验证交易评价")}</span><strong>${item.rating.overall.toFixed(2)} / 5</strong></div><small>${item.rating.onTimePct}% ${copy("on-time delivery", "准时交付")}</small></div><blockquote>“${reviewOne}”<span>${copy("Verified enterprise buyer", "已验证企业买家")}</span></blockquote><blockquote>“${reviewTwo}”<span>${copy("Verified capacity buyer", "已验证容量买家")}</span></blockquote></section>
  <div class="market-boundary-note"><span>i</span><p><strong>${copy("Supply verification", "供应验证")}</strong>${copy("OpenNEXT records the reviewed evidence, technical test and buyer delivery method. Technical verification does not create upstream authorization.", "OpenNEXT 记录已审核证据、技术测试和买方交付方式。技术验证不会形成上游授权。")}</p></div>`;
}

function openQuoteRequest(key) {
  const item = contextForKey(key);
  if (!item) return;
  closeMarketModal();
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.hidden = true;
  trigger.dataset.procAction = "post-rfq";
  trigger.dataset.rfqType = item.kind === "gpu" ? "gpu" : "native_model";
  trigger.dataset.family = item.product;
  document.body.append(trigger);
  trigger.click();
  trigger.remove();
  const form = document.querySelector("#unifiedRfqForm");
  if (!form) return;
  form.insertAdjacentHTML("afterbegin", `<div class="selected-offer-context"><span>${copy("SELECTED OFFER", "已选供应")}</span><strong>${escapeHtml(item.product)} · ${escapeHtml(item.supplier)}</strong><p>${escapeHtml(item.rate)} · ${escapeHtml(item.capacity)} · ${escapeHtml(item.delivery)}</p><small>${copy("This quote request is tied to the selected offer. Confirm volume, term and delivery requirements before sending.", "此报价请求已关联所选供应。发送前请确认采购量、期限与交付要求。")}</small></div>`);
  Object.entries({ offerKey: item.key, selectedSupplier: item.supplier, quotedRate: item.rate }).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.append(input);
  });
  const heading = modal.querySelector(".modal-head h2");
  const caption = modal.querySelector(".modal-head p");
  const submit = modal.querySelector('[data-flow-action="submit-rfq-full"]');
  if (heading) heading.textContent = copy("Request quote", "请求报价");
  if (caption) caption.textContent = `${item.product} · ${item.supplier}`;
  if (submit) submit.textContent = copy("Send quote request", "发送报价请求");
}

function renderDetail(key, returnList = null) {
  const item = contextForKey(key);
  if (!item) return closeMarketModal();
  activeOverlay = { kind: "detail", key, returnList };
  const saved = isSelected("saved", key);
  const cart = isSelected("cart", key);
  const back = returnList ? `<button class="secondary-button compact" type="button" data-market-action="open-list" data-list-type="${returnList}">← ${copy(`Back to ${listLabel(returnList)}`, `返回${listLabel(returnList)}`)}</button>` : "";
  const footer = `${back}<button class="secondary-button compact ${saved ? "is-selected" : ""}" type="button" data-market-action="toggle-save" data-market-key="${escapeHtml(key)}">${saved ? "★" : "☆"} ${saved ? copy("Saved", "已收藏") : copy("Save", "收藏")}</button><button class="secondary-button compact ${cart ? "is-selected" : ""}" type="button" data-market-action="toggle-cart" data-market-key="${escapeHtml(key)}">${cart ? "✓" : "+"} ${cart ? copy("In Quote Cart", "已加入询价清单") : copy("Add to Quote Cart", "加入询价清单")}</button><button class="primary-button compact" type="button" data-market-action="request-quote" data-market-key="${escapeHtml(key)}">${copy("Request quote", "请求报价")}</button>`;
  showMarketModal(copy("Offer details", "供应详情"), `${item.product} · ${item.supplier}`, detailBody(item), footer, "offer-detail-modal");
}

function selectionRows(listType) {
  const items = keyList(listType).map(contextForKey).filter(Boolean);
  if (!items.length) return `<div class="selection-empty"><span>${listType === "cart" ? "+" : "☆"}</span><strong>${copy(`Your ${listLabel(listType)} is empty`, `${listLabel(listType)}为空`)}</strong><p>${copy("Use the icons on a supply row to add offers before comparing.", "使用供应挂单上的图标加入选项，然后进行对比。")}</p></div>`;
  return `<div class="selection-list">${items.map((item, index) => `<div class="selection-item"><input type="checkbox" data-compare-key="${escapeHtml(item.key)}" ${index < 4 ? "checked" : ""} aria-label="${copy("Select for comparison", "选择进行对比")}"><div class="selection-item-product"><strong>${escapeHtml(item.product)}</strong><span>${escapeHtml(item.supplier)} · ${escapeHtml(item.provenance?.productLabel || "Verified Operator")}</span></div><div class="selection-item-commercial"><strong>${escapeHtml(item.rate)}</strong><span>${escapeHtml(item.capacity)} · ${item.rating.overall.toFixed(2)} / 5</span></div><div class="selection-item-actions"><button type="button" data-market-action="view-selection-detail" data-list-type="${listType}" data-market-key="${escapeHtml(item.key)}">${copy("Details", "详情")}</button>${listType === "cart" ? `<button class="is-primary" type="button" data-market-action="request-quote" data-market-key="${escapeHtml(item.key)}">${copy("Request quote", "请求报价")}</button>` : ""}<button class="selection-remove" type="button" data-market-action="remove-selection" data-list-type="${listType}" data-market-key="${escapeHtml(item.key)}" aria-label="${copy("Remove", "移除")}">×</button></div></div>`).join("")}</div>`;
}

function renderSelection(listType) {
  activeOverlay = { kind: "selection", listType };
  const count = keyList(listType).length;
  const introTitle = listType === "cart" ? copy("Request one offer directly, or select 2–4 to compare", "可直接向单个供应请求报价，或勾选 2–4 个供应进行对比") : copy("Open details, or select 2–4 offers to compare", "可查看详情，或勾选 2–4 个供应进行对比");
  const body = `<div class="selection-intro"><strong>${introTitle}</strong><p>${copy("This release compares offers for the same model or accelerator. Cross-model comparison is planned next.", "当前版本支持同一模型或同一芯片的供应对比，跨模型对比将在下一阶段开放。")}</p></div>${selectionRows(listType)}<div class="market-selection-error" data-selection-error hidden></div>`;
  const footer = `<button class="secondary-button compact" type="button" data-market-action="clear-list" data-list-type="${listType}" ${count ? "" : "disabled"}>${copy("Clear list", "清空列表")}</button><button class="primary-button compact" type="button" data-market-action="compare-selected" data-list-type="${listType}" ${count < 2 ? "disabled" : ""}>${copy("Compare selected", "对比已选项")}</button>`;
  showMarketModal(`${listLabel(listType)} · ${count}`, copy("Review details, request a quote or compare shortlisted capacity", "查看详情、请求报价或比较入选容量"), body, footer, "selection-modal");
}
function comparisonRows(items) {
  const modelRows = [
    { label: copy("Supplier", "供应商"), display: (item) => item.supplier },
    { label: copy("Supply class", "供应类别"), display: (item) => item.provenance?.productLabel || "Verified Operator" },
    { label: copy("Price", "价格"), display: (item) => item.rate, value: (item) => item.rateValue, preference: "min" },
    { label: copy("Total for $100k OEV", "$100k OEV 应付总额"), display: (item) => item.total, value: (item) => item.rateValue, preference: "min" },
    { label: copy("Available capacity", "可用容量"), display: (item) => item.capacity, value: (item) => item.capacityValue, preference: "max" },
    { label: "TPM", display: (item) => item.tpm, value: (item) => item.tpmValue, preference: "max" },
    { label: "RPM", display: (item) => item.rpm, value: (item) => item.rpmValue, preference: "max" },
    { label: copy("Earliest delivery", "最快交付"), display: (item) => item.delivery, value: (item) => item.deliveryHours, preference: "min" },
    { label: copy("Seller rating", "卖家评分"), display: (item) => `${item.rating.overall.toFixed(2)} / 5`, value: (item) => item.ratingValue, preference: "max" },
    { label: copy("Average response", "平均响应"), display: (item) => item.response, value: (item) => item.responseMinutes, preference: "min" },
    { label: copy("SLA / uptime", "SLA / 可用率"), display: (item) => item.uptime, value: (item) => item.uptimeValue, preference: "max" },
  ];
  const gpuRows = [
    { label: copy("Supplier", "供应商"), display: (item) => item.supplier },
    { label: copy("Region", "地区"), display: (item) => item.regions },
    { label: copy("Rate", "费率"), display: (item) => item.rate, value: (item) => item.rateValue, preference: "min" },
    { label: copy("Available units", "可用数量"), display: (item) => item.capacity, value: (item) => item.capacityValue, preference: "max" },
    { label: copy("Availability", "可用时间"), display: (item) => item.delivery, value: (item) => item.deliveryHours, preference: "min" },
    { label: copy("Term", "期限"), display: (item) => item.term },
    { label: copy("Topology", "拓扑"), display: (item) => item.topology },
    { label: copy("Seller rating", "卖家评分"), display: (item) => `${item.rating.overall.toFixed(2)} / 5`, value: (item) => item.ratingValue, preference: "max" },
    { label: copy("Average response", "平均响应"), display: (item) => item.response, value: (item) => item.responseMinutes, preference: "min" },
    { label: "SLA", display: (item) => item.uptime, value: (item) => item.uptimeValue, preference: "max" },
  ];
  const rows = items[0].kind === "model" ? modelRows : gpuRows;
  return rows.map((row) => {
    const values = row.value ? items.map((item) => Number(row.value(item))) : [];
    const comparable = row.preference && values.length === items.length && values.every(Number.isFinite) && new Set(values).size > 1;
    const best = comparable ? (row.preference === "min" ? Math.min(...values) : Math.max(...values)) : null;
    return `<tr><th>${escapeHtml(row.label)}</th>${items.map((item, index) => {
      const isBest = comparable && Math.abs(values[index] - best) < 0.0000001;
      return `<td class="${isBest ? "is-best-value" : ""}"><span class="compare-value">${escapeHtml(row.display(item) || "—")}</span>${isBest ? `<span class="compare-best-badge">${copy("Best", "最优")}</span>` : ""}</td>`;
    }).join("")}</tr>`;
  }).join("");
}
function renderComparison(items, sourceList) {
  activeOverlay = { kind: "compare", keys: items.map((item) => item.key), sourceList };
  const headers = items.map((item) => `<th><strong>${escapeHtml(item.supplier)}</strong><span>${escapeHtml(item.rate)}</span><button class="compare-quote-button" type="button" data-market-action="request-quote" data-market-key="${escapeHtml(item.key)}">${copy("Request quote", "请求报价")}</button></th>`).join("");
  const body = `<div class="compare-scope"><span>✓</span><div><strong>${escapeHtml(items[0].product)}</strong><p>${copy("Same-product comparison · standardized commercial and delivery fields", "同产品对比 · 标准化商务与交付字段")}</p></div></div><div class="compare-best-legend"><span>${copy("Best", "最优")}</span><p>${copy("Highlighted only where values are directly comparable. Lower wins for price and time; higher wins for capacity, throughput, rating and SLA.", "仅对可直接比较的指标标出最优项。价格和时间越低越优；容量、吞吐、评分与 SLA 越高越优。")}</p></div><div class="table-wrap compare-table-wrap"><table class="data-table compare-table"><thead><tr><th>${copy("Parameter", "参数")}</th>${headers}</tr></thead><tbody>${comparisonRows(items)}</tbody></table></div>`;
  const footer = `<button class="secondary-button compact" type="button" data-market-action="open-list" data-list-type="${sourceList}">${copy("Back to selection", "返回选择")}</button>`;
  showMarketModal(copy("Compare offers", "对比供应"), copy("Choose with price, capacity, delivery and reputation in one view", "在一个表格中比较价格、容量、交付和信誉"), body, footer, "comparison-modal");
}
function compareSelected(listType) {
  const keys = [...modal.querySelectorAll("[data-compare-key]:checked")].map((input) => input.dataset.compareKey);
  const error = modal.querySelector("[data-selection-error]");
  const fail = (message) => { if (error) { error.hidden = false; error.textContent = message; } };
  if (keys.length < 2 || keys.length > 4) return fail(copy("Select between 2 and 4 offers.", "请选择 2–4 个供应。"));
  const items = keys.map(contextForKey).filter(Boolean);
  const sameScope = items.length === keys.length && items.every((item) => item.kind === items[0].kind && item.familyKey === items[0].familyKey);
  if (!sameScope) return fail(copy("For this release, compare offers for the same model or accelerator only.", "当前版本仅支持同一模型或同一芯片的供应对比。"));
  renderComparison(items, listType);
}

function toggleSelection(listType, key) {
  const list = keyList(listType);
  const index = list.indexOf(key);
  const added = index === -1;
  if (added) list.push(key); else list.splice(index, 1);
  persistSelections();
  if (activeOverlay?.kind === "detail" && activeOverlay.key === key) renderDetail(key);
  else if (activeOverlay?.kind === "selection" && activeOverlay.listType === listType) renderSelection(listType);
  scheduleEnhancement();
  const title = added ? copy(listType === "cart" ? "Added to Quote Cart" : "Saved for later", listType === "cart" ? "已加入询价清单" : "已收藏") : copy(listType === "cart" ? "Removed from Quote Cart" : "Removed from Saved", listType === "cart" ? "已移出询价清单" : "已取消收藏");
  showToast(title, copy("Your comparison workspace has been updated.", "对比工作区已更新。"));
}

function quickActions(item) {
  const saved = isSelected("saved", item.key);
  const cart = isSelected("cart", item.key);
  const signature = `${zh() ? "zh" : "en"}-${saved ? 1 : 0}-${cart ? 1 : 0}`;
  const saveLabel = saved ? copy("Remove from Saved", "取消收藏") : copy("Save", "收藏");
  const cartLabel = cart ? copy("Remove from Quote Cart", "移出询价清单") : copy("Add to Quote Cart", "加入询价清单");
  return `<span class="market-quick-actions" data-quick-state="${signature}"><button class="market-icon-button ${saved ? "is-active" : ""}" type="button" data-market-action="toggle-save" data-market-key="${escapeHtml(item.key)}" title="${saveLabel}" aria-label="${saveLabel}">${saved ? "★" : "☆"}</button><button class="market-icon-button ${cart ? "is-active is-cart" : ""}" type="button" data-market-action="toggle-cart" data-market-key="${escapeHtml(item.key)}" title="${cartLabel}" aria-label="${cartLabel}">${cart ? "✓" : "+"}</button></span>`;
}

function decorateRow(row, item, kind) {
  row.dataset.marketKey = item.key;
  row.dataset.marketKind = kind;
  row.dataset.marketFamily = item.familyKey;
  row.dataset.marketPrice = String(item.rateValue);
  row.dataset.marketTpm = String(item.tpmValue);
  row.dataset.marketDelivery = String(item.deliveryHours);
  row.dataset.marketRating = String(item.ratingValue);
  row.dataset.marketCapacity = String(item.capacityValue);
  row.dataset.marketProduct = item.product;
  const firstStrong = row.querySelector("td:first-child .strong");
  if (firstStrong && !firstStrong.classList.contains("offer-detail-link")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "strong offer-detail-link";
    button.dataset.marketAction = "view-detail";
    button.dataset.marketKey = item.key;
    button.textContent = firstStrong.textContent;
    firstStrong.replaceWith(button);
  }
  const actionCell = kind === "model" ? row.querySelector(".board-actions") : row.querySelector("td:last-child");
  let tools = actionCell?.querySelector(".market-quick-actions");
  if (!tools && actionCell) {
    actionCell.insertAdjacentHTML("afterbegin", quickActions(item));
    tools = actionCell.querySelector(".market-quick-actions");
  }
  if (tools) {
    const expected = `${zh() ? "zh" : "en"}-${isSelected("saved", item.key) ? 1 : 0}-${isSelected("cart", item.key) ? 1 : 0}`;
    if (tools.dataset.quickState !== expected) tools.outerHTML = quickActions(item);
  }
  const verification = row.querySelector('[data-proc-action="view-passport"]');
  const verificationLabel = copy("View verification", "查看验证");
  if (verification && verification.textContent !== verificationLabel) verification.textContent = verificationLabel;
}

function decorateMarketRows() {
  const models = modelContexts();
  document.querySelectorAll(".supply-board-table tbody tr").forEach((row) => {
    const product = row.querySelector("td:first-child .strong, td:first-child .offer-detail-link")?.textContent.trim();
    const supplier = row.querySelector("td:first-child .subline")?.textContent.trim();
    const item = models.find((entry) => entry.product === product && entry.supplier === supplier);
    if (item) decorateRow(row, item, "model");
  });
  const gpus = gpuContexts();
  document.querySelectorAll(".gpu-listing-table tbody tr").forEach((row) => {
    const product = row.querySelector("td:first-child .strong, td:first-child .offer-detail-link")?.textContent.trim();
    const supplier = row.querySelector("td:nth-child(2) .strong")?.textContent.trim();
    const item = gpus.find((entry) => entry.product === product && entry.supplier === supplier);
    if (item) decorateRow(row, item, "gpu");
  });
}

function selectionSummary() {
  const signature = `${zh() ? "zh" : "en"}-${procurementState.starredOfferIds.length}-${procurementState.cartOfferIds.length}`;
  return `<div class="market-selection-summary topbar-selection-summary" data-selection-state="${signature}"><button type="button" data-market-action="open-list" data-list-type="saved"><span>★</span>${copy("Saved", "收藏")}<strong>${procurementState.starredOfferIds.length}</strong></button><button type="button" data-market-action="open-list" data-list-type="cart"><span>＋</span>${copy("Quote Cart", "询价清单")}<strong>${procurementState.cartOfferIds.length}</strong></button></div>`;
}

function ensureSelectionSummaries() {
  document.querySelectorAll(".market-board-head > .market-selection-summary").forEach((summary) => summary.remove());
  const host = document.querySelector(".topbar-right");
  if (!host) return;
  const expected = `${zh() ? "zh" : "en"}-${procurementState.starredOfferIds.length}-${procurementState.cartOfferIds.length}`;
  const summary = host.querySelector(".market-selection-summary");
  if (!summary) {
    const languageSwitch = host.querySelector(".language-switch");
    if (languageSwitch) languageSwitch.insertAdjacentHTML("beforebegin", selectionSummary());
    else host.insertAdjacentHTML("afterbegin", selectionSummary());
  } else if (summary.dataset.selectionState !== expected) {
    summary.outerHTML = selectionSummary();
  }
}

function ensureRankControls() {
  const nativeToolbar = document.querySelector(".procurement-market .procurement-toolbar");
  if (nativeToolbar && !nativeToolbar.querySelector(".market-rank-controls")) {
    const options = modelMarkets.map((raw) => `<option value="${escapeHtml(raw.id)}">${escapeHtml(modelView(raw).name)}</option>`).join("");
    nativeToolbar.insertAdjacentHTML("beforeend", `<div class="market-rank-controls"><label><span>${copy("Model", "模型")}</span><select class="select" id="marketModelFilter"><option value="all">${copy("All models", "全部模型")}</option>${options}</select></label><label><span>${copy("Rank by", "排序方式")}</span><select class="select" id="marketModelSort"><option value="price_asc">${copy("Lowest price", "价格最低")}</option><option value="tpm_desc">${copy("Highest TPM", "TPM 最高")}</option><option value="delivery_asc">${copy("Fastest delivery", "交付最快")}</option><option value="rating_desc">${copy("Best rated", "评价最高")}</option><option value="capacity_desc">${copy("Largest capacity", "容量最大")}</option></select></label></div>`);
  }
  const modelFilter = document.querySelector("#marketModelFilter");
  const modelSort = document.querySelector("#marketModelSort");
  if (modelFilter) modelFilter.value = procurementState.modelFilter;
  if (modelSort) modelSort.value = procurementState.modelSort;

  // Physical hardware already has its own price/quantity sort. Cloud-only
  // ranking metadata must not create a second, non-functional hardware sort.
  const gpuToolbar = document.querySelector(".gpu-supply-board")
    ? document.querySelector(".gpu-procurement .filter-bar") : null;
  if (!gpuToolbar) document.querySelector(".gpu-rank-control")?.remove();
  if (gpuToolbar && !gpuToolbar.querySelector("#marketGpuSort")) {
    gpuToolbar.insertAdjacentHTML("beforeend", `<label class="gpu-rank-control"><span>${copy("Rank by", "排序方式")}</span><select class="select" id="marketGpuSort"><option value="price_asc">${copy("Lowest price", "价格最低")}</option><option value="capacity_desc">${copy("Most units", "数量最多")}</option><option value="delivery_asc">${copy("Earliest available", "最早可用")}</option><option value="rating_desc">${copy("Best rated", "评价最高")}</option></select></label>`);
  }
  const gpuSort = document.querySelector("#marketGpuSort");
  if (gpuSort) gpuSort.value = procurementState.gpuSort;
}

function sortRows(table, sortKey) {
  const body = table?.tBodies?.[0];
  if (!body) return;
  const current = [...body.rows];
  const sorted = [...current].sort((a, b) => {
    const numeric = (row, key) => Number(row.dataset[key] || 0);
    if (sortKey === "tpm_desc") return numeric(b, "marketTpm") - numeric(a, "marketTpm");
    if (sortKey === "delivery_asc") return numeric(a, "marketDelivery") - numeric(b, "marketDelivery");
    if (sortKey === "rating_desc") return numeric(b, "marketRating") - numeric(a, "marketRating");
    if (sortKey === "capacity_desc") return numeric(b, "marketCapacity") - numeric(a, "marketCapacity");
    return numeric(a, "marketPrice") - numeric(b, "marketPrice");
  });
  if (!sorted.some((row, index) => row !== current[index])) return;
  const fragment = document.createDocumentFragment();
  sorted.forEach((row) => fragment.append(row));
  body.append(fragment);
}

function applyFiltersAndSort() {
  const nativeRows = [...document.querySelectorAll(".supply-board-table tbody tr")];
  nativeRows.forEach((row) => row.classList.toggle("is-market-filtered", procurementState.modelFilter !== "all" && row.dataset.marketFamily !== procurementState.modelFilter));
  sortRows(document.querySelector(".supply-board-table"), procurementState.modelSort);
  sortRows(document.querySelector(".gpu-listing-table"), procurementState.gpuSort);
  const count = nativeRows.filter((row) => !row.hidden && !row.classList.contains("is-market-filtered")).length;
  const empty = document.querySelector('[data-search-empty="native"]');
  if (empty) empty.hidden = count > 0;
}

function setText(element, value) {
  if (element && element.textContent !== value) element.textContent = value;
}

function applyTerminology() {
  const page = document.querySelector(".procurement-market");
  const nav = document.querySelector('[data-nav="models"] > span:last-child');
  setText(nav, copy("Native Capacity", "原厂容量"));
  if (!page) return;
  // Headings and explanatory copy belong to the page renderer; enhancement
  // must not restore the previous visual design after every DOM change.
  const metricLabels = page.querySelectorAll(".procurement-metrics > div > span");
  setText(metricLabels[0], copy("Qualified offers", "合格供应"));
  setText(metricLabels[1], copy("Indicative available capacity", "指示性可用容量"));

}

function enhance() {
  enhancementFrame = 0;
  if (document.body.classList.contains("is-public")) return;
  applyTerminology();
  decorateMarketRows();
  ensureSelectionSummaries();
  ensureRankControls();
  applyFiltersAndSort();
}

function scheduleEnhancement() {
  if (enhancementFrame) cancelAnimationFrame(enhancementFrame);
  enhancementFrame = requestAnimationFrame(enhance);
}

function renderActiveOverlay() {
  if (document.body.classList.contains("is-public") || !modal?.querySelector(".market-tools-modal")) {
    activeOverlay = null;
    return;
  }
  if (!activeOverlay) return;
  if (activeOverlay.kind === "detail") renderDetail(activeOverlay.key, activeOverlay.returnList);
  if (activeOverlay.kind === "selection") renderSelection(activeOverlay.listType);
  if (activeOverlay.kind === "compare") {
    const items = activeOverlay.keys.map(contextForKey).filter(Boolean);
    if (items.length) renderComparison(items, activeOverlay.sourceList);
  }
}

function handleAction(action, element) {
  const key = element.dataset.marketKey;
  if (action === "close-market-modal") return closeMarketModal();
  if (action === "close-market-toast") return toast.replaceChildren();
  if (action === "view-detail") return renderDetail(key);
  if (action === "view-selection-detail") return renderDetail(key, element.dataset.listType || "saved");
  if (action === "request-quote") return openQuoteRequest(key);
  if (action === "toggle-save") return toggleSelection("saved", key);
  if (action === "toggle-cart") return toggleSelection("cart", key);
  if (action === "open-list") return renderSelection(element.dataset.listType || "saved");
  if (action === "remove-selection") return toggleSelection(element.dataset.listType || "saved", key);
  if (action === "compare-selected") return compareSelected(element.dataset.listType || "saved");
  if (action === "clear-list") {
    const listType = element.dataset.listType || "saved";
    keyList(listType).splice(0);
    persistSelections();
    renderSelection(listType);
    scheduleEnhancement();
  }
}

export function installMarketTools() {
  if (installed) return;
  installed = true;
  restoreSelections();
  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "./market-tools.css?v=opennext-20260912-5";
  document.head.append(style);

  document.addEventListener("click", (event) => {
    if (event.target.classList?.contains("market-modal-backdrop")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeMarketModal();
      return;
    }
    const element = event.target.closest?.("[data-market-action]");
    if (element) {
      event.preventDefault();
      event.stopImmediatePropagation();
      handleAction(element.dataset.marketAction, element);
      return;
    }
    if (activeOverlay && event.target.closest?.("[data-route], [data-proc-action], [data-flow-action]")) activeOverlay = null;
  }, true);

  document.addEventListener("change", (event) => {
    if (event.target.id === "marketModelFilter") {
      event.preventDefault(); event.stopImmediatePropagation();
      procurementState.modelFilter = event.target.value;
      applyFiltersAndSort();
    }
    if (event.target.id === "marketModelSort") {
      event.preventDefault(); event.stopImmediatePropagation();
      procurementState.modelSort = event.target.value;
      applyFiltersAndSort();
    }
    if (event.target.id === "marketGpuSort") {
      event.preventDefault(); event.stopImmediatePropagation();
      procurementState.gpuSort = event.target.value;
      applyFiltersAndSort();
    }
  }, true);

  window.addEventListener("input", (event) => {
    if (["nativeMarketSearch", "gpuMarketSearch"].includes(event.target.id)) queueMicrotask(scheduleEnhancement);
  }, true);
  document.addEventListener("opennext:localechange", () => queueMicrotask(() => {
    scheduleEnhancement();
    renderActiveOverlay();
  }));
  window.addEventListener("popstate", () => { activeOverlay = null; });
  // Public navigation and shared Escape handling can close the modal before
  // this module receives an event. Forget that closed view immediately.
  if (modal) new MutationObserver(() => {
    if (!modal.querySelector(".market-tools-modal")) activeOverlay = null;
  }).observe(modal, { childList: true });
  new MutationObserver(scheduleEnhancement).observe(main, { childList: true, subtree: true });
  scheduleEnhancement();
}
