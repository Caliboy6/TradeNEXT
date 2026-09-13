export const phase1Meta = {
  label: "Phase 1 · Native RFQ Market",
  dataMode: "Synthetic demo data",
  updatedAt: "2026-08-20 23:30 CST",
};

export const provenanceCatalog = {
  native_direct: {
    label: "Native Direct",
    zh: "Native Direct",
    role: "Core",
    tone: "native",
    buyerReceives: "Original-provider project, account or direct access",
    description: "Direct access under an original-provider contract or project, with provenance, capacity and delivery terms verified by OpenNEXT.",
    indexEligible: true,
  },
  native_allocated: {
    label: "Native Allocated",
    zh: "Native Allocated",
    role: "Core",
    tone: "native",
    buyerReceives: "Dedicated allocation under an enterprise agreement",
    description: "Isolated native allocation under an enterprise agreement, with explicit term, throughput, region and revocation terms.",
    indexEligible: true,
  },
  enterprise_partner: {
    label: "Enterprise Partner",
    zh: "Enterprise Partner",
    role: "Core-adjacent",
    tone: "partner",
    buyerReceives: "Partner-delivered enterprise allocation",
    description: "Delivered by a verified enterprise partner, with clear contractual and service-responsibility boundaries.",
    indexEligible: true,
  },
  managed_gateway: {
    label: "Managed Gateway",
    zh: "Managed Gateway",
    role: "Optional",
    tone: "managed",
    buyerReceives: "OpenNEXT-managed key or endpoint",
    description: "Optional managed delivery, metering and settlement. It is not Native Direct and is disabled by default.",
    indexEligible: false,
  },
  hosted_inference: {
    label: "Hosted Inference",
    zh: "Hosted Inference",
    role: "Supplemental",
    tone: "hosted",
    buyerReceives: "Provider-hosted endpoint",
    description: "A third-party hosted endpoint for open or compatible models, offered as supplemental market supply.",
    indexEligible: false,
  },
  unknown: {
    label: "Provenance Pending",
    zh: "Provenance pending",
    role: "Restricted",
    tone: "pending",
    buyerReceives: "Delivery terms pending verification",
    description: "Provenance evidence and capacity testing are incomplete; excluded from the public Native market and benchmark.",
    indexEligible: false,
  },
};

export const providerProvenance = {
  "claude-depth-1": { type: "native_direct", verified: true, method: "Contract evidence + live capacity test", deliveryMode: "Original-provider project access", lastVerifiedAt: "18 min ago" },
  "claude-depth-2": { type: "native_allocated", verified: true, method: "Enterprise allocation letter + quota telemetry", deliveryMode: "Dedicated enterprise allocation", lastVerifiedAt: "31 min ago" },
  "claude-depth-3": { type: "managed_gateway", verified: true, method: "Endpoint health + metering audit", deliveryMode: "OpenNEXT managed endpoint", lastVerifiedAt: "12 min ago" },
  "gpt-depth-1": { type: "native_direct", verified: true, method: "Channel authorization + project test", deliveryMode: "Original-provider project access", lastVerifiedAt: "24 min ago" },
  "gpt-depth-2": { type: "native_allocated", verified: true, method: "Enterprise agreement + quota telemetry", deliveryMode: "Dedicated enterprise allocation", lastVerifiedAt: "43 min ago" },
  "gpt-depth-3": { type: "managed_gateway", verified: true, method: "Gateway audit + usage reconciliation", deliveryMode: "OpenNEXT managed endpoint", lastVerifiedAt: "15 min ago" },
  "gemini-depth-1": { type: "native_direct", verified: true, method: "Partner authorization + project test", deliveryMode: "Original-provider project access", lastVerifiedAt: "27 min ago" },
  "gemini-depth-2": { type: "enterprise_partner", verified: true, method: "Partner contract + capacity test", deliveryMode: "Partner-delivered allocation", lastVerifiedAt: "46 min ago" },
  "gemini-depth-3": { type: "managed_gateway", verified: true, method: "Endpoint health + metering audit", deliveryMode: "OpenNEXT managed endpoint", lastVerifiedAt: "20 min ago" },
  "deepseek-depth-1": { type: "hosted_inference", verified: true, method: "Model hash + H200 performance test", deliveryMode: "Provider-hosted endpoint", lastVerifiedAt: "14 min ago" },
  "deepseek-depth-2": { type: "hosted_inference", verified: true, method: "Model hash + H100 performance test", deliveryMode: "Provider-hosted endpoint", lastVerifiedAt: "33 min ago" },
  "deepseek-depth-3": { type: "hosted_inference", verified: true, method: "Model hash + route performance test", deliveryMode: "Provider-hosted endpoint", lastVerifiedAt: "22 min ago" },
  "kimi-depth-1": { type: "native_direct", verified: true, method: "Channel evidence + project test", deliveryMode: "Original-provider project access", lastVerifiedAt: "19 min ago" },
  "kimi-depth-2": { type: "native_allocated", verified: true, method: "Enterprise allocation + quota telemetry", deliveryMode: "Dedicated enterprise allocation", lastVerifiedAt: "39 min ago" },
  "kimi-depth-3": { type: "managed_gateway", verified: true, method: "Gateway audit + capacity test", deliveryMode: "OpenNEXT managed endpoint", lastVerifiedAt: "17 min ago" },
  "glm-depth-1": { type: "native_direct", verified: true, method: "Channel evidence + project test", deliveryMode: "Original-provider project access", lastVerifiedAt: "29 min ago" },
  "glm-depth-2": { type: "hosted_inference", verified: true, method: "Model hash + H100 performance test", deliveryMode: "Provider-hosted endpoint", lastVerifiedAt: "35 min ago" },
  "glm-depth-3": { type: "managed_gateway", verified: true, method: "Gateway audit + usage reconciliation", deliveryMode: "OpenNEXT managed endpoint", lastVerifiedAt: "21 min ago" },
};

export const demandTape = [
  { id: "RFQ-8421", model: "Claude Sonnet", notional: "$100k", term: "30 days", throughput: "2M TPM", region: "US", provenance: "Native only", responses: 6, age: "3 min" },
  { id: "RFQ-8418", model: "GPT Enterprise", notional: "$250k", term: "90 days", throughput: "5M TPM", region: "US · EU", provenance: "Native / Partner", responses: 4, age: "11 min" },
  { id: "RFQ-8412", model: "Gemini Capacity", notional: "$80k", term: "45 days", throughput: "3M TPM", region: "APAC", provenance: "Native only", responses: 3, age: "18 min" },
  { id: "RFQ-8405", model: "H100 SXM × 64", notional: "60 days", term: "Dedicated", throughput: "400G IB", region: "Singapore", provenance: "Verified operator", responses: 5, age: "26 min" },
];

export const quoteComparison = [
  { supplier: "Aurora Authorized Channel", provenance: "native_direct", rate: 0.82, total: "$82,000", capacity: "$120k", throughput: "2.0M TPM", delivery: "24h", sla: "99.97%", highlight: "Best native provenance" },
  { supplier: "Meridian Enterprise AI", provenance: "native_allocated", rate: 0.835, total: "$83,500", capacity: "$180k", throughput: "2.5M TPM", delivery: "18h", sla: "99.96%", highlight: "Fastest delivery" },
  { supplier: "Pinnacle Enterprise Partner", provenance: "enterprise_partner", rate: 0.84, total: "$84,000", capacity: "$240k", throughput: "4.0M TPM", delivery: "36h", sla: "99.98%", highlight: "Highest throughput" },
];

export const phaseRoadmap = [
  { phase: "Phase 1", title: "Native RFQ Market", status: "Now", description: "Provenance verification, structured RFQ, quote comparison, allocation and settlement records." },
  { phase: "Phase 2", title: "Execution & Hosted Supply", status: "Next", description: "GPU reservation, hosted inference, optional managed delivery and metering." },
  { phase: "Phase 3", title: "Market Depth & Data", status: "Later", description: "Transaction history, depth, supplier fulfilment data and capacity indices." },
];

export const phaseState = {
  provenanceFilter: "native",
};

export function getProvenance(row) {
  const record = providerProvenance[row?.id] || { type: "unknown", verified: false, method: "Pending", deliveryMode: "Pending", lastVerifiedAt: "Pending" };
  return { ...record, ...provenanceCatalog[record.type] };
}

export function isNativeType(type) {
  return ["native_direct", "native_allocated", "enterprise_partner"].includes(type);
}
