import { state } from './demo-core.js?v=opennext-20260914-desk-1';
import { demandTape } from './procurement-data.js?v=opennext-20260914-desk-1';
import { renderCapacityPage, initializeCapacity, addDemoAllocation } from './opennext-capacity.js?v=opennext-20260915-marketplace-1';
import { renderAccountPage, initializeAccount, closeAccountDialogs } from './opennext-account.js?v=opennext-20260915-marketplace-1';
import { createWorkspaceStore } from './opennext-portal-state.js?v=opennext-20260914-desk-1';
import { renderOpenDesk, initializeOpenDesk } from './opennext-desk.js?v=opennext-20260914-desk-1';
import { createMarketplaceStore } from './opennext-marketplace-state.js?v=opennext-20260915-marketplace-2';
import { initializeMarketplace, renderMarketplacePage, openMarketplaceComposer } from './opennext-marketplace.js?v=opennext-20260915-marketplace-2';

const sections=[['opendesk','My OpenDesk'],['profile','Profile'],['tokens','My Tokens'],['my-gpus','My GPUs'],['supply','My Supplies'],['rfq','My RFQs'],['messages','Messages'],['billing','Billing'],['account','Account']];
const personal=new Set(sections.map(([id])=>id));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage=(()=>{try{return sessionStorage;}catch{return null;}})();
const records=createWorkspaceStore(storage);
const marketplace=createMarketplaceStore(storage);
let selectedThread='OpenNEXT Capacity Desk', context='', toastTimer, legacyRender, installed=false;
const go=route=>window.__openNextProcurementNavigate?.(route);
function notify(message) {
  const host=document.getElementById('toast-host');clearTimeout(toastTimer);
  host.innerHTML=`<div class="toast" role="status"><div class="toast-icon">✓</div><div><strong>${escape(message)}</strong></div><button type="button" data-portal-action="close-toast" aria-label="Dismiss notification">×</button></div>`;
  toastTimer=setTimeout(()=>host.replaceChildren(),4500);
}
function closeDialog(){document.getElementById('modal-host').replaceChildren();document.body.classList.remove('overlay-open');}
function openDialog({title,body}) {
  closeAccountDialogs();
  document.getElementById('modal-host').innerHTML=`<div class="modal-backdrop" data-portal-action="close-dialog"><section class="modal on-portal-dialog" role="dialog" aria-modal="true" aria-label="${escape(title)}"><header class="modal-head"><h2>${escape(title)}</h2><button type="button" class="close-button" data-portal-action="close-dialog" aria-label="Close">×</button></header><div class="modal-body">${body}</div></section></div>`;
  document.body.classList.add('overlay-open');
}
function messagesPage(){
  const names=[...new Set(['OpenNEXT Capacity Desk','Meridian Compute','Aurora Authorized Channel',...Object.keys(records.threads)])];
  const thread=records.thread(selectedThread);
  return `<section class="on-messages"><header class="on-messages-title"><div><p class="eyebrow">MY OPENNEXT / MESSAGES</p><h1>Your conversations.</h1><p>Keep requirements, quotes and delivery updates with each counterparty.</p></div></header><div class="on-message-workspace"><nav class="on-thread-list" aria-label="Conversations">${names.map(name=>`<button type="button" data-portal-action="thread" data-thread="${escape(name)}" ${selectedThread===name?'aria-current="true"':''}><span>${escape(name)}</span><small>${name==='OpenNEXT Capacity Desk'?'Procurement support':'Supplier conversation'}</small></button>`).join('')}</nav><div class="on-thread"><header><strong>${escape(selectedThread)}</strong><span>${context?escape(context):'Private procurement thread'}</span></header><div class="on-thread-log" role="log" aria-label="Conversation messages">${thread.map(message=>`<article class="on-message ${message.side==='me'?'is-mine':''}"><div><strong>${message.side==='me'?'You':escape(selectedThread)}</strong><span>${escape(message.time === 'Demo thread' ? 'Conversation opened' : message.time === 'Demo reply' ? 'Automated reply' : message.time)}</span></div><p>${escape(message.text)}</p></article>`).join('')}</div><form id="portalMessageForm"><label for="portalMessage">Message</label><textarea id="portalMessage" name="message" rows="3" maxlength="2000" required placeholder="Ask about capacity, delivery or commercial terms…"></textarea><div><button class="primary-button" type="submit">Send message →</button></div></form></div></div></section>`;
}
function updateNavigation(route){
  document.querySelectorAll('.workspace-header [data-route]').forEach(item=>{const active=item.dataset.route===route;item.classList.toggle('is-active',active);active?item.setAttribute('aria-current','page'):item.removeAttribute('aria-current');});
  const current=document.querySelector('[data-workspace-current-section]');
  if(current)current.textContent=sections.find(([id])=>id===route)?.[1]||({docs:'Documentation',scheduler:'Capacity Optimizer'}[route]||'Workspace');
  updateMarketplaceBadge();
}
function updateMarketplaceBadge(){
  const count=marketplace.notifications.filter(item=>!item.read).length;
  document.querySelectorAll('[data-marketplace-unread]').forEach(badge=>{badge.textContent=count>99?'99+':String(count);badge.hidden=count===0;});
  document.querySelectorAll('[data-marketplace-action="notifications"]').forEach(button=>button.setAttribute('aria-label',count?`Notifications, ${count} unread`:'Notifications'));
}
function render(route){
  // Catalog URLs remain valid bookmarks, but procurement now starts privately.
  if(['models','gpus','native','overview'].includes(route))route='rfq';
  if(route==='data')route='opendesk';
  closeAccountDialogs();
  const main=document.getElementById('mainContent');
  main.classList.toggle('is-opendesk',route==='opendesk');
  state.route=route;
  if (personal.has(route)) {
    let content;
    if(route==='opendesk')content=renderOpenDesk();
    else if(['profile','tokens','my-gpus'].includes(route))content=renderCapacityPage(route);
    else if(['billing','account'].includes(route))content=renderAccountPage(route);
    else if(route==='messages')content=messagesPage();
    else if(['supply','rfq'].includes(route))content=renderMarketplacePage(route);
    main.innerHTML=`<div class="on-personal-workspace"><div class="on-personal-content">${content}</div></div>`;
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
  initializeOpenDesk();
  initializeMarketplace({store:marketplace,navigate:go,notify,openDialog,closeDialog,onChange:updateMarketplaceBadge});
  window.OpenNEXTPostAgentRfq=brief=>{
    const sla=String(brief.requirements||'').match(/(?:SLA|uptime)\s*(?:of|:|>=|at least)?\s*(\d{2}(?:\.\d+)?)\s*%|(\d{2}(?:\.\d+)?)\s*%\s*(?:SLA|uptime)/i);
    const record=marketplace.createRfq({market:'gpu',model:brief.accelerator,gpuCount:brief.quantity,
      region:brief.region==='No region preference'?'Any region':brief.region,durationMonths:brief.months,monthlyBudget:brief.monthlyBudget,
      startDate:brief.startDate==='As soon as available'?new Date().toISOString().slice(0,10):brief.startDate,
      minSlaPercent:sla?Number(sla[1]||sla[2]):0,notes:brief.requirements});
    updateMarketplaceBadge();
    if(state.route==='rfq')render('rfq');
    return {record,matchCount:marketplace.getMatches('rfq',record.id).length};
  };
  window.addEventListener('opennext:reservation',event=>{
    const detail=event.detail;if(!detail?.id)return;
    const hours=Number(detail.months||1)*30*24;
    const quantity=Number(detail.quantity);
    const result=addDemoAllocation({kind:'gpu',sourceKey:detail.id,model:detail.accelerator||detail.gpu,
      quantity,region:detail.region,supplier:detail.supplier,hours,startAt:detail.startDate,
      rate:Number(detail.total??detail.totalPrice)/(quantity*hours)});
    if(!result.ok) notify('Your reservation is in OpenDesk. Portfolio sync needs review.');
  });
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
    const procurement=event.target.closest?.('[data-proc-action="post-rfq"]');
    if(procurement||(flow&&['add-supply-picker','add-supply'].includes(flow.dataset.flowAction))){
      event.preventDefault();event.stopImmediatePropagation();
      openMarketplaceComposer(procurement?'rfq':'supply');return;
    }
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
    if(action.dataset.portalAction==='about-preview')openDialog({title:'About this preview',body:'<p>Explore OpenNEXT with illustrative market listings and workspace records. Orders, payments, credentials and supplier messages are simulated.</p><p>Changes stay in this browser. No real accounts are connected or infrastructure provisioned.</p>'});
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
