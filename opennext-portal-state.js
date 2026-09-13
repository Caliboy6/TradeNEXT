// Tab-scoped, synthetic workspace records. No backend requests or credentials.
const STORE = 'opennext.workspace-records.v1';
const clean = (value, max = 300) => String(value ?? '').trim().slice(0, max);
export function createWorkspaceStore(storage) {
  let data = { rfqs: [], threads: {} };
  try {
    const saved = JSON.parse(storage?.getItem(STORE) || 'null');
    if (saved && Array.isArray(saved.rfqs) && saved.threads && typeof saved.threads === 'object') {
      data.rfqs = saved.rfqs.filter(x => /^RFQ-D\d+$/.test(x.id) && typeof x.model === 'string' && typeof x.notional === 'string').slice(0,100);
      for (const [name, messages] of Object.entries(saved.threads).slice(0,30)) {
        if (!Array.isArray(messages) || ['__proto__','constructor','prototype'].includes(name)) continue;
        data.threads[name] = messages.filter(x => x && typeof x.text === 'string' && ['me','them'].includes(x.side)).slice(-100).map(x => ({side:x.side,text:clean(x.text,2000),time:clean(x.time,40)}));
      }
    }
  } catch { /* Keep the demo available when storage is blocked or invalid. */ }
  const save = () => { try { storage?.setItem(STORE,JSON.stringify(data)); } catch {} };
  return {
    get rfqs() { return data.rfqs; },
    get threads() { return data.threads; },
    createRfq(values) {
      const model=clean(values.product), amount=clean(values.amount).replace(/[$,\s]/g,'');
      const numeric=Number(amount), region=clean(values.region,60);
      if (!model || !region || !Number.isFinite(numeric) || numeric <= 0 || numeric > 1e9) return null;
      const type=clean(values.type,30); const term=values.term==='custom'?'Custom term':values.term==='90d'?'90 days':'30 days';
      const record={id:`RFQ-D${Date.now()}${data.rfqs.length}`, type: type==='gpu'?'GPU Cluster':type==='private_otc'?'Private OTC':'Native Model',model,notional:new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(numeric),term,throughput:clean(values.quantity||values.tps||values.network||'To be agreed',80),region,provenance:type==='private_otc'?'Authorization unconfirmed':'Evidence required',responses:0,age:'Just now',status:'Supplier matching',notes:clean(values.notes,2000),createdAt:new Date().toISOString()};
      data.rfqs.unshift(record); data.rfqs=data.rfqs.slice(0,100);save();return record;
    },
    thread(name) {
      const key=clean(name,100)||'OpenNEXT Capacity Desk';
      if (['__proto__','constructor','prototype'].includes(key)) return [];
      if (!Object.hasOwn(data.threads,key)) data.threads[key]=[{side:'them',time:'Conversation opened',text:'Welcome to your private procurement conversation. Confirm capacity, delivery terms and quote details here.'}];
      return data.threads[key];
    },
    send(name,text) {
      const message=clean(text,2000);if(!message)return false;
      const thread=this.thread(name);thread.push({side:'me',time:'Just now',text:message},{side:'them',time:'Automated reply',text:'Your message has been saved. Review availability, delivery and commercial terms before confirming a purchase.'});
      if(thread.length>100)thread.splice(0,thread.length-100);save();return true;
    }
  };
}
