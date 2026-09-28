/* Acts 3 and 4: injustice in real time, public outrage, the fictional network behind it, the long road through the
 * courts, the reforms that make convictions possible, and how the story ends.
 * Every person in NETWORK is fictional. Nobody is jailed by the player: independent courts decide, and they only
 * convict when evidence, protected witnesses and independent institutions are all in place. */

const NETWORK=[
 {id:"sood",name:"Vikrant Sood",role:"Owner of a national coaching chain",crime:"Runs the ring that sells exam papers to students who can pay.",power:30},
 {id:"vora",name:"Ketan Vora",role:"Pharmaceutical manufacturer",crime:"Keeps banned syrups on shelves under new batch numbers.",power:30},
 {id:"malhotra",name:"Devraj Malhotra",role:"Industrialist-turned-MLA",crime:"Wins contracts for bridges that crack and projects where workers die.",power:40},
 {id:"kharbanda",name:"Arvind Kharbanda",role:"Deputy Inspector-General of Police",crime:"Buries complaints against the network and signs off deaths in custody.",power:45},
 {id:"oberoi",name:"Rakesh Oberoi",role:"State Minister",crime:"Clears land for the network's projects, with or without notice.",power:50},
 {id:"varkey",name:"Sunita Varkey",role:"Party spokesperson and trust treasurer",crime:"Launders the network's money into political donations.",power:45},
 {id:"chairman",name:"Omprakash Dhanraj",alias:"The Chairman",role:"Financier behind the network",crime:"Owns the companies, funds the trusts and decides who is protected.",power:70,hidden:true}
];
const INSTITUTION_LABELS={agency:"Investigating agency independence",courts:"Court capacity",protection:"Witness protection"};
const PRIDE_LABELS={exams:"Fair examinations",schools:"Schools",health:"Health and drug safety",justice:"Justice and policing",integrity:"Clean public life",prosperity:"Work and wages"};
const CHAIRMAN_AGENCY_THRESHOLD=70;
/* Bills cost political capital (mandate), not party money. Mandate regenerates slowly while governing. */
const BILLS=[
 {id:"lokpal",title:"Independent Anti-Corruption Commission Act",detail:"An investigating agency that answers to Parliament, not ministers.",capital:12,days:45,inst:{agency:35},pride:{integrity:10}},
 {id:"witness",title:"Witness Protection Act",detail:"New identities, relocation and security for witnesses in serious cases.",capital:8,days:40,inst:{protection:40},pride:{justice:5}},
 {id:"courts",title:"Fast-Track Courts and Judicial Vacancies Act",detail:"Fills vacant judgeships and adds special courts for corruption trials.",capital:14,days:60,inst:{courts:30},pride:{justice:13}},
 {id:"police",title:"Police Accountability Act",detail:"Mandatory video of custody, independent inquiries into every death.",capital:10,days:50,inst:{agency:5},pride:{justice:13}},
 {id:"exams",title:"National Examination Integrity Act",detail:"Independent audits of every exam centre and printing press.",capital:8,days:40,pride:{exams:29}},
 {id:"schools",title:"School Standards Act",detail:"Enforceable minimums for water, toilets and safe buildings.",capital:12,days:50,pride:{schools:26}},
 {id:"drugs",title:"Drug Safety and Recall Act",detail:"Batch testing, public recalls and criminal liability for contamination.",capital:8,days:40,pride:{health:23}},
 {id:"wages",title:"Wages on Time Act",detail:"Automatic compensation when public wages are late.",capital:12,days:45,pride:{prosperity:18}},
 {id:"funding",title:"Transparent Political Funding Act",detail:"Every political donation over ₹2,000 published with its donor.",capital:6,days:40,inst:{agency:5},pride:{integrity:16}}
];
const VICTORY_PRIDE=65;
const CIVIC_REFORM_EFFECTS={"exam-integrity":{pride:{exams:15},inst:{agency:9}},"school-standards":{pride:{schools:14},inst:{agency:9}},"water-disclosure":{pride:{health:8},inst:{agency:9}},"health-procurement":{pride:{health:10,integrity:4},inst:{agency:9}}};

function ensureAct3State(){
 state.injustices??=[];state.injusticeCount??=0;state.outrage??=0;state.collapses??=0;
 state.institutions??={agency:25,courts:35,protection:15};
 state.pride??={exams:28,schools:34,health:32,justice:24,integrity:26,prosperity:44};
 state.bills??={};state.ending??=null;
 state.network??={};for(const m of NETWORK)state.network[m.id]??={evidence:0,stage:"free",progress:0,witnesses:0};
}
function prideIndex(){ensureState();const v=Object.values(state.pride);return Math.round(v.reduce((a,b)=>a+b,0)/v.length);}
function adjustPride(delta){for(const [k,v] of Object.entries(delta||{}))state.pride[k]=clamp(state.pride[k]+v);}
function adjustInstitutions(delta){for(const [k,v] of Object.entries(delta||{}))state.institutions[k]=clamp(state.institutions[k]+v);}
function networkMember(id){return NETWORK.find(m=>m.id===id);}
function memberVisible(m){return !m.hidden||state.network[m.id].revealed;}
function addEvidence(id,amount,why){const n=state.network[id];if(!n||!amount||["convicted"].includes(n.stage))return;n.evidence=Math.max(0,n.evidence+amount);if(amount>0&&why)record("Evidence gathered",`${why} (${networkMember(id).name}: ${n.evidence} pieces)`);}
function convictedCount(){return NETWORK.filter(m=>state.network[m.id].stage==="convicted").length;}

/* ---------- The injustice feed ---------- */
function fillDistrict(text,district){return text.replaceAll("{district}",district);}
function openInjustices(){return state.injustices.filter(x=>x.status==="open");}
/** New cases arrive while the player is busy elsewhere; there are rarely more than two open at once. */
function spawnInjustice(){
 if(state.date<"2026-05-20"||!state.flags.firstResponse||state.ending)return;
 if(openInjustices().length>=2||roll(`injustice:${state.date}`)>=(state.date<=timelineCutoff()?11:17))return;
 const t=INJUSTICE_CASES[(state.injusticeCount*7+roll(`pick:${state.date}`))%INJUSTICE_CASES.length];
 const district=FICTIONAL_DISTRICTS[roll(`district:${state.date}`)%FICTIONAL_DISTRICTS.length];
 state.injusticeCount++;
 state.injustices.unshift({uid:`inj-${state.injusticeCount}`,id:t.id,district,openedOn:state.date,dueOn:addDays(state.date,t.days),status:"open"});
 state.injustices=state.injustices.slice(0,40);state.lastCaseOn=state.date;
 record("Injustice reported",`${t.title} · ${district} (fictional). You have ${t.days} day${t.days===1?"":"s"}.`);
}
/** A case nobody answers still ends: badly, publicly, and it feeds the anger. */
function expireInjustices(){
 for(const x of openInjustices()){if(x.dueOn>state.date)continue;const t=INJUSTICE_CASES.find(c=>c.id===x.id);
  x.status="ignored";x.closedOn=state.date;x.outcome=fillDistrict(t.ignored.text,x.district);
  applyEffect(t.ignored.effect,`The team watched a case in ${x.district} end badly.`);state.outrage=clamp(state.outrage+(t.ignored.outrage||0));
  if(state.phase==="government")adjustPride({justice:-1});
  record("No one came",`${t.title} · ${x.district}: ${x.outcome}`);}
}
function respondInjustice(uid,index){ensureState();const x=state.injustices.find(v=>v.uid===uid);if(!x||x.status!=="open")throw Error("This case is closed.");
 const t=INJUSTICE_CASES.find(c=>c.id===x.id),r=t.responses[Number(index)];if(!r)throw Error("Unknown response.");
 const cost=-(r.effect.funds||0);if(cost>state.org.funds)throw Error(`This response needs ₹${money(cost)}.`);
 if(-(r.effect.energy||0)>state.player.energy)throw Error("You are too exhausted for this. Rest, or let someone else lead.");
 applyEffect(r.effect,`The team answered "${t.title}" in ${x.district}.`);state.outrage=clamp(state.outrage+(r.outrage||2));
 x.status="answered";x.closedOn=state.date;x.outcome=r.label;
 if(r.evidence&&t.lead)addEvidence(t.lead,r.evidence,`${r.label} in ${x.district}`);
 record("Case answered",`${t.title} · ${x.district}: ${r.label}.`);save();renderGame();
}
function injusticeFeedHTML(){ensureState();if(state.date<"2026-05-20"||!state.flags.firstResponse)return "";const open=openInjustices(),recent=state.injustices.filter(x=>x.status!=="open").slice(0,4);
 const cards=open.map(x=>{const t=INJUSTICE_CASES.find(c=>c.id===x.id),left=daysBetween(state.date,x.dueOn),bg=BEFORE_THE_MOVEMENT.find(b=>b.id===t.pattern);
  return `<article class="injustice-card"><div class="injustice-top"><span>${safe(x.district)} · fictional case</span><b class="${left<=1?"urgent":""}">${left<=0?"DUE TODAY":`${left} DAY${left===1?"":"S"} LEFT`}</b></div><h3>${safe(t.title)}</h3><p>${safe(fillDistrict(t.body,x.district))}</p><p class="injustice-pattern">Why this happens: ${safe(bg.record)} <a href="${safe(bg.url)}" target="_blank" rel="noopener noreferrer">${safe(bg.source)} ↗</a></p><div class="choices">${t.responses.map((r,i)=>`<button class="choice" data-injustice="${safe(x.uid)}" data-index="${i}"><span class="choice-key">${String.fromCharCode(65+i)}</span><span><strong>${safe(r.label)}</strong><small>${safe(r.detail)}</small>${effectChips(r.effect)}${r.evidence&&t.lead?`<span class="effect-chips"><i class="up">Evidence +${r.evidence}</i></span>`:""}</span></button>`).join("")}</div></article>`;}).join("");
 return `<section class="panel injustice-feed"><div class="panel-title"><h3>Injustice feed</h3><span>LIVE · ${open.length} OPEN</span></div>${outrageHTML()}${cards||`<p class="muted">No open cases today. They will come.</p>`}${recent.length?`<div class="history-list">${recent.map(x=>`<div class="${x.status}"><small>${safe(x.closedOn)} · ${x.status==="answered"?"ANSWERED":"NO ONE CAME"} · ${safe(x.district)}</small><strong>${safe(INJUSTICE_CASES.find(c=>c.id===x.id).title)}</strong><p>${safe(x.outcome)}</p></div>`).join("")}</div>`:""}</section>`;}

/** What was already broken before May 2026: sourced facts, so players can judge the record for themselves. */
function backgroundHTML(){return panel("BEFORE THE MOVEMENT · THE RECORD",`<p>What was documented before the story begins. Every case in the injustice feed is fictional, and every one follows one of these patterns.</p><div class="history-list">${BEFORE_THE_MOVEMENT.map(b=>`<div><small>${b.year} · ${safe(b.topic)}</small><p>${safe(b.record)}</p><a href="${safe(b.url)}" target="_blank" rel="noopener noreferrer">SOURCE: ${safe(b.source)} ↗</a></div>`).join("")}</div>`,"SOURCED");}

/* ---------- Public outrage ---------- */
function outrageHTML(){const o=Math.round(state.outrage),legal=state.org.legal;return `${legal>=40?`<div class="legal-warning"><strong>Legal pressure ${legal}/100${legal>=75?" · an arrest is being discussed":""}</strong><p>At 100 you are arrested and the story ends. Pressure fades as cases lapse; senior counsel can push it back.</p><div class="management-actions"><button data-outrage="counsel">Retain senior counsel · ₹30,000</button></div></div>`:""}<div class="outrage-meter"><div class="progress-row"><span>PUBLIC OUTRAGE</span><b>${o}/100${o>=85?" · UNREST RISK":""}</b></div><div class="progress-track"><div class="progress-fill outrage-fill" style="width:${o}%"></div></div><div class="management-actions"><button data-outrage="protest" ${o<30?"disabled title=\"Outrage must reach 30\"":""}>Channel it into a protest · ₹10,000</button><button data-outrage="report" ${o<20?"disabled title=\"Outrage must reach 20\"":""}>Turn it into a people's report · ₹4,000</button></div></div>`;}
/** Anger is fuel: a protest turns it into support and volunteers, at a legal risk that preparation reduces. */
function channelOutrage(kind){ensureState();const o=state.outrage,org=state.org;
 if(kind==="protest"){if(o<30)throw Error("Outrage is not high enough to fill the streets.");if(org.funds<10000)throw Error("A safe protest needs ₹10,000.");if(state.player.energy<12)throw Error("You need 12 energy to lead a protest.");
  const safeCrowd=org.volunteers>=150&&org.legal<50,help=GameEngine.useStaff("field",6);
  applyEffect({funds:-10000,energy:-12,support:Math.round(o/12),volunteers:Math.round(o*1.5)+help.bonus*3,media:8,legal:safeCrowd?1:Math.round(o/6)},"The team marshalled a protest.");
  state.outrage=clamp(o-40);record("Protest",`${Math.round(o*40)} people marched${safeCrowd?" peacefully with trained marshals":"; with too few marshals, police filed cases"}.${help.name?` ${help.name} ran the ground.`:""}`);return advanceDay();}
 if(kind==="counsel"){if(state.org.legal<40)throw Error("You do not need senior counsel yet.");if(state.org.funds<30000)throw Error("Senior counsel needs ₹30,000.");const help=GameEngine.useStaff("legal",4);applyEffect({funds:-30000,legal:-(20+help.bonus),energy:-4},"Senior counsel took on the movement's cases.");record("Senior counsel retained",`Anticipatory bail and quashing petitions filed${help.name?` with ${help.name}`:""}. Legal pressure eased.`);return advanceDay();}
 if(kind==="report"){if(o<20)throw Error("There is not enough public attention yet.");if(org.funds<4000)throw Error("A report needs ₹4,000.");
  applyEffect({funds:-4000,energy:-6,credibility:Math.round(o/15),media:3},"The team compiled a people's report.");state.outrage=clamp(o-30);
  record("People's report","Every case, every date and every official who did not answer, published in one document.");return advanceDay();}
 throw Error("Unknown action.");}
function outrageDaily(){state.outrage=clamp(state.outrage-1);if(state.day%4===0&&state.org.legal>0)state.org.legal--;
 if(state.outrage>=85&&roll(`unrest:${state.date}`)<12){applyEffect({credibility:-3,legal:6,support:-1},"Unrest broke out that the team did not organise.");state.outrage=clamp(state.outrage-20);record("Unrest","Anger spilled over without organisers or marshals. Property was damaged and cases were filed; the movement is blamed.");}}

/* ---------- The network, investigations and trials ---------- */
function networkHTML(){ensureState();const visible=NETWORK.filter(memberVisible);
 const inst=`<div class="state-grid">${Object.entries(INSTITUTION_LABELS).map(([k,l])=>`<div style="border-left:4px solid ${state.institutions[k]>=60?"#15965b":state.institutions[k]>=35?"#e0b24d":"#ed1c24"}"><strong>${l}</strong><span>${state.institutions[k]}/100</span></div>`).join("")}</div>`;
 const members=visible.map(m=>{const n=state.network[m.id];const stage={free:"Free and untouched",investigation:`Under investigation · ${Math.round(n.progress)}%`,trial:`${n.appealHeard?"Appeal in the High Court":"On trial"} · verdict due ${n.trialEnds} · ${n.witnesses} witness${n.witnesses===1?"":"es"} standing`,convicted:`CONVICTED ${n.convictedOn} · ${n.sentence} years`,acquitted:`Acquitted ${n.closedOn}`}[n.stage];
  const acts=[];const b=(a,l,extra="")=>acts.push(`<button data-network="${a}" data-id="${m.id}" ${extra}>${l}</button>`);
  if(n.stage==="free"){const blocked=m.id==="chairman"&&state.institutions.agency<CHAIRMAN_AGENCY_THRESHOLD;b("complain","File a complaint with the agency · ₹5,000",n.evidence<6||blocked?`disabled title="${blocked?`No agency will touch him until its independence reaches ${CHAIRMAN_AGENCY_THRESHOLD}`:"Needs 6 pieces of evidence"}"`:"");}
  if(n.stage==="investigation")b("push","Push the investigation · ₹8,000");
  if(n.stage==="trial"){b("protect","Protect the witnesses · ₹12,000",n.shieldUntil&&n.shieldUntil>state.date?"disabled":"");b("prosecute","Support the prosecution · ₹15,000");}
  if(n.stage==="acquitted")b("appeal","Appeal the acquittal · ₹25,000");
  if(m.id==="chairman"&&["free","investigation","trial"].includes(n.stage))b("audit","Forensic audit of his companies · ₹40,000",n.lastAudit&&daysBetween(n.lastAudit,state.date)<30?"disabled title=\"Auditors need a month\"":"");
  return `<div class="staff-card network-card ${n.stage}"><div class="staff-head"><div class="portrait">${safe(initials(m.name))}</div><div><strong>${safe(m.name)}${m.alias?` · "${safe(m.alias)}"`:""}</strong><small>${safe(m.role)} · fictional</small></div></div><p>${safe(m.crime)}</p><p class="staff-request">${safe(stage)}</p><small>Evidence: ${n.evidence} piece${n.evidence===1?"":"s"}${n.stage==="free"&&n.evidence<6?` · ${6-n.evidence} more before an agency will act`:""}</small>${acts.length?`<div class="management-actions">${acts.join("")}</div>`:""}</div>`;}).join("");
 const hidden=NETWORK.some(m=>m.hidden&&!state.network[m.id].revealed)?`<p class="muted">Someone above them pays for all of it. A convicted lieutenant may name him.</p>`:"";
 return panel("THE NETWORK",`<p>A fictional network behind the paper leaks, the poisoned syrup, the collapsing bridges and the bodies in custody. Answer cases to gather evidence, then take it to an agency. Courts decide; witnesses can be frightened into silence; the network strikes back.</p>${inst}<div class="staff-grid">${members}</div>${hidden}`,`${convictedCount()} CONVICTED`);}
function networkAction(action,id){ensureState();const m=networkMember(id),n=state.network[id],o=state.org;if(!m||!memberVisible(m))throw Error("Unknown figure.");
 const pay=c=>{if(o.funds<c)throw Error(`This needs ₹${money(c)}.`);o.funds-=c;};
 if(action==="complain"){if(n.stage!=="free")throw Error("A case is already under way.");if(n.evidence<6)throw Error("The agency needs at least 6 pieces of evidence.");if(id==="chairman"&&state.institutions.agency<CHAIRMAN_AGENCY_THRESHOLD)throw Error(`No agency will investigate him until its independence reaches ${CHAIRMAN_AGENCY_THRESHOLD}.`);pay(5000);n.stage="investigation";n.progress=0;record("Complaint filed",`The movement's evidence against ${m.name} went to the investigating agency.`);return advanceDay();}
 if(action==="push"){if(n.stage!=="investigation")throw Error("There is no open investigation.");pay(8000);const help=GameEngine.useStaff("legal",5);n.progress=Math.min(99,n.progress+4+help.bonus);record("Investigation pushed",`RTI follow-ups and public pressure on the ${m.name} investigation${help.name?`, led by ${help.name}`:""}.`);return advanceDay();}
 if(action==="protect"){if(n.stage!=="trial")throw Error("There is no trial.");pay(12000);n.shieldUntil=addDays(state.date,45);record("Witnesses protected",`Safe houses and security for witnesses in the ${m.name} trial for 45 days.`);return advanceDay();}
 if(action==="prosecute"){if(n.stage!=="trial")throw Error("There is no trial.");pay(15000);const help=GameEngine.useStaff("legal",5);n.evidence+=1;if(help.bonus>=3)n.witnesses=Math.min(8,n.witnesses+1);record("Prosecution supported",`Documents and a new witness statement for the ${m.name} trial${help.name?`, prepared by ${help.name}`:""}.`);return advanceDay();}
 if(action==="audit"){if(id!=="chairman")throw Error("Only the Chairman hides behind companies.");if(n.lastAudit&&daysBetween(n.lastAudit,state.date)<30)throw Error("The auditors need a month.");pay(40000);const help=GameEngine.useStaff("finance",6);n.lastAudit=state.date;n.evidence+=2+(help.bonus>=4?1:0);record("Following the money",`Forensic accountants traced shell companies back to Dhanraj${help.name?`, with ${help.name}`:""}. (${n.evidence} pieces)`);return advanceDay();}
 if(action==="appeal"){if(n.stage!=="acquitted")throw Error("Only an acquittal can be appealed.");pay(25000);startTrial(m,n,-1);record("Appeal filed",`The acquittal of ${m.name} goes to a higher court.`);return advanceDay();}
 throw Error("Unknown action.");}
function startTrial(m,n,witnessDelta=0){n.stage="trial";n.witnesses=Math.max(1,Math.min(6,1+Math.floor(Math.min(n.evidence,12)/2)+witnessDelta));n.trialEnds=addDays(state.date,Math.max(90,Math.round(320-state.institutions.courts*2.2)));}
/** Investigations crawl unless the agency is independent; trials last months; the verdict weighs evidence, witnesses, courts and the accused's power. */
function justiceDaily(){
 for(const m of NETWORK){const n=state.network[m.id];
  if(n.stage==="investigation"){n.progress+=Math.max(.05,.2+state.institutions.agency/220+n.evidence*.03-m.power/250);if(n.progress>=100){startTrial(m,n);record("Chargesheet filed",`${m.name} will stand trial. Verdict expected ${n.trialEnds}.`);}}
  else if(n.stage==="trial"){
   const shielded=n.shieldUntil&&n.shieldUntil>state.date;
   if(!shielded&&n.witnesses>0&&roll(`hostile:${m.id}:${state.date}`)<Math.round((100-state.institutions.protection)/100*m.power/20)){n.witnesses--;record("Witness turned hostile",`A witness in the ${m.name} trial changed their statement after 'visitors' came to their home.`);}
   if(state.date>=n.trialEnds){const chance=clamp(5+Math.min(n.evidence,12)*2+n.witnesses*6+state.institutions.courts*.4+state.institutions.protection*.15-m.power*.8);
    if(roll(`verdict:${m.id}:${state.date}`)<chance&&m.id==="chairman"&&!n.appealHeard){n.stage="trial";n.appealHeard=true;n.trialEnds=addDays(state.date,Math.max(180,Math.round(420-state.institutions.courts*3)));n.witnesses=Math.max(1,n.witnesses-1);applyEffect({media:10,morale:4},"The Chairman was convicted and appealed.");record("Convicted, and appealing",`A special court convicted Omprakash Dhanraj. His lawyers appealed to the High Court the same afternoon; he is out on bail until it rules (${n.trialEnds}).`);}
    else if(roll(`verdict:${m.id}:${state.date}`)<chance){n.stage="convicted";n.convictedOn=state.date;n.sentence=3+roll(`sentence:${m.id}`)%(m.id==="chairman"?12:8);adjustPride({integrity:m.id==="chairman"?12:4,justice:2});applyEffect({credibility:4,support:2,media:10,morale:6},`${m.name} was convicted.`);state.outrage=clamp(state.outrage-15);
     record("Convicted",`A court sentenced ${m.name} (${m.role}, fictional) to ${n.sentence} years in prison.`);if(m.id!=="chairman"&&state.network.chairman.revealed){state.network.chairman.evidence+=3;record("Another one talks",`To reduce ${m.name}'s sentence, their lawyers offered testimony about the Chairman’s money.`);}revealChairman();}
    else{n.stage="acquitted";n.closedOn=state.date;applyEffect({credibility:-2,morale:-4},`${m.name} walked free.`);state.outrage=clamp(state.outrage+12);record("Acquitted",`${m.name} walked out of court smiling. The court found the evidence insufficient.`);}}
  }}
}
function revealChairman(){const c=state.network.chairman;if(c.revealed||convictedCount()<2)return;c.revealed=true;c.evidence+=5;record("A lieutenant talks","Facing years in prison, a convicted member of the network named the man who paid for everything: Omprakash Dhanraj, known as the Chairman (fictional). His testimony is your first evidence against him.");}
/** The network notices who is hurting it. Weekly, it raids, smears or tries to buy someone on the inside. */
function retaliationDaily(){
 const pressure=NETWORK.filter(m=>["investigation","trial"].includes(state.network[m.id].stage)).length+(NETWORK.some(m=>state.network[m.id].evidence>=6)?1:0);
 if(!pressure||state.day%7!==0||roll(`retaliate:${state.date}`)>=20+pressure*10)return;
 const kind=["raid","smear","bribe"][roll(`kind:${state.date}`)%3];
 if(kind==="raid"){const taken=Math.min(state.org.funds,12000);applyEffect({legal:8,funds:-taken,morale:-3},"Officials raided the office.");record("Office raided",`Tax officials searched the office for eleven hours and froze ₹${money(taken)}. No charge was filed.`);}
 else if(kind==="smear"){applyEffect({credibility:state.org.prRetainer?-1:-4,support:-1},"A smear campaign targeted the movement.");record("Smear campaign","Edited clips and fake documents about your finances trend for two days.");}
 else{const r=GameEngine.api().bribeAttempt(GameEngine.sync());if(!r)return;
  if(r.accepted){const target=NETWORK.filter(m=>state.network[m.id].stage!=="convicted").sort((a,b)=>state.network[b.id].evidence-state.network[a.id].evidence)[0];if(target)state.network[target.id].evidence=Math.max(0,state.network[target.id].evidence-3);record("A file leaked",`The network knew details only your team had. Three pieces of evidence against ${target?.name??"them"} are compromised. Someone close to you talked.`);}
  else{const target=NETWORK.find(m=>!["convicted"].includes(state.network[m.id].stage)&&memberVisible(m));if(target)state.network[target.id].evidence++;record("A bribe refused",`${r.name} was offered money to pass on case files, refused, and brought you the details. The attempt itself is evidence.`);}}
}

/* ---------- Government: reforms and national pride ---------- */
function reformsHTML(){ensureState();const seats=state.elections[0]?.seats??0;
 return panel("LEGISLATE",`<p>Victory needs every member of the network convicted and a pride index of ${VICTORY_PRIDE}. Laws spend political capital: your mandate (${state.governance.mandate}/100), which recovers slowly while you govern and through public services. Laws take weeks in Parliament and can fail. The anti-corruption commission is what finally makes the Chairman reachable.</p><div class="history-list">${BILLS.map(b=>{const s=state.bills[b.id];return `<div><small>${s?.passedOn?`PASSED ${safe(s.passedOn)}`:s?.voteOn?`IN PARLIAMENT · VOTE ${safe(s.voteOn)}`:s?.failedOn?`DEFEATED ${safe(s.failedOn)} · can return after 30 days`:"NOT INTRODUCED"}</small><strong>${safe(b.title)}</strong><p>${safe(b.detail)}</p>${!s?.passedOn&&!s?.voteOn?`<div class="management-actions"><button data-bill="${b.id}" ${state.phase!=="government"||state.governance.mandate<b.capital||s?.failedOn&&daysBetween(s.failedOn,state.date)<30?"disabled":""}>Introduce · ${b.capital} mandate</button></div>`:""}</div>`;}).join("")}</div><p class="muted">Passing chance rises with your mandate and majority (${seats} seats).</p>`,"GOVERNMENT");}
function introduceBill(id){ensureState();const b=BILLS.find(x=>x.id===id);if(!b)throw Error("Unknown bill.");if(state.phase!=="government")throw Error("Only a government can pass laws.");const s=state.bills[id]||{};if(s.passedOn||s.voteOn)throw Error("This bill is already law or in Parliament.");if(s.failedOn&&daysBetween(s.failedOn,state.date)<30)throw Error("Wait before reintroducing the bill.");if(state.governance.mandate<b.capital)throw Error(`This bill needs ${b.capital} mandate; you have ${state.governance.mandate}.`);
 state.governance.mandate=clamp(state.governance.mandate-b.capital);state.bills[id]={introducedOn:state.date,voteOn:addDays(state.date,b.days)};record("Bill introduced",`${b.title}: the vote is due ${state.bills[id].voteOn}.`);return advanceDay();}
function billsDaily(){if(state.phase==="government"&&state.day%10===0)state.governance.mandate=clamp(state.governance.mandate+1);
 // A law keeps working after it passes: for its first year, it improves its area a little every month.
 if(state.day%30===0)for(const b of BILLS){const x=state.bills[b.id];if(x?.passedOn&&daysBetween(x.passedOn,state.date)<=365)adjustPride(Object.fromEntries(Object.keys(b.pride).map(k=>[k,1])));}for(const b of BILLS){const s=state.bills[b.id];if(!s?.voteOn||s.voteOn>state.date)continue;const seats=state.elections[0]?.seats??0,chance=clamp(40+state.governance.mandate*.4+Math.max(-10,Math.min(15,(seats-272)*.2))-(seats<272?8:0));
 if(roll(`bill:${b.id}:${state.date}`)<chance){state.bills[b.id]={passedOn:state.date};adjustInstitutions(b.inst);adjustPride(b.pride);state.governance.mandate=clamp(state.governance.mandate+2);record("Bill passed",`${b.title} is now law.`);}
 else{state.bills[b.id]={failedOn:state.date};state.governance.mandate=clamp(state.governance.mandate-3);record("Bill defeated",`${b.title} fell short in the Rajya Sabha after the network's friends lobbied against it.`);}}}
function onReformAdopted(id){const e=CIVIC_REFORM_EFFECTS[id];if(!e)return;adjustPride(e.pride);adjustInstitutions(e.inst);}
function prideHTML(){ensureState();return panel("INDIA'S PRIDE INDEX",`<p>A simulated measure of whether the country works for ordinary people. Laws, convictions and every case you answer or ignore move it.</p><div class="management-stats">${metric("Pride index",prideIndex()+"/100")}</div><div class="state-grid">${Object.entries(PRIDE_LABELS).map(([k,l])=>`<div style="border-left:4px solid ${state.pride[k]>=70?"#15965b":state.pride[k]>=45?"#e0b24d":"#ed1c24"}"><strong>${l}</strong><span>${state.pride[k]}/100</span></div>`).join("")}</div>`,"SIMULATED");}

/* ---------- Endings ---------- */
const ENDINGS={
 restored:{title:"A Republic Restored",tone:"victory"},
 conscience:{title:"The Conscience of the Republic",tone:"victory"},
 arrested:{title:"Silenced",tone:"defeat"},
 burnout:{title:"The Body Gives Out",tone:"defeat"},
 unfinished:{title:"The Unfinished Republic",tone:"open"}
};
function checkEndings(){if(state.ending||!state.handoff&&state.historicalRoleplay)return;
 const chairman=convictedCount()===NETWORK.length,id=
  state.org.legal>=100?"arrested":state.collapses>=3?"burnout":
  state.phase==="government"&&chairman&&prideIndex()>=VICTORY_PRIDE?"restored":
  state.handoff?.route==="civic"&&chairman&&Object.keys(CIVIC_REFORM_EFFECTS).every(k=>state.nationalCampaigns.some(c=>c.id===k&&c.outcome==="adopted"))?"conscience":
  state.date>="2036-06-01"?"unfinished":null;
 if(id){state.ending={id,date:state.date};record("The end of the story",ENDINGS[id].title);}}
function endingStory(){const e=state.ending,p=state.player,years=((new Date(e.date)-new Date("2026-05-14"))/31557600000).toFixed(1);
 const convicted=NETWORK.filter(m=>state.network[m.id].stage==="convicted").map(m=>`${m.name} (${state.network[m.id].sentence} years)`);
 const answered=state.injustices.filter(x=>x.status==="answered").length+0,ignored=state.injustices.filter(x=>x.status==="ignored").length;
 const lines={
  restored:[`${p.name} led ${state.org.name} into government. It took ${years} years.`,`Omprakash Dhanraj, the Chairman, was sentenced to ${state.network.chairman.sentence} years by a special court on ${state.network.chairman.convictedOn}. Not by decree: by evidence, by witnesses who were kept safe, and by courts with the judges they needed.`,`Exams are audited. Syrups are batch-tested. Custody is filmed. Wages come on time. India's pride index stands at ${prideIndex()}.`,`Behind bars: ${convicted.join(", ")}.`],
  conscience:[`${p.name} never held office. ${state.org.name} never needed to.`,`Four national reforms were won from outside government, and the institutions they built convicted the Chairman: ${state.network.chairman.sentence} years.`,`Behind bars: ${convicted.join(", ")}.`],
  arrested:[`Legal pressure became an arrest warrant. ${p.name} was taken into custody on ${e.date}.`,`The network did not need to win in court. It only needed you busy defending yourself.`,convicted.length?`Still, ${convicted.length} of them are behind bars because of what you started.`:"None of them faced trial."],
  burnout:[`After a third collapse, doctors gave ${p.name} a choice: stop, or not survive another year.`,`The movement carries on without its founder, smaller and quieter.`,convicted.length?`${convicted.length} convictions remain your legacy.`:"The network is untouched."],
  unfinished:[`Ten years after the movement began, the work is not done.`,`${convicted.length} convicted. Pride index ${prideIndex()}. The Chairman ${state.network.chairman.stage==="convicted"?"is in prison":"is still free"}.`,"Some republics are rebuilt in a decade. Most take longer."]
 }[e.id];
 return {lines,stats:[["Years",years],["Cases answered",answered],["Cases no one reached",ignored],["Convicted",convicted.length],["Pride index",prideIndex()],["Laws passed",Object.values(state.bills).filter(b=>b.passedOn).length]]};}
function showEnding(){if(!state.ending||state.ending.dismissed||document.querySelector(".ending-screen"))return;const def=ENDINGS[state.ending.id],story=endingStory();
 const alt=/abhijeet\s+dipke/i.test(state.player.name)?`<p class="ending-note">Alternate history. Abhijeet Dipke is a real person; everything after 28 September 2026 in this story is fiction, not a prediction.</p>`:"";
 const el=document.createElement("div");el.className=`decision-modal ending-screen ${def.tone}`;el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");
 el.innerHTML=`<div class="decision-box ending-box"><small>${safe(state.ending.date)} · THE END</small><h2>${safe(def.title)}</h2>${story.lines.map(l=>`<p>${safe(l)}</p>`).join("")}<div class="management-stats">${story.stats.map(([k,v])=>metric(k,v)).join("")}</div>${alt}<p class="ending-note">Every member of the network, every victim and every verdict in this story is fictional.</p><div class="management-actions"><button data-ending="continue">Keep playing</button><button data-ending="new">Start a new story</button></div></div>`;
 document.body.appendChild(el);el.querySelector('[data-ending="continue"]').onclick=()=>{state.ending.dismissed=true;save();el.remove();};el.querySelector('[data-ending="new"]').onclick=()=>{el.remove();startHistoricalGame();};}

/** Called once per day from advanceDay, after the core day and before the save. */
function termLimitDaily(){const lapsed=ELECTIONS.find(e=>e.kind==="general"&&addDays(e.closes,1)===state.date);if(!lapsed||state.contested[lapsed.id])return;if(state.phase==="government"){state.phase="opposition";record("The term ended",`${state.org.name} did not contest the ${lapsed.name} election and left government.`);}}
function act3Daily(){ensureAct3State();termLimitDaily();expireInjustices();spawnInjustice();outrageDaily();justiceDaily();retaliationDaily();billsDaily();checkEndings();}
