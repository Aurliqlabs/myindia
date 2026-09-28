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
/** A game's resource strip: an icon and a number each, with the meaning on hover. Warnings pulse red. */
function hudHTML(){if(!state.player)return "";const o=state.org,p=state.player;
 const item=(icon,value,title,{warn,meter}={})=>`<span class="hud-chip ${warn?"warn":""}" title="${safe(title)}" aria-label="${safe(title)}: ${safe(String(value))}"><b aria-hidden="true">${icon}</b>${value}${meter!==undefined?`<i style="--v:${Math.max(0,Math.min(100,meter))}%"></i>`:""}</span>`;
 return [item("₹",money(o.funds),`Movement funds · monthly costs ₹${money(monthlyCosts())}`,{warn:o.funds<monthlyCosts()}),item("✊",o.volunteers.toLocaleString("en-IN"),"Volunteers"),item("◔",state.support+"%","Public support"),item("★",o.credibility,"Credibility (0–100)"),
  item("⚡",Math.round(p.energy),p.energy<25?"Your energy is dangerously low: rest":"Your energy",{warn:p.energy<25,meter:p.energy}),o.legal>0||o.legal>=40?item("⚖",o.legal,"Legal pressure · at 100 you are arrested",{warn:o.legal>=40}):"",
  (state.outrage||0)>0?item("🔥",Math.round(state.outrage),"Public outrage · channel it before it turns to unrest",{warn:state.outrage>=85}):"",state.phase==="government"?item("❖",prideIndex(),"India's pride index"):""].join("");}

/* ---------- Asking before acting ---------- */
/** What each consequential action is, what it costs and what it is likely to do. Unlisted actions still get a
 * dialog built from the button's own words. */
const ACT_INFO={
 fundraise:{title:"Run a small-donor drive",text:"Call and message supporters for small, disclosed contributions. Donors tire of repeated appeals.",effect:()=>({energy:-4})},
 rest:{title:"Take a day to rest",text:"Recover energy. The news cycle cools while you are away.",effect:()=>({energy:22,stress:-10,media:-2})},
 recruit:{title:"Recruit volunteers",text:"Local outreach to bring new people in.",effect:()=>({funds:-3000,energy:-5})},
 "state-visit":{title:()=>`Visit ${state.targetState}`,text:"Meet local organisers and build field presence.",effect:()=>({funds:-20000,energy:-10,volunteers:24,support:1})},
 briefing:{title:"Hold an evidence briefing",text:"A carefully checked public update.",effect:()=>({funds:-5000,credibility:2,media:2,energy:-5})},
 interview:{title:"Give a national interview",text:"A big audience. If you are stressed, it can go badly.",effect:()=>({energy:-12,media:4})},
 "hidden-donation":{title:"Accept ₹40,000 from an undisclosed source",text:"It solves today's cash problem. It is also a secret that can surface at the worst moment, and it grows riskier the more attention you attract.",effect:()=>({funds:40000,secret:1}),danger:true},
 "found-party":{title:"Found the political party",text:"There is no going back to being a pressure group. Elections, candidates and a manifesto follow.",effect:()=>({funds:-100000,media:8}),danger:true},
 "switch-route":{title:"Turn toward electoral politics",text:"The civic pressure group will work toward founding a party. A party cannot return to the civic route.",danger:true},
 campaign:{title:()=>`Campaign tour in ${state.targetState}`,text:"Rallies and meetings that raise campaign preparation and local presence.",effect:()=>({funds:-25000,energy:-8,support:1})},
 election:{title:"Contest the general election",text:"All 543 seats. Your preparation, presence and candidates are what they are now.",effect:()=>({funds:-50000}),danger:true},
 "crisis-pr":{title:"Hire crisis PR",text:"Professionals cool a bad news cycle.",effect:()=>({funds:-15000,media:-15,legal:-10})},
 "pr-retainer":{title:"Sign a PR retainer",text:"₹8,000 every month from now on, for steadier credibility.",effect:()=>({funds:-20000})},
 services:{title:"Fund public services",text:"Visible delivery for ordinary people.",effect:()=>({funds:-40000,support:3,credibility:1,energy:-8})},
 thread:{title:"Publish an investigative thread",text:"Slow, sourced and credible.",effect:()=>({funds:-4000,energy:-10,credibility:4,media:5})},
 meme:{title:"Push fast content",text:"Wide reach. Sloppy if you are stressed.",effect:()=>({funds:-1500,media:6,energy:-3})}
};
/** Action types that change the world and so ask first; navigation, pickers and settings never do. */
const ASK_FIRST=new Set(["act","people","network","rti","suit","electoral","campaign","bill","outrage","project","civic","jantar","audit","rival"]);
const NEVER_ASK_ACTS=new Set(["toggle-confirm","historical-scene","advance-chapter","handoff","open-crisis","wait-dispatch","decision","campaign-day","negotiate","export","import","advance-week","advance-month"]);
function needsConfirmation(type,p){if(state.settings?.confirm===false||!ASK_FIRST.has(type))return false;if(type==="act"&&NEVER_ASK_ACTS.has(p.act))return false;if(type==="people"&&p.action==="interview")return false;if(type==="audit"&&p.action==="response"||type==="rival"&&p.action==="response")return false;return true;}
function confirmAction(type,p,run){
 const info=type==="act"?ACT_INFO[p.act]:null;
 const title=(typeof info?.title==="function"?info.title():info?.title)||String(p.label||"Are you sure?").replace(/\s*·\s*/g," · ").trim();
 const text=info?.text||"This takes your day and changes what happens next.";
 const effect=info?.effect?.();const danger=info?.danger||/let go|release|appeal|found|accept undisclosed|inflammatory/i.test(p.label||"");
 const modal=document.createElement("div");modal.className=`decision-modal confirm-modal ${danger?"danger":""}`;
 modal.innerHTML=`<div class="decision-box confirm-box"><small>${danger?"THIS CANNOT EASILY BE UNDONE":"YOUR DECISION"}</small><h2>${safe(title)}</h2><p>${safe(text)}</p>${effect?`<div class="confirm-effects"><small>What it does</small>${effectChips(effect)}</div>`:""}<div class="confirm-actions"><button type="button" class="dispatch-action confirm-yes">${danger?"Yes, do it":"Do it"}</button><button type="button" class="modal-close">Not now</button></div><label class="confirm-skip"><input type="checkbox" /> Don't ask again (change this in Settings)</label></div>`;
 document.body.appendChild(modal);
 modal.querySelector(".modal-close").onclick=()=>modal.remove();
 modal.querySelector(".confirm-yes").onclick=()=>{if(modal.querySelector(".confirm-skip input").checked){state.settings={...(state.settings||{}),confirm:false};}modal.remove();try{run();}catch(e){toast(e.message);}};
 setTimeout(()=>modal.querySelector(".confirm-yes").focus(),0);
}
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

/* ---------- People as characters ---------- */
/** A colleague's mood, read from what they show: never from their private numbers. */
function moodOf(x){const s=x.signals.join(" ").toLowerCase();if(/exhausted|serious strain|morale has fallen|resentment|strained|unpaid|bruised/.test(s))return ["low","Struggling"];if(/energised|fiercely loyal|close friend|strongly trusts|speaks warmly/.test(s))return ["high","Fired up"];if(x.status==="on_leave")return ["rest","On leave"];return ["steady","Steady"];}
function characterCardHTML(x){const [mood,label]=moodOf(x),joined=x.status!=="available";
 return `<article class="character ${mood} ${x.status}"><div class="character-face" aria-hidden="true">${safe(initials(x.name))}<i></i></div><div class="character-body"><strong>${safe(x.name)}</strong><small>${safe(joined?x.role:`Could be your ${x.suggestedRoleTitle}`)} · ${STAFF_STATUS[x.status]}</small><p class="character-line">${joined?safe(x.request?`“${x.request.detail}”`:x.signals[0]||""):safe(x.background)}</p>${joined?`<span class="mood-tag">${label}</span>`:""}</div><button type="button" class="talk-btn" data-talk="${safe(x.id)}">${joined?"Talk":"Approach"}</button></article>`;}
/** Talking to someone: their story, what they remember, and what you can do, each option with its meaning. */
function openTalk(id){ensureState();const x=team().find(v=>v.id===id);if(!x)return toast("They are not available.");const w=state.world,joined=x.status!=="available"&&x.status!=="former";
 const opt=(action,title,detail,extra={})=>({action,title,detail,...extra});const options=[];const first=x.name.split(" ")[0];
 if(!joined){options.push(opt("volunteer","Ask them to join as a volunteer","Unpaid. They start now, and they will remember that you asked."),opt("hire",`Offer a paid role · ₹${money(STAFF_SALARY)} a month`,"A salary you must meet every month. Missed pay lands differently on each person."));}
 else{
  if(x.request)options.push(opt("grant",x.request.type==="raise"?"Agree to the raise":"Agree to their request","They will remember you kept faith with them."),opt("deny","Say no, for now",`${first} will remember the refusal. Proud, ambitious people remember it longer.`,{danger:true}));
  if(x.status!=="on_leave")options.push(opt("time-off","Send them home for three days","They recover and come back steadier. The work waits."));
  const last=w.flags[`defended_${id}`];options.push(opt("defend","Defend them in public","A public show of trust they will remember for years. Costs you 4 energy.",{disabled:last&&daysBetween(last,state.date)<14?"You defended them recently.":""}));
  if(x.founding)options.push(opt("recognise","Honour them as a founding member","A moment they will carry for the rest of their career.",{disabled:w.flags[`recognised_${id}`]?"Already honoured.":""}));
  if(x.status==="volunteer")options.push(opt("hire",`Put them on the payroll · ₹${money(STAFF_SALARY)} a month`,"They have earned it; your monthly costs rise."));
  options.push(opt("release","Let them go",`${first} leaves the organisation. How they remember it depends on who they are.`,{danger:true}));
 }
 const [mood,label]=moodOf(x);
 const modal=document.createElement("div");modal.className="decision-modal talk-modal";
 modal.innerHTML=`<div class="decision-box talk-box"><div class="talk-head"><div class="character-face big ${mood}" aria-hidden="true">${safe(initials(x.name))}<i></i></div><div><small>${safe(joined?`${x.role} · ${label}`:`Could be your ${x.suggestedRoleTitle}`)}</small><h2>${safe(x.name)}</h2><p class="muted">${safe(x.background)}${x.homeState?` From ${safe(x.homeState)}.`:""}</p></div></div>`+
  (x.signals.length?`<div class="talk-read"><small>What you notice</small><ul>${x.signals.map(s=>`<li>${safe(s)}</li>`).join("")}</ul></div>`:"")+
  (x.memories.length?`<p class="staff-memory">They remember: ${x.memories.map(safe).join(" · ")}</p>`:"")+
  `<div class="choices">${options.map((o,i)=>`<button type="button" class="choice ${o.danger?"danger":""}" data-talk-action="${o.action}" ${o.disabled?`disabled title="${safe(o.disabled)}"`:""}><span class="choice-key">${String.fromCharCode(65+i)}</span><span><strong>${safe(o.title)}</strong><small>${safe(o.disabled||o.detail)}</small></span></button>`).join("")}</div><button type="button" class="modal-close">Leave it for now</button></div>`;
 document.body.appendChild(modal);modal.querySelector(".modal-close").onclick=()=>modal.remove();
 modal.querySelectorAll("[data-talk-action]").forEach(b=>b.onclick=()=>{modal.remove();GameEngine.dispatch("people",{action:b.dataset.talkAction,id});});
}
/** Meeting a candidate: what the interviews have shown so far, and the choice to hire. */
function openCandidate(id){ensureState();const c=GameEngine.api().recruitmentView(state.world).find(v=>v.id===id);if(!c)return toast("That candidate has moved on.");
 const modal=document.createElement("div");modal.className="decision-modal talk-modal";
 modal.innerHTML=`<div class="decision-box talk-box"><div class="talk-head"><div class="character-face big steady" aria-hidden="true">${safe(initials(c.name))}<i></i></div><div><small>Candidate · best fit ${safe(c.suggestedRoleTitle)} · interviewed ${c.interviewLevel} of 2 times</small><h2>${safe(c.name)}</h2><p class="muted">${safe(c.background)} ${c.age}, from ${safe(c.homeState)}.</p></div></div>`+
  `<div class="talk-read"><small>What you have seen so far</small><ul>${c.headline.map(h=>`<li>${safe(h)}</li>`).join("")}${Object.entries(c.estimatedSkills).map(([k,v])=>`<li>${safe(k)}: ${safe(v)}</li>`).join("")}${c.concerns.map(h=>`<li class="concern">${safe(h)}</li>`).join("")}</ul></div>`+
  `<div class="choices"><button type="button" class="choice" data-cand="interview" ${c.interviewLevel>=2?"disabled":""}><span class="choice-key">A</span><span><strong>Interview them${c.interviewLevel?" again":""}</strong><small>${c.interviewLevel>=2?"You have learned what interviews can show.":"Costs 6 energy. Narrows the estimate and may surface a concern."}</small></span></button><button type="button" class="choice" data-cand="hire-candidate"><span class="choice-key">B</span><span><strong>Hire them · ₹${money(STAFF_SALARY)} a month</strong><small>You are hiring what you have seen, not what is hidden.</small></span></button><button type="button" class="choice" data-cand="volunteer-candidate"><span class="choice-key">C</span><span><strong>Take them on as a volunteer</strong><small>No salary. Ambitious people may not stay unpaid for long.</small></span></button></div><button type="button" class="modal-close">Not yet</button></div>`;
 document.body.appendChild(modal);modal.querySelector(".modal-close").onclick=()=>modal.remove();
 modal.querySelectorAll("[data-cand]").forEach(b=>b.onclick=()=>{modal.remove();GameEngine.dispatch("people",{action:b.dataset.cand,id});if(b.dataset.cand==="interview")setTimeout(()=>openCandidate(id),0);});
}
