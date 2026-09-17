import { renderGciFactory } from './opennext-gci.js?v=opennext-20260915-original-1';

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const copy = {
  en: {
    market: 'The market', how: 'How it works', suppliers: 'For suppliers', signin: 'Sign in', eyebrow: 'AI CAPACITY MARKET',
    hero: 'AI capacity,<br>on your terms.', intro: 'Source model capacity and GPU compute.<br>Compare supply, request quotes, and manage<br class="public-desktop-break"> delivery in one place.', explore: 'Explore capacity', post: 'Sign in to post',
    marketLabel: '02 / THE MARKET', marketTitle: 'Two ways to source compute.', models: 'Model capacity', token: 'Token capacity', modelDescription: 'Compare model access by region, limits, and commercial terms.', modelPreview: '', gpu: 'GPU compute', tokenStatus: 'Coming Soon', gpuStatus: 'Private RFQ only', gpuDescription: 'Find the right hardware, location, and rental window.', gpuPreview: '',
    inside: '01 / INSIDE OPENNEXT', listingsTitle: 'See how supply meets demand.', listingsDescription: 'A preview of the listings you can publish and compare in your workspace.', rental: 'GPU rental', physical: 'Physical GPUs', side: 'Side', resource: 'Resource', spec: 'Specification', terms: 'Commercial terms', supply: 'Supply', demand: 'Demand',
    listingSets: [
      [ ['Supply', 'Model API capacity', 'Token allowance · APAC · Monthly', 'Per 1M tokens · Quote based'], ['Supply', 'Dedicated inference', 'Private endpoint · US · Reserved capacity', 'Monthly commitment · Custom SLA'], ['Demand', 'Model capacity', 'High concurrency · EU · 90 days', 'Request for quote'] ],
      [ ['Supply', 'H100 GPU rental', '8 GPUs · US West · 30 days', 'Per GPU-hour · Quote based'], ['Supply', 'H200 GPU rental', '8 GPUs · Singapore · Flexible term', 'Per GPU-hour · Reserved capacity'], ['Demand', 'A100 GPU cluster', '16 GPUs · APAC · 90 days', 'Request for quote'] ],
      [ ['Supply', 'H100 hardware', '8 units · New · Delivery available', 'Unit price · Quote based'], ['Supply', 'H200 hardware', '16 units · New · Supplier verification', 'Unit price · Delivery terms'], ['Demand', 'GPU servers', '4 servers · Configurable · Delivery required', 'Request for quote'] ]
    ],
    steps: ['Choose supply or demand', 'Set specifications and terms', 'Publish from your workspace'], viewMarket: 'Sign in to view the market', publish: 'Sign in to publish',
    procurement: '03 / PROCUREMENT', procurementTitle: 'From requirement to delivery.', process: [['Define', 'Specify your workload and budget.'], ['Compare', 'Review supplier quotes side by side.'], ['Agree', 'Confirm capacity and commercial terms.'], ['Track', 'Keep delivery and records together.']],
    band: 'Built for buyers.<br>Open to suppliers.', buyer: 'One place to source capacity<br>and coordinate procurement.', buyerAction: 'Post a requirement', supplier: 'List your supply and respond<br>to qualified requests.', supplierAction: 'List your supply', supplierNote: '',
    closing: 'Tell us what you need.', closingDescription: 'Start with a workload, a region, and a timeline.', closingAction: 'Contact Us', privacy: 'Privacy', contact: 'Contact', footer: 'OpenNEXT · AI Capacity Market',
    workspace: 'OPENNEXT WORKSPACE', authTitle: 'Your market.<br>Your workspace.', authDescription: 'Compare supply, publish requirements, and manage quotes in one place.', loginTitle: 'Sign in to OpenNEXT', loginDescription: 'Continue to your procurement workspace.', emailLabel: 'Work email', emailPlaceholder: 'you@company.com', continueEmail: 'Continue with email', emailHint: 'This demo uses an on-screen sign-in code.', demo: 'Explore workspace', newAccount: 'New to OpenNEXT?', createAccount: 'Create an account',
    codeTitle: 'Enter your sign-in code', codeDescription: 'Continue with', codeLabel: 'Six-digit code', codePlaceholder: '123456', verify: 'Enter workspace', codeHint: 'Demo code: 123456. No email has been sent.', changeEmail: 'Use a different email', registerTitle: 'Create your workspace', registerDescription: 'A shared place for your next capacity purchase.', name: 'Full name', namePlaceholder: 'Your full name', company: 'Company', companyPlaceholder: 'Company name', registerButton: 'Create account', registerHint: 'Your preview workspace stays in this browser.', haveAccount: 'Already have an account?', secure: 'Model capacity. GPU compute. One workspace.'
  }
};

function getCopy(locale) { return copy[locale] || copy.en; }
const arrow = '<span aria-hidden="true">→</span>';
export function logoMarkup() {
  return '<span class="on-brand"><img class="on-brand-mark" src="assets/opennext-mark.svg" alt="" width="30" height="32"><span>OpenNEXT</span></span>';
}
function brandLink() { return `<a class="on-brand-link" href="#" data-public-action="home" aria-label="OpenNEXT">${logoMarkup()}</a>`; }
function cta(text, target = 'models', style = 'primary', mode = '') {
  const action = target === 'contact' ? 'contact' : 'open-workspace';
  const targetAttrs = action === 'open-workspace' ? ` data-target="${target}"${mode ? ` data-mode="${mode}"` : ''}` : '';
  return `<button type="button" class="on-button on-button-${style}" data-public-action="${action}"${targetAttrs}>${text}${style === 'text' ? arrow : ''}</button>`;
}
function footer(c, compact = false) {
  return `<footer class="public-footer${compact ? ' public-footer-compact' : ''}">${brandLink()}<div class="public-footer-links"><button type="button" data-public-action="info" data-info="contact">${c.contact}</button><button type="button" data-public-action="info" data-info="privacy">${c.privacy}</button>${compact ? '' : `<span>${c.footer}</span>`}</div></footer>`;
}
function listings(c) {
  const names = [c.models, c.rental, c.physical];
  const panels = c.listingSets.map((rows, i) => `<div class="public-listing-panel public-listing-panel-${i}" role="region" aria-label="${names[i]}"><div class="public-table-scroll"><table class="public-listing-table"><thead><tr><th>${c.side}</th><th>${c.resource}</th><th>${c.spec}</th><th>${c.terms}</th></tr></thead><tbody>${rows.map(row => `<tr><td><span class="public-side-tag">${row[0]}</span></td><td><button class="public-listing-resource" type="button" data-public-action="open-workspace" data-target="${i === 0 ? 'models' : 'gpus'}"${i === 2 ? ' data-mode="hardware"' : i === 1 ? ' data-mode="rental"' : ''}>${row[1]}</button></td><td>${row[2]}</td><td>${row[3]}</td></tr>`).join('')}</tbody></table></div></div>`).join('');
  return `<div class="public-listing-preview">${names.map((name, i) => `<input class="public-listing-radio" type="radio" name="public-listings" id="public-listings-${i}"${i === 0 ? ' checked' : ''}><label class="public-listing-tab public-listing-tab-${i}" for="public-listings-${i}">${name}</label>`).join('')}<div class="public-listing-panels">${panels}</div></div>`;
}

function gpuTicker() {
  const rows = [
    ['Supply', 'H100 GPU rental', '8 GPUs · US West · 30 days', 'Per GPU-hour · Quote based', 'H100'],
    ['Supply', 'H200 GPU rental', '8 GPUs · Singapore · Flexible term', 'Per GPU-hour · Reserved capacity', 'H200'],
    ['Demand', 'A100 GPU cluster', '16 GPUs · APAC · 90 days', 'Request for quote', 'A100'],
  ];
  const items = rows.map(([side, resource, spec, terms, market]) => '<button type="button" class="public-ticker-row" data-ticker-row="' + side.toLowerCase() + '" data-public-action="open-market" data-gpu-market="' + market + '" data-mode="rental" aria-label="Open ' + resource + ' market"><span class="public-ticker-side public-ticker-side-' + side.toLowerCase() + '">' + side + '</span><strong>' + resource + '</strong><span>' + spec + '</span><span class="public-ticker-terms">' + terms + '</span></button>').join('');
  return '<section class="public-gpu-ticker" aria-label="GPU rental supply and demand preview"><input class="public-ticker-toggle" type="checkbox" id="public-ticker-paused" aria-label="Pause supply and demand ticker"><div class="public-ticker-caption"><strong>GPU MARKET</strong><span>Supply / Demand</span></div><div class="public-ticker-window" tabindex="0" aria-label="GPU rental supply and demand rows"><div class="public-ticker-row-stack">' + items + '</div></div><label class="public-ticker-control" for="public-ticker-paused"><span class="public-ticker-pause" aria-hidden="true">Ⅱ</span><span class="public-ticker-play" aria-hidden="true">▷</span><span class="public-ticker-control-label">Pause ticker</span></label></section>';
}
// Native SVG motion and the visible line reference the very same route. Both
// stay in SVG user coordinates even when the illustration resizes. Packets
// travel start to end and restart; they never reverse direction.
function capacityPlane(x, y, ux, uy, vx, vy, depth) {
  const point = (u, v, z = 0) => `${+(x + ux * u + vx * v).toFixed(2)} ${+(y + uy * u + vy * v + z).toFixed(2)}`;
  const outline = `M${point(0, 0)} L${point(1, 0)} L${point(1, 1)} L${point(0, 1)} Z`;
  const frontFace = `M${point(0, 0)} L${point(1, 0)} L${point(1, 0, depth)} L${point(0, 0, depth)} Z`;
  const sideFace = `M${point(1, 0)} L${point(1, 1)} L${point(1, 1, depth)} L${point(1, 0, depth)} Z`;
  const roof = Array.from({length: 11}, (_, i) => {
    const v = (i + 1) / 12;
    return `M${point(0, v)} L${point(1, v)}`;
  }).join(' ');
  const panels = Array.from({length: 31}, (_, i) => {
    const u = i / 30;
    return `M${point(u, 0)} L${point(u, 0, depth)}`;
  }).join(' ');
  const side = Array.from({length: 17}, (_, i) => {
    const v = i / 16;
    return `M${point(1, v)} L${point(1, v, depth)}`;
  }).join(' ');
  const louvers = [0.25, 0.5, 0.75].map(z => `M${point(0, 0, depth * z)} L${point(1, 0, depth * z)}`).join(' ');
  return `<g class="public-flow-building"><path class="public-flow-base" d="M${point(-0.015, -0.015, depth + 10)} L${point(1.015, -0.015, depth + 10)} L${point(1.015, 1.015, depth + 10)}"/><path class="public-flow-face public-flow-front-face" d="${frontFace}"/><path class="public-flow-face public-flow-side-face" d="${sideFace}"/><path class="public-flow-plane" d="${outline}"/><path class="public-flow-detail" d="${roof} ${panels} ${side} ${louvers}"/></g>`;
}

function capacityNetworkArtwork() {
  const floor = 'M70 646 L1780 338 M70 719 L1780 411 M70 792 L1780 484 M406 805 L1780 557 M780 812 L1780 630';
  // All three rectangular enclosures share the same axonometric projection.
  // The foreground enclosure must not use a steeper, incompatible roof axis.
  const building = (x, y, width, length, depth) => capacityPlane(x, y, width, width * 0.22, length, length * -0.32, depth);
  return `<g class="public-flow-ground"><path d="${floor}"/></g>${building(985, 413, 475, 172, 28)}${building(630, 476, 520, 193, 31)}${building(210, 605, 440, 383, 39)}`;
}

function capacityGlobalArtwork() {
  const nodes = [[265, 272], [190, 443], [355, 621]].map(([x, y], i) => `<g class="public-flow-node"><rect x="${x - 38}" y="${y - 38}" width="76" height="76" rx="8"/><rect class="public-flow-node-core" x="${x - 14}" y="${y - 14}" width="28" height="28" rx="2"/><path class="public-flow-detail" d="M${x - 18} ${y - 47} v9 M${x} ${y - 47} v9 M${x + 18} ${y - 47} v9 M${x - 18} ${y + 38} v9 M${x} ${y + 38} v9 M${x + 18} ${y + 38} v9"/></g>`).join('');
  return `<g class="public-flow-node-grid"><path d="M92 190H496 M92 360H496 M92 531H496 M92 702H496 M116 139V744 M265 139V744 M415 139V744"/></g><g class="public-flow-globe"><ellipse class="public-flow-globe-outline" cx="1404" cy="420" rx="357" ry="357"/><g class="public-flow-graticule"><ellipse cx="1404" cy="420" rx="225" ry="357"/><ellipse cx="1404" cy="420" rx="87" ry="357"/><ellipse cx="1404" cy="420" rx="357" ry="104"/><ellipse cx="1404" cy="420" rx="357" ry="246"/><path d="M1047 420H1761 M1404 63V777"/></g><g class="public-flow-coast"><path d="M1176 171 L1210 145 1227 119 1264 113 1282 125 1304 116 1324 130 1310 154 1285 167 1280 185 1300 201 1294 226 1271 239 1251 274 1221 287 1215 313 1234 337 1238 359 1264 373 1274 396 1250 392 1236 378 1218 375 1201 351 1184 342 1176 314 1159 297 1147 269 1164 250 1160 228 1178 206 Z M1285 429 L1313 437 1336 452 1362 460 1378 486 1365 517 1343 535 1340 568 1324 592 1315 624 1297 650 1285 641 1281 609 1265 582 1262 550 1250 535 1246 502 1237 482 1252 453 Z M1536 184 L1560 180 1577 168 1599 183 1616 182 1645 199 1650 223 1673 242 1678 261 1700 285 1709 312 1680 306 1664 323 1654 353 1630 351 1615 371 1598 355 1588 332 1567 315 1554 293 1537 291 1518 278 1530 259 1513 245 1520 224 Z M1553 361 L1581 365 1595 383 1617 392 1632 421 1628 451 1612 477 1601 510 1580 531 1569 523 1560 491 1545 472 1538 441 1523 423 1529 398 Z M1678 539 L1697 525 1717 530 1733 549 1721 566 1697 571 1681 561 Z"/></g></g>${nodes}<g class="public-flow-exchange"><path d="M758 401 L777 420 758 439 739 420 Z"/><path class="public-flow-exchange-inner" d="M751 420H765 M758 413V427"/></g>`;
}

function capacityIllustration(kind) {
  const network = kind === 'network';
  const id = `public-${kind}-motion`;
  const paths = network ? [
    ['M388 553 C424 406 675 375 822 287 C1001 210 1168 292 1243 450', 15, -3],
    ['M486 526 C535 380 735 393 822 287 C935 122 1050 131 1228 194 C1388 244 1501 365 1564 464', 18, -7],
    ['M849 435 C927 228 1111 124 1227 90 C1451 7 1668 10 1810 119', 20, -11],
    ['M939 644 C1021 404 1160 274 1321 216 C1517 145 1706 148 1760 403', 19, -13],
    ['M822 451 L822 287', 7, -2],
    ['M1227 383 L1227 90', 9, -5],
    ['M1272 390 L1272 215', 7, -4]
  ] : [
    ['M303 272 C506 264 525 420 758 420 C944 420 1015 186 1242 219', 17, -3],
    ['M228 443 C446 443 548 420 758 420 C1041 420 1340 310 1660 373', 20, -9],
    ['M393 621 C551 621 568 420 758 420 C956 420 1053 600 1321 559', 18, -14]
  ];
  const routes = paths.map(([d], i) => `<path id="${id}-route-${i}" d="${d}" pathLength="1000"/>`).join('');
  const lines = paths.map((_, i) => `<use class="public-flow-line" href="#${id}-route-${i}"/>`).join('');
  const packets = paths.map(([, duration, delay], i) => [0, 0.5].map(phase => {
    const begin = delay - duration * phase;
    return `<circle class="public-flow-packet" data-route="${id}-route-${i}" cx="0" cy="0" r="4.5"><animateMotion dur="${duration}s" begin="${begin}s" calcMode="paced" repeatCount="indefinite"><mpath href="#${id}-route-${i}"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.02;0.98;1" dur="${duration}s" begin="${begin}s" repeatCount="indefinite"/></circle>`;
  }).join('')).join('');
  const caption = network ? 'From supply to workload.' : 'Local nodes. Global reach.';
  const label = network ? 'Capacity flowing between connected compute locations' : 'Compute nodes connecting through OpenNEXT to global destinations';
  return `<figure class="public-flow-figure ${network ? 'public-hero-visual' : 'public-auth-visual'}" aria-label="${label}"><input class="public-flow-toggle" type="checkbox" id="${id}" aria-label="Pause capacity flow animation"><div class="public-flow-art"><svg class="public-flow-drawing" viewBox="0 0 1860 846" aria-hidden="true" focusable="false"><defs>${routes}</defs>${network ? capacityNetworkArtwork() : capacityGlobalArtwork()}<g class="public-flow-routes">${lines}</g><g class="public-flow-packets">${packets}</g></svg></div><figcaption class="public-flow-caption"><span>${caption}</span><label class="public-flow-control" for="${id}"><span class="public-flow-pause" aria-hidden="true">Ⅱ</span><span class="public-flow-play" aria-hidden="true">▷</span><span class="public-flow-running-label">Pause motion</span><span class="public-flow-paused-label">Resume motion</span></label></figcaption></figure>`;
}

function publicAgentDemo() {
  const steps = [
    ['Understand the request', '64 × H100 · Singapore · 30 days', 'The Agent captures the minimum fields needed to start a private match.'],
    ['Prepare the RFQ', 'GPU rental · buyer brief', 'A concise RFQ is assembled without exposing identity, credentials or payment data.'],
    ['Screen private supply', '3 qualified supply signals', 'Capacity, delivery, topology and commercial fit are checked against the request.'],
    ['Align the agreement', 'Standard GPU Rental Agreement · V1', 'Reusable seller terms and buyer requirements are combined into one shared document.'],
    ['Approve the match', 'Masked counterparty · policy passed', 'The selected quote is ready for approval with a complete, privacy-safe audit trail.'],
    ['Order confirmed', 'ON-DEMO-2409 · capacity reserved', 'The simulated order is placed successfully and the fulfilment record is sealed.'],
  ];
  const activity = ['Parsing the buyer brief', 'Drafting the standard RFQ', 'Comparing private supply', 'Completing shared terms', 'Preparing buyer approval', 'Sealing the order record'];
  const factSets = [
    [['Input', 'Minimum match fields'], ['Identity', 'Not collected'], ['Record', 'Draft']],
    [['Document', 'GPU rental RFQ'], ['Scope', 'Private / masked'], ['Record', 'Prepared']],
    [['Signals', '3 screened'], ['Fit', '96% best match'], ['Record', 'Verified']],
    [['Agreement', 'V1 shared draft'], ['Terms', '4 / 4 core fields'], ['Record', 'In review']],
    [['Guardrail', 'Passed'], ['Approval', 'Buyer review'], ['Record', 'Ready']],
    [['Order', 'ON-DEMO-2409'], ['Capacity', 'Reserved'], ['Record', 'Sealed']],
  ];
  const stepMarkup = steps.map(([title, summary], index) => '<button type="button" class="public-demo-step-button' + (index === 0 ? ' is-active' : '') + '" data-agent-step="' + index + '" aria-selected="' + (index === 0 ? 'true' : 'false') + '" aria-controls="public-agent-step-detail-' + index + '"><span class="public-demo-step-number">' + String(index + 1).padStart(2, '0') + '</span><span class="public-demo-step-copy"><strong>' + title + '</strong><small>' + summary + '</small></span><em>' + (index === 0 ? 'Selected' : 'View') + '</em></button>').join('');
  const detailMarkup = steps.map(([title, summary, body], index) => '<section class="public-demo-step-detail" id="public-agent-step-detail-' + index + '" data-agent-detail="' + index + '"' + (index ? ' hidden' : '') + '><span class="agent-kicker">Step 0' + (index + 1) + ' / ' + title + '</span><h4>' + title + '</h4><p>' + body + '</p><div class="public-agent-demo-facts">' + factSets[index].map(([label, value]) => '<span><small>' + label + '</small><strong>' + value + '</strong></span>').join('') + '</div></section>').join('');
  const logMarkup = steps.map(([title], index) => '<div class="agent-log-step' + (index === 0 ? ' is-current' : '') + '" data-agent-log-step="' + index + '"><span>' + String(index + 1).padStart(2, '0') + '</span><div><strong>' + title + '</strong></div><em>' + (index === 0 ? 'Current' : 'Standby') + '</em></div>').join('');
  const sparkle = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z" stroke="currentColor" stroke-width="1.2"/><path d="M19 2v4m-2-2h4" stroke="currentColor" stroke-width="1.2"/></svg>';
  return '<article class="public-agent-demo" data-agent-demo><header class="public-agent-demo-head"><div><p class="public-demo-eyebrow">PROCUREMENT / AGENT DEMO</p><h3>See the Agent work, one step at a time.</h3><p>Choose a step to see what the workspace Agent is doing. The preview is read-only and does not auto-play.</p></div><div class="public-agent-demo-status"><span data-agent-demo-dot></span><strong data-agent-demo-status>Ready</strong><small data-agent-demo-progress>Step 01 / 06</small></div></header><div class="public-agent-demo-shell"><section class="public-demo-explainer" aria-label="Procurement Agent steps"><div class="public-demo-explainer-intro"><p class="public-demo-eyebrow">SELECT A STEP</p><h4>From brief to order.</h4><p>Click a stage below. A short explanation appears here while the Agent preview updates on the right.</p></div><nav class="public-demo-step-list" aria-label="Procurement Agent steps">' + stepMarkup + '</nav><div class="public-demo-step-details">' + detailMarkup + '</div></section><aside class="public-demo-agent-panel agent-panel" aria-label="OpenNEXT Agent step preview"><div class="agent-heading"><div class="agent-identity"><span class="agent-symbol">' + sparkle + '</span><div><h2>OpenNEXT Agent</h2><p>From request to reserved capacity</p></div></div><span class="public-demo-auto-badge">Click to preview</span></div><div class="agent-context"><span>Active brief</span><strong>64 × H100 · Singapore · 30 days</strong></div><div class="agent-scroll"><div class="agent-intro"><p>This mirrors the Agent view inside My OpenDesk. Select a step on the left to inspect the workflow.</p></div><div class="agent-conversation" role="log" aria-label="Agent workflow preview" aria-live="polite"><article class="agent-message agent-message-user"><span class="agent-speaker">Buyer brief</span><p>Need 64 H100 GPUs in Singapore for 30 days, within a $210,000 monthly budget.</p></article><article class="agent-message"><span class="agent-speaker">OpenNEXT Agent</span><p data-agent-demo-message>Understood. I am capturing the minimum fields needed to start a private match.</p></article><section class="agent-card public-agent-demo-active-card"><div class="public-agent-demo-activity"><span class="agent-kicker">Execution activity · selected step</span><strong data-agent-demo-activity>Parsing the buyer brief</strong><em data-agent-demo-stage-tag>Selected</em></div><div class="public-agent-demo-agent-state"><span>Current state</span><strong data-agent-demo-agent-status>Understand the request</strong><small data-agent-demo-progress>Step 01 / 06</small></div></section><section class="agent-card agent-work-log public-agent-demo-work-log"><span class="agent-kicker">Workflow map · click a step on the left</span>' + logMarkup + '</section></div></div><div class="public-demo-agent-footer"><span>Approval before action</span><strong>Read-only presentation</strong></div></aside></div><footer class="public-agent-demo-footer-bar"><span>Click a step to update the Agent preview</span><span>Read-only simulation · no payment or allocation occurs</span></footer></article>';
}

export function renderLanding(locale = 'en') {
  locale = 'en';
  const c = getCopy(locale);
  return `<div class="public-page" lang="${locale}">
    <header class="public-header"><div class="public-header-inner">${brandLink()}<nav class="public-nav" aria-label="${c.market}"><button data-public-action="scroll" data-section="market">${c.market}</button><button data-public-action="scroll" data-section="how-it-works">${c.how}</button><button data-public-action="scroll" data-section="suppliers">${c.suppliers}</button><button data-public-action="scroll" data-section="gci-index">GCI Index</button></nav><div class="public-header-actions"><button class="on-button on-button-primary on-button-small" data-public-action="signin">${c.signin}</button></div></div></header>
    ${gpuTicker()}
    <main>
      <section class="public-hero public-container"><div class="public-hero-copy"><p class="on-eyebrow">${c.eyebrow}</p><h1>${c.hero}</h1><p class="public-hero-description">${c.intro}</p><div class="public-hero-actions">${cta(c.explore)}${cta(c.post, 'supply', 'outline')}</div></div>${capacityIllustration('network')}</section>
      <section class="public-listings-band" id="inside-opennext" aria-labelledby="public-listings-title"><div class="public-section public-listings-section public-container"><div class="public-section-heading"><p class="on-eyebrow">${c.inside}</p><h2 id="public-listings-title">${c.listingsTitle}</h2><p class="public-section-description">${c.listingsDescription}</p></div>${listings(c)}<ol class="public-posting-steps">${c.steps.map((step, i) => `<li><span>0${i + 1}</span><p>${step}</p></li>`).join('')}</ol><div class="public-preview-actions">${cta(c.viewMarket)}${cta(c.publish, 'supply', 'text')}</div></div></section>
      <section class="public-section public-market-section public-container" id="market" aria-labelledby="public-market-title"><div class="public-section-heading"><p class="on-eyebrow">${c.marketLabel}</p><h2 id="public-market-title">${c.marketTitle}</h2></div><div class="public-market-row"><span class="public-row-number">01</span><h3>${c.token}</h3><p>${c.modelDescription}</p><span class="public-market-status">${c.tokenStatus}</span></div><div class="public-market-row"><span class="public-row-number">02</span><h3>${c.gpu}</h3><p>${c.gpuDescription}</p><span class="public-market-status">${c.gpuStatus}</span></div></section>
      <section class="public-section public-procurement-section public-container" id="how-it-works" aria-labelledby="public-process-title"><div class="public-section-heading"><p class="on-eyebrow">${c.procurement}</p><h2 id="public-process-title">${c.procurementTitle}</h2><p class="public-section-description">A clear record of every decision, from the first quote to the final delivery.</p></div><ol class="public-process">${c.process.map(([title, description], i) => `<li><span class="public-process-number">0${i + 1}</span><h3>${title}</h3><p>${description}</p></li>`).join('')}</ol>${publicAgentDemo()}</section>
      <section class="public-gci-band" id="gci-index" aria-labelledby="public-gci-title"><div class="public-container public-gci-section" id="public-gci"><div class="public-gci-heading"><div><p class="on-eyebrow">04 / THE INDEX CREATED AND GUARDED BY AI</p><h2 id="public-gci-title">Agent empowered GCI Index Flow</h2><p class="public-section-description">System Architecture and End-to-End Workflow for the GPU Compute Index.</p></div></div>${renderGciFactory()}</div></section>
      <section class="public-supplier-band" id="suppliers" aria-labelledby="public-supplier-title"><div class="public-container public-supplier-inner"><div class="public-supplier-heading"><p class="on-eyebrow">05 / A TWO-SIDED MARKET</p><h2 id="public-supplier-title">${c.band}</h2></div><div class="public-supplier-column"><p class="on-eyebrow">FOR BUYERS</p><p>${c.buyer}</p>${cta(c.buyerAction, 'rfq', 'text')}</div><div class="public-supplier-column"><p class="on-eyebrow">FOR SUPPLIERS</p><p>${c.supplier}</p>${cta(c.supplierAction, 'supply', 'text')}</div></div></section>
      <section class="public-closing public-container" aria-labelledby="public-closing-title"><div><p class="on-eyebrow">06 / GET STARTED</p><h2 id="public-closing-title">${c.closing}</h2><p>${c.closingDescription}</p></div>${cta(c.closingAction, 'contact')}</section>
    </main><div class="public-container">${footer(c)}</div>
  </div>`;
}

const providerIcons = {
  google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.5 12.2c0-.7-.1-1.5-.2-2.2H12v4.1h5.3a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"/><path fill="currentColor" opacity=".72" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5a6.1 6.1 0 0 1-9.1-3.2H3v2.6A10 10 0 0 0 12 22Z"/><path fill="currentColor" opacity=".5" d="M6.3 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.3-2.6Z"/><path fill="currentColor" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.5l3.3 2.6A6 6 0 0 1 12 6Z"/></svg>',
  github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .8a11.3 11.3 0 0 0-3.6 22c.6.1.8-.3.8-.6v-2.1c-3.4.7-4.1-1.4-4.1-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6.1 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.4 4.2 18.4 4.5 18.4 4.5c.7 1.6.3 2.9.2 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.9 5.8-5.6 6.1.4.4.8 1.2.8 2.3v2.9c0 .3.2.7.8.6A11.3 11.3 0 0 0 12 .8Z"/></svg>',
  lark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" opacity=".55" d="m3 3 7 1 5 8-5 3Z"/><path fill="currentColor" d="m2 10 8 6 9-8 4 1c-4 6-7 11-12 12-4 .7-7-2-9-5Z"/></svg>',
  walletconnect: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9a11.3 11.3 0 0 1 16 0M1.5 12l5 5 5.5-5 5.5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  binance: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 1 6 6-2.5 2.5L12 6l-3.5 3.5L6 7Zm-8.5 8L7 12l-3.5 3.5L0 12ZM12 9l3 3-3 3-3-3Zm8.5-.5L24 12l-3.5 3.5L17 12ZM8.5 14.5 12 18l3.5-3.5L18 17l-6 6-6-6Z"/></svg>',
  metamask: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m2 2 8 6h4l8-6-2 10-2 8-6 3-6-3-2-8Z" opacity=".7"/><path fill="currentColor" d="m2 2 10 9L22 2l-3 12-4 1-3 6-3-6-4-1Z"/><path fill="#fff" d="m6 12 4 2-2 1Zm12 0-4 2 2 1Z"/><path fill="#ddd" d="m9 18 3 1 3-1-1 3h-4Z"/></svg>'
};

function providerButton(provider, label, compact = false) {
  return `<button class="public-provider${compact ? ' public-provider-wallet' : ''}" type="button" data-public-action="provider" data-provider="${provider}" aria-label="Continue with ${label}">${providerIcons[provider]}<span>${label}</span></button>`;
}

function providers() {
  return `<div class="public-auth-divider"><span>or continue with</span></div><div class="public-provider-row" role="group" aria-label="Sign-in providers">${providerButton('google', 'Google')}${providerButton('github', 'GitHub')}${providerButton('lark', 'Lark')}</div><div class="public-provider-row public-wallet-row" role="group" aria-label="Wallet sign-in">${providerButton('walletconnect', 'WalletConnect', true)}${providerButton('binance', 'Binance Wallet', true)}${providerButton('metamask', 'MetaMask', true)}</div>`;
}

function consent(options, error) {
  return `<div class="public-consent"><input id="public-terms" name="terms" type="checkbox"${options.terms ? ' checked' : ''} required aria-label="I have read and agree to the policies listed below" aria-describedby="public-terms-copy"><div id="public-terms-copy"><label for="public-terms">I have read and agree to the</label> <button type="button" data-public-action="info" data-info="terms">Terms of Service</button>, <button type="button" data-public-action="info" data-info="usage">Usage Policy</button>, <button type="button" data-public-action="info" data-info="regions">Supported Countries and Regions</button>, and <button type="button" data-public-action="info" data-info="service">Service-Specific Terms</button>.</div></div>${error}`;
}

export function renderLogin(locale = 'en', options = {}) {
  locale = 'en';
  const c = getCopy(locale);
  const mode = ['code', 'register', 'email'].includes(options.mode) ? options.mode : 'account';
  const email = escapeHTML(options.email || '');
  const error = `<div class="public-auth-error" id="public-auth-error" role="alert"${options.error ? '' : ' hidden'}>${escapeHTML(options.error || '')}</div>`;
  let form;
  if (mode === 'code') {
    form = `<h2>${c.codeTitle}</h2><p class="public-auth-description">${c.codeDescription} <strong>${email}</strong></p><form class="public-auth-form" data-auth-form="code"><input type="hidden" name="email" value="${email}"><label for="public-code">${c.codeLabel}</label><input class="public-code-input" id="public-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" placeholder="${c.codePlaceholder}" required><p class="public-auth-hint public-demo-code">${c.codeHint}</p>${consent(options, error)}<button class="on-button on-button-primary" type="submit">${c.verify}</button></form><button class="public-auth-link" type="button" data-public-action="email-code">${c.changeEmail}</button>`;
  } else if (mode === 'register') {
    form = `<h2>${c.registerTitle}</h2><p class="public-auth-description">${c.registerDescription}</p><form class="public-auth-form" data-auth-form="register"><label for="public-full-name">${c.name}</label><input id="public-full-name" name="fullName" value="${escapeHTML(options.name || '')}" type="text" autocomplete="name" placeholder="${c.namePlaceholder}" required><label for="public-company">${c.company}</label><input id="public-company" name="company" value="${escapeHTML(options.company || '')}" type="text" autocomplete="organization" placeholder="${c.companyPlaceholder}" required><label for="public-email">${c.emailLabel}</label><input id="public-email" name="email" type="email" autocomplete="email" placeholder="${c.emailPlaceholder}" value="${email}" required>${consent(options, error)}<button class="on-button on-button-primary" type="submit">${c.registerButton}</button><p class="public-auth-hint">${c.registerHint}</p></form><div class="public-auth-secondary"><h3>${c.haveAccount}</h3><button class="public-auth-link" data-public-action="signin">${c.signin}</button></div>`;
  } else if (mode === 'email') {
    form = `<h2>${c.loginTitle}</h2><p class="public-auth-description">${c.loginDescription}</p><form class="public-auth-form" data-auth-form="email"><label for="public-email">${c.emailLabel}</label><input id="public-email" name="email" type="email" autocomplete="email" placeholder="${c.emailPlaceholder}" value="${email}" required><button class="on-button on-button-primary" type="submit">${c.continueEmail}</button><p class="public-auth-hint">${c.emailHint}</p>${consent(options, error)}</form>${providers()}<button class="public-auth-link public-account-fallback" type="button" data-public-action="signin">Use account and password</button><button class="on-button on-button-outline public-demo-button" type="button" data-public-action="demo">${c.demo}${arrow}</button><div class="public-auth-secondary"><h3>${c.newAccount}</h3><button class="public-auth-link" type="button" data-public-action="register">${c.createAccount}</button></div>`;
  } else {
    form = `<h2>${c.loginTitle}</h2><p class="public-auth-description">${c.loginDescription}</p><form class="public-auth-form public-account-form" data-auth-form="account"><div class="public-account-fields"><div><label for="public-email">Account</label><input id="public-email" name="email" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Username or email" value="${email}" required aria-describedby="public-account-hint"></div><div><label for="public-password">Password</label><input id="public-password" name="password" type="password" autocomplete="off" placeholder="Password" required aria-describedby="public-account-hint"></div></div><div class="public-password-actions"><button class="public-auth-link" type="button" data-public-action="email-code">Use an email code</button><button class="public-auth-link" type="button" data-public-action="forgot-password">Forgot password?</button></div><p class="public-auth-hint" id="public-account-hint">Interactive preview. Use sample credentials only.</p><button class="on-button on-button-primary" type="submit">Sign in${arrow}</button>${consent(options, error)}</form>${providers()}<button class="on-button on-button-outline public-demo-button" type="button" data-public-action="demo">${c.demo}${arrow}</button><div class="public-auth-secondary"><h3>${c.newAccount}</h3><button class="public-auth-link" type="button" data-public-action="register">${c.createAccount}</button></div>`;
  }
  return `<div class="auth-page${mode === 'register' ? ' public-register-page' : ''}" lang="${locale}"><div class="public-auth-shell"><header class="public-auth-header">${brandLink()}</header><main class="public-auth-main"><section class="public-auth-story"><p class="on-eyebrow">${c.workspace}</p><h1>${c.authTitle}</h1><p class="public-auth-intro">${c.authDescription}</p>${capacityIllustration('global')}<p class="public-auth-caption">${c.secure}</p></section><section class="public-auth-panel">${form}</section></main>${footer(c, true)}</div></div>`;
}
