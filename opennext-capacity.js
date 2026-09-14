// My OpenNEXT: a local, explicitly simulated portfolio of purchased capacity.
// A reservation consumes wall-clock time; GPU-hours = devices × reserved hours.
const STORE = 'opennext.capacity.v1';
const HOUR = 3600000;
const DAY = 24 * HOUR;
let state;
let initialized = false;
let currentSection = 'profile';
let hooks = {};
let pendingRenewal = null;
let filters = { query: '', status: 'all' };
let storageAvailable = true;
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const money = (n, digits = 2) => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',minimumFractionDigits:digits,maximumFractionDigits:digits}).format(n);
const number = n => new Intl.NumberFormat('en-US', {maximumFractionDigits:1}).format(n);
const tokens = n => n >= 1e6 ? `${number(n / 1e6)}M` : number(n);
const date = n => new Intl.DateTimeFormat('en-US', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'UTC'}).format(n) + ' UTC';
const clean = (value, fallback) => String(value || fallback).replace(/[\u0000-\u001f]/g, '').slice(0, 100);
const finite = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const arrow = '<span aria-hidden="true">↗</span>';
const newId = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function seed(now = Date.now()) {
  const row = (id, model, purchased, inputUsed, outputUsed, rate) => ({id,model,purchased:purchased*1e6,inputUsed:inputUsed*1e6,outputUsed:outputUsed*1e6,rate});
  const family = (id,name,region,supplier,models,days) => ({id,name,region,supplier,models,createdAt:now-2*DAY,expiresAt:now+days*DAY,usageAlert:true,billingReminder:true});
  const gpu = (id,model,quantity,region,supplier,rate,startOffset,hours) => ({id,model,quantity,region,supplier,rate,startsAt:now+startOffset*HOUR,hours,initialHours:hours,renewalReminder:true,createdAt:now-2*DAY});
  return {version:1,createdAt:now,
    families:[
      family('tok-openai','OpenAI','US East','Northstar API',[row('tok-gpt41','GPT-4.1',80,20,8,2.6),row('tok-gpt41mini','GPT-4.1 mini',40,12,3,.6)],28),
      family('tok-anthropic','Anthropic','US East','Atlas Model Cloud',[row('tok-sonnet','Claude Sonnet 4',60,14,4,5.5),row('tok-haiku','Claude Haiku 3.5',20,3,1,1.2)],21),
      family('tok-open','Open models','Singapore','Meridian API',[row('tok-deepseek','DeepSeek V3',70,23,8,.35),row('tok-qwen','Qwen3-235B',30,8,2,.22)],7),
    ],
    gpus:[
      gpu('gpu-h100','H100 SXM',32,'Singapore','Meridian Compute',2.28,-24,72),
      gpu('gpu-a100','A100 80GB',8,'US East','Aperture Compute',1.18,-9,12),
      gpu('gpu-h200','H200',16,'Frankfurt','Vertex Infrastructure',3.1,2,24),
      gpu('gpu-l40s','L40S',4,'US West','Helix Accelerated',.72,-30,24),
    ],receipts:[]};
}

export function validateCapacityState(candidate) {
  if (!candidate || candidate.version !== 1 || !finite(candidate.createdAt,1,1e14)) return false;
  if (!Array.isArray(candidate.families) || candidate.families.length > 80 || !Array.isArray(candidate.gpus) || candidate.gpus.length > 80 || !Array.isArray(candidate.receipts) || candidate.receipts.length > 500) return false;
  const text = value => typeof value === 'string' && value.length > 0 && value.length <= 100;
  const ids = new Set();
  const id = value => text(value) && !ids.has(value) && Boolean(ids.add(value));
  for (const f of candidate.families) {
    if (!id(f.id) || ![f.name,f.region,f.supplier].every(text) || !finite(f.createdAt,1,1e14) || !finite(f.expiresAt,f.createdAt,1e14) || typeof f.usageAlert !== 'boolean' || typeof f.billingReminder !== 'boolean' || !Array.isArray(f.models) || !f.models.length || f.models.length > 30) return false;
    if (f.sourceKey !== undefined && !text(f.sourceKey)) return false;
    for (const m of f.models) {
      if (!id(m.id) || !text(m.model) || !finite(m.purchased,1,1e13) || !finite(m.inputUsed,0,m.purchased) || !finite(m.outputUsed,0,m.purchased-m.inputUsed) || !finite(m.rate,0,1e6)) return false;
      if ('inputPurchased' in m && (!finite(m.inputPurchased,0,m.purchased) || !finite(m.outputPurchased,0,m.purchased) || m.inputPurchased+m.outputPurchased!==m.purchased || !finite(m.inputRate,0,1e6) || !finite(m.outputRate,0,1e6))) return false;
    }
  }
  for (const g of candidate.gpus) if (!id(g.id) || ![g.model,g.region,g.supplier].every(text) || !finite(g.quantity,1,1e5) || !Number.isInteger(g.quantity) || !finite(g.hours,1,87600) || !finite(g.initialHours,1,g.hours) || !finite(g.rate,0,1e6) || !finite(g.startsAt,1,1e14) || !finite(g.createdAt,1,1e14) || typeof g.renewalReminder !== 'boolean' || (g.sourceKey !== undefined && !text(g.sourceKey))) return false;
  for (const r of candidate.receipts) if (!id(r.id) || !text(r.description) || !text(r.allocationId) || !finite(r.amount,0,1e14) || !finite(r.date,1,1e14)) return false;
  return true;
}
function getState() {
  if (state) return state;
  try { const stored = globalThis.localStorage?.getItem(STORE); if (stored) { const parsed=JSON.parse(stored); if (validateCapacityState(parsed)) state=parsed; } } catch { storageAvailable=false; }
  state ||= seed();
  return state;
}
function save() {
  try { globalThis.localStorage?.setItem(STORE,JSON.stringify(getState())); } catch { storageAvailable=false; }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('opennext:capacity-change'));
}
export function calculateTokenFamily(family) {
  return family.models.reduce((a,m) => ({purchased:a.purchased+m.purchased,used:a.used+m.inputUsed+m.outputUsed,remaining:a.remaining+m.purchased-m.inputUsed-m.outputUsed,cost:a.cost+m.purchased/1e6*m.rate}),{purchased:0,used:0,remaining:0,cost:0});
}
export function calculateReservation(gpu, now=Date.now()) {
  const endsAt=gpu.startsAt+gpu.hours*HOUR;
  const elapsedHours=Math.min(gpu.hours,Math.max(0,(now-gpu.startsAt)/HOUR));
  return {endsAt,elapsedHours,remainingHours:Math.max(0,gpu.hours-elapsedHours),remainingGPUHours:Math.max(0,gpu.hours-elapsedHours)*gpu.quantity,status:now < gpu.startsAt?'Scheduled':now >= endsAt?'Expired':'Running'};
}
export function getCapacityLedgerRecords() {
  const s=getState();
  return [
    ...s.families.map(f => ({id:`INV-${f.id}`,allocationId:f.id,date:f.createdAt,description:`${f.name} token capacity`,amount:Math.round(calculateTokenFamily(f).cost*100)/100,kind:'tokens',direction:'debit',status:'Paid',supplier:f.supplier})),
    ...s.gpus.map(g => ({id:`INV-${g.id}`,allocationId:g.id,sourceKey:g.sourceKey,date:g.createdAt,description:`${g.quantity} × ${g.model} · ${g.initialHours} hours`,amount:Math.round(g.quantity*g.initialHours*g.rate*100)/100,kind:'gpu',direction:'debit',status:'Paid',supplier:g.supplier})),
    ...s.receipts.map(r => ({...r,kind:'renewal',direction:'debit',status:'Paid',supplier:s.gpus.find(g=>g.id===r.allocationId)?.supplier||'Demo supplier'})),
  ].sort((a,b)=>b.date-a.date);
}
export function getCapacitySummary(now=Date.now()) {
  const s=getState(); const sums=s.families.map(calculateTokenFamily);
  const active=s.gpus.filter(g=>calculateReservation(g,now).status==='Running');
  return {activeGPUs:active.reduce((n,g)=>n+g.quantity,0),activeReservations:active.length,totalReservations:s.gpus.length,
    tokenPurchased:sums.reduce((n,f)=>n+f.purchased,0),tokenUsed:sums.reduce((n,f)=>n+f.used,0),tokenRemaining:s.families.reduce((n,f)=>n+(f.expiresAt>now?calculateTokenFamily(f).remaining:0),0),
    gpuHoursRemaining:s.gpus.reduce((n,g)=>n+calculateReservation(g,now).remainingGPUHours,0),
    committedTotal:getCapacityLedgerRecords().reduce((n,r)=>n+r.amount,0),
    tokenCost:sums.reduce((n,f)=>n+f.cost,0),gpuCost:getCapacityLedgerRecords().filter(r=>r.kind!=='tokens').reduce((n,r)=>n+r.amount,0)};
}

export function addDemoAllocation(detail) {
  if (!detail || !['tokens','gpu'].includes(detail.kind)) return {ok:false,error:'Choose token capacity or a GPU reservation.'};
  const s=getState(); const now=Date.now();
  const model=clean(detail.model,detail.kind==='gpu'?'H100':'Model capacity');
  const supplier=clean(detail.supplier,'Demo supplier'); const region=clean(detail.region,'US East');
  const rate=Number(detail.rate); const quantity=Number(detail.quantity);
  if (!finite(rate,0,1e6) || !finite(quantity,1,detail.kind==='tokens'?1e13:1e5) || !Number.isInteger(quantity)) return {ok:false,error:'Enter a valid quantity and unit price.'};
  if (detail.kind==='tokens') {
    const sourceKey=detail.sourceKey ? clean(detail.sourceKey,'') : undefined;
    const existing=sourceKey && s.families.find(f=>f.sourceKey===sourceKey);
    if (existing) return {ok:true,id:existing.id,route:'tokens'};
    if (s.families.length>=80) return {ok:false,error:'The demo allocation limit has been reached.'};
    const days=detail.days===undefined?30:Number(detail.days);
    if (!finite(days,1,366)) return {ok:false,error:'Choose a token allocation term between 1 and 366 days.'};
    const allocation={id:'',model,purchased:quantity,inputUsed:0,outputUsed:0,rate};
    if (detail.inputTokens!==undefined || detail.outputTokens!==undefined) {
      const input=Number(detail.inputTokens),output=Number(detail.outputTokens),inputRate=Number(detail.inputRate),outputRate=Number(detail.outputRate);
      if (!finite(input,0,quantity) || !finite(output,0,quantity) || input+output!==quantity || !finite(inputRate,0,1e6) || !finite(outputRate,0,1e6)) return {ok:false,error:'The input/output allocation must match the purchased token total and include valid rates.'};
      Object.assign(allocation,{inputPurchased:input,outputPurchased:output,inputRate,outputRate,rate:(input*inputRate+output*outputRate)/quantity});
    }
    const id=newId('tok');allocation.id=`${id}-model`;
    s.families.unshift({id,...(sourceKey?{sourceKey}:{}),name:model,region,supplier,createdAt:now,expiresAt:now+days*DAY,usageAlert:true,billingReminder:true,models:[allocation]});
    save(); return {ok:true,id,route:'tokens'};
  }
  const sourceKey=detail.sourceKey ? clean(detail.sourceKey,'') : undefined;
  const existing=sourceKey && s.gpus.find(g=>g.sourceKey===sourceKey);
  if(existing) return {ok:true,id:existing.id,route:'my-gpus'};
  const hours=Number(detail.hours);
  if (!finite(hours,1,8760)) return {ok:false,error:'A GPU reservation needs a duration between 1 and 8,760 hours.'};
  if (s.gpus.length>=80) return {ok:false,error:'The demo reservation limit has been reached.'};
  const startsAt=detail.startAt===undefined?now:typeof detail.startAt==='number'?detail.startAt:Date.parse(detail.startAt);
  if (!finite(startsAt,now-366*DAY,now+366*DAY)) return {ok:false,error:'Choose a valid reservation start within one year.'};
  const id=newId('gpu');
  s.gpus.unshift({id,...(sourceKey?{sourceKey}:{}),model,quantity,region,supplier,rate,startsAt,hours,initialHours:hours,renewalReminder:true,createdAt:now});
  save(); return {ok:true,id,route:'my-gpus'};
}

export function quoteDemoRenewal(id, hours) {
  const gpu=getState().gpus.find(g=>g.id===id); const duration=Number(hours);
  if (!gpu || ![24,72,168].includes(duration)) return {ok:false,error:'Select a valid reservation and extension.'};
  if (calculateReservation(gpu).status==='Expired') return {ok:false,error:'This reservation has expired. Request new capacity from the marketplace.'};
  if (gpu.hours+duration>87600) return {ok:false,error:'This reservation has reached the demo duration limit.'};
  return {ok:true,id,hours:duration,quantity:gpu.quantity,model:gpu.model,rate:gpu.rate,amount:Math.round(gpu.quantity*duration*gpu.rate*100)/100,previousEnd:gpu.startsAt+gpu.hours*HOUR,nextEnd:gpu.startsAt+(gpu.hours+duration)*HOUR};
}
export function confirmDemoRenewal(quote) {
  if (!quote?.ok) return {ok:false,error:'Review a renewal quote first.'};
  const current=quoteDemoRenewal(quote.id,quote.hours);
  if (!current.ok) return current;
  if (current.previousEnd!==quote.previousEnd || current.amount!==quote.amount) return {ok:false,error:'This reservation changed. Request a fresh renewal quote.'};
  const s=getState(); const gpu=s.gpus.find(g=>g.id===quote.id);
  if (s.receipts.length>=500) return {ok:false,error:'The demo transaction limit has been reached.'};
  gpu.hours+=quote.hours;
  s.receipts.unshift({id:newId('INV-renewal'),allocationId:gpu.id,date:Date.now(),description:`${gpu.model} reservation · ${quote.hours}-hour extension`,amount:quote.amount});
  save();return {ok:true,id:gpu.id,nextEnd:current.nextEnd};
}

const action=(label,name,id='',className='cap-button')=>`<button type="button" class="${className}" data-capacity-action="${name}"${id?` data-capacity-id="${esc(id)}"`:''}>${label}</button>`;
const link=(label,route,primary=false)=>`<button type="button" class="cap-button${primary?' cap-button-dark':''}" data-route="${esc(route)}">${label} ${arrow}</button>`;
const badge=status=>`<span class="cap-status${status==='Running'?' is-running':''}"><i aria-hidden="true"></i>${esc(status)}</span>`;
const stat=(label,value,detail)=>`<div class="cap-stat"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`;
const notice=()=>storageAvailable?'':'<p class="cap-storage-note" role="status">Browser storage is unavailable. Changes will be kept for this visit only.</p>';
const toggle=(label,key,id,checked)=>`<label class="cap-toggle"><input type="checkbox" data-capacity-toggle="${key}" data-capacity-id="${esc(id)}"${checked?' checked':''}><span class="cap-toggle-track" aria-hidden="true"></span><span>${label}</span></label>`;
const head=(eyebrow,title,description,actions='')=>`<header class="cap-page-head"><div><p class="cap-eyebrow">${eyebrow}</p><h1>${title}</h1><p>${description}</p></div>${actions?`<div class="cap-actions">${actions}</div>`:''}</header>`;

function profilePage() {
  const s=getState();const summary=getCapacitySummary(); const running=s.gpus.filter(g=>calculateReservation(g).status==='Running');
  const expiring=s.gpus.filter(g=>{const c=calculateReservation(g);return c.status==='Running'&&c.remainingHours<24;});
  const activeTokens=s.families.filter(f=>f.expiresAt>Date.now());
  return `<section class="on-capacity" data-capacity-page="profile">${head('MY OPENNEXT / PROFILE','Your workspace, at a glance.','Keep an eye on capacity, usage and the next decision.',link('Browse capacity','gpus',true))}
    <div class="cap-identity"><span class="cap-avatar" aria-hidden="true">EW</span><div><strong>Example workspace</strong><span>Procurement team · Workspace owner</span></div><div class="cap-identity-meta"><span>member@example.com</span><button type="button" data-route="account">Manage account ${arrow}</button></div></div>
    <div class="cap-stats">${stat('Running GPUs',number(summary.activeGPUs),`${summary.activeReservations} active reservations`)}${stat('Available tokens',tokens(summary.tokenRemaining),`${activeTokens.length} unexpired capacity pools`)}${stat('Reserved time remaining',number(summary.gpuHoursRemaining)+'<small> GPU·hr</small>','Across running and scheduled reservations')}${stat('Capacity purchased',money(summary.committedTotal), 'Prepaid purchases, including renewals')}</div>
    <div class="cap-profile-grid"><section class="cap-block"><div class="cap-section-head"><div><p class="cap-eyebrow">COMPUTE</p><h2>Active reservations</h2></div><button type="button" class="cap-text-link" data-route="my-gpus">View all ${arrow}</button></div><div class="cap-running-list">${running.length?running.map(g=>{const c=calculateReservation(g);return `<article><div class="cap-hardware-mark" aria-hidden="true"><i></i><i></i><i></i></div><div><strong>${g.quantity} × ${esc(g.model)}</strong><span>${esc(g.region)} · ${esc(g.supplier)}</span></div><div>${badge('Running')}<small>${number(c.remainingHours)} hours remaining</small></div></article>`;}).join(''):'<p class="cap-empty">No running reservations. Browse the GPU market to source capacity.</p>'}</div></section>
    <section class="cap-block"><div class="cap-section-head"><div><p class="cap-eyebrow">UP NEXT</p><h2>Needs your attention</h2></div><span class="cap-counter">${expiring.length+1}</span></div><div class="cap-attention-list">${expiring.map(g=>`<article><span class="cap-attention-marker" aria-hidden="true">↗</span><div><strong>${esc(g.model)} term ends soon</strong><p>${g.quantity} GPUs · ${date(calculateReservation(g).endsAt)}</p>${action('Review renewal','renew',g.id,'cap-text-link')}</div></article>`).join('')}<article><span class="cap-attention-marker" aria-hidden="true">◷</span><div><strong>Keep procurement moving</strong><p>Review supplier replies and compare the terms before confirming an order.</p><button type="button" class="cap-text-link" data-route="rfq">Review my RFQs ${arrow}</button></div></article></div></section></div>
    <section class="cap-block"><div class="cap-section-head"><div><p class="cap-eyebrow">CONSUMPTION</p><h2>Your token capacity</h2></div><button type="button" class="cap-text-link" data-route="tokens">Manage tokens ${arrow}</button></div><div class="cap-token-overview">${s.families.slice(0,3).map(f=>{const t=calculateTokenFamily(f);const pct=Math.round(t.used/t.purchased*100);return `<article><div><strong>${esc(f.name)}</strong><span>${pct}% used</span></div><div class="cap-meter" role="meter" aria-label="${esc(f.name)} token usage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div><p>${tokens(t.remaining)} of ${tokens(t.purchased)} tokens remaining</p></article>`;}).join('')}</div></section>
    <section class="cap-block cap-purchases"><div class="cap-section-head"><div><p class="cap-eyebrow">ACTIVITY</p><h2>Recent capacity purchases</h2></div><button type="button" class="cap-text-link" data-route="billing">View billing ${arrow}</button></div><ol class="cap-activity">${getCapacityLedgerRecords().slice(0,4).map(r=>`<li><span class="cap-activity-dot" aria-hidden="true"></span><div><strong>${esc(r.description)}</strong><span>${date(r.date)} · Payment recorded</span></div><b>${money(r.amount)}</b></li>`).join('')}</ol></section>
${notice()}</section>`;
}

function tokensPage() {
 const s=getState();const summary=getCapacitySummary();
 return `<section class="on-capacity" data-capacity-page="tokens">${head('MY OPENNEXT / MY TOKENS','Capacity for every model.','Purchased token allocations, metered usage and renewal preferences.',link('Source model capacity','models',true))}
 <div class="cap-stats cap-stats-three">${stat('Purchased',tokens(summary.tokenPurchased),'Total tokens across all allocations')}${stat('Consumed',tokens(summary.tokenUsed),'Input and output tokens combined')}${stat('Available',tokens(summary.tokenRemaining),'Unused tokens in unexpired pools')}</div>
 <div class="cap-section-head cap-token-heading"><div><h2>Model allocations</h2><p>Expand a provider to inspect individual models and terms.</p></div><span class="cap-counter">${s.families.length} pools</span></div>
 <div class="cap-allocation-list">${s.families.map(f=>{const t=calculateTokenFamily(f);const expired=f.expiresAt<=Date.now(); const percent=Math.round(t.used/t.purchased*100);return `<details class="cap-allocation"${f.id==='tok-openai'?' open':''} data-capacity-family="${esc(f.id)}"><summary><span class="cap-family-mark" aria-hidden="true">${esc(f.name.slice(0,1))}</span><span class="cap-family-title"><strong>${esc(f.name)}</strong><small>${f.models.length} model${f.models.length===1?'':'s'} · ${esc(f.region)}${expired?' · Expired':''}</small></span><span class="cap-family-numbers"><strong>${tokens(t.remaining)}<small> / ${tokens(t.purchased)}</small></strong><span>${expired?'Unused at expiry':'tokens remaining'}</span></span><span class="cap-family-progress"><span>${percent}% used</span><span class="cap-meter"><span style="width:${percent}%"></span></span></span><span class="cap-chevron" aria-hidden="true">⌄</span></summary><div class="cap-allocation-content"><div class="cap-table-wrap" tabindex="0" aria-label="${esc(f.name)} model usage table"><table class="cap-table"><thead><tr><th scope="col">Model</th><th scope="col">Purchased</th><th scope="col">Used</th><th scope="col">Remaining</th><th scope="col">Avg. purchase price</th></tr></thead><tbody>${f.models.map(m=>`<tr><td><strong>${esc(m.model)}</strong><small>${tokens(m.inputUsed)} input / ${tokens(m.outputUsed)} output used</small>${m.inputPurchased!==undefined?`<small>Allocation: ${tokens(m.inputPurchased)} input / ${tokens(m.outputPurchased)} output</small>`:''}</td><td>${tokens(m.purchased)}</td><td>${tokens(m.inputUsed+m.outputUsed)}</td><td>${tokens(m.purchased-m.inputUsed-m.outputUsed)}</td><td>${money(m.rate)}<small>per 1M tokens</small>${m.inputPurchased!==undefined?`<small>${money(m.inputRate)} input / ${money(m.outputRate)} output</small>`:''}</td></tr>`).join('')}</tbody></table></div><div class="cap-allocation-terms"><div><span>Supplier</span><strong>${esc(f.supplier)}</strong></div><div><span>Allocation expires</span><strong>${date(f.expiresAt)}</strong></div><div><span>Weighted average</span><strong>${money(t.cost/(t.purchased/1e6))} / 1M tokens</strong></div><div><span>Capacity cost</span><strong>${money(t.cost)} prepaid</strong></div></div><div class="cap-preferences">${toggle('Usage alerts at 80% and 95%','usageAlert',f.id,f.usageAlert)}${toggle('Payment & expiry reminders','billingReminder',f.id,f.billingReminder)}<button type="button" class="cap-text-link" data-route="models">Add capacity ${arrow}</button></div><p class="cap-footnote">Average purchase price includes input and output allocations, weighted by token volume.</p></div></details>`;}).join('')}</div>${notice()}</section>`;
}

function matchesGPU(g) { const c=calculateReservation(g);return (filters.status==='all'||c.status.toLowerCase()===filters.status)&&`${g.model} ${g.region} ${g.supplier}`.toLowerCase().includes(filters.query.trim().toLowerCase()); }
function gpuRow(g) {
 const c=calculateReservation(g); const pct=Math.round(c.elapsedHours/g.hours*100);
 return `<tr${matchesGPU(g)?'':' hidden'} data-capacity-row="${esc(g.id)}" data-capacity-search="${esc(`${g.model} ${g.region} ${g.supplier}`.toLowerCase())}" data-capacity-status="${c.status.toLowerCase()}"><td><strong>${g.quantity} × ${esc(g.model)}</strong><small>${esc(g.region)} · ${esc(g.supplier)}</small><button type="button" class="cap-text-link" data-capacity-action="details" data-capacity-id="${esc(g.id)}">Reservation details ${arrow}</button></td><td>${badge(c.status)}<small>${c.status==='Scheduled'?'Starts '+date(g.startsAt):`${number(c.elapsedHours)} of ${number(g.hours)} hours elapsed`}</small></td><td><strong>${number(c.remainingHours)} hours</strong><small>${number(c.remainingGPUHours)} GPU·hr remaining</small><span class="cap-meter cap-table-meter"><span style="width:${pct}%"></span></span></td><td>${date(c.endsAt)}<small>${money(g.rate)} / GPU·hr</small></td><td>${toggle('Remind me','renewalReminder',g.id,g.renewalReminder)}<small>24 hours before expiry</small></td><td>${c.status==='Expired'?link('Source again','gpus'):action('Extend term','renew',g.id)}</td></tr>`;
}
function gpusPage() {
 const s=getState();const summary=getCapacitySummary();
 return `<section class="on-capacity" data-capacity-page="my-gpus">${head('MY OPENNEXT / MY GPUS','Your compute, accounted for.','Track reserved GPU time, operating status and upcoming term endings.',link('Source GPU capacity','gpus',true))}
 <div class="cap-stats cap-stats-three">${stat('Running now',number(summary.activeGPUs)+'<small> GPUs</small>',`${summary.activeReservations} active reservations`)}${stat('Reserved time remaining',number(summary.gpuHoursRemaining)+'<small> GPU·hr</small>','Includes scheduled reservations')}${stat('Reservations',number(s.gpus.length),'Running, scheduled and historical terms')}</div>
 <div class="cap-section-head"><div><h2>Purchased GPU hours</h2><p>Reserved time is billed continuously during the term, regardless of workload.</p></div></div><div class="cap-filter-bar"><label><span class="cap-visually-hidden">Search GPU reservations</span><input type="search" placeholder="Search model, supplier or region" data-capacity-search-input value="${esc(filters.query)}"></label><label><span class="cap-visually-hidden">Filter reservation status</span><select data-capacity-status-filter>${[['all','All statuses'],['running','Running'],['scheduled','Scheduled'],['expired','Expired']].map(([value,label])=>`<option value="${value}"${filters.status===value?' selected':''}>${label}</option>`).join('')}</select></label><span id="capReservationCount">${s.gpus.filter(matchesGPU).length} reservations</span></div>
 <div class="cap-table-wrap" tabindex="0" aria-label="GPU reservation table"><table class="cap-table cap-gpu-table"><thead><tr><th scope="col">Reservation</th><th scope="col">Status & runtime</th><th scope="col">Time remaining</th><th scope="col">Expires</th><th scope="col">Renewal reminders</th><th scope="col"><span class="cap-visually-hidden">Actions</span></th></tr></thead><tbody>${s.gpus.map(gpuRow).join('')}</tbody></table><p class="cap-empty" id="capNoReservations"${s.gpus.some(matchesGPU)?' hidden':''}>No reservations match this search. Try a different model, region or status.</p></div><p class="cap-footnote">GPU-hours = GPU count × reserved hours. Runtime tracks elapsed reservation time, not workload utilization.</p>${notice()}</section>`;
}
export function renderCapacityPage(section='profile') {
 currentSection=['profile','tokens','my-gpus'].includes(section)?section:'profile';
 return currentSection==='tokens'?tokensPage():currentSection==='my-gpus'?gpusPage():profilePage();
}
function refresh() {
 const current=document.querySelector('[data-capacity-page]'); if (!current) return;
 const open=[...current.querySelectorAll('details[open][data-capacity-family]')].map(d=>d.dataset.capacityFamily);
 current.outerHTML=renderCapacityPage(currentSection);
 document.querySelectorAll('[data-capacity-family]').forEach(d=>{d.open=open.includes(d.dataset.capacityFamily);});
 applyFilters();
}
function inform(text) { hooks.notify?.(text); }
function close() { pendingRenewal=null; hooks.closeDialog?.(); }
function dialog(title,body) { hooks.openDialog?.({title,body:`<div class="on-capacity cap-dialog">${body}</div>`}); }
function details(id) {
 const g=getState().gpus.find(item=>item.id===id);if(!g)return;const c=calculateReservation(g);
 dialog('GPU reservation',`<div class="cap-dialog-heading"><h3>${g.quantity} × ${esc(g.model)}</h3>${badge(c.status)}</div><dl class="cap-details"><div><dt>Reservation ID</dt><dd>${esc(g.id)}</dd></div><div><dt>Supplier / region</dt><dd>${esc(g.supplier)} / ${esc(g.region)}</dd></div><div><dt>Starts</dt><dd>${date(g.startsAt)}</dd></div><div><dt>Expires</dt><dd>${date(c.endsAt)}</dd></div><div><dt>Reserved duration</dt><dd>${number(g.hours)} continuous hours</dd></div><div><dt>Compute entitlement</dt><dd>${number(g.hours*g.quantity)} GPU·hr</dd></div><div><dt>Remaining time</dt><dd>${number(c.remainingHours)} hours / ${number(c.remainingGPUHours)} GPU·hr</dd></div><div><dt>Reservation rate</dt><dd>${money(g.rate)} per GPU·hr</dd></div><div><dt>Delivery</dt><dd>Supplier-managed cluster</dd></div></dl><p class="cap-footnote">Credentials and endpoints are issued by the supplier after acceptance. This demo does not provision a machine or expose real access credentials.</p><div class="cap-dialog-actions">${link('Contact supplier','messages')}${action('Close','close')}</div>`);
}
function renewal(id) {
 const g=getState().gpus.find(item=>item.id===id);if(!g)return;
 if(calculateReservation(g).status==='Expired'){inform('This reservation has expired. Source a new allocation from the GPU market.');return;}
 pendingRenewal=null;
 dialog('Extend your reservation',`<p class="cap-dialog-intro">Keep ${g.quantity} × ${esc(g.model)} in ${esc(g.region)} reserved for longer.</p><dl class="cap-details"><div><dt>Current end</dt><dd>${date(calculateReservation(g).endsAt)}</dd></div><div><dt>Indicative rate</dt><dd>${money(g.rate)} / GPU·hr</dd></div></dl><label class="cap-dialog-field" for="capRenewalHours">Additional continuous time<select id="capRenewalHours"><option value="24">24 hours · ${money(g.quantity*24*g.rate)}</option><option value="72">72 hours · ${money(g.quantity*72*g.rate)}</option><option value="168">7 days · ${money(g.quantity*168*g.rate)}</option></select></label><p class="cap-footnote">This is a simulated extension at the existing sample rate. A live renewal would require supplier availability and final terms. No payment will be collected.</p><div class="cap-dialog-actions">${action('Cancel','close')}${action('Review extension','review-renewal',g.id,'cap-button cap-button-dark')}</div>`);
}
function reviewRenewal(id) {
 const hours=Number(document.getElementById('capRenewalHours')?.value); const quote=quoteDemoRenewal(id,hours);
 if(!quote.ok){inform(quote.error);return;} pendingRenewal=quote;
 dialog('Review the extension',`<p class="cap-dialog-intro">${quote.quantity} × ${esc(quote.model)} · ${quote.hours} additional hours</p><dl class="cap-details"><div><dt>Additional entitlement</dt><dd>${number(quote.quantity*quote.hours)} GPU·hr</dd></div><div><dt>New expiration</dt><dd>${date(quote.nextEnd)}</dd></div><div><dt>Sample compute cost</dt><dd>${money(quote.amount)}</dd></div><div><dt>Amount charged now</dt><dd>$0.00 · demo only</dd></div></dl><p class="cap-footnote">Confirming updates your demo reservation and adds a sample paid record to Billing. No real charge or infrastructure change occurs. Additional fees and taxes are excluded from this illustration.</p><div class="cap-dialog-actions">${action('Cancel','close')}${action('Confirm demo extension','confirm-renewal',id,'cap-button cap-button-dark')}</div>`);
}
function applyFilters() {
 const rows=[...document.querySelectorAll('[data-capacity-row]')];let count=0;
 rows.forEach(row=>{const show=(filters.status==='all'||row.dataset.capacityStatus===filters.status)&&row.dataset.capacitySearch.includes(filters.query.toLowerCase().trim());row.hidden=!show;if(show)count++;});
 const counter=document.getElementById('capReservationCount');if(counter)counter.textContent=`${count} reservation${count===1?'':'s'}`;
 const empty=document.getElementById('capNoReservations');if(empty)empty.hidden=count>0;
}
export function initializeCapacity(options={}) {
 hooks={...hooks,...options};if(initialized)return;initialized=true;
 document.addEventListener('click',event=>{
   const button=event.target.closest('[data-capacity-action]');if(!button)return;
   event.preventDefault();event.stopImmediatePropagation();
   const {capacityAction:actionName,capacityId:id}=button.dataset;
   if(actionName==='details')details(id);
   else if(actionName==='renew')renewal(id);
   else if(actionName==='review-renewal')reviewRenewal(id);
   else if(actionName==='confirm-renewal'){
     if(!pendingRenewal||pendingRenewal.id!==id)return;
     const result=confirmDemoRenewal(pendingRenewal);pendingRenewal=null;
     if(result.ok){close();refresh();inform('Extension confirmed. Your reservation and billing records are updated.');}
     else inform(result.error);
   }else if(actionName==='close')close();
 },true);
 document.addEventListener('change',event=>{
   const toggle=event.target.closest('[data-capacity-toggle]');
   if(toggle){const key=toggle.dataset.capacityToggle;const allowed=['usageAlert','billingReminder','renewalReminder'];if(!allowed.includes(key))return;
     const s=getState();const item=(key==='renewalReminder'?s.gpus:s.families).find(v=>v.id===toggle.dataset.capacityId);if(!item)return;
     item[key]=toggle.checked;save();inform(`${key==='renewalReminder'?'Renewal reminders':key==='usageAlert'?'Usage alerts':'Payment and expiry reminders'} ${toggle.checked?'enabled':'disabled'}.`);
   }
   if(event.target.matches('[data-capacity-status-filter]')){filters.status=event.target.value;applyFilters();}
 });
 document.addEventListener('input',event=>{if(event.target.matches('[data-capacity-search-input]')){filters.query=event.target.value.slice(0,100);applyFilters();}});
 document.addEventListener('opennext:page-rendered',applyFilters);
 window.addEventListener('opennext:signout',()=>{pendingRenewal=null;filters={query:'',status:'all'};});
}
