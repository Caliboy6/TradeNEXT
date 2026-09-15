/* OpenNEXT GCI: a local, illustrative walkthrough of the supplied Index Factory. */
export const GCI_DURATION = 20000;
export const GCI_STAGES = Object.freeze([
  {name:'Collect', title:'Data collection & API monitoring', description:'Bring venue quotes into one traceable intake stream. Preserve the source, timestamp and inventory reference for each observation.', checkpoint:'14,206 quotes across 38 venues', note:'Quote intake', icon:'M3 4h14v4H3z M3 12h14v4H3z M6 6h1 M6 14h1'},
  {name:'Normalize', title:'Spec recognition & normalization', description:'Map equivalent naming to a common specification. Keep materially different memory, interconnect and rental terms in separate comparison groups.', checkpoint:'H100 SXM5 · 80GB HBM3 · IB 400G · on-demand', note:'Comparable specifications', icon:'M3 4h14 M3 10h14 M3 16h14 M7 2v4 M13 8v4 M9 14v4'},
  {name:'Dedupe', title:'Related-party & duplicate detection', description:'Two related sellers list the same 512-GPU block. Flag the duplicate listing so one inventory block cannot be counted twice.', checkpoint:'LOT 4182 · duplicate listing flagged', note:'Duplicate inventory alert', icon:'M3 3h10v10H3z M7 7h10v10H7z'},
  {name:'Surveil', title:'Anomaly & manipulation watch', description:'Check abnormal price moves and related-party signals. Route the duplicate alert to an evidence case and the human control desk.', checkpoint:'CASE-8814 · escalated for review', note:'Exception escalation', icon:'M2 15l4-5 4 2 4-8 4 3 M2 18h16'},
  {name:'Evidence', title:'Evidence & case management', description:'Reject the duplicate listing and preserve its evidence trail. Feed the resolved related-party case back to the shared SLM as a new institutional lesson.', checkpoint:'CASE-8814 rejected · shared memory +1 lesson', note:'Case resolution & learning', icon:'M4 2h8l4 4v12H4z M12 2v5h4 M7 11h6 M7 14h4'},
  {name:'Calculate', title:'Deterministic calculation engine', description:'Only accepted, normalized observations enter the calculation. The output stays linked to the input evidence and the approved methodology.', checkpoint:'Illustrative calculation output · $2.418 / GPU-hour', note:'Accepted observations only', icon:'M4 2h12v16H4z M7 5h6 M7 9h1 M12 9h1 M7 13h1 M12 13h1'},
  {name:'Review', title:'Dual human review', description:'The methodology reviewer checks the calculation and the compliance reviewer checks the release. Both sign-offs are required before publication.', checkpoint:'Methodology + Compliance · dual release approval', note:'Independent release checks', icon:'M2 10l3 3 6-7 M9 14l3 3 6-7'},
  {name:'Publish', title:'Publication & release package', description:'Publish the approved index value with its source coverage, resolved case and two reviewer sign-offs. Keep the release package connected to its evidence.', checkpoint:'Release package published · NVIDIA H100 SXM5', note:'Approved release', icon:'M4 8v10h12V8 M10 13V2 M6 6l4-4 4 4'}
]);

export function createGciState() { return {elapsed:0, playing:false, cadence:'1s'}; }
export function transitionGciState(state, action) {
  if (!state || !action) return createGciState();
  switch (action.type) {
    case 'play': return {...state, elapsed:state.elapsed >= GCI_DURATION ? 0 : state.elapsed, playing:true};
    case 'pause': return {...state, playing:false};
    case 'replay': return {...state, elapsed:0, playing:true};
    case 'select': return Number.isInteger(action.stage) && action.stage >= 0 && action.stage < GCI_STAGES.length ? {...state, elapsed:action.stage * 2500, playing:false} : state;
    case 'cadence': return ['1s','1h','24h'].includes(action.value) ? {...state, cadence:action.value} : state;
    case 'tick': {
      if (!state.playing || !Number.isFinite(action.delta) || action.delta < 0) return state;
      const elapsed = Math.min(GCI_DURATION, state.elapsed + action.delta);
      return {...state, elapsed, playing:elapsed < GCI_DURATION};
    }
    default: return state;
  }
}
export function getGciSnapshot(state) {
  const stage = Math.min(7, Math.floor(Math.max(0, state.elapsed) / 2500));
  const secondSigned = stage > 6 || (stage === 6 && state.elapsed % 2500 >= 1100);
  return {
    stage, progress:Math.min(1, state.elapsed / GCI_DURATION), complete:state.elapsed >= GCI_DURATION,
    duplicate:stage < 2 ? 'Pending' : stage < 4 ? 'Flagged' : 'Rejected',
    lessons:stage >= 4 ? 1285 : 1284,
    methodology:stage >= 6 ? 'Signed' : stage >= 3 && stage < 5 ? 'Escalated' : 'Standby',
    compliance:secondSigned ? 'Signed' : stage >= 3 && stage < 5 ? 'Escalated' : 'Standby',
    signoffs:stage < 6 ? 0 : secondSigned ? 2 : 1,
    value:stage >= 5 ? '$2.418' : '—', published:stage === 7
  };
}

const icon = (path) => `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path.split(' M').map((p,i)=>`<path d="${i ? 'M' : ''}${p}"/>`).join('')}</svg>`;
const number = (n) => String(n + 1).padStart(2,'0');
let renderCount = 0;

function architectureMarkup() {
  return `<div class="gci-architecture">
    <div class="gci-tier-label"><span>01</span> Orchestration <i>State, commands & shared memory</i></div>
    <div class="gci-orchestration">
      <article class="gci-master"><div class="gci-card-eyebrow">Master orchestrator <span class="gci-micro-tag">8 agents</span></div><h3>Index Generation Master Agent</h3><p>Issues commands, maintains state and verifies every result.</p><div class="gci-master-sequence" aria-hidden="true">${GCI_STAGES.map((s,i)=>`<span>${number(i)}</span>`).join('')}</div></article>
      <article class="gci-memory"><div class="gci-card-eyebrow">Institutional memory <span class="gci-memory-symbol" aria-hidden="true">↺</span></div><h3>Shared SLM</h3><p>Resolved cases become lessons for all eight agents.</p><div class="gci-memory-footer"><span><b>1,284</b> lessons</span><span>Evidence → memory</span></div></article>
    </div>
    <svg class="gci-command-bus" viewBox="0 0 1000 38" preserveAspectRatio="none" aria-hidden="true">${[125,375,625,875].map((x,i)=>{const d=`M500 0 V14 H${x} V38`;return `<path d="${d}"/><circle r="2.5" style="offset-path:path('${d}');animation-delay:-${i*.67}s"/>`;}).join('')}</svg>
    <div class="gci-tier-label"><span>02</span> Agent floor <i>Select a stage to follow its work</i></div>
    <div class="gci-agent-grid">${GCI_STAGES.map((s,i)=>`<button type="button" class="gci-agent-card" data-gci-stage="${i}" aria-label="Explore stage ${i+1}: ${s.name}"><span class="gci-agent-number">${number(i)} ${icon(s.icon)}</span><strong>${s.name}<span aria-hidden="true">↗</span></strong><small>${s.title}</small></button>`).join('')}</div>
    <div class="gci-tier-label gci-control-tier"><span>03</span> Evidence & human control <i>Exceptions, learning & release approval</i></div>
    <div class="gci-control-grid"><article class="gci-evidence-architecture"><h3>Evidence & Case Ledger</h3><p>Related-party and duplicate alerts retain an auditable case trail.</p><div class="gci-architecture-route"><span>Duplicate alert</span><b aria-hidden="true">→</b><span>Evidence</span><b aria-hidden="true">→</b><span>Human review</span></div></article><article class="gci-human-architecture"><h3>Human Control Desk</h3><p>Escalations are reviewed; every release requires two sign-offs.</p><div class="gci-review-pair"><span>Methodology <b aria-hidden="true">✓</b></span><span>Compliance <b aria-hidden="true">✓</b></span></div></article></div>
  </div>`;
}

function stageVisual(stage, snapshot) {
  if (stage === 0) return `<div class="gci-intake-visual"><div class="gci-quote-stack"><span>Venue 01 <b>Quote received</b></span><span>Venue 22 <b>Source retained</b></span><span>Venue 38 <b>Timestamp saved</b></span></div><div class="gci-intake-count"><strong>14,206</strong><span>quotes · 38 venues</span></div></div>`;
  if (stage === 1) return `<div class="gci-spec-grid">${[['Accelerator','H100 SXM5'],['Memory','80GB HBM3'],['Interconnect','IB 400G'],['Rental basis','On-demand']].map(([k,v])=>`<span><small>${k}</small><strong>${v}</strong></span>`).join('')}</div>`;
  if (stage === 2 || stage === 3) return `<div class="gci-duplicate-visual"><div class="gci-duplicate-lot"><span>Seller A</span><strong>LOT 4182</strong><small>512 × H100 SXM5</small></div><div class="gci-duplicate-mark" aria-hidden="true">=</div><div class="gci-duplicate-lot"><span>Related seller B</span><strong>LOT 4182</strong><small>Same inventory block</small></div><p>${stage === 2 ? 'Duplicate listing detected' : 'Alert routed to CASE-8814'}<span>One block. One eligible observation.</span></p></div>`;
  if (stage === 4) return `<div class="gci-learning-visual"><span class="gci-case-stamp">CASE-8814 · Rejected</span><div><span>Resolved evidence</span><b aria-hidden="true">→</b><span>Shared SLM</span></div><strong>1,284 <i aria-hidden="true">→</i> 1,285</strong><small>Related-party lesson added · 8 agents subscribed</small></div>`;
  if (stage === 5) return `<div class="gci-calc-visual"><span>Accepted, normalized observations</span><div aria-hidden="true">Σ w · p <i>→</i> index output</div><strong>$2.418 <small>/ GPU-hour</small></strong><small>Illustrative methodology cue: Laspeyres</small></div>`;
  if (stage === 6) return `<div class="gci-signoff-visual">${[['Reviewer A','Methodology',snapshot.methodology],['Reviewer B','Compliance',snapshot.compliance]].map(([reviewer,role,status])=>`<div><span>${reviewer}</span><strong>${role}</strong><b class="${status==='Signed'?'is-signed':''}">${status==='Signed'?'✓ Signed':'Awaiting sign-off'}</b></div>`).join('')}</div>`;
  return `<div class="gci-release-visual"><span>Release package · Published</span><h4>NVIDIA H100 SXM5</h4><div><strong>$2.418</strong><small>/ GPU-hour</small><b>+0.42%</b></div><p>80GB HBM3 · IB 400G · on-demand</p></div>`;
}

function detailMarkup(state) {
  const snap = getGciSnapshot(state), stage = GCI_STAGES[snap.stage];
  return `<span class="gci-card-eyebrow">${number(snap.stage)} / 08 <span>${stage.note}</span></span><h3>${stage.name}</h3><p class="gci-stage-description">${stage.description}</p><div class="gci-stage-visual">${stageVisual(snap.stage,snap)}</div><p class="gci-checkpoint">${icon('M3 10l4 4 10-10')}<span>${stage.checkpoint}</span></p>`;
}

function evidenceMarkup(state) {
  const snap = getGciSnapshot(state);
  return `<div class="gci-mini-heading"><h4>Evidence ledger</h4><span>3 cases</span></div><div class="gci-case-list"><div><span><b>CASE-8814</b><small>Duplicate listing · related party</small></span><em class="${snap.duplicate==='Rejected'?'is-rejected':snap.duplicate==='Flagged'?'is-flagged':''}">${snap.duplicate}</em></div><div><span><b>CASE-8813</b><small>Stale quote · venue 22</small></span><em>Cleared</em></div><div><span><b>CASE-8811</b><small>Spec mismatch · HBM3e</small></span><em>Cleared</em></div></div><div class="gci-mini-heading gci-review-heading"><h4>Human control</h4><span>${snap.signoffs} / 2 signed</span></div><div class="gci-review-status"><span>Methodology <b class="${snap.methodology==='Signed'?'is-signed':''}">${snap.methodology}</b></span><span>Compliance <b class="${snap.compliance==='Signed'?'is-signed':''}">${snap.compliance}</b></span></div><div class="gci-lesson-counter"><span>Shared SLM</span><strong>${snap.lessons.toLocaleString('en-US')} <small>lessons</small></strong>${snap.lessons>1284?'<b>+1</b>':''}</div>`;
}

function workflowMarkup(prefix) {
  const initial = createGciState();
  return `<div class="gci-workflow-toolbar"><div><span class="gci-walkthrough-label">One release, end to end</span><span class="gci-elapsed" data-gci-time>00:00 / 00:20</span></div><div class="gci-play-controls"><button type="button" data-gci-action="play" aria-label="Play workflow">Play <span aria-hidden="true">▷</span></button><button type="button" data-gci-action="replay" aria-label="Replay workflow from the beginning">Replay <span aria-hidden="true">↺</span></button></div></div><div class="gci-progress-track" role="progressbar" aria-label="Workflow progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><div class="gci-workflow-grid"><div class="gci-stage-nav" role="group" aria-label="Workflow stages">${GCI_STAGES.map((s,i)=>`<button type="button" data-gci-stage="${i}" aria-controls="${prefix}-detail" ${i===0?'aria-current="step"':''}><span>${number(i)}</span>${s.name}<b aria-hidden="true">${i===0?'→':''}</b></button>`).join('')}</div><article class="gci-stage-detail" id="${prefix}-detail" data-gci-detail>${detailMarkup(initial)}</article><aside class="gci-workflow-evidence" data-gci-evidence aria-label="Evidence and release controls">${evidenceMarkup(initial)}</aside></div><div class="gci-output-strip"><div><span>Index output</span><strong data-gci-output>—</strong><small>/ GPU-hour</small></div><div><strong>14,206</strong><span>quotes</span></div><div><strong>38</strong><span>venues</span></div><div><strong data-gci-rejected>0</strong><span>cases rejected</span></div><div><strong data-gci-signoffs>0 / 2</strong><span>sign-offs</span></div></div><span class="gci-sr-only" data-gci-announcement aria-live="polite"></span>`;
}

export function renderGciFactory() {
  const prefix = `gci-${++renderCount}`;
  return `<div class="gci-factory" data-gci-tab="architecture" data-gci-motion="paused"><div class="gci-factory-bar"><div class="gci-tabs" role="tablist" aria-label="Index Factory views"><button type="button" role="tab" id="${prefix}-tab-architecture" aria-controls="${prefix}-architecture" aria-selected="true" data-gci-tab="architecture">System Architecture</button><button type="button" role="tab" id="${prefix}-tab-workflow" aria-controls="${prefix}-workflow" aria-selected="false" tabindex="-1" data-gci-tab="workflow">End-to-End Workflow</button></div><label class="gci-cadence">Release cadence <select data-gci-cadence aria-label="Illustrative release cadence"><option value="1s">1 second</option><option value="1h">1 hour</option><option value="24h">24 hours</option></select></label></div><div id="${prefix}-architecture" role="tabpanel" aria-labelledby="${prefix}-tab-architecture" tabindex="0" data-gci-panel="architecture">${architectureMarkup()}</div><div id="${prefix}-workflow" role="tabpanel" aria-labelledby="${prefix}-tab-workflow" tabindex="0" data-gci-panel="workflow" hidden>${workflowMarkup(prefix)}</div><div class="gci-factory-caption"><span>Illustrative scenario · NVIDIA H100 SXM5 · on-demand</span><button type="button" data-gci-action="motion" aria-pressed="false">Pause motion</button><span data-gci-cadence-caption>Release family: 1 second</span></div></div>`;
}

const activeWidgets = new Map();
function mountWidget(element) {
  if (activeWidgets.has(element)) return;
  const doc = element.ownerDocument, win = doc?.defaultView;
  if (!win || !element.addEventListener) return;
  let state = createGciState(), tab = 'architecture', visible = true, manuallyPaused = false, disposed = false;
  let timer = null, previousTime = 0, lastCheckpoint = '', observer;
  const reduced = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reducedMotion = !!reduced?.matches;
  const q = (selector) => element.querySelector(selector);
  const all = (selector) => [...element.querySelectorAll(selector)];
  const setText = (selector, value) => { const el = q(selector); if (el) el.textContent = value; };
  function redraw(force = false) {
    const snap = getGciSnapshot(state), checkpoint = `${snap.stage}:${snap.signoffs}`;
    if (force || checkpoint !== lastCheckpoint) {
      q('[data-gci-detail]').innerHTML = detailMarkup(state);
      q('[data-gci-evidence]').innerHTML = evidenceMarkup(state);
      all('.gci-stage-nav [data-gci-stage]').forEach((button,i)=>{
        if (i===snap.stage) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current');
        button.classList.toggle('is-complete',i<snap.stage);
        button.querySelector('b').textContent=i<snap.stage?'✓':i===snap.stage?'→':'';
      });
      setText('[data-gci-output]',snap.value);
      setText('[data-gci-rejected]',snap.duplicate==='Rejected'?'1':'0');
      setText('[data-gci-signoffs]',`${snap.signoffs} / 2`);
      if (tab==='workflow') setText('[data-gci-announcement]',`Stage ${snap.stage+1}: ${GCI_STAGES[snap.stage].name}. ${GCI_STAGES[snap.stage].checkpoint}`);
      lastCheckpoint=checkpoint;
    }
    setText('[data-gci-time]',`00:${String(Math.floor(state.elapsed/1000)).padStart(2,'0')} / 00:20`);
    const progress=q('.gci-progress-track');
    progress.setAttribute('aria-valuenow',String(Math.round(snap.progress*100)));
    progress.querySelector('span').style.width=`${snap.progress*100}%`;
    const play=q('[data-gci-action="play"]');
    play.textContent=state.playing?'Pause Ⅱ':snap.complete?'Play again ▷':'Play ▷';
    play.setAttribute('aria-label',state.playing?'Pause workflow':snap.complete?'Play workflow again':'Play workflow');
    const cadenceLabel={'1s':'1 second','1h':'1 hour','24h':'24 hours'}[state.cadence];
    setText('[data-gci-cadence-caption]',`Release family: ${cadenceLabel}`);
  }
  function syncMotion() {
    const allowed=visible && !doc.hidden && !manuallyPaused && !reducedMotion;
    element.dataset.gciMotion=allowed && (tab==='architecture' || state.playing)?'running':'paused';
    const motionButton=q('[data-gci-action="motion"]');
    motionButton.textContent=manuallyPaused || reducedMotion?'Enable motion':'Pause motion';
    motionButton.setAttribute('aria-pressed',String(manuallyPaused || reducedMotion));
    if (timer!==null) { win.clearInterval(timer); timer=null; }
    if (!disposed && visible && !doc.hidden && tab==='workflow' && state.playing && !manuallyPaused) {
      previousTime=win.performance.now();
      timer=win.setInterval(()=>{
        const now=win.performance.now();
        state=transitionGciState(state,{type:'tick',delta:Math.min(300,now-previousTime)});
        previousTime=now; redraw();
        if (!state.playing) syncMotion();
      },100);
    }
  }
  function setTab(next, focus=false) {
    if (!['architecture','workflow'].includes(next)) return;
    tab=next; element.dataset.gciTab=next;
    all('[role="tab"]').forEach(button=>{
      const selected=button.dataset.gciTab===next;
      button.setAttribute('aria-selected',String(selected)); button.tabIndex=selected?0:-1;
      if (selected && focus) button.focus();
    });
    all('[data-gci-panel]').forEach(panel=>{ panel.hidden=panel.dataset.gciPanel!==next; });
    if (next==='architecture') state=transitionGciState(state,{type:'pause'});
    redraw();syncMotion();
  }
  function click(event) {
    const button=event.target.closest?.('button');
    if (!button || !element.contains(button)) return;
    if (button.dataset.gciTab) { setTab(button.dataset.gciTab);return; }
    if (button.dataset.gciStage!==undefined) {
      const fromArchitecture=tab==='architecture';
      state=transitionGciState(state,{type:'select',stage:Number(button.dataset.gciStage)});
      setTab('workflow'); redraw(true);
      if(fromArchitecture)q(`.gci-stage-nav [data-gci-stage="${getGciSnapshot(state).stage}"]`)?.focus();
      return;
    }
    const action=button.dataset.gciAction;
    if (action==='motion') {
      if (reducedMotion) { reducedMotion=false;manuallyPaused=false; }
      else manuallyPaused=!manuallyPaused;
    } else if (action==='play' || action==='replay') {
      if (!state.playing || action==='replay') manuallyPaused=false;
      state=transitionGciState(state,{type:action==='replay'?'replay':state.playing?'pause':'play'});
    }
    redraw();syncMotion();
  }
  function keydown(event) {
    if (event.target.getAttribute?.('role')!=='tab') return;
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    setTab(event.key==='Home'?'architecture':event.key==='End'?'workflow':tab==='architecture'?'workflow':'architecture',true);
  }
  function change(event) {
    if (!event.target.matches?.('[data-gci-cadence]')) return;
    state=transitionGciState(state,{type:'cadence',value:event.target.value});redraw();
  }
  function preference(event) { reducedMotion=event.matches; if (reducedMotion) state=transitionGciState(state,{type:'pause'});redraw();syncMotion(); }
  element.addEventListener('click',click); element.addEventListener('keydown',keydown); element.addEventListener('change',change);
  doc.addEventListener('visibilitychange',syncMotion); reduced?.addEventListener?.('change',preference);
  if (win.IntersectionObserver) {
    visible=false;
    observer=new win.IntersectionObserver(entries=>{ visible=entries.some(entry=>entry.isIntersecting);syncMotion(); },{threshold:.05});
    observer.observe(element);
  }
  const dispose=()=>{
    disposed=true;if(timer!==null)win.clearInterval(timer);observer?.disconnect();
    element.removeEventListener('click',click);element.removeEventListener('keydown',keydown);element.removeEventListener('change',change);
    doc.removeEventListener('visibilitychange',syncMotion);reduced?.removeEventListener?.('change',preference);
    element.dataset.gciMotion='paused';activeWidgets.delete(element);
  };
  activeWidgets.set(element,dispose);redraw();syncMotion();
}
export function initializeGciFactory(root = globalThis.document) {
  if (!root?.querySelectorAll) return;
  for (const [element,dispose] of activeWidgets) if (!element.isConnected) dispose();
  if (root.matches?.('.gci-factory')) mountWidget(root);
  root.querySelectorAll('.gci-factory').forEach(mountWidget);
}
export function disposeGciFactory() { for (const dispose of [...activeWidgets.values()]) dispose(); }
