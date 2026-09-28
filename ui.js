/* Shared interface pieces: one behaviour for every popup, a card picker instead of dropdowns, the resource bar,
 * and the Home desk. Loaded after game.js and act3.js. */

/* ---------- Popups ---------- */
/** Every .decision-modal gets the same behaviour: a close button, Escape, backdrop click and focus handling.
 * Closing uses the popup's own close button when it has one, so its logic (such as saving) still runs; a popup
 * without one, like an ending, is a choice the player must make. */
function enhanceModal(modal){
 if(modal.dataset.enhanced)return;modal.dataset.enhanced="1";
 const box=modal.querySelector(".decision-box");if(!box)return;
 modal.setAttribute("role",modal.getAttribute("role")||"dialog");modal.setAttribute("aria-modal","true");
 const heading=box.querySelector("h2");if(heading){heading.id||=`modal-title-${Date.now()}`;modal.setAttribute("aria-labelledby",heading.id);}
 const own=box.querySelector(".modal-close");const close=()=>own?own.click():null;
 if(own){const x=document.createElement("button");x.type="button";x.className="modal-x";x.setAttribute("aria-label","Close");x.textContent="✕";x.onclick=close;box.prepend(x);}
 modal.addEventListener("click",e=>{if(e.target===modal)close();});
 modal.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.preventDefault();close();}
  if(e.key==="Tab"){const f=[...box.querySelectorAll("button:not(:disabled),input,select,a[href]")];if(!f.length)return;const first=f[0],last=f[f.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 const opener=document.activeElement;
 new MutationObserver((_,obs)=>{if(!modal.isConnected){obs.disconnect();if(opener&&opener.isConnected)opener.focus();}}).observe(document.body,{childList:true});
 (box.querySelector("input:not([type=radio]),.choice,.picker-option,button:not(.modal-x)")||box).focus?.();
}
if(typeof MutationObserver!=="undefined"&&typeof document!=="undefined"&&document.body){
 new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.classList?.contains("decision-modal"))enhanceModal(n);}).observe(document.body,{childList:true});
}

/* ---------- Picker ---------- */
/** A searchable grid of cards: the replacement for every dropdown. */
function openPicker({title,kicker="CHOOSE",intro="",options,current,onPick,search=options.length>8}){
 const modal=document.createElement("div");modal.className="decision-modal picker-modal";
 const card=o=>`<button type="button" class="picker-option ${o.value===current?"selected":""}" data-value="${safe(o.value)}" ${o.disabled?"disabled":""} data-search="${safe((o.label+" "+(o.meta||"")).toLowerCase())}"><strong>${safe(o.label)}</strong>${o.meta?`<small>${safe(o.meta)}</small>`:""}${o.detail?`<span>${safe(o.detail)}</span>`:""}${o.value===current?`<em>Current</em>`:""}</button>`;
 modal.innerHTML=`<div class="decision-box picker-box"><small>${safe(kicker)}</small><h2>${safe(title)}</h2>${intro?`<p>${safe(intro)}</p>`:""}${search?`<input class="picker-search" type="search" placeholder="Search…" aria-label="Search options" />`:""}<div class="picker-grid">${options.map(card).join("")}</div><button type="button" class="modal-close">Cancel</button></div>`;
 document.body.appendChild(modal);
 modal.querySelector(".modal-close").onclick=()=>modal.remove();
 modal.querySelectorAll(".picker-option").forEach(b=>b.onclick=()=>{modal.remove();onPick(b.dataset.value);});
 const input=modal.querySelector(".picker-search");
 if(input){input.oninput=()=>{const q=input.value.trim().toLowerCase();modal.querySelectorAll(".picker-option").forEach(b=>b.hidden=!!q&&!b.dataset.search.includes(q));};input.focus();}
 return modal;
}
/** The pickers the game offers, keyed by what they choose. Each returns picker options from the current state. */
const PICKERS={
 state:{title:"Choose a state or union territory",options:()=>Object.entries(SEAT_COUNTS).sort((a,b)=>b[1]-a[1]).map(([n,seats])=>{const p=state.org.presence[n]||0,t=presenceTier(p);return {value:n,label:n,meta:`${seats} Lok Sabha seat${seats===1?"":"s"} · presence ${p}/100 · ${t[1]}`};})},
 segment:{title:"Choose the audience",options:()=>GameEngine.api().demographicsView(state.world).map(g=>({value:g.key,label:SEGMENT_LABELS[g.key],meta:`${Math.round(g.weight*100)}% of voters · opinion ${g.value}/100`}))},
 bloc:{title:"Choose a partner",options:()=>FOREIGN_BLOCS.map(b=>({value:b.id,label:b.label,meta:`Relations ${state.foreignRelations[b.id]}/100`}))},
 rti:{title:"Choose what to ask for",options:()=>RTI_TOPICS.map(t=>({value:t.id,label:t.title,meta:t.office,detail:t.question,disabled:state.rtiRequests.some(r=>r.topic===t.id&&["filed","appealed"].includes(r.status))}))}
};
const PICK_LABELS={targetState:v=>`${v} · ${SEAT_COUNTS[v]} seats`,targetSegment:v=>SEGMENT_LABELS[v],targetBloc:v=>FOREIGN_BLOCS.find(b=>b.id===v)?.label,rtiTopic:v=>RTI_TOPICS.find(t=>t.id===v)?.title};
/** A button that shows the current choice and opens its picker. */
function pickerButton(kind,key,label){ensureState();const value=state[key];return `<span class="picker-field"><small>${safe(label)}</small><button type="button" class="picker-btn" data-pick="${kind}" data-key="${key}">${safe(PICK_LABELS[key]?.(value)??value??"Choose")}<b aria-hidden="true">▾</b></button></span>`;}
function pickAction(kind,key){const def=PICKERS[kind];if(!def)throw Error("Unknown choice.");openPicker({title:def.title,options:def.options(),current:state[key],onPick:v=>{state[key]=v;save();renderPage();}});}

/* ---------- Segmented choices (small number ranges) ---------- */
function segmented(key,label,values,suffix=""){const current=key.split(".").reduce((o,k)=>o?.[k],state);return `<div class="segmented" role="group" aria-label="${safe(label)}"><small>${safe(label)}</small><div>${values.map(v=>`<button type="button" data-set="${key}" data-value="${v}" aria-pressed="${current===v}" class="${current===v?"on":""}">${v}${suffix}</button>`).join("")}</div></div>`;}
function setAction(key,value){const parts=key.split("."),last=parts.pop(),target=parts.reduce((o,k)=>o[k],state);target[last]=Number(value);save();renderPage();}

/* ---------- Resource bar ---------- */
/** The only numbers every desk needs, all of them real. Warnings turn red. */
function hudHTML(){if(!state.player)return "";const o=state.org,p=state.player,act2=state.date>timelineCutoff();
 const item=(label,value,{bar,warn,title}={})=>`<div class="hud-item ${warn?"warn":""}" title="${safe(title||label)}"><small>${label}</small><strong>${value}</strong>${bar!==undefined?`<i style="--v:${Math.max(0,Math.min(100,bar))}%"></i>`:""}</div>`;
 return [item("Funds","₹"+money(o.funds),{warn:o.funds<monthlyCosts(),title:`Monthly costs ₹${money(monthlyCosts())}`}),item("Volunteers",o.volunteers.toLocaleString("en-IN")),item("Support",state.support+"%",{bar:state.support}),item("Credibility",o.credibility,{bar:o.credibility}),item("Energy",Math.round(p.energy),{bar:p.energy,warn:p.energy<25}),
  item("Legal pressure",o.legal,{bar:o.legal,warn:o.legal>=40,title:"At 100 you are arrested"}),state.date>="2026-05-20"?item("Outrage",Math.round(state.outrage||0),{bar:state.outrage,warn:state.outrage>=85}):"",act2&&state.phase==="government"?item("Pride index",prideIndex(),{bar:prideIndex()}):""].join("");}
function renderHud(){const el=document.querySelector("#hud");if(el)el.innerHTML=hudHTML();}

/* ---------- Home: the desk ---------- */
/** What needs the player now comes first; everything else lives on its own desk. */
function deskHTML(){ensureState();const custom=!(state.historicalRoleplay&&state.flags.firstResponse);
 return `<section class="page command-page desk"><div class="command-title"><div><span>${safe(state.org.name)} · ${safe(state.phase)}</span><h1>Command desk</h1></div><p>${safe(state.player.name)} · ${safe(state.player.state||"India")}</p></div>${historyAlertHTML()}<div class="desk-grid"><div class="desk-main">${custom?commandDispatchHTML():careerDispatchHTML()}${injusticeFeedHTML()}${jantarHTML()}</div><aside class="desk-side">${keyActionsHTML()}${teamMiniHTML()}</aside></div></section>`;}
function keyActionsHTML(){const btn=(act,icon,title,detail,extra="")=>`<button class="action-btn" data-act="${act}" ${extra}><span class="action-icon">${icon}</span><span><strong>${title}</strong><small>${detail}</small></span></button>`;
 return `<article class="panel action-panel"><div class="panel-title"><h3>Your days</h3><span>DAY ${state.day}</span></div><div class="action-list">${routineHTML()}
 ${!state.flags.firstResponse||!state.historicalRoleplay?btn("decision","⚡","Today's decision","A major choice is waiting."):""}
 ${state.date>="2026-06-06"&&state.date<="2026-07-25"?btn("campaign-day","◎","Run a protest day","Choose a field focus; crowd safety matters."):""}
 ${state.date>="2026-07-20"&&state.date<="2026-07-25"?btn("negotiate","◇","Set the negotiating position","Pick a demand and whether to brief publicly."):""}
 <div class="action-row">${btn("rest","☕","Rest","Recover energy.")}${btn("fundraise","₹","Donor drive","Transparent contributions.")}</div>
 ${btn("wait-dispatch","◷","Wait for the next dispatch",state.date>timelineCutoff()?"Up to 30 days; stops for anything new.":"Jumps to the next dated event.",!state.flags.firstResponse||state.pendingScenes.length||state.pendingCrisis?"disabled":"")}</div></article>`;}
function teamMiniHTML(){const people=team().filter(x=>x.status!=="available");return `<article class="panel team-mini"><div class="panel-title"><h3>Team</h3><span>${people.length} WITH YOU</span></div>${people.length?`<ul>${people.map(x=>`<li><b>${safe(initials(x.name))}</b><span><strong>${safe(x.name)}</strong><small>${safe(x.signals[0]||x.role)}</small></span></li>`).join("")}</ul>`:`<p class="muted">No one has joined yet.</p>`}<button class="dispatch-action secondary" data-go="people">Open the People desk →</button></article>`;}
