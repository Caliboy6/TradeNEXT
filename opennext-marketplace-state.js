// Private RFQs and inventory are matched locally in the presentation workspace.
// This module has no network side effects and never copies private notes into alerts.
const STORAGE_KEY = 'opennext.marketplace.v1';
const RECORD_LIMIT = 100;
const NOTICE_LIMIT = 400;
const RFQ_STATUSES = new Set(['open', 'paused', 'closed', 'completed']);
const SUPPLY_STATUSES = new Set(['active', 'paused', 'withdrawn', 'depleted']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function cleanText(value, label, maximum = 120, optional = false) {
  if (optional && (value == null || value === '')) return '';
  if (typeof value !== 'string') throw new Error(`${label} is required.`);
  const result = value.trim();
  if ((!result && !optional) || result.length > maximum || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)) {
    throw new Error(`Enter a valid ${label.toLowerCase()}${maximum ? ` (${maximum} characters maximum)` : ''}.`);
  }
  return result;
}

function number(value, label, {minimum = 0, maximum = 1e12, integer = false, fallback} = {}) {
  if ((value === undefined || value === null || value === '') && fallback !== undefined) return fallback;
  if (typeof value !== 'number' && typeof value !== 'string') throw new Error(`Enter a valid ${label.toLowerCase()}.`);
  if (typeof value === 'string' && !value.trim()) throw new Error(`${label} is required.`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < minimum || result > maximum || (integer && !Number.isSafeInteger(result))) {
    throw new Error(`${label} must be ${integer ? 'a whole number ' : ''}between ${minimum.toLocaleString('en-US')} and ${maximum.toLocaleString('en-US')}.`);
  }
  return result;
}

function choice(value, choices, label, fallback) {
  const result = value === undefined || value === null || value === '' ? fallback : value;
  if (!choices.includes(result)) throw new Error(`Select a valid ${label.toLowerCase()}.`);
  return result;
}

function date(value, label, fallback) {
  const result = value || fallback;
  if (typeof result !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new Error(`${label} is required.`);
  const parsed = new Date(`${result}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result || result < '2000-01-01' || result > '2200-12-31') {
    throw new Error(`Enter a valid ${label.toLowerCase()}.`);
  }
  return result;
}

function boolean(value, fallback = true) {
  if (value === undefined || value === null) return fallback;
  if (value === true || value === 'true' || value === 'on') return true;
  if (value === false || value === 'false') return false;
  throw new Error('Choose whether partial allocation is available.');
}

function normalizeRecord(values, kind, today) {
  if (!isObject(values)) throw new Error('Complete the required fields before submitting.');
  const supply = kind === 'supply';
  const market = choice(values.market, ['gpu', 'token'], 'market');
  const record = {
    market,
    model: cleanText(values.model, market === 'gpu' ? 'GPU model' : 'Model', 100),
    notes: cleanText(values.notes, 'Notes', 1600, true),
    status: choice(values.status, [...(supply ? SUPPLY_STATUSES : RFQ_STATUSES)], 'status', supply ? 'active' : 'open'),
  };
  if (market === 'gpu') {
    record.region = cleanText(values.region, 'Region', 80);
    if (supply && /^(any(?: region)?|global|worldwide)$/i.test(record.region)) throw new Error('Enter the region where this inventory is hosted.');
    if (supply) {
      record.servers = number(values.servers, 'Server count', {minimum: 1, maximum: 100000, integer: true});
      record.gpusPerServer = number(values.gpusPerServer, 'GPUs per server', {minimum: 1, maximum: 72, integer: true});
      record.totalGpus = record.servers * record.gpusPerServer;
      record.minimumMonths = number(values.minimumMonths, 'Minimum term', {minimum: 1, maximum: 120, integer: true, fallback: 1});
      record.monthlyPrice = number(values.monthlyPrice, 'Monthly price', {minimum: 0.01, maximum: 1e9});
      record.slaPercent = number(values.slaPercent, 'Uptime SLA', {minimum: 0, maximum: 100, fallback: 99.9});
      record.availability = choice(values.availability, ['available', 'scheduled', 'unavailable'], 'availability', 'available');
      record.availableFrom = date(values.availableFrom, 'Availability date', record.availability === 'scheduled' ? undefined : today);
      record.allowPartial = boolean(values.allowPartial);
    } else {
      record.gpuCount = number(values.gpuCount, 'GPU count', {minimum: 1, maximum: 7200000, integer: true});
      record.durationMonths = number(values.durationMonths, 'Rental term', {minimum: 1, maximum: 120, integer: true});
      record.monthlyBudget = number(values.monthlyBudget, 'Monthly budget', {minimum: 0.01, maximum: 1e9});
      record.minSlaPercent = number(values.minSlaPercent, 'Minimum uptime SLA', {minimum: 0, maximum: 100, fallback: 0});
      record.startDate = date(values.startDate, 'Start date');
    }
  } else {
    record.quotaTokens = number(values.quotaTokens, 'Token allocation', {minimum: 1, maximum: 1e15, integer: true});
    record.deliveryHours = number(values.deliveryHours, supply ? 'Delivery lead time' : 'Delivery window', {minimum: supply ? 0 : 1, maximum: 8760});
    if (supply) {
      record.inputPrice = number(values.inputPrice, 'Input price', {minimum: 0, maximum: 1e6});
      record.outputPrice = number(values.outputPrice, 'Output price', {minimum: 0, maximum: 1e6});
      record.sourceType = choice(values.sourceType, ['original', 'authorized', 'independent'], 'supply source', 'independent');
      record.availableFrom = date(values.availableFrom, 'Availability date', today);
    } else {
      record.maxInputPrice = number(values.maxInputPrice, 'Maximum input price', {minimum: 0, maximum: 1e6});
      record.maxOutputPrice = number(values.maxOutputPrice, 'Maximum output price', {minimum: 0, maximum: 1e6});
      record.sourceRequirement = choice(values.sourceRequirement, ['any', 'authorized', 'original'], 'source requirement', 'any');
    }
  }
  return record;
}

function normalizedModel(model, market) {
  const cleaned = model.toLowerCase().replace(/\s+/g, ' ').trim();
  return market === 'gpu' ? cleaned.replace(/^nvidia\s+/, '').replace(/[\s_-]/g, '') : cleaned.replace(/\s/g, '');
}

function normalizedRegion(region) {
  let value = region.trim().toLowerCase().replace(/[._]/g, '').replace(/\s+/g, ' ');
  value = value.replace(/^(united states(?: of america)?|usa)(?=\b)/, 'us');
  value = value.replace(/^united kingdom(?=\b)/, 'uk');
  return value;
}

function regionMatches(requested, available) {
  const buyer = normalizedRegion(requested);
  const seller = normalizedRegion(available);
  if (['any', 'any region', 'global', 'worldwide'].includes(buyer)) return true;
  if (buyer === seller) return true;
  // Country-wide requests may accept a specified subregion, never the reverse.
  return ['us', 'uk', 'canada', 'germany', 'singapore', 'japan', 'australia'].includes(buyer) && seller.startsWith(`${buyer} `);
}

function matchPair(rfq, supply, currentTime) {
  if (rfq.status !== 'open' || supply.status !== 'active' || rfq.market !== supply.market || normalizedModel(rfq.model, rfq.market) !== normalizedModel(supply.model, supply.market)) return null;
  const match = {
    id: `MATCH-${rfq.id.slice(4)}--${supply.id.slice(4)}`,
    rfqId: rfq.id,
    supplyId: supply.id,
    market: rfq.market,
    model: rfq.model,
    createdAt: rfq.createdAt > supply.createdAt ? rfq.createdAt : supply.createdAt,
  };
  if (rfq.market === 'gpu') {
    if (rfq.startDate < new Date(currentTime).toISOString().slice(0, 10)) return null;
    if (supply.availability === 'unavailable' || !regionMatches(rfq.region, supply.region) || supply.totalGpus < rfq.gpuCount || supply.minimumMonths > rfq.durationMonths || supply.slaPercent < rfq.minSlaPercent || supply.availableFrom > rfq.startDate) return null;
    if (!supply.allowPartial && rfq.gpuCount !== supply.totalGpus) return null;
    const cost = supply.monthlyPrice * (supply.allowPartial ? rfq.gpuCount / supply.totalGpus : 1);
    // Compare the unrounded price so display rounding never admits an over-budget offer.
    if (cost > rfq.monthlyBudget + 1e-8) return null;
    match.estimatedMonthlyCost = Math.round(cost * 100) / 100;
  } else {
    if (supply.quotaTokens < rfq.quotaTokens || supply.inputPrice > rfq.maxInputPrice || supply.outputPrice > rfq.maxOutputPrice) return null;
    // A buyer's delivery deadline is fixed when the RFQ is submitted. It must
    // not keep moving forward while an unmatched request waits for new supply.
    const deliveryDeadline = Date.parse(rfq.createdAt) + rfq.deliveryHours * 3600000;
    const supplierCanStart = Math.max(currentTime, new Date(`${supply.availableFrom}T00:00:00.000Z`).getTime());
    if (supplierCanStart + supply.deliveryHours * 3600000 > deliveryDeadline) return null;
    if (rfq.sourceRequirement === 'original' && supply.sourceType !== 'original') return null;
    if (rfq.sourceRequirement === 'authorized' && !['original', 'authorized'].includes(supply.sourceType)) return null;
  }
  return match;
}

function notificationFor(match, role, createdAt, read = false) {
  const buyer = role === 'buyer';
  return {
    id: `NOTICE-${buyer ? 'B' : 'S'}-${match.id.slice(6)}`,
    role,
    title: buyer ? 'Matching supply found' : 'Matching buyer found',
    body: buyer
      ? `A ${match.model} inventory listing matches your request. Review the terms in My RFQs.`
      : `A buyer request matches your ${match.model} inventory. Review the request in My Supplies.`,
    rfqId: match.rfqId,
    supplyId: match.supplyId,
    matchId: match.id,
    read,
    createdAt,
  };
}

const validId = (id, prefix) => typeof id === 'string' && id.length <= 100 && new RegExp(`^${prefix}-[a-z0-9]+-[0-9]+$`).test(id);
const validTimestamp = value => typeof value === 'string' && value.length <= 30 && Number.isFinite(Date.parse(value));

export function createMarketplaceStore(storage, options = {}) {
  const clock = typeof options.now === 'function' ? options.now : () => new Date();
  const now = () => {
    const result = new Date(clock());
    return Number.isFinite(result.getTime()) ? result : new Date();
  };
  let rfqs = [];
  let supplies = [];
  let notifications = [];
  let matches = [];
  let deliveredPairs = new Set();
  let sequence = 0;

  function pairKey(rfqId, supplyId) { return `${rfqId}|${supplyId}`; }
  function restoreRecord(value, kind) {
    const prefix = kind === 'rfq' ? 'RFQ' : 'SUP';
    if (!isObject(value) || !validId(value.id, prefix) || !validTimestamp(value.createdAt)) return null;
    try {
      return {...normalizeRecord(value, kind, now().toISOString().slice(0, 10)), id: value.id, createdAt: new Date(value.createdAt).toISOString()};
    } catch { return null; }
  }

  try {
    const raw = storage?.getItem(STORAGE_KEY);
    // Refuse unexpectedly large payloads before parsing untrusted persisted data.
    const saved = typeof raw === 'string' && raw.length <= 6000000 ? JSON.parse(raw) : null;
    if (isObject(saved) && saved.version === 1) {
      const uniqueRecords = (values, kind) => {
        const seen = new Set();
        return (Array.isArray(values) ? values : []).slice(0, RECORD_LIMIT * 2).map(value => restoreRecord(value, kind)).filter(value => value && !seen.has(value.id) && seen.add(value.id)).slice(0, RECORD_LIMIT);
      };
      rfqs = uniqueRecords(saved.rfqs, 'rfq');
      supplies = uniqueRecords(saved.supplies, 'supply');
      const rfqIds = new Set(rfqs.map(record => record.id));
      const supplyIds = new Set(supplies.map(record => record.id));
      deliveredPairs = new Set((Array.isArray(saved.deliveredPairs) ? saved.deliveredPairs : []).slice(0, RECORD_LIMIT ** 2).filter(value => {
        if (typeof value !== 'string') return false;
        const parts = value.split('|');
        return parts.length === 2 && rfqIds.has(parts[0]) && supplyIds.has(parts[1]);
      }));
      const seenNotices = new Set();
      notifications = (Array.isArray(saved.notifications) ? saved.notifications : []).slice(0, NOTICE_LIMIT).flatMap(value => {
        if (!isObject(value) || !['buyer', 'seller'].includes(value.role) || !rfqIds.has(value.rfqId) || !supplyIds.has(value.supplyId) || !validTimestamp(value.createdAt) || typeof value.read !== 'boolean') return [];
        const rfq = rfqs.find(record => record.id === value.rfqId);
        const supply = supplies.find(record => record.id === value.supplyId);
        if (rfq.market !== supply.market || normalizedModel(rfq.model, rfq.market) !== normalizedModel(supply.model, supply.market)) return [];
        const match = {id: `MATCH-${rfq.id.slice(4)}--${supply.id.slice(4)}`, rfqId: rfq.id, supplyId: supply.id, model: rfq.model};
        const notification = notificationFor(match, value.role, new Date(value.createdAt).toISOString(), value.read);
        if (seenNotices.has(notification.id)) return [];
        seenNotices.add(notification.id);
        deliveredPairs.add(pairKey(rfq.id, supply.id));
        return [notification];
      });
    }
  } catch { /* A blocked or corrupt storage area must not prevent publishing. */ }

  function persist() {
    try { storage?.setItem(STORAGE_KEY, JSON.stringify({version: 1, rfqs, supplies, notifications, deliveredPairs: [...deliveredPairs]})); } catch { /* The current session remains usable. */ }
  }

  function refresh(emitNotifications = true) {
    const current = now();
    const rfqIds = new Set(rfqs.map(record => record.id));
    const supplyIds = new Set(supplies.map(record => record.id));
    deliveredPairs = new Set([...deliveredPairs].filter(key => {
      const [rfqId, supplyId] = key.split('|');
      return rfqIds.has(rfqId) && supplyIds.has(supplyId);
    }));
    notifications = notifications.filter(value => rfqIds.has(value.rfqId) && supplyIds.has(value.supplyId));
    matches = [];
    for (const rfq of rfqs) {
      for (const supply of supplies) {
        const match = matchPair(rfq, supply, current.getTime());
        if (!match) continue;
        matches.push(match);
        const key = pairKey(rfq.id, supply.id);
        if (emitNotifications && !deliveredPairs.has(key)) {
          notifications.unshift(notificationFor(match, 'buyer', current.toISOString()), notificationFor(match, 'seller', current.toISOString()));
          deliveredPairs.add(key);
        }
      }
    }
    notifications = notifications.slice(0, NOTICE_LIMIT);
  }

  function nextId(prefix) {
    const ids = new Set([...rfqs, ...supplies].map(value => value.id));
    let id;
    do { id = `${prefix}-${now().getTime().toString(36)}-${++sequence}`; } while (ids.has(id));
    return id;
  }

  function create(values, kind) {
    const current = now();
    const normalized = normalizeRecord(values, kind, current.toISOString().slice(0, 10));
    if (kind === 'rfq' && normalized.market === 'gpu') {
      if (normalized.startDate < current.toISOString().slice(0, 10)) throw new Error('Start date must be today or later.');
      if (new Date(`${normalized.startDate}T00:00:00.000Z`).getTime() > current.getTime() + 1830 * 86400000) throw new Error('Choose a start date within the next five years.');
    }
    const record = {...normalized, id: nextId(kind === 'rfq' ? 'RFQ' : 'SUP'), createdAt: current.toISOString()};
    if (kind === 'rfq') rfqs = [record, ...rfqs].slice(0, RECORD_LIMIT);
    else supplies = [record, ...supplies].slice(0, RECORD_LIMIT);
    refresh();
    persist();
    return {...record};
  }

  // Loading is read-only: previously acknowledged matches do not generate another alert.
  refresh(false);
  return {
    get rfqs() { return rfqs.map(value => ({...value})); },
    get supplies() { return supplies.map(value => ({...value})); },
    get notifications() { refresh(false); return notifications.map(value => ({...value})); },
    get matches() { refresh(false); return matches.map(value => ({...value})); },
    createRfq(values) { return create(values, 'rfq'); },
    createSupply(values) { return create(values, 'supply'); },
    getMatches(kind, id) {
      if (!['rfq', 'supply'].includes(kind)) throw new Error('Select an RFQ or inventory listing.');
      refresh(false);
      return matches.filter(value => value[kind === 'rfq' ? 'rfqId' : 'supplyId'] === id).map(value => ({...value}));
    },
    updateStatus(kind, id, status) {
      if (!['rfq', 'supply'].includes(kind)) throw new Error('Select an RFQ or inventory listing.');
      const list = kind === 'rfq' ? rfqs : supplies;
      const allowed = kind === 'rfq' ? RFQ_STATUSES : SUPPLY_STATUSES;
      if (!allowed.has(status)) throw new Error('Select a valid status.');
      const record = list.find(value => value.id === id);
      if (!record) throw new Error('This record is no longer available.');
      record.status = status;
      refresh();
      persist();
      return {...record};
    },
    markRead(id) {
      const notice = notifications.find(value => value.id === id);
      if (!notice) return null;
      notice.read = true;
      persist();
      return {...notice};
    },
    markAllRead() {
      const count = notifications.filter(value => !value.read).length;
      notifications.forEach(value => { value.read = true; });
      persist();
      return count;
    },
  };
}
