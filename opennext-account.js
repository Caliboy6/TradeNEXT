import { getCapacityLedgerRecords } from './opennext-capacity.js?v=opennext-20260914-desk-1';

// Billing and account controls are local, explicitly labelled demo workflows.
// No payment, identity, authentication or cloud provider endpoint is contacted.
const STORE = 'opennext.account.v1';
const PAGE_SIZE = 5;
const nowDate = () => new Date();
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const usd = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const dateLabel = (value) => new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
const defaults = () => ({
  billing: { company: 'Example Organization', email: 'billing@example.com', country: 'United States', address: '100 Example Avenue', taxId: '' },
  invoices: [], mfa: false, passwordReset: false, phone: false, providers: [], revokedSessions: [],
  apiKeys: [], sshKeys: [],
  settings: { name: 'Workspace Member', organization: 'Example Organization', email: 'member@example.com', timezone: 'UTC', weekly: true, billing: true, security: true, renewal: true },
});
let state = defaults();
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
  if (saved && typeof saved === 'object') state = { ...state, ...saved, billing: { ...state.billing, ...saved.billing }, settings: { ...state.settings, ...saved.settings } };
} catch { /* Storage can be unavailable in privacy modes. The demo still works. */ }
for (const name of ['invoices', 'providers', 'revokedSessions', 'apiKeys', 'sshKeys']) if (!Array.isArray(state[name])) state[name] = [];
const validText = (value, limit = 200) => typeof value === 'string' && value.length <= limit;
const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const fresh = defaults();
for (const field of Object.keys(fresh.billing)) if (!validText(state.billing[field])) state.billing[field] = fresh.billing[field];
for (const field of Object.keys(fresh.settings)) if (typeof state.settings[field] !== typeof fresh.settings[field] || typeof state.settings[field] === 'string' && !validText(state.settings[field])) state.settings[field] = fresh.settings[field];
state.invoices = state.invoices.filter((r) => r && validText(r.id) && validText(r.orderId) && validDate(r.date) && validText(r.title) && Number.isFinite(r.amount) && r.amount >= 0 && r.billing && Object.keys(fresh.billing).every((key) => validText(r.billing[key]))).slice(0,500);
state.apiKeys = state.apiKeys.filter((r) => r && validText(r.id) && validText(r.name) && validText(r.scope) && validText(r.reference) && validDate(r.date)).slice(0,100);
state.sshKeys = state.sshKeys.filter((r) => r && validText(r.id) && validText(r.name) && validText(r.type) && validText(r.fingerprint) && validDate(r.date)).slice(0,100);
state.providers = state.providers.filter((p) => ['Google','GitHub','Lark','WalletConnect','Binance','MetaMask'].includes(p));
state.revokedSessions = state.revokedSessions.filter((p) => ['session-2','session-3'].includes(p));
for (const key of ['mfa','passwordReset','phone']) state[key] = state[key] === true;
let view = { section: 'billing', billing: 'transactions', account: 'security', page: 1, query: '', type: 'all', from: '', to: '' };
let initialized = false;
let hooks = {};
let dialog = null;
let persistent = true;

function persist() { try { localStorage.setItem(STORE, JSON.stringify(state)); return true; } catch { persistent = false; return false; } }
function tell(message) {
  const live = document.querySelector('.on-account [data-ac-live]');
  if (live) live.textContent = message;
  if (hooks.notify) hooks.notify(message);
}
function confirmSaved(message) { const saved = persist(); tell(`${message}${saved ? '' : ' Changes are available for this tab only.'}`); }
function button(label, action, extra = '', style = '') { return `<button type="button" class="ac-button ${style}" data-ac-action="${action}" ${extra}>${label}</button>`; }
function badge(label, status = '') { return `<span class="ac-badge ${status}">${escape(label)}</span>`; }
function empty(message) { return `<div class="ac-empty"><span aria-hidden="true">—</span><h3>No records found</h3><p>${escape(message)}</p>${button('Clear filters', 'clear-filters')}</div>`; }
function tabs(section, entries) {
  return `<nav class="ac-tabs" aria-label="${section === 'billing' ? 'Billing' : 'Account'} sections">${entries.map(([id, label]) => `<button type="button" data-ac-action="tab" data-tab="${id}" aria-current="${view[section] === id ? 'page' : 'false'}">${label}</button>`).join('')}</nav>`;
}
function pagination(total) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  view.page = Math.max(1, Math.min(view.page, pages));
  const first = total ? (view.page - 1) * PAGE_SIZE + 1 : 0;
  return `<div class="ac-pagination"><span>${first}–${Math.min(view.page * PAGE_SIZE, total)} of ${total} records</span><div>${button('Previous', 'page', `data-page="${view.page - 1}" ${view.page <= 1 ? 'disabled' : ''}`)}<span>Page ${view.page} of ${pages}</span>${button('Next', 'page', `data-page="${view.page + 1}" ${view.page >= pages ? 'disabled' : ''}`)}</div></div>`;
}
function paged(records) { view.page = Math.max(1, Math.min(view.page, Math.max(1, Math.ceil(records.length / PAGE_SIZE)))); return records.slice((view.page - 1) * PAGE_SIZE, view.page * PAGE_SIZE); }
function table(heads, rows, label) { return `<div class="ac-table-scroll" tabindex="0" role="region" aria-label="${escape(label)}"><table><thead><tr>${heads.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`; }
function filters({ search = true, types, dates = false, exportLabel } = {}) {
  return `<form class="ac-filters" data-ac-form="filters">${search ? `<label class="ac-search"><span class="ac-sr-only">Search records</span><input type="search" name="query" value="${escape(view.query)}" placeholder="Search records" maxlength="100"></label>` : ''}${types ? `<label><span class="ac-sr-only">Record type</span><select name="type">${types.map(([value, text]) => `<option value="${value}"${view.type === value ? ' selected' : ''}>${text}</option>`).join('')}</select></label>` : ''}${dates ? `<label class="ac-date"><span>From</span><input type="date" name="from" value="${escape(view.from)}"></label><label class="ac-date"><span>To</span><input type="date" name="to" value="${escape(view.to)}"></label>` : ''}<button type="submit" class="ac-button">Apply</button>${view.query || view.type !== 'all' || view.from || view.to ? button('Reset', 'clear-filters', '', 'ac-button-quiet') : ''}${exportLabel ? button(exportLabel, 'export', '', 'ac-export') : ''}</form>`;
}
function filtered(records, match = () => true) {
  return records.filter((r) => (!view.query || JSON.stringify(r).toLowerCase().includes(view.query.toLowerCase())) && (!view.from || r.date.slice(0, 10) >= view.from) && (!view.to || r.date.slice(0, 10) <= view.to) && match(r));
}

// Normalization keeps capacity purchases authoritative across Profile, My GPU and Fees.
function purchases() {
  return getCapacityLedgerRecords().map((r, i) => ({
    id: String(r.id || `CAP-${1001 + i}`), date: new Date(r.date || r.createdAt || Date.now()).toISOString(),
    title: r.description || r.title || r.product || r.label || 'Capacity purchase',
    category: r.kind || r.category || r.type || 'Capacity', amount: Math.abs(Number(r.amount ?? r.total ?? 0)),
    status: 'Completed', raw: r,
  }));
}
function transactions() {
  const ordered = [...purchases()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  let balance = 10000;
  const records = [{ id: 'TXN-DEMO-1000', date: new Date(Math.min(...ordered.map((r) => Date.parse(r.date)), Date.now()) - 86400000).toISOString(), title: 'Opening credit', category: 'Funding', amount: 10000, direction: 'in', balance: 10000, channel: 'Workspace credit', status: 'Completed' }];
  for (const item of ordered) { balance -= item.amount; records.push({ ...item, direction: 'out', balance: Math.round(balance * 100) / 100, channel: 'Workspace credit' }); }
  return records.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
function transactionRecords() { return filtered(transactions(), (r) => view.type === 'all' || r.direction === view.type); }
function renderTransactions() {
  const records = transactionRecords();
  return `<div class="ac-section-head"><div><h2>Transactions</h2><p>Credits and capacity purchases, in one ledger.</p></div>${badge('USD')}</div>${filters({ types: [['all','All transactions'],['in','Money in'],['out','Money out']], dates: true, exportLabel: 'Export CSV' })}${records.length ? table(['Date / reference', 'Description', 'Type', 'Payment method', 'Amount', 'Balance', ''], paged(records).map((r) => `<tr><td>${dateLabel(r.date)}<small>${escape(r.id)}</small></td><td>${escape(r.title)}</td><td>${badge(r.direction === 'in' ? 'Credit' : 'Purchase')}</td><td>${r.channel}</td><td class="ac-number">${r.direction === 'in' ? '+' : '−'}${usd(r.amount)}</td><td class="ac-number">${usd(r.balance)}</td><td>${button('Details', 'transaction', `data-id="${escape(r.id)}"`, 'ac-button-quiet')}</td></tr>`).join(''), 'Transaction records') + pagination(records.length) : empty('Try a different date range or transaction type.')}`;
}
function statements() {
  const all = purchases();
  return Array.from({ length: 6 }, (_, i) => {
    const anchor = nowDate();
    const month = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1)).toISOString().slice(0, 7);
    const items = all.filter((p) => p.date.startsWith(month));
    return { id: `STMT-${month.replace('-', '')}`, date: `${month}-01T00:00:00Z`, period: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`)), amount: items.reduce((sum, p) => sum + p.amount, 0), count: items.length, status: i ? 'Closed' : 'In progress', items };
  });
}
function renderStatements() {
  const records = filtered(statements());
  return `<div class="ac-section-head"><div><h2>Statements</h2><p>Monthly purchase summaries for your records.</p></div></div>${filters({ exportLabel: 'Export CSV' })}${records.length ? table(['Period', 'Statement', 'Purchases', 'Total', 'Status', ''], paged(records).map((r) => `<tr><td>${r.period}</td><td class="ac-mono">${r.id}</td><td>${r.count}</td><td class="ac-number">${usd(r.amount)}</td><td>${badge(r.status)}</td><td>${button('View statement', 'statement', `data-id="${r.id}"`, 'ac-button-quiet')}</td></tr>`).join(''), 'Monthly statements') + pagination(records.length) : empty('No statements match this search.')}`;
}
function invoiceRecords() {
  const all = purchases();
  const seeds = ['INV-tok-openai', 'INV-tok-anthropic'].map((id) => all.find((p) => p.id === id)).filter(Boolean).map((p, i) => ({ id: `INV-DEMO-${1001 + i}`, orderId: p.id, date: p.date, title: p.title, amount: p.amount, status: 'Available', billing: { ...defaults().billing } }));
  const seen = new Set(seeds.map((x) => x.orderId));
  return [...seeds, ...state.invoices.filter((r) => all.some((p) => p.id === r.orderId) && !seen.has(r.orderId))].sort((a, b) => b.date.localeCompare(a.date));
}
function renderInvoices() {
  const records = filtered(invoiceRecords());
  return `<div class="ac-section-head"><div><h2>Invoices</h2><p>Keep billing details and purchase documents together.</p></div>${button('Request invoice', 'request-invoice', '', 'ac-button-dark')}</div><div class="ac-billing-details"><div><span class="ac-eyebrow">Billing details</span><strong>${escape(state.billing.company)}</strong><span>${escape(state.billing.email)} · ${escape(state.billing.country)}</span></div>${button('Edit details', 'billing-details')}</div>${filters({ exportLabel: 'Export CSV' })}${records.length ? table(['Invoice / date', 'Purchase', 'Billed to', 'Amount', 'Status', ''], paged(records).map((r) => `<tr><td class="ac-mono">${escape(r.id)}<small>${dateLabel(r.date)}</small></td><td>${escape(r.title)}</td><td>${escape(r.billing.company)}</td><td class="ac-number">${usd(r.amount)}</td><td>${badge(r.status)}</td><td>${button('View', 'invoice', `data-id="${escape(r.id)}"`, 'ac-button-quiet')}</td></tr>`).join(''), 'Invoice records') + pagination(records.length) : empty('No invoices match this search.')}`;
}
function contracts() {
  return purchases().map((p, i) => ({ ...p, id: `CTR-${p.id.replace(/^INV-/, '')}`, orderId: p.id, counterparty: p.raw.supplier || p.raw.provider || 'Example Capacity Provider', status: /renew/i.test(p.title) ? 'Renewal' : 'Active', term: /token|model/i.test(p.category + p.title) ? 'Prepaid capacity' : 'Reserved GPU hours' }));
}
function renderContracts() {
  const records = filtered(contracts());
  return `<div class="ac-section-head"><div><h2>Contracts</h2><p>Review the terms attached to each capacity purchase.</p></div></div>${filters({ exportLabel: 'Export CSV' })}${records.length ? table(['Contract / purchase', 'Counterparty', 'Scope', 'Value', 'Status', 'Next step', ''], paged(records).map((r) => `<tr><td class="ac-mono">${r.id}<small>${escape(r.title)}</small></td><td>${escape(r.counterparty)}</td><td>${r.term}</td><td class="ac-number">${usd(r.amount)}</td><td>${badge(r.status)}</td><td>No payment due</td><td>${button('Review', 'contract', `data-id="${r.id}"`, 'ac-button-quiet')}</td></tr>`).join(''), 'Capacity contracts') + pagination(records.length) : empty('No contracts match this search.')}`;
}
const sessions = [
  { id: 'session-current', device: 'Chrome · macOS', region: 'San Francisco, US', ip: '192.0.2.14', date: '2026-09-13T08:42:00Z', current: true },
  { id: 'session-2', device: 'Safari · iOS', region: 'Singapore, SG', ip: '198.51.100.42', date: '2026-09-12T14:30:00Z' },
  { id: 'session-3', device: 'Firefox · Windows', region: 'London, GB', ip: '203.0.113.26', date: '2026-09-11T16:05:00Z' },
];
function securityRow(title, description, status, action) { return `<div class="ac-security-row"><div><h3>${title}</h3><p>${description}</p></div><div class="ac-security-controls">${status}${action}</div></div>`; }
function renderSecurity() {
  return `<div class="ac-section-head"><div><h2>Security</h2><p>Review sign-in methods and workspace access.</p></div></div><section class="ac-settings-card" aria-label="Sign-in security">${securityRow('Password', state.passwordReset ? 'A password reset has been simulated in this browser.' : 'Manage password-based access to your workspace.', badge(state.passwordReset ? 'Reset simulated' : 'Password set'), button('Reset password', 'password'))}${securityRow('Two-factor authentication', 'Add an extra verification step to password sign-in.', badge(state.mfa ? 'Enabled in demo' : 'Not enabled', state.mfa ? 'ac-badge-ok' : ''), button(state.mfa ? 'Manage' : 'Set up', 'mfa'))}${securityRow('Recovery phone', state.phone ? '+1 (202) 555-0142 · sample number' : 'An optional recovery method for your workspace.', badge(state.phone ? 'Demo linked' : 'Not linked'), button(state.phone ? 'Remove' : 'Add sample phone', 'phone'))}${securityRow('Organization verification', 'Example Organization · business procurement account.', badge('Sample verified'), button('View details', 'verification'))}</section><div class="ac-section-head ac-subsection"><div><h2>Connected accounts</h2><p>Choose how you sign in to OpenNEXT.</p></div></div><section class="ac-settings-card" aria-label="Connected accounts">${['Google','GitHub','Lark','WalletConnect','Binance','MetaMask'].map((p) => securityRow(p, /WalletConnect|Binance|MetaMask/.test(p) ? 'Wallet sign-in preview' : 'Single sign-on preview', badge(state.providers.includes(p) ? 'Demo connected' : 'Not connected'), button(state.providers.includes(p) ? 'Disconnect' : 'Connect', 'provider', `data-provider="${p}"`))).join('')}</section><div class="ac-section-head ac-subsection"><div><h2>Active sessions</h2><p>Review devices and manage active sessions.</p></div>${button('Revoke other sessions', 'revoke-all', `${sessions.filter((s) => !s.current && !state.revokedSessions.includes(s.id)).length ? '' : 'disabled'}`)}</div>${table(['Device', 'Location / IP', 'Last active', 'Status', ''], sessions.map((s) => `<tr><td>${s.device}</td><td>${s.region}<small class="ac-mono">${s.ip}</small></td><td>${dateLabel(s.date)}</td><td>${badge(s.current ? 'This session' : state.revokedSessions.includes(s.id) ? 'Revoked' : 'Active')}</td><td>${s.current ? '<span class="ac-muted">Current</span>' : button('Revoke', 'revoke', `data-id="${s.id}" ${state.revokedSessions.includes(s.id) ? 'disabled' : ''}`, 'ac-button-quiet')}</td></tr>`).join(''), 'Sample sign-in sessions')}<div class="ac-signout"><div><h3>Current session</h3><p>End this session and return to sign in.</p></div><button type="button" class="ac-button" data-flow-action="logout">Sign out</button></div>`;
}
function accessRecords() {
  const methods = ['Email code', 'Google', 'Password', 'GitHub'];
  return Array.from({ length: 18 }, (_, i) => ({ id: `ACCESS-${1018 - i}`, date: new Date(Date.now() - i * 3 * 86400000 - (i % 5) * 3600000).toISOString(), ip: ['192.0.2.14', '198.51.100.42', '203.0.113.26'][i % 3], region: ['San Francisco, US', 'Singapore, SG', 'London, GB'][i % 3], method: methods[i % 4], user: 'Workspace Member', result: i === 5 || i === 11 ? 'Failed' : 'Successful' }));
}
function renderAccess() {
  const records = filtered(accessRecords(), (r) => view.type === 'all' || r.result.toLowerCase() === view.type);
  return `<div class="ac-section-head"><div><h2>Access history</h2><p>Review sign-in events from the past 90 days.</p></div>${badge('UTC')}</div>${filters({ types: [['all','All events'],['successful','Successful'],['failed','Failed']], dates: true, exportLabel: 'Export CSV' })}${records.length ? table(['Date / time (UTC)', 'IP address', 'Location', 'Method', 'User', 'Result', ''], paged(records).map((r) => `<tr><td>${dateLabel(r.date)}<small>${r.date.slice(11, 16)} UTC</small></td><td class="ac-mono">${r.ip}</td><td>${r.region}</td><td>${r.method}</td><td>${r.user}</td><td>${badge(r.result, r.result === 'Failed' ? 'ac-badge-warn' : '')}</td><td>${button('Details', 'access', `data-id="${r.id}"`, 'ac-button-quiet')}</td></tr>`).join(''), 'Workspace access history') + pagination(records.length) : empty('Try a different date range, result or search.')}`;
}
function switchField(name, title, description, checked, disabled = false) { return `<label class="ac-switch-row"><div><strong>${title}</strong><span>${description}</span></div><input type="checkbox" name="${name}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''} role="switch" aria-label="${title}"><span class="ac-switch" aria-hidden="true"></span></label>`; }
function renderSettings() {
  const s = state.settings;
  return `<div class="ac-section-head"><div><h2>Workspace settings</h2><p>Manage your profile, preferences and developer access.</p></div></div><form data-ac-form="settings" class="ac-settings-form"><section class="ac-settings-card"><div class="ac-card-heading"><h3>Profile &amp; preferences</h3><p>Your contact details and workspace preferences.</p></div><div class="ac-form-grid"><label>Display name<input name="name" maxlength="60" value="${escape(s.name)}" required></label><label>Organization<input name="organization" maxlength="100" value="${escape(s.organization)}" required></label><label>Contact email<input name="email" type="email" maxlength="120" value="${escape(s.email)}" required></label><label>Time zone<select name="timezone">${['UTC','America/Los_Angeles','America/New_York','Europe/London','Asia/Singapore','Asia/Tokyo'].map((z) => `<option${s.timezone === z ? ' selected' : ''}>${z}</option>`).join('')}</select></label><label>Language<input value="English" disabled aria-describedby="ac-language-note"><small id="ac-language-note">English is the workspace language.</small></label><div class="ac-static-field"><span>Currency</span><strong>USD · US dollar</strong><small>Quotes and statements are denominated in USD.</small></div></div></section><section class="ac-settings-card"><div class="ac-card-heading"><h3>Notifications</h3><p>Choose the updates you want to receive.</p></div>${switchField('weekly','Weekly activity summary','A recap of capacity, purchases and RFQs.',s.weekly)}${switchField('billing','Billing updates','Invoices, statements and payment reminders.',s.billing)}${switchField('renewal','Renewal reminders','Upcoming capacity expirations and renewals.',s.renewal)}${switchField('security','Security alerts','Sign-in and account-change notifications.',s.security)}</section><div class="ac-form-actions"><span data-ac-save-note>${persistent ? '' : 'Browser storage is unavailable. Changes last for this tab.'}</span><button class="ac-button ac-button-dark" type="submit">Save preferences</button></div></form><div class="ac-section-head ac-subsection"><div><h2>API access</h2><p>Preview scoped credentials for procurement integrations.</p></div>${button('Create key preview', 'api-add')}</div>${state.apiKeys.length ? table(['Name / created', 'Scope', 'Key reference', 'Status', ''], state.apiKeys.map((k) => `<tr><td>${escape(k.name)}<small>${dateLabel(k.date)}</small></td><td>${escape(k.scope)}</td><td class="ac-mono">${escape(k.reference)}</td><td>${badge(k.revoked ? 'Revoked' : 'Demo only')}</td><td>${button('Revoke', 'api-revoke', `data-id="${escape(k.id)}" ${k.revoked ? 'disabled' : ''}`, 'ac-button-quiet')}</td></tr>`).join(''), 'Demo API key references') : '<div class="ac-key-empty">No API key previews yet.</div>'}<div class="ac-section-head ac-subsection"><div><h2>SSH public keys</h2><p>Review the keys you would use to access provisioned compute.</p></div>${button('Add public key', 'ssh-add')}</div>${state.sshKeys.length ? table(['Name / added', 'Key type', 'Fingerprint preview', ''], state.sshKeys.map((k) => `<tr><td>${escape(k.name)}<small>${dateLabel(k.date)}</small></td><td>${escape(k.type)}</td><td class="ac-mono">${escape(k.fingerprint)}</td><td>${button('Remove', 'ssh-remove', `data-id="${escape(k.id)}"`, 'ac-button-quiet')}</td></tr>`).join(''), 'SSH public key previews') : '<div class="ac-key-empty">No public keys added.</div>'}`;
}
export function renderAccountPage(section = 'billing') {
  if (!['billing','account'].includes(section)) section = 'billing';
  if (section !== view.section) { view = { ...view, section, page: 1, query: '', type: 'all', from: '', to: '' }; }
  const isBilling = section === 'billing';
  const render = isBilling ? { transactions: renderTransactions, statements: renderStatements, invoices: renderInvoices, contracts: renderContracts }[view.billing] : { security: renderSecurity, access: renderAccess, settings: renderSettings }[view.account];
  return `<section class="on-account" data-ac-section="${section}"><header class="ac-page-heading"><span class="ac-eyebrow">My OpenNEXT</span><h1>${isBilling ? 'Fees & billing' : 'Account'}</h1><p>${isBilling ? 'A clear view of every purchase, document and commitment.' : 'Your identity, access and workspace preferences.'}</p></header>${tabs(section, isBilling ? [['transactions','Transactions'],['statements','Statements'],['invoices','Invoices'],['contracts','Contracts']] : [['security','Security'],['access','Access history'],['settings','Settings']])}<div class="ac-feedback" data-ac-live role="status" aria-live="polite"></div><div class="ac-content">${render()}</div></section>`;
}
function refresh(message) {
  const node = document.querySelector('.on-account');
  if (!node) return;
  node.outerHTML = renderAccountPage(view.section);
  if (message) tell(message);
}
export function closeAccountDialogs() { if (dialog) { dialog.close(); dialog.remove(); dialog = null; } }
function showDialog(title, content, footer = '') {
  closeAccountDialogs();
  dialog = document.createElement('dialog');
  dialog.className = 'on-account-dialog';
  dialog.setAttribute('aria-labelledby', 'ac-dialog-title');
  dialog.innerHTML = `<header><div><span class="ac-eyebrow">OpenNEXT</span><h2 id="ac-dialog-title">${title}</h2></div>${button('×', 'close-dialog', 'aria-label="Close dialog"', 'ac-dialog-close')}</header><div class="ac-dialog-body">${content}</div>${footer ? `<footer>${footer}</footer>` : ''}`;
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeAccountDialogs(); });
  dialog.addEventListener('cancel', () => { const old = dialog; dialog = null; queueMicrotask(() => old?.remove()); });
  document.body.append(dialog);
  dialog.showModal();
}
function facts(rows) { return `<dl class="ac-detail-list">${rows.map(([key, value]) => `<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`; }
function billingForm() {
  return `<form data-ac-form="billing-details"><div class="ac-form-grid"><label>Legal / billing name<input name="company" value="${escape(state.billing.company)}" maxlength="120" required></label><label>Billing email<input type="email" name="email" value="${escape(state.billing.email)}" maxlength="120" required></label><label>Country / region<select name="country">${['United States','United Kingdom','Singapore','Germany','Japan','Other'].map((c) => `<option${state.billing.country === c ? ' selected' : ''}>${c}</option>`).join('')}</select></label><label>Tax ID <span class="ac-muted">(optional)</span><input name="taxId" value="${escape(state.billing.taxId)}" maxlength="60" placeholder="Sample business tax reference"></label><label class="ac-full">Billing address<input name="address" value="${escape(state.billing.address)}" maxlength="180" required></label></div><p class="ac-note">Use example details for this demo. Existing documents keep the billing details captured when they were created.</p><div class="ac-form-actions"><button class="ac-button ac-button-dark" type="submit">Save billing details</button></div></form>`;
}
function requestInvoice() {
  const used = new Set(invoiceRecords().map((r) => r.orderId));
  const eligible = purchases().filter((r) => !used.has(r.id));
  if (!eligible.length) return showDialog('All purchases are covered', '<p>Every current capacity purchase already has an invoice preview. A new demo purchase will become available here.</p>', button('Done', 'close-dialog', '', 'ac-button-dark'));
  showDialog('Request an invoice', `<form data-ac-form="invoice"><label>Purchase<select name="orderId" required><option value="">Select a purchase</option>${eligible.map((r) => `<option value="${escape(r.id)}">${escape(r.title)} — ${usd(r.amount)}</option>`).join('')}</select></label><div class="ac-invoice-recipient"><strong>${escape(state.billing.company)}</strong><span>${escape(state.billing.email)}</span><span>${escape(state.billing.address)}, ${escape(state.billing.country)}</span></div><label class="ac-consent"><input type="checkbox" name="confirm" required><span>I confirm the sample billing details above are correct.</span></label><p class="ac-note">This creates one local demo document per purchase. It is not a tax invoice.</p><p class="ac-form-error" data-ac-form-error role="alert"></p><div class="ac-form-actions"><button class="ac-button ac-button-dark" type="submit">Create invoice preview</button></div></form>`);
}
function transactionDialog(id) { const r = transactions().find((x) => x.id === id); if (!r) return; showDialog('Transaction details', facts([['Reference',r.id],['Date',`${dateLabel(r.date)} · ${r.date.slice(11,16)} UTC`],['Description',r.title],['Type',r.direction === 'in' ? 'Credit' : 'Capacity purchase'],['Payment method',r.channel],['Amount',`${r.direction === 'in' ? '+' : '−'}${usd(r.amount)}`],['Balance after transaction',usd(r.balance)],['Status',r.status]]) + '<p class="ac-note">Sample record only. No funds were transferred.</p>', button('Download record', 'download-transaction', `data-id="${escape(id)}"`, 'ac-button-dark')); }
function statementDialog(id) { const r = statements().find((x) => x.id === id); if (!r) return; showDialog(r.period + ' statement', facts([['Statement',r.id],['Organization',state.billing.company],['Status',r.status],['Capacity purchases',r.count],['Total',usd(r.amount)]]) + (r.items.length ? `<ul class="ac-document-lines">${r.items.map((p) => `<li><span>${escape(p.title)}</span><strong>${usd(p.amount)}</strong></li>`).join('')}</ul>` : '<p>No purchases were recorded in this sample period.</p>') + '<p class="ac-note">Demo statement. This document is not proof of payment.</p>', button('Download statement', 'download-statement', `data-id="${id}"`, 'ac-button-dark')); }
function invoiceDialog(id) { const r = invoiceRecords().find((x) => x.id === id); if (!r) return; showDialog('Invoice preview', `<div class="ac-document-stamp">DEMO DOCUMENT · NOT A TAX INVOICE</div>` + facts([['Invoice',r.id],['Date',dateLabel(r.date)],['Billed to',r.billing.company],['Billing email',r.billing.email],['Address',`${r.billing.address}, ${r.billing.country}`],['Purchase',r.title],['Order reference',r.orderId],['Purchase amount',usd(r.amount)],['Tax','Not assessed in demo'],['Document total',usd(r.amount)]]) + '<p class="ac-note">No payment is requested by this preview.</p>', button('Download preview', 'download-invoice', `data-id="${escape(id)}"`, 'ac-button-dark')); }
function contractDialog(id) { const r = contracts().find((x) => x.id === id); if (!r) return; showDialog('Capacity order terms', '<div class="ac-document-stamp">SAMPLE · UNSIGNED</div>' + facts([['Contract',r.id],['Buyer',state.billing.company],['Provider',r.counterparty],['Capacity',r.title],['Order value',usd(r.amount)],['Term',r.term],['Next payment','None scheduled in demo']]) + '<div class="ac-terms"><h3>Delivery & acceptance</h3><p>Capacity, region, start time and access method would be confirmed in the order schedule. Acceptance would be recorded after the agreed checks.</p><h3>Usage & renewal</h3><p>Usage is measured against the purchased allowance. Renewals require a separate review and confirmation; reminder preferences do not authorize payment.</p><h3>Service & support</h3><p>Service levels, maintenance notices and any credits would be specified in a signed provider agreement.</p></div>', button('Download sample terms', 'download-contract', `data-id="${id}"`, 'ac-button-dark')); }
function mfaDialog() {
  if (state.mfa) return showDialog('Manage two-factor authentication', '<p>Two-factor authentication is enabled in this local preview. It does not protect the public demo.</p>', button('Disable in demo', 'mfa-disable') + button('Done', 'close-dialog', '', 'ac-button-dark'));
  showDialog('Set up two-factor authentication', `<ol class="ac-steps"><li>In production, you would add OpenNEXT to an authenticator app.</li><li>For this preview, enter the demo verification code below.</li></ol><div class="ac-demo-code"><span>Demo verification code</span><strong>123456</strong></div><form data-ac-form="mfa"><label>Verification code<input name="code" type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="off" placeholder="123456" required></label><p class="ac-form-error" data-ac-form-error role="alert"></p><div class="ac-form-actions"><button type="submit" class="ac-button ac-button-dark">Enable in demo</button></div></form><p class="ac-note">No QR secret, authenticator or backup codes are created.</p>`);
}
function apiDialog() { showDialog('Create a demo API key', `<form data-ac-form="api"><label>Key name<input name="name" maxlength="60" placeholder="Procurement dashboard" required></label><label>Permission scope<select name="scope"><option>Read-only</option><option>Read and draft RFQs</option></select></label><p class="ac-note">Creates a visible, non-functional key reference only. Demo keys cannot authenticate requests or spend funds.</p><div class="ac-form-actions"><button type="submit" class="ac-button ac-button-dark">Create demo key</button></div></form>`); }
function sshDialog() { showDialog('Add an SSH public key preview', `<form data-ac-form="ssh"><label>Key name<input name="name" maxlength="60" placeholder="Example workstation" required></label><label>Public key<textarea name="key" rows="4" maxlength="16000" placeholder="ssh-ed25519 AAAA… workspace@example" required spellcheck="false"></textarea></label>${button('Use a sample public key', 'ssh-sample', '', 'ac-button-quiet')}<p class="ac-note">Public keys only. Never paste a private key. This preview stores the label, key type and a fingerprint; it does not provision access.</p><p class="ac-form-error" data-ac-form-error role="alert"></p><div class="ac-form-actions"><button type="submit" class="ac-button ac-button-dark">Add key preview</button></div></form>`); }
function download(filename, text, type = 'text/plain') { const blob = new Blob([text], { type: `${type};charset=utf-8` }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); tell('Demo document downloaded.'); }
export function accountCsv(rows) { const cell = (value) => { let text = String(value ?? ''); if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; }; return rows.map((row) => row.map(cell).join(',')).join('\r\n'); }
function exportCsv() {
  let rows;
  if (view.section === 'account') rows = [['DEMO ACCESS HISTORY'], ['Date UTC','IP address','Location','Method','User','Result'], ...filtered(accessRecords(), (r) => view.type === 'all' || r.result.toLowerCase() === view.type).map((r) => [r.date,r.ip,r.region,r.method,r.user,r.result])];
  else if (view.billing === 'transactions') rows = [['DEMO TRANSACTIONS - NOT REAL FUNDS'],['Date UTC','Reference','Description','Direction','Amount USD','Balance USD'], ...transactionRecords().map((r) => [r.date,r.id,r.title,r.direction,r.amount,r.balance])];
  else if (view.billing === 'statements') rows = [['DEMO STATEMENTS'],['Period','Reference','Purchases','Total USD','Status'], ...filtered(statements()).map((r) => [r.period,r.id,r.count,r.amount,r.status])];
  else if (view.billing === 'invoices') rows = [['DEMO INVOICES - NOT TAX DOCUMENTS'],['Date UTC','Invoice','Order','Billed to','Amount USD'], ...filtered(invoiceRecords()).map((r) => [r.date,r.id,r.orderId,r.billing.company,r.amount])];
  else rows = [['DEMO CONTRACTS - UNSIGNED'],['Reference','Order','Counterparty','Scope','Value USD'], ...filtered(contracts()).map((r) => [r.id,r.orderId,r.counterparty,r.term,r.amount])];
  download(`opennext-demo-${view.section === 'account' ? 'access-history' : view.billing}.csv`, accountCsv(rows), 'text/csv');
}
function downloadRecord(kind, id) {
  let title, data, paragraphs = '';
  if (kind === 'transaction') { const r = transactions().find((x) => x.id === id); if (!r) return; title='Transaction record'; data={ Reference:r.id, Date:r.date, Description:r.title, Direction:r.direction, Amount:usd(r.amount), 'Balance after transaction':usd(r.balance) }; }
  if (kind === 'statement') { const r = statements().find((x) => x.id === id); if (!r) return; title='Monthly statement'; data={ Reference:r.id, Period:r.period, Organization:state.billing.company, Total:usd(r.amount) }; paragraphs=r.items.map((x)=>`${x.id} | ${x.title} | ${usd(x.amount)}`).join('\n'); }
  if (kind === 'invoice') { const r = invoiceRecords().find((x) => x.id === id); if (!r) return; title='Invoice preview — NOT A TAX INVOICE'; data={ Invoice:r.id, Date:r.date, 'Billed to':r.billing.company, Email:r.billing.email, Address:`${r.billing.address}, ${r.billing.country}`, Order:r.orderId, Purchase:r.title, Amount:usd(r.amount), Tax:'Not assessed in demo' }; }
  if (kind === 'contract') { const r = contracts().find((x) => x.id === id); if (!r) return; title='Sample capacity order terms — UNSIGNED'; data={ Reference:r.id, Buyer:state.billing.company, Provider:r.counterparty, Capacity:r.title, Value:usd(r.amount), Scope:r.term }; paragraphs='Delivery: capacity, region, start time and access method would be confirmed in the order schedule.\nUsage: measured against the purchased allowance. Renewals require separate confirmation.\nService: service levels, maintenance and credits would be specified in a signed provider agreement.'; }
  if (!data) return;
  download(`opennext-demo-${id}.txt`, `OPENNEXT DEMO\n${title}\n${'='.repeat(52)}\n\n${Object.entries(data).map(([key,value])=>`${key}: ${value}`).join('\n')}\n\n${paragraphs}\n\nSAMPLE ONLY. Not proof of payment, a tax document, or a signed agreement.\n`);
}
function formError(form, message) { const node = form.querySelector('[data-ac-form-error]'); if (node) node.textContent = message; }
function uniqueId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`; }
async function submitForm(form) {
  if (!form.reportValidity()) return;
  const values = new FormData(form); const kind = form.dataset.acForm;
  if (kind === 'filters') { const from = String(values.get('from') || ''), to = String(values.get('to') || ''); if (from && to && from > to) return tell('The start date must be on or before the end date.'); view = { ...view, query: String(values.get('query') || '').trim(), type: String(values.get('type') || 'all'), from, to, page: 1 }; refresh(); return; }
  if (kind === 'billing-details') { for (const field of ['company','email','country','address','taxId']) state.billing[field] = String(values.get(field)||'').trim(); closeAccountDialogs(); confirmSaved('Billing details saved.'); refresh('Billing details saved.'); return; }
  if (kind === 'invoice') {
    const id = String(values.get('orderId')); const order = purchases().find((r)=>r.id===id);
    if (!order || invoiceRecords().some((r)=>r.orderId===id)) return formError(form, 'This purchase already has an invoice, or is no longer available. Select another purchase.');
    const record = { id: uniqueId('INV-DEMO').toUpperCase(), orderId:id, date: new Date().toISOString(), title:order.title, amount:order.amount, status:'Available', billing:{...state.billing} };
    state.invoices.unshift(record); persist(); closeAccountDialogs(); view.billing='invoices'; view.page=1; view.query=''; view.from=''; view.to=''; refresh('Invoice preview created.'); invoiceDialog(record.id); return;
  }
  if (kind === 'mfa' || kind === 'password') {
    if (values.get('code') !== '123456') return formError(form, 'Enter the six-digit demo code 123456.');
    if (kind === 'mfa') state.mfa=true; else state.passwordReset=true;
    persist(); closeAccountDialogs(); refresh(kind === 'mfa' ? 'Two-factor authentication enabled in this demo only.' : 'Password reset simulated. No credentials were changed.'); return;
  }
  if (kind === 'settings') {
    for (const field of ['name','organization','email','timezone']) state.settings[field]=String(values.get(field)||'').trim();
    for (const field of ['weekly','billing','security','renewal']) state.settings[field]=values.has(field);
    confirmSaved('Preferences saved.'); return;
  }
  if (kind === 'api') {
    const id=uniqueId('key'); state.apiKeys.push({ id, name:String(values.get('name')).trim(), scope:String(values.get('scope')), reference:`demo_not_valid_${id.slice(-7)}`, date:new Date().toISOString(), revoked:false });
    persist(); closeAccountDialogs(); refresh('Demo API key reference created. It cannot authenticate requests.'); return;
  }
  if (kind === 'ssh') {
    const key=String(values.get('key')||'').trim();
    if (/PRIVATE KEY/i.test(key)) return formError(form, 'Private keys are not accepted. Paste an SSH public key only.');
    const match=key.match(/^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(?:256|384|521))\s+([A-Za-z0-9+/]+={0,3})(?:\s+[^\r\n]*)?$/);
    if (!match || match[2].length < 40) return formError(form, 'Enter a valid OpenSSH public key, or use the sample public key.');
    let bytes; try { bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0)); } catch { return formError(form,'The public key contains invalid Base64 data.'); }
    let fingerprint;
    try { const hash=await crypto.subtle.digest('SHA-256',bytes); fingerprint='SHA256:'+btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/=+$/,''); } catch { return formError(form,'Fingerprint calculation is unavailable in this browser. Try a secure HTTPS page.'); }
    if (state.sshKeys.some((r)=>r.fingerprint===fingerprint)) return formError(form,'This public key has already been added.');
    state.sshKeys.push({ id:uniqueId('ssh'), name:String(values.get('name')).trim(), type:match[1], fingerprint, date:new Date().toISOString() });
    persist(); closeAccountDialogs(); refresh('Public key preview added. No server access was provisioned.');
  }
}
export function initializeAccount(options = {}) {
  hooks = options;
  if (initialized) return;
  initialized = true;
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-ac-action]'); if (!target) return;
    event.preventDefault(); const action=target.dataset.acAction, id=target.dataset.id;
    if (action==='close-dialog') return closeAccountDialogs();
    if (action==='tab') { view[view.section]=target.dataset.tab; view.page=1; view.query=''; view.type='all'; view.from=''; view.to=''; refresh(); document.querySelector(`.on-account [data-tab="${target.dataset.tab}"]`)?.focus(); return; }
    if (action==='page') { view.page=Number(target.dataset.page)||1; refresh(); return; }
    if (action==='clear-filters') { view.page=1; view.query=''; view.type='all'; view.from=''; view.to=''; refresh(); return; }
    if (action==='export') return exportCsv();
    if (action.startsWith('download-')) return downloadRecord(action.slice(9),id);
    if (action==='transaction') return transactionDialog(id);
    if (action==='statement') return statementDialog(id);
    if (action==='invoice') return invoiceDialog(id);
    if (action==='contract') return contractDialog(id);
    if (action==='billing-details') return showDialog('Billing details',billingForm());
    if (action==='request-invoice') return requestInvoice();
    if (action==='mfa') return mfaDialog();
    if (action==='mfa-disable') { state.mfa=false; persist(); closeAccountDialogs(); return refresh('Two-factor authentication disabled in the demo.'); }
    if (action==='password') return showDialog('Simulate a password reset',`<p>A production reset would verify your identity before changing your password.</p><div class="ac-demo-code"><span>Demo verification code</span><strong>123456</strong></div><form data-ac-form="password"><label>Verification code<input name="code" type="text" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" placeholder="123456" autocomplete="off" required></label><p class="ac-form-error" data-ac-form-error role="alert"></p><div class="ac-form-actions"><button type="submit" class="ac-button ac-button-dark">Simulate reset</button></div></form><p class="ac-note">Do not enter a real password or verification code. No credentials are changed.</p>`);
    if (action==='phone') { state.phone=!state.phone; persist(); return refresh(state.phone?'Sample recovery phone added. No message was sent.':'Sample recovery phone removed.'); }
    if (action==='verification') return showDialog('Organization verification',facts([['Organization','Example Organization'],['Account type','Business procurement'],['Verification state','Sample verified'],['Review reference','DEMO-ORG-2026-001']])+'<p class="ac-note">Example status for this walkthrough. No identity documents were collected or reviewed.</p>');
    if (action==='provider') { const provider=target.dataset.provider; if (!['Google','GitHub','Lark','WalletConnect','Binance','MetaMask'].includes(provider)) return; if(state.providers.includes(provider)) { state.providers=state.providers.filter((p)=>p!==provider);persist();return refresh(`${provider} disconnected in the demo.`); } return showDialog(`Connect ${provider}`,`<p>Preview a connected ${provider} sign-in method. No external account or wallet will be opened, requested or connected.</p>`,button('Connect in demo','provider-confirm',`data-provider="${provider}"`,'ac-button-dark')); }
    if (action==='provider-confirm') { const provider=target.dataset.provider;if(!['Google','GitHub','Lark','WalletConnect','Binance','MetaMask'].includes(provider))return; if(!state.providers.includes(provider))state.providers.push(provider);persist();closeAccountDialogs();return refresh(`${provider} connected in the demo only.`); }
    if (action==='revoke') return showDialog('Revoke this sample session?', '<p>This removes the example device from the active sessions list. Your current demo session stays open.</p>',button('Cancel','close-dialog')+button('Revoke session','revoke-confirm',`data-id="${escape(id)}"`,'ac-button-dark'));
    if (action==='revoke-all') return showDialog('Revoke other sample sessions?', '<p>Your current demo session stays open. All other example devices will be marked as revoked.</p>',button('Cancel','close-dialog')+button('Revoke other sessions','revoke-confirm','data-id="all"','ac-button-dark'));
    if (action==='revoke-confirm') { const ids=id==='all'?sessions.filter((s)=>!s.current).map((s)=>s.id):sessions.filter((s)=>s.id===id&&!s.current).map((s)=>s.id); state.revokedSessions=[...new Set([...state.revokedSessions,...ids])];persist();closeAccountDialogs();return refresh('Sample session access revoked.'); }
    if (action==='access') { const r=accessRecords().find((x)=>x.id===id);if(!r)return;return showDialog('Sign-in event',facts([['Event',r.id],['Date / time (UTC)',r.date.replace('T',' ').replace('.000Z','')],['Member',r.user],['IP address',r.ip],['Location',r.region],['Method',r.method],['Result',r.result]])+'<p class="ac-note">Sample access record. Location and IP address do not describe your actual connection.</p>'); }
    if (action==='api-add') return apiDialog();
    if (action==='api-revoke') return showDialog('Revoke this demo key?', '<p>The sample reference will remain in your key history and be marked as revoked.</p>',button('Cancel','close-dialog')+button('Revoke key','api-revoke-confirm',`data-id="${escape(id)}"`,'ac-button-dark'));
    if (action==='api-revoke-confirm') { const k=state.apiKeys.find((x)=>x.id===id);if(k)k.revoked=true;persist();closeAccountDialogs();return refresh('Demo key marked as revoked.'); }
    if (action==='ssh-add') return sshDialog();
    if (action==='ssh-sample') { const input=dialog?.querySelector('textarea[name="key"]');if(input)input.value='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE6cQqb1tb1TnnpxmAZUTNM1NkNRIPN3e1Wx8SWurWdG workspace@example.com';return; }
    if (action==='ssh-remove') return showDialog('Remove this public key preview?', '<p>This removes the local key reference. No server access is changed.</p>',button('Cancel','close-dialog')+button('Remove key','ssh-remove-confirm',`data-id="${escape(id)}"`,'ac-button-dark'));
    if (action==='ssh-remove-confirm') { state.sshKeys=state.sshKeys.filter((x)=>x.id!==id);persist();closeAccountDialogs();return refresh('Public key preview removed.'); }
  });
  document.addEventListener('submit',(event)=>{ const form=event.target.closest('[data-ac-form]');if(!form)return;event.preventDefault();submitForm(form).catch(()=>formError(form,'This demo action could not be completed. Please try again.')); });
  window.addEventListener('opennext:signout', closeAccountDialogs);
  window.addEventListener('hashchange', closeAccountDialogs);
  window.addEventListener('opennext:capacity-change', () => { if (document.querySelector('.on-account[data-ac-section="billing"]')) refresh(); });
}
