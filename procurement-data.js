import { providerProvenance as legacyProviderProfiles } from "./phase1-data.js?v=opennext-20260912-2";

export const procurementMeta = {
  dataMode: "Demo environment",
  updatedAt: "20 Aug · 23:30 SGT",
  marketMode: "Private RFQ-first · not a public order book",
};

export const provenanceCatalog = {
  native_direct: {
    productLabel: "Native Direct",
    category: "Upstream-authorized resale",
    shortCategory: "Upstream authorized",
    tone: "native",
    buyerReceives: "Original-provider project or direct access",
    authorization: "Upstream resale or allocation rights reviewed",
    verificationScope: "Rights evidence + live capacity test",
    indexEligible: true,
  },
  native_allocated: {
    productLabel: "Native Allocated",
    category: "Authorized enterprise allocation",
    shortCategory: "Enterprise allocation",
    tone: "native",
    buyerReceives: "Ring-fenced allocation under an enterprise agreement",
    authorization: "Enterprise allocation rights reviewed",
    verificationScope: "Allocation letter + quota telemetry",
    indexEligible: true,
  },
  enterprise_partner: {
    productLabel: "Enterprise Partner",
    category: "Partner-delivered access",
    shortCategory: "Partner delivered",
    tone: "partner",
    buyerReceives: "Access delivered and supported by a named partner",
    authorization: "Partner mandate and delivery rights reviewed",
    verificationScope: "Partner evidence + project capacity test",
    indexEligible: true,
  },
  managed_gateway: {
    productLabel: "Managed Gateway",
    category: "Technically verified third-party delivery",
    shortCategory: "Technical delivery",
    tone: "managed",
    buyerReceives: "OpenNEXT-managed endpoint with metering",
    authorization: "No upstream resale claim is made",
    verificationScope: "Endpoint health + metering audit",
    indexEligible: false,
  },
  hosted_inference: {
    productLabel: "Hosted Inference",
    category: "Technically verified hosted delivery",
    shortCategory: "Hosted delivery",
    tone: "hosted",
    buyerReceives: "Provider-hosted model endpoint",
    authorization: "Not represented as original-provider capacity",
    verificationScope: "Model identity + route performance test",
    indexEligible: false,
  },
  private_otc: {
    productLabel: "Private OTC",
    category: "Non-authorized Private OTC",
    shortCategory: "Authorization unconfirmed",
    tone: "pending",
    buyerReceives: "Bilaterally agreed controlled delivery",
    authorization: "Upstream resale authorization is not confirmed",
    verificationScope: "Identity, claimed capacity and test execution only",
    indexEligible: false,
  },
  unknown: {
    productLabel: "Provenance pending",
    category: "Unclassified supply",
    shortCategory: "Pending",
    tone: "pending",
    buyerReceives: "Delivery terms pending review",
    authorization: "Not established",
    verificationScope: "No completed verification scope",
    indexEligible: false,
  },
};

export const providerProfiles = Object.fromEntries(
  Object.entries(legacyProviderProfiles).map(([id, record]) => {
    const meta = provenanceCatalog[record.type] || provenanceCatalog.unknown;
    return [id, {
      ...record,
      ...meta,
      evidenceReviewed: ["native_direct", "native_allocated", "enterprise_partner"].includes(record.type),
      technicalTested: record.verified === true,
    }];
  }),
);

export const demandTape = [
  { id: "RFQ-8421", type: "Native Model", model: "Claude Sonnet", notional: "$100k", term: "30 days", throughput: "33.3K TPS", region: "US", provenance: "Native only", responses: 6, age: "3 min", status: "Comparing quotes" },
  { id: "RFQ-8418", type: "Native Model", model: "GPT Enterprise", notional: "$250k", term: "90 days", throughput: "83.3K TPS", region: "US · EU", provenance: "Native / Partner", responses: 4, age: "11 min", status: "Capacity test" },
  { id: "RFQ-8412", type: "Native Model", model: "Gemini Capacity", notional: "$80k", term: "45 days", throughput: "50K TPS", region: "APAC", provenance: "Native only", responses: 3, age: "18 min", status: "Supplier matching" },
  { id: "RFQ-8405", type: "GPU Cluster", model: "H100 SXM × 64", notional: "$640k", term: "60 days", throughput: "400G IB", region: "Singapore", provenance: "Verified operator", responses: 5, age: "26 min", status: "Commercial review" },
  { id: "RFQ-8399", type: "Private OTC", model: "Claude capacity", notional: "$500k", term: "120 days", throughput: "133.3K TPS", region: "Global", provenance: "Authorization unconfirmed", responses: 2, age: "41 min", status: "Risk review" },
];

export const quoteComparison = [
  { supplier: "Aurora Authorized Channel", provenance: "native_direct", rate: 0.82, total: "$82,000", capacity: "$120,000", inputPer1MUsd: 2.46, outputPer1MUsd: 12.30, tps: 33333, delivery: "24h", sla: "99.97%", validUntil: "21 Aug · 18:00 SGT", quoteState: "Indicative", fee: "Included", highlight: "Strongest authorization evidence" },
  { supplier: "Meridian Enterprise AI", provenance: "native_allocated", rate: 0.835, total: "$83,500", capacity: "$180,000", inputPer1MUsd: 2.505, outputPer1MUsd: 12.525, tps: 41667, delivery: "18h", sla: "99.96%", validUntil: "21 Aug · 16:30 SGT", quoteState: "Indicative", fee: "Included", highlight: "Fastest delivery" },
  { supplier: "Pinnacle Enterprise Partner", provenance: "enterprise_partner", rate: 0.84, total: "$84,000", capacity: "$240,000", inputPer1MUsd: 2.52, outputPer1MUsd: 12.60, tps: 66667, delivery: "36h", sla: "99.98%", validUntil: "22 Aug · 12:00 SGT", quoteState: "Indicative", fee: "Included", highlight: "Highest throughput" },
];

export const rfqTypes = {
  native_model: {
    icon: "M",
    title: "Native Model Capacity",
    caption: "Original-provider access, enterprise allocations or partner-delivered capacity.",
  },
  gpu: {
    icon: "G",
    title: "GPU Capacity",
    caption: "On-demand accelerators, scheduled reservations or dedicated clusters.",
  },
  hosted: {
    icon: "H",
    title: "Hosted Inference",
    caption: "A provider-hosted endpoint with disclosed model and delivery boundaries.",
  },
  private_otc: {
    icon: "R",
    title: "Private OTC",
    caption: "Non-standard or non-authorized supply handled in a separate risk lane.",
  },
};

export const gpuDemandRatings = [
  { accelerator: "H100 SXM / PCIe", memory: "80GB", demandScore: 5, marketPosition: "Primary market", useCase: "LLM training, fine-tuning and inference" },
  { accelerator: "H200", memory: "141GB", demandScore: 5, marketPosition: "High-end primary", useCase: "Large-model inference, long context and training" },
  { accelerator: "B200", memory: "180GB", demandScore: 4.5, marketPosition: "Fast-growing", useCase: "Frontier models and large-scale inference or training" },
  { accelerator: "A100 80GB", memory: "80GB", demandScore: 4, marketPosition: "Established primary", useCase: "Training, fine-tuning and research" },
  { accelerator: "L40S", memory: "48GB", demandScore: 4, marketPosition: "Inference-critical", useCase: "LLM inference, image and video" },
  { accelerator: "RTX 4090", memory: "24GB", demandScore: 4, marketPosition: "Active value market", useCase: "Stable Diffusion, video, small models and LoRA" },
  { accelerator: "RTX 5090", memory: "32GB", demandScore: 4, marketPosition: "Next-gen value market", useCase: "AI video, image and small-model inference" },
  { accelerator: "RTX PRO 6000 Blackwell", memory: "96GB", demandScore: 4, marketPosition: "Enterprise ramp", useCase: "Enterprise inference and high-memory workstation AI" },
  { accelerator: "B300", memory: "288GB class", demandScore: 3, marketPosition: "New flagship · expanding", useCase: "Reasoning and frontier inference" },
  { accelerator: "GB200 / GB300 NVL72", memory: "186GB / 279GB class", demandScore: 3, marketPosition: "Ultra-dense cluster", useCase: "Very-large-model training and inference" },
];

const gpuSupplierNames = [
  "Northstar Compute", "AtlasGPU Cloud", "Meridian Compute", "Stratus AI Infra",
  "Helix Accelerated", "Pinnacle Systems", "Kinetic Compute", "Nebula GPU",
  "Cobalt Datacenter", "Vertex AI Infrastructure", "Aperture Compute", "Sovereign GPU",
];

const gpuRegionCycle = ["US East", "US West", "Singapore", "Tokyo", "Frankfurt", "London"];
const gpuTermCycle = ["On-demand", "Scheduled", "Dedicated cluster", "30-day reservation"];

function makeGpuSupply(accelerator, memory, count, basePrice, baseUnits, startIndex, modes) {
  return Array.from({ length: count }, (_, index) => {
    const mode = modes[index % modes.length];
    const availableNow = mode === "instant";
    const day = 21 + ((startIndex + index) % 5);
    return {
      id: `gpu-listing-${startIndex + index + 1}`,
      accelerator,
      memory,
      supplier: gpuSupplierNames[(startIndex + index) % gpuSupplierNames.length],
      region: gpuRegionCycle[(startIndex + index) % gpuRegionCycle.length],
      pricePerHour: Number((basePrice * (0.94 + ((startIndex + index) % 7) * 0.018)).toFixed(2)),
      units: Math.max(2, baseUnits - index * Math.max(1, Math.round(baseUnits / (count + 2)))),
      availability: availableNow ? "Available now" : `Available ${day} Aug, ${String(9 + ((index * 2) % 10)).padStart(2, "0")}:00 SGT`,
      term: gpuTermCycle[(startIndex + index) % gpuTermCycle.length],
      transactionMode: mode,
      sla: [99.9, 99.95, 99.97][(startIndex + index) % 3],
      topology: accelerator.includes("GB") ? "NVL72 · NVLink fabric" : accelerator.includes("SXM") || ["H200", "B200", "B300"].includes(accelerator) ? "SXM · NVLink" : "PCIe",
    };
  });
}

export const gpuSupplyListings = [
  ...makeGpuSupply("H100 SXM / PCIe", "80GB", 7, 2.34, 128, 0, ["instant", "quote", "instant", "cluster"]),
  ...makeGpuSupply("H200", "141GB", 6, 3.62, 96, 7, ["quote", "instant", "cluster"]),
  ...makeGpuSupply("B200", "180GB", 5, 5.95, 64, 13, ["quote", "cluster", "instant"]),
  ...makeGpuSupply("A100 80GB", "80GB", 3, 1.62, 80, 18, ["instant", "quote"]),
  ...makeGpuSupply("L40S", "48GB", 3, 1.08, 72, 21, ["instant", "quote"]),
  ...makeGpuSupply("RTX 4090", "24GB", 3, 0.48, 48, 24, ["instant", "quote"]),
  ...makeGpuSupply("RTX 5090", "32GB", 3, 0.71, 40, 27, ["instant", "quote"]),
  ...makeGpuSupply("RTX PRO 6000 Blackwell", "96GB", 2, 2.18, 32, 30, ["quote", "cluster"]),
  ...makeGpuSupply("B300", "288GB class", 2, 7.8, 24, 32, ["quote", "cluster"]),
  ...makeGpuSupply("GB200 / GB300 NVL72", "186GB / 279GB class", 2, 13.4, 72, 34, ["cluster", "managed"]),
];

export const gpuHardwareListings = [
  { id: "hw-h100-pcie-1", accelerator: "H100 PCIe", memory: "80GB", formFactor: "PCIe card", condition: "New", supplier: "Pinnacle Systems", region: "US East", unitPriceUsd: 27800, quantity: 24, minOrder: 2, leadTime: "7–10 days", warranty: "3-year OEM", inspection: "Serials + burn-in verified", verified: true },
  { id: "hw-h100-sxm-1", accelerator: "H100 SXM5", memory: "80GB", formFactor: "SXM module", condition: "OEM surplus", supplier: "Cobalt Datacenter", region: "Singapore", unitPriceUsd: 24900, quantity: 64, minOrder: 8, leadTime: "10–14 days", warranty: "1-year seller", inspection: "Serials + photos reviewed", verified: true },
  { id: "hw-h200-sxm-1", accelerator: "H200 SXM", memory: "141GB", formFactor: "SXM module", condition: "New", supplier: "Vertex AI Infrastructure", region: "Frankfurt", unitPriceUsd: 36800, quantity: 32, minOrder: 4, leadTime: "14–21 days", warranty: "3-year OEM", inspection: "Factory seal verified", verified: true },
  { id: "hw-b200-sxm-1", accelerator: "B200 SXM", memory: "180GB", formFactor: "SXM module", condition: "New allocation", supplier: "Sovereign GPU", region: "Tokyo", unitPriceUsd: 44500, quantity: 16, minOrder: 8, leadTime: "21–30 days", warranty: "OEM terms", inspection: "Allocation evidence reviewed", verified: true },
  { id: "hw-a100-pcie-1", accelerator: "A100 PCIe", memory: "80GB", formFactor: "PCIe card", condition: "Refurbished", supplier: "Aperture Compute", region: "US West", unitPriceUsd: 11800, quantity: 80, minOrder: 4, leadTime: "5–7 days", warranty: "90-day seller", inspection: "Burn-in + benchmark passed", verified: true },
  { id: "hw-l40s-1", accelerator: "L40S", memory: "48GB", formFactor: "PCIe card", condition: "New", supplier: "Meridian Compute", region: "Hong Kong", unitPriceUsd: 7200, quantity: 120, minOrder: 4, leadTime: "5–8 days", warranty: "3-year OEM", inspection: "Serials verified", verified: true },
  { id: "hw-rtx4090-1", accelerator: "RTX 4090", memory: "24GB", formFactor: "PCIe card", condition: "Used · tested", supplier: "Kinetic Compute", region: "Singapore", unitPriceUsd: 1950, quantity: 45, minOrder: 2, leadTime: "3–5 days", warranty: "30-day seller", inspection: "Stress test passed", verified: true },
  { id: "hw-rtx5090-1", accelerator: "RTX 5090", memory: "32GB", formFactor: "PCIe card", condition: "New", supplier: "Helix Accelerated", region: "US West", unitPriceUsd: 3100, quantity: 60, minOrder: 2, leadTime: "5–7 days", warranty: "OEM terms", inspection: "Factory seal verified", verified: true },
  { id: "hw-rtxpro6000-1", accelerator: "RTX PRO 6000 Blackwell", memory: "96GB", formFactor: "PCIe card", condition: "New", supplier: "Nebula GPU", region: "London", unitPriceUsd: 9800, quantity: 18, minOrder: 2, leadTime: "10–14 days", warranty: "3-year OEM", inspection: "Serials verified", verified: true },
  { id: "hw-b300-1", accelerator: "B300", memory: "288GB class", formFactor: "SXM module", condition: "New allocation", supplier: "Stratus AI Infra", region: "Tokyo", unitPriceUsd: 52800, quantity: 8, minOrder: 8, leadTime: "30–45 days", warranty: "OEM terms", inspection: "Allocation + export scope reviewed", verified: true },
];

export const ratingPolicy = {
  scale: 5,
  dimensions: [
    { id: "communication", label: "Communication & attitude" },
    { id: "delivery", label: "Delivery speed" },
    { id: "quality", label: "Operational / usage quality" },
    { id: "support", label: "After-sales support" },
  ],
  eligibility: "Settled transaction + service term ended",
  publication: "Blind until both sides submit or the 14-day review window closes",
  minimumPublicReviews: 3,
};

const explicitSupplierReputation = {
  "Aurora Authorized Channel": { overall: 4.86, completedTrades: 148, onTimePct: 98.6, repeatBuyerPct: 72, dimensions: { communication: 4.9, delivery: 4.8, quality: 4.9, support: 4.8 } },
  "Meridian Enterprise AI": { overall: 4.83, completedTrades: 96, onTimePct: 99.1, repeatBuyerPct: 68, dimensions: { communication: 4.8, delivery: 4.9, quality: 4.8, support: 4.8 } },
  "Pinnacle Enterprise Partner": { overall: 4.78, completedTrades: 74, onTimePct: 97.8, repeatBuyerPct: 64, dimensions: { communication: 4.7, delivery: 4.7, quality: 4.9, support: 4.8 } },
  "claude-depth-1": { overall: 4.88, completedTrades: 127, onTimePct: 98.9, repeatBuyerPct: 74, dimensions: { communication: 4.9, delivery: 4.8, quality: 4.9, support: 4.9 } },
  "claude-depth-2": { overall: 4.76, completedTrades: 83, onTimePct: 97.5, repeatBuyerPct: 65, dimensions: { communication: 4.8, delivery: 4.7, quality: 4.8, support: 4.7 } },
  "gpt-depth-1": { overall: 4.91, completedTrades: 164, onTimePct: 99.2, repeatBuyerPct: 78, dimensions: { communication: 4.9, delivery: 4.9, quality: 4.9, support: 4.8 } },
  "gemini-depth-1": { overall: 4.72, completedTrades: 61, onTimePct: 96.8, repeatBuyerPct: 59, dimensions: { communication: 4.7, delivery: 4.6, quality: 4.8, support: 4.8 } },
  "Northstar Compute": { overall: 4.84, completedTrades: 212, onTimePct: 98.7, repeatBuyerPct: 71, dimensions: { communication: 4.8, delivery: 4.9, quality: 4.8, support: 4.8 } },
  "AtlasGPU Cloud": { overall: 4.71, completedTrades: 139, onTimePct: 96.9, repeatBuyerPct: 62, dimensions: { communication: 4.7, delivery: 4.6, quality: 4.8, support: 4.7 } },
};

function reputationSeed(value) {
  return [...String(value || "supplier")].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 17);
}

export function getSupplierReputation(key) {
  if (explicitSupplierReputation[key]) return explicitSupplierReputation[key];
  const seed = reputationSeed(key);
  const overall = Number((4.55 + (seed % 35) / 100).toFixed(2));
  const completedTrades = 28 + (seed % 147);
  const onTimePct = Number((96.1 + (seed % 32) / 10).toFixed(1));
  const repeatBuyerPct = 54 + (seed % 22);
  const delta = (offset) => Number(Math.min(5, Math.max(4.2, overall + (((seed + offset) % 9) - 4) / 20)).toFixed(1));
  return { overall, completedTrades, onTimePct, repeatBuyerPct, dimensions: { communication: delta(1), delivery: delta(3), quality: delta(5), support: delta(7) } };
}

export const currentSellerReputation = {
  overall: 4.84,
  completedTrades: 89,
  onTimePct: 98.4,
  dimensions: { communication: 4.8, delivery: 4.9, quality: 4.8, support: 4.8 },
};

export const currentBuyerReputation = {
  overall: 4.79,
  completedTrades: 42,
  paymentOnTimePct: 100,
  dimensions: { communication: 4.8, scopeClarity: 4.7, acceptanceSpeed: 4.8, paymentReliability: 4.9 },
};

export const completedTransactions = [
  { id: "ON-29481", product: "Claude Sonnet · Native Direct", counterparty: "Aurora Authorized Channel", role: "Buyer rates supplier", usageEndedAt: "18 Aug · 23:59 SGT", reviewStatus: "Eligible now", reviewEligible: true },
  { id: "ON-29462", product: "H100 SXM × 32 · 30-day reservation", counterparty: "Northstar Compute", role: "Buyer rates supplier", usageEndedAt: "25 Aug · 23:59 SGT", reviewStatus: "Opens after service term", reviewEligible: false },
  { id: "ON-29377", product: "GPT Enterprise · Native Allocated", counterparty: "Meridian Enterprise AI", role: "Buyer rates supplier", usageEndedAt: "12 Aug · 23:59 SGT", reviewStatus: "Submitted · blind", reviewEligible: false },
];


function makeSignalSeries(base, drift, wobble = 0.01) {
  return Array.from({ length: 30 }, (_, index) => Number((base + drift * index + Math.sin(index * 0.72) * wobble).toFixed(3)));
}

export const modelMarketData = [
  { id: "claude", name: "Claude Sonnet", family: "Anthropic", value: 0.82, change7d: -2.4, quotes: 12, settled: 6, volume: "$684k OEV", state: "Indicative", confidence: "Medium", updated: "21 Aug · 09:20 SGT", series: makeSignalSeries(0.856, -0.0012, 0.009) },
  { id: "gpt", name: "GPT Enterprise", family: "OpenAI", value: 0.90, change7d: -1.1, quotes: 15, settled: 8, volume: "$1.12M OEV", state: "Firm + settled", confidence: "High", updated: "21 Aug · 09:18 SGT", series: makeSignalSeries(0.924, -0.0008, 0.006) },
  { id: "gemini", name: "Gemini Pro", family: "Google", value: 0.86, change7d: 0.7, quotes: 10, settled: 5, volume: "$438k OEV", state: "Indicative", confidence: "Medium", updated: "21 Aug · 09:12 SGT", series: makeSignalSeries(0.842, 0.0006, 0.008) },
  { id: "deepseek", name: "DeepSeek", family: "DeepSeek", value: 0.69, change7d: -3.8, quotes: 18, settled: 11, volume: "$592k OEV", state: "Firm + settled", confidence: "High", updated: "21 Aug · 09:16 SGT", series: makeSignalSeries(0.742, -0.0017, 0.011) },
  { id: "kimi", name: "Kimi", family: "Moonshot AI", value: 0.78, change7d: -0.9, quotes: 9, settled: 4, volume: "$276k OEV", state: "Indicative", confidence: "Medium", updated: "21 Aug · 09:05 SGT", series: makeSignalSeries(0.804, -0.0008, 0.009) },
  { id: "glm", name: "GLM", family: "Zhipu AI", value: 0.74, change7d: 1.3, quotes: 8, settled: 3, volume: "$214k OEV", state: "Indicative", confidence: "Low", updated: "21 Aug · 08:58 SGT", series: makeSignalSeries(0.716, 0.0009, 0.012) },
];

export const gpuMarketData = [
  { id: "h100", name: "H100 SXM / PCIe", value: 2.34, change7d: -4.2, observations: 28, reservations: 19, volume: "31.8k accelerator·h", state: "Firm + settled", confidence: "High", updated: "21 Aug · 09:15 SGT", series: makeSignalSeries(2.52, -0.006, 0.035) },
  { id: "h200", name: "H200", value: 3.62, change7d: -2.1, observations: 23, reservations: 14, volume: "18.6k accelerator·h", state: "Firm + settled", confidence: "High", updated: "21 Aug · 09:10 SGT", series: makeSignalSeries(3.78, -0.005, 0.045) },
  { id: "b200", name: "B200", value: 5.95, change7d: 1.8, observations: 17, reservations: 9, volume: "9.4k accelerator·h", state: "Indicative", confidence: "Medium", updated: "21 Aug · 09:06 SGT", series: makeSignalSeries(5.72, 0.008, 0.07) },
  { id: "a100", name: "A100 80GB", value: 1.62, change7d: -3.1, observations: 21, reservations: 13, volume: "22.7k accelerator·h", state: "Firm + settled", confidence: "High", updated: "21 Aug · 09:03 SGT", series: makeSignalSeries(1.74, -0.004, 0.028) },
  { id: "l40s", name: "L40S", value: 1.08, change7d: -1.5, observations: 16, reservations: 8, volume: "14.1k accelerator·h", state: "Indicative", confidence: "Medium", updated: "21 Aug · 08:57 SGT", series: makeSignalSeries(1.13, -0.0016, 0.018) },
  { id: "rtx4090", name: "RTX 4090", value: 0.48, change7d: -0.6, observations: 14, reservations: 7, volume: "10.8k accelerator·h", state: "Indicative", confidence: "Medium", updated: "21 Aug · 08:52 SGT", series: makeSignalSeries(0.505, -0.0008, 0.011) },
  { id: "rtx5090", name: "RTX 5090", value: 0.71, change7d: 2.4, observations: 11, reservations: 5, volume: "6.3k accelerator·h", state: "Indicative", confidence: "Medium", updated: "21 Aug · 08:46 SGT", series: makeSignalSeries(0.66, 0.0018, 0.015) },
  { id: "rtxpro6000", name: "RTX PRO 6000 Blackwell", value: 2.18, change7d: 3.9, observations: 8, reservations: 3, volume: "2.9k accelerator·h", state: "Indicative", confidence: "Low", updated: "21 Aug · 08:40 SGT", series: makeSignalSeries(2.02, 0.0055, 0.035) },
  { id: "b300", name: "B300", value: 7.80, change7d: 5.1, observations: 6, reservations: 2, volume: "1.4k accelerator·h", state: "Indicative", confidence: "Low", updated: "21 Aug · 08:32 SGT", series: makeSignalSeries(7.22, 0.019, 0.09) },
  { id: "gb-nvl72", name: "GB200 / GB300 NVL72", value: 13.40, change7d: 4.6, observations: 5, reservations: 2, volume: "0.9k rack·h", state: "Indicative", confidence: "Low", updated: "21 Aug · 08:25 SGT", series: makeSignalSeries(12.55, 0.028, 0.15) },
];

export const marketDataSignals = [
  { name: "Claude pricing signal", value: "0.82×", state: "Indicative", sample: "12 qualified quotes", window: "Rolling 7D", updated: "20 Aug · 23:30 SGT", confidence: "Medium", threshold: "No Print below 5 settled trades" },
  { name: "GPT pricing signal", value: "0.90×", state: "Indicative", sample: "15 qualified quotes", window: "Rolling 7D", updated: "20 Aug · 23:30 SGT", confidence: "Medium", threshold: "No Print below 5 settled trades" },
  { name: "H100 price signal", value: "$2.34/h", state: "Firm + settled", sample: "28 reservations", window: "Rolling 14D", updated: "20 Aug · 23:00 SGT", confidence: "High", threshold: "No Print below 8 observations" },
  { name: "Private OTC activity", value: "$1.9M", state: "Executed notional", sample: "9 closed RFQs", window: "Rolling 30D", updated: "20 Aug · 22:00 SGT", confidence: "Low", threshold: "Always separated from benchmark" },
];

export const procurementState = {
  provenanceFilter: "native",
  modelQuery: "",
  dataMarket: "model",
  dataAsset: "claude",
  dataRange: 14,
  gpuMode: "rental",
  hardwareRegion: "all",
  hardwareCondition: "all",
  hardwareSort: "price_asc",
  supplierReviewStatus: "not_started",
  supplierReviewId: "",
};

export function getProvenance(row) {
  return providerProfiles[row?.id] || { type: "unknown", ...provenanceCatalog.unknown, evidenceReviewed: false, technicalTested: false, method: "Pending", deliveryMode: "Pending", lastVerifiedAt: "Pending" };
}

export function isNativeType(type) {
  return ["native_direct", "native_allocated", "enterprise_partner"].includes(type);
}
