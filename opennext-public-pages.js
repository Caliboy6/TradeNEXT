const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const copy = {
  en: {
    market: 'The market', how: 'How it works', suppliers: 'For suppliers', signin: 'Sign in', eyebrow: 'AI CAPACITY MARKET',
    hero: 'AI capacity,<br>on your terms.', intro: 'Source model capacity and GPU compute.<br>Compare supply, request quotes, and manage<br class="public-desktop-break"> delivery in one place.', explore: 'Explore capacity', post: 'Sign in to post',
    marketLabel: '01 / THE MARKET', marketTitle: 'Two ways to source compute.', models: 'Model capacity', modelDescription: 'Compare model access by region, limits, and commercial terms.', modelPreview: 'Explore models', gpu: 'GPU compute', gpuDescription: 'Find the right hardware, location, and rental window.', gpuPreview: 'Explore GPUs',
    inside: 'INSIDE OPENNEXT', listingsTitle: 'See how supply meets demand.', listingsDescription: 'A preview of the listings you can publish and compare in your workspace.', example: 'Example listings', rental: 'GPU rental', physical: 'Physical GPUs', side: 'Side', resource: 'Resource', spec: 'Specification', terms: 'Commercial terms', supply: 'Supply', demand: 'Demand',
    listingSets: [
      [ ['Supply', 'Model API capacity', 'Token allowance · APAC · Monthly', 'Per 1M tokens · Quote based'], ['Supply', 'Dedicated inference', 'Private endpoint · US · Reserved capacity', 'Monthly commitment · Custom SLA'], ['Demand', 'Model capacity', 'High concurrency · EU · 90 days', 'Request for quote'] ],
      [ ['Supply', 'H100 GPU rental', '8 GPUs · US West · 30 days', 'Per GPU-hour · Quote based'], ['Supply', 'H200 GPU rental', '8 GPUs · Singapore · Flexible term', 'Per GPU-hour · Reserved capacity'], ['Demand', 'A100 GPU cluster', '16 GPUs · APAC · 90 days', 'Request for quote'] ],
      [ ['Supply', 'H100 hardware', '8 units · New · Delivery available', 'Unit price · Quote based'], ['Supply', 'H200 hardware', '16 units · New · Supplier verification', 'Unit price · Delivery terms'], ['Demand', 'GPU servers', '4 servers · Configurable · Delivery required', 'Request for quote'] ]
    ],
    steps: ['Choose supply or demand', 'Set specifications and terms', 'Publish from your workspace'], viewMarket: 'Sign in to view the market', publish: 'Sign in to publish',
    procurement: '02 / PROCUREMENT', procurementTitle: 'From requirement to delivery.', process: [['Define', 'Specify your workload and budget.'], ['Compare', 'Review supplier quotes side by side.'], ['Agree', 'Confirm capacity and commercial terms.'], ['Track', 'Keep delivery and records together.']],
    band: 'Built for buyers.<br>Open to suppliers.', buyer: 'One place to source capacity<br>and coordinate procurement.', buyerAction: 'Post a requirement', supplier: 'List your supply and respond<br>to qualified requests.', supplierAction: 'List your supply', supplierNote: 'Sign in to publish or respond.',
    closing: 'Tell us what you need.', closingDescription: 'Start with a workload, a region, and a timeline.', closingAction: 'Sign in to post RFQ', privacy: 'Privacy', contact: 'Contact', footer: 'OpenNEXT · AI Capacity Market',
    backHome: 'Back to homepage', workspace: 'OPENNEXT WORKSPACE', authTitle: 'Your market.<br>Your workspace.', authDescription: 'Compare supply, publish requirements, and manage quotes in one place.', loginTitle: 'Sign in to OpenNEXT', loginDescription: 'Continue to your procurement workspace.', emailLabel: 'Work email', emailPlaceholder: 'you@company.com', continueEmail: 'Continue with email', emailHint: 'This demo uses an on-screen sign-in code.', demo: 'Explore demo workspace', newAccount: 'New to OpenNEXT?', createAccount: 'Create an account',
    codeTitle: 'Enter your sign-in code', codeDescription: 'Continue with', codeLabel: 'Six-digit code', codePlaceholder: '123456', verify: 'Enter workspace', codeHint: 'Demo code: 123456. No email has been sent.', changeEmail: 'Use a different email', registerTitle: 'Create your workspace', registerDescription: 'A shared place for your next capacity purchase.', name: 'Full name', namePlaceholder: 'Your full name', company: 'Company', companyPlaceholder: 'Company name', registerButton: 'Create demo account', registerHint: 'Demo account data stays in this browser.', haveAccount: 'Already have an account?', secure: 'Model capacity. GPU compute. One workspace.'
  },
  'zh-CN': {
    market: '交易市场', how: '采购流程', suppliers: '成为供应商', signin: '登录', eyebrow: 'AI 容量采购市场',
    hero: 'AI 算力，<br>按你的方式采购。', intro: '寻找模型容量与 GPU 算力。<br>比较供应、发起询价，<br class="public-desktop-break">在同一个工作台管理交付。', explore: '探索算力市场', post: '登录发布挂单',
    marketLabel: '01 / 交易市场', marketTitle: '两种方式，找到所需算力。', models: '模型容量', modelDescription: '按区域、调用额度和商务条件，比较模型接入方案。', modelPreview: '查看模型市场', gpu: 'GPU 算力', gpuDescription: '寻找合适的 GPU 型号、交付地点和租赁周期。', gpuPreview: '查看 GPU 市场',
    inside: '走进 OPENNEXT', listingsTitle: '让供应与需求相遇。', listingsDescription: '提前了解你可以在工作台发布和比较的挂单。', example: '挂单示例', rental: 'GPU 租赁', physical: '实体 GPU', side: '方向', resource: '资源', spec: '规格', terms: '交易条件', supply: '供应', demand: '需求',
    listingSets: [
      [ ['供应', '模型 API 容量', 'Token 额度 · 亚太 · 按月', '每百万 Token · 询价'], ['供应', '专属推理服务', '私有端点 · 美国 · 预留容量', '月度承诺 · 定制 SLA'], ['需求', '模型容量', '高并发 · 欧洲 · 90 天', '征集报价'] ],
      [ ['供应', 'H100 GPU 租赁', '8 张 GPU · 美国西部 · 30 天', '每卡每小时 · 询价'], ['供应', 'H200 GPU 租赁', '8 张 GPU · 新加坡 · 灵活周期', '每卡每小时 · 预留容量'], ['需求', 'A100 GPU 集群', '16 张 GPU · 亚太 · 90 天', '征集报价'] ],
      [ ['供应', 'H100 实体硬件', '8 张 · 全新 · 支持交付', '单台价格 · 询价'], ['供应', 'H200 实体硬件', '16 张 · 全新 · 供应商审核', '单台价格 · 交付条件'], ['需求', 'GPU 服务器', '4 台 · 可配置 · 需要交付', '征集报价'] ]
    ],
    steps: ['选择供应或需求', '填写规格与交易条件', '在工作台发布挂单'], viewMarket: '登录查看完整市场', publish: '登录发布',
    procurement: '02 / 采购流程', procurementTitle: '从提出需求，到完成交付。', process: [['明确需求', '确定工作负载与采购预算。'], ['比较报价', '并排比较各供应商的方案。'], ['确认条款', '确认容量、价格与商务条件。'], ['跟进交付', '集中管理交付进度与记录。']],
    band: '为买方而建。<br>向供应商开放。', buyer: '在一个工作台寻找容量，<br>协同管理采购。', buyerAction: '发布采购需求', supplier: '发布供应，<br>响应匹配的采购需求。', supplierAction: '发布你的供应', supplierNote: '登录后即可发布或响应需求。',
    closing: '告诉我们，你需要什么。', closingDescription: '从工作负载、区域和时间安排开始。', closingAction: '登录发布询价', privacy: '隐私', contact: '联系我们', footer: 'OpenNEXT · AI 容量采购市场',
    backHome: '返回首页', workspace: 'OPENNEXT 工作台', authTitle: '你的市场。<br>你的工作台。', authDescription: '比较供应、发布需求，集中管理每一份报价。', loginTitle: '登录 OpenNEXT', loginDescription: '进入你的算力采购工作台。', emailLabel: '工作邮箱', emailPlaceholder: 'you@company.com', continueEmail: '通过邮箱继续', emailHint: '演示版使用页面显示的登录验证码。', demo: '体验演示工作台', newAccount: '第一次使用 OpenNEXT？', createAccount: '创建账号',
    codeTitle: '输入登录验证码', codeDescription: '继续使用邮箱', codeLabel: '六位验证码', codePlaceholder: '123456', verify: '进入工作台', codeHint: '演示验证码：123456。系统不会发送邮件。', changeEmail: '使用其他邮箱', registerTitle: '创建你的工作台', registerDescription: '下一次算力采购，从这里开始。', name: '姓名', namePlaceholder: '请输入姓名', company: '公司', companyPlaceholder: '请输入公司名称', registerButton: '创建演示账号', registerHint: '演示账号信息仅保存在此浏览器中。', haveAccount: '已经有账号？', secure: '模型容量与 GPU 算力，尽在一个工作台。'
  }
};

function getCopy(locale) { return copy[locale] || copy.en; }
const arrow = '<span aria-hidden="true">→</span>';
export function logoMarkup() {
  return '<span class="on-brand"><img class="on-brand-mark" src="assets/opennext-mark.svg" alt="" width="30" height="32"><span>OpenNEXT</span></span>';
}
function brandLink() { return `<a class="on-brand-link" href="#" data-public-action="home" aria-label="OpenNEXT">${logoMarkup()}</a>`; }
function languageSwitch(locale) {
  const zh = locale === 'zh-CN';
  return `<button class="on-language" type="button" data-public-action="locale" data-locale="${zh ? 'en' : 'zh-CN'}" aria-label="${zh ? 'Switch to English' : '切换为中文'}"><span class="${zh ? '' : 'on-language-active'}">EN</span><span class="on-language-divider">/</span><span class="${zh ? 'on-language-active' : ''}">中文</span></button>`;
}
function cta(text, target = 'models', style = 'primary', mode = '') {
  return `<button type="button" class="on-button on-button-${style}" data-public-action="open-workspace" data-target="${target}"${mode ? ` data-mode="${mode}"` : ''}>${text}${style === 'text' ? arrow : ''}</button>`;
}
function footer(c, compact = false) {
  return `<footer class="public-footer${compact ? ' public-footer-compact' : ''}">${brandLink()}<div class="public-footer-links"><button type="button" data-public-action="info" data-info="contact">${c.contact}</button><button type="button" data-public-action="info" data-info="privacy">${c.privacy}</button>${compact ? '' : `<span>${c.footer}</span>`}</div></footer>`;
}
function listings(c) {
  const names = [c.models, c.rental, c.physical];
  const panels = c.listingSets.map((rows, i) => `<div class="public-listing-panel public-listing-panel-${i}" role="region" aria-label="${names[i]}"><div class="public-table-scroll"><table class="public-listing-table"><thead><tr><th>${c.side}</th><th>${c.resource}</th><th>${c.spec}</th><th>${c.terms}</th></tr></thead><tbody>${rows.map(row => `<tr><td><span class="public-side-tag">${row[0]}</span></td><td><button class="public-listing-resource" type="button" data-public-action="open-workspace" data-target="${i === 0 ? 'models' : 'gpus'}"${i === 2 ? ' data-mode="hardware"' : ''}>${row[1]}</button></td><td>${row[2]}</td><td>${row[3]}</td></tr>`).join('')}</tbody></table></div></div>`).join('');
  return `<div class="public-listing-preview">${names.map((name, i) => `<input class="public-listing-radio" type="radio" name="public-listings" id="public-listings-${i}"${i === 0 ? ' checked' : ''}><label class="public-listing-tab public-listing-tab-${i}" for="public-listings-${i}">${name}</label>`).join('')}<div class="public-listing-panels">${panels}</div></div>`;
}

export function renderLanding(locale = 'en') {
  const c = getCopy(locale);
  return `<div class="public-page" lang="${locale}">
    <header class="public-header"><div class="public-header-inner">${brandLink()}<nav class="public-nav" aria-label="${c.market}"><button data-public-action="scroll" data-section="market">${c.market}</button><button data-public-action="scroll" data-section="how-it-works">${c.how}</button><button data-public-action="scroll" data-section="suppliers">${c.suppliers}</button></nav><div class="public-header-actions">${languageSwitch(locale)}<button class="on-button on-button-primary on-button-small" data-public-action="signin">${c.signin}</button></div></div></header>
    <main>
      <section class="public-hero public-container"><div class="public-hero-copy"><p class="on-eyebrow">${c.eyebrow}</p><h1>${c.hero}</h1><p class="public-hero-description">${c.intro}</p><div class="public-hero-actions">${cta(c.explore)}${cta(c.post, 'supply', 'outline')}</div></div><div class="public-hero-visual"><img src="assets/compute-network.png" alt="" width="1860" height="846" fetchpriority="high"></div></section>
      <div class="public-container">
        <section class="public-section public-market-section" id="market"><p class="on-eyebrow">${c.marketLabel}</p><h2>${c.marketTitle}</h2><div class="public-market-row"><span class="public-row-number">01</span><h3>${c.models}</h3><p>${c.modelDescription}</p>${cta(c.modelPreview, 'models', 'text')}</div><div class="public-market-row"><span class="public-row-number">02</span><h3>${c.gpu}</h3><p>${c.gpuDescription}</p>${cta(c.gpuPreview, 'gpus', 'text')}</div></section>
        <section class="public-section public-listings-section"><p class="on-eyebrow">${c.inside}</p><h2>${c.listingsTitle}</h2><p class="public-section-description">${c.listingsDescription}</p><div class="public-preview-label">${c.example}</div>${listings(c)}<ol class="public-posting-steps">${c.steps.map((step, i) => `<li><span>0${i + 1}</span><p>${step}</p></li>`).join('')}</ol><div class="public-preview-actions">${cta(c.viewMarket)}${cta(c.publish, 'supply', 'text')}</div></section>
        <section class="public-section public-procurement-section" id="how-it-works"><p class="on-eyebrow">${c.procurement}</p><h2>${c.procurementTitle}</h2><ol class="public-process">${c.process.map(([title, description], i) => `<li><span class="public-process-number">0${i + 1}</span><h3>${title}</h3><p>${description}</p></li>`).join('')}</ol></section>
      </div>
      <section class="public-supplier-band" id="suppliers"><div class="public-container public-supplier-inner"><h2>${c.band}</h2><div class="public-supplier-column"><p>${c.buyer}</p>${cta(c.buyerAction, 'rfq', 'text')}</div><div class="public-supplier-column"><p>${c.supplier}</p>${cta(c.supplierAction, 'supply', 'text')}<small>${c.supplierNote}</small></div></div></section>
      <section class="public-closing public-container"><h2>${c.closing}</h2><p>${c.closingDescription}</p>${cta(c.closingAction, 'rfq')}</section>
    </main><div class="public-container">${footer(c)}</div>
  </div>`;
}

export function renderLogin(locale = 'en', options = {}) {
  const c = getCopy(locale);
  const mode = ['code', 'register'].includes(options.mode) ? options.mode : 'email';
  const email = escapeHTML(options.email || '');
  const error = options.error ? `<div class="public-auth-error" role="alert">${escapeHTML(options.error)}</div>` : '';
  let form;
  if (mode === 'code') {
    form = `<h2>${c.codeTitle}</h2><p class="public-auth-description">${c.codeDescription} <strong>${email}</strong></p><form class="public-auth-form" data-auth-form="code"><input type="hidden" name="email" value="${email}"><label for="public-code">${c.codeLabel}</label><input class="public-code-input" id="public-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" placeholder="${c.codePlaceholder}" required>${error}<button class="on-button on-button-primary" type="submit">${c.verify}</button><p class="public-auth-hint public-demo-code">${c.codeHint}</p></form><button class="public-auth-link" type="button" data-public-action="signin">${c.changeEmail}</button>`;
  } else if (mode === 'register') {
    form = `<h2>${c.registerTitle}</h2><p class="public-auth-description">${c.registerDescription}</p><form class="public-auth-form" data-auth-form="register"><label for="public-full-name">${c.name}</label><input id="public-full-name" name="fullName" value="${escapeHTML(options.name || '')}" type="text" autocomplete="name" placeholder="${c.namePlaceholder}" required><label for="public-company">${c.company}</label><input id="public-company" name="company" value="${escapeHTML(options.company || '')}" type="text" autocomplete="organization" placeholder="${c.companyPlaceholder}" required><label for="public-email">${c.emailLabel}</label><input id="public-email" name="email" type="email" autocomplete="email" placeholder="${c.emailPlaceholder}" value="${email}" required>${error}<button class="on-button on-button-primary" type="submit">${c.registerButton}</button><p class="public-auth-hint">${c.registerHint}</p></form><div class="public-auth-secondary"><h3>${c.haveAccount}</h3><button class="public-auth-link" data-public-action="signin">${c.signin}</button></div>`;
  } else {
    form = `<h2>${c.loginTitle}</h2><p class="public-auth-description">${c.loginDescription}</p><form class="public-auth-form" data-auth-form="email"><label for="public-email">${c.emailLabel}</label><input id="public-email" name="email" type="email" autocomplete="email" placeholder="${c.emailPlaceholder}" value="${email}" required>${error}<button class="on-button on-button-primary" type="submit">${c.continueEmail}</button><p class="public-auth-hint">${c.emailHint}</p></form><button class="on-button on-button-outline public-demo-button" type="button" data-public-action="demo">${c.demo}${arrow}</button><div class="public-auth-secondary"><h3>${c.newAccount}</h3><button class="public-auth-link" type="button" data-public-action="register">${c.createAccount}</button></div>`;
  }
  return `<div class="auth-page${mode === 'register' ? ' public-register-page' : ''}" lang="${locale}"><div class="public-auth-shell"><header class="public-auth-header">${brandLink()}<div class="public-auth-header-links">${languageSwitch(locale)}<button type="button" data-public-action="home">${c.backHome}<span aria-hidden="true">↗</span></button></div></header><main class="public-auth-main"><section class="public-auth-story"><p class="on-eyebrow">${c.workspace}</p><h1>${c.authTitle}</h1><p class="public-auth-intro">${c.authDescription}</p><img class="public-auth-visual" src="assets/global-matching.png" alt="" width="1860" height="846"><p class="public-auth-caption">${c.secure}</p></section><section class="public-auth-panel">${form}</section></main>${footer(c, true)}</div></div>`;
}
