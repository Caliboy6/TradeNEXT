import { state } from './demo-core.js?v=opennext-20260913-2';
import { demandTape } from './procurement-data.js?v=opennext-20260913-2';
import { renderCapacityPage, initializeCapacity, addDemoAllocation } from './opennext-capacity.js?v=opennext-20260913-2';
import { renderAccountPage, initializeAccount, closeAccountDialogs } from './opennext-account.js?v=opennext-20260913-2';
import { createWorkspaceStore } from './opennext-portal-state.js?v=opennext-20260913-2';

const sections=[['profile','Profile'],['tokens','My Tokens'],['my-gpus','My GPUs'],['supply','My Supplies'],['rfq','My RFQs'],['messages','Messages'],['billing','Billing'],['account','Account']];
const personal=new Set(sections.map(([id])=>id));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage=(()=>{try{return sessionStorage;}catch{return null;}})();
const records=createWorkspaceStore(storage);
let selectedThread='OpenNEXT Capacity Desk', context='', toastTimer, legacyRender, installed=false;
const go=route=>window.__openNextProcurementNavigate?.(route);
function notify(message) {
  const host=document.getElementById('toast-host');clearTimeout(toastTimer);
  host.innerHTML=`<div class="toast" role="status"><div class="toast-icon">✓</div><div><strong>${escape(message)}</strong><span>Demo workspace</span></div><button type="button" data-portal-action="close-toast" aria-label="Dismiss notification">×</button></div>`;
  toastTimer=setTimeout(()=>host.replaceChildren(),4500);
}
function closeDialog(){document.getElementById('modal-host').replaceChildren();document.body.classList.remove('overlay-open');}
function openDialog({title,body}) {
  closeAccountDialogs();
  document.getElementById('modal-host').innerHTML=`<div class="modal-backdrop" data-portal-action="close-dialog"><section class="modal on-portal-dialog" role="dialog" aria-modal="true" aria-label="${escape(title)}"><header class="modal-head"><h2>${escape(title)}</h2><button type="button" class="close-button" data-portal-action="close-dialog" aria-label="Close">×</button></header><div class="modal-body">${body}</div></section></div>`;
  document.body.classList.add('overlay-open');
}
function nav(route){return `<div class="on-personal-head"><span>MY OPENNEXT</span><span>Example workspace <i>·</i> Demo data</span></div><nav class="on-personal-nav" aria-label="My OpenNEXT sections">${sections.map(([id,label])=>`<button type="button" data-route="${id}" ${route===id?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`;}
function messagesPage(){
  const names=[...new Set(['OpenNEXT Capacity Desk','Meridian Compute','Aurora Authorized Channel',...Object.keys(records.threads)])];
  const thread=records.thread(selectedThread);
  return `<section class="on-messages"><header class="on-messages-title"><div><p class="eyebrow">MY OPENNEXT / MESSAGES</p><h1>Your conversations.</h1><p>Keep requirements, quotes and delivery updates with each counterparty.</p></div><span class="badge">Demo conversations</span></header><div class="on-message-workspace"><nav class="on-thread-list" aria-label="Conversations">${names.map(name=>`<button type="button" data-portal-action="thread" data-thread="${escape(name)}" ${selectedThread===name?'aria-current="true"':''}><span>${escape(name)}</span><small>${name==='OpenNEXT Capacity Desk'?'Procurement support':'Supplier conversation'}</small></button>`).join('')}</nav><div class="on-thread"><header><strong>${escape(selectedThread)}</strong><span>${context?escape(context):'Private procurement thread'}</span></header><div class="on-thread-log" role="log" aria-label="Conversation messages">${thread.map(message=>`<article class="on-message ${message.side==='me'?'is-mine':''}"><div><strong>${message.side==='me'?'You':escape(selectedThread)}</strong><span>${escape(message.time)}</span></div><p>${escape(message.text)}</p></article>`).join('')}</div><form id="portalMessageForm"><label for="portalMessage">Message</label><textarea id="portalMessage" name="message" rows="3" maxlength="2000" required placeholder="Ask about capacity, delivery or commercial terms…"></textarea><div><small>Messages stay in this demo. Nothing is sent to a supplier.</small><button class="primary-button" type="submit">Send demo message →</button></div></form></div></div></section>`;
}
function updateNavigation(route){
  document.querySelectorAll('.workspace-top-nav [data-nav]').forEach(item=>{const active=item.dataset.nav===(personal.has(route)?'profile':route);item.classList.toggle('is-active',active);active?item.setAttribute('aria-current','page'):item.removeAttribute('aria-current');});
}
function render(route){
  closeAccountDialogs();
  const main=document.getElementById('mainContent');
  state.route=route;
  if (personal.has(route)) {
    let content;
    if(['profile','tokens','my-gpus'].includes(route))content=renderCapacityPage(route);
    else if(['billing','account'].includes(route))content=renderAccountPage(route);
    else if(route==='messages')content=messagesPage();
    else {legacyRender(route);content=main.innerHTML;}
    main.innerHTML=`<div class="on-personal-workspace">${nav(route)}<div class="on-personal-content">${content}</div></div>`;
  } else {route=legacyRender(route);}
  updateNavigation(route);
  return route;
}
export function initializePortal(){
  if(installed)return;installed=true;
  legacyRender=window.__openNextProcurementRender;
  for(const record of [...records.rfqs].reverse())if(!demandTape.some(x=>x.id===record.id))demandTape.unshift(record);
  window.__openNextProcurementRender=render;
  // Existing stable navigation calls this render function and owns history.
  initializeCapacity({navigate:go,notify,openDialog,closeDialog});
  initializeAccount({navigate:go,notify});
  window.OpenNEXTAddAllocation=detail=>{ const result=addDemoAllocation(detail); if (!result.ok) { notify(result.error); return null; } return result; };
  window.OpenNEXTCreateRfq=form=>{
    if(!form)return null;
    const values=Object.fromEntries(new FormData(form));
    const record=records.createRfq(values);
    if(!record){let alert=form.querySelector('.on-rfq-error');if(!alert){alert=document.createElement('p');alert.className='on-rfq-error';alert.setAttribute('role','alert');form.prepend(alert);}alert.textContent='Enter a requirement, a valid positive budget in USD, and a delivery region.';return null;}
    demandTape.unshift(record);return record;
  };
  // Run before legacy document-capture actions that stop propagation.
  window.addEventListener('click',event=>{
    const flow=event.target.closest?.('[data-flow-action]');
    if(flow&&['messages','open-chat','account-profile','account-settings','account-menu'].includes(flow.dataset.flowAction)){
      event.preventDefault();event.stopImmediatePropagation();
      if(['messages','open-chat'].includes(flow.dataset.flowAction)){selectedThread=flow.dataset.supplier||'OpenNEXT Capacity Desk';context=flow.dataset.context||'';go('messages');}
      else go(flow.dataset.flowAction==='account-profile'?'profile':'account');
      return;
    }
    const action=event.target.closest?.('[data-portal-action]');if(!action)return;
    if(action.classList.contains('modal-backdrop')&&event.target!==action)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(action.dataset.portalAction==='close-dialog')closeDialog();
    if(action.dataset.portalAction==='close-toast')document.getElementById('toast-host').replaceChildren();
    if(action.dataset.portalAction==='thread'){selectedThread=action.dataset.thread;context='';render('messages');}
  },true);
  document.addEventListener('submit',event=>{
    if(event.target.id!=='portalMessageForm')return;
    event.preventDefault();event.stopImmediatePropagation();
    const input=event.target.querySelector('textarea');
    if(records.send(selectedThread,input.value)){render('messages');document.querySelector('#portalMessage')?.focus();}
  },true);
  window.addEventListener('opennext:signout',()=>{closeAccountDialogs();selectedThread='OpenNEXT Capacity Desk';context='';});
}
