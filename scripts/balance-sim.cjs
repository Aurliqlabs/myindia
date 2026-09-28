/* Plays the real browser game (game.js + engine bundle) headlessly with scripted strategies and reports
 * how the economy behaves. Usage: node scripts/balance-sim.cjs [days=600] [--json] */
const fs=require('node:fs');
const vm=require('node:vm');
const DAYS=Number(process.argv[2])||600;

function boot(seed){
  const context={console,Date,Math:Object.create(Math),Intl,localStorage:{setItem(){},getItem(){return null;}},setTimeout:()=>0,clearTimeout:()=>{},
    document:{querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>({setAttribute(){},querySelector:()=>null,querySelectorAll:()=>[],remove(){}}),body:{appendChild(){}}}};
  // Deterministic Math.random per run so strategies are comparable.
  let s=seed>>>0;context.Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  vm.createContext(context);
  for(const file of ['data/reality/historical-scenes.js','data/reality/injustice-patterns.js','src/shared/campaign-rules.js','engine/republic-engine.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
  vm.runInContext(fs.readFileSync('game.js','utf8').replace(/init\(\);\s*$/,''),context);
  vm.runInContext(fs.readFileSync('act3.js','utf8'),context);
vm.runInContext(fs.readFileSync('ui.js','utf8'),context);
  // Count what the decisions actually are, by wrapping every player-facing entry point.
  vm.runInContext(`var __counts={};(function(){const wrap=(name,key)=>{const f=globalThis[name];globalThis[name]=function(...a){const k=key(a),r=f.apply(this,a);__counts[k]=(__counts[k]||0)+1;return r;};};wrap('performAction',a=>'action:'+a[0]);wrap('respondInjustice',()=>'answer injustice case');wrap('networkAction',a=>'network:'+a[0]);wrap('channelOutrage',a=>'outrage:'+a[0]);wrap('introduceBill',()=>'introduce bill');wrap('prepareJantar',()=>'jantar task');wrap('startProject',()=>'operation');wrap('peopleAction',a=>'people:'+a[0]);wrap('contestAssembly',()=>'state election');wrap('campaignAction',a=>'campaign:'+a[0]);wrap('rtiAction',a=>'rti:'+a[0]);wrap('civicAction',a=>'civic:'+a[1]);wrap('botScene',()=>'historical dispatch');wrap('waitForDispatch',()=>'wait for dispatch');const adv=globalThis.advanceWithRoutine;globalThis.advanceWithRoutine=function(n){const d=state.day;adv(n);const k='routine advanced '+(state.day-d)+' days';__counts[k]=(__counts[k]||0)+1;};})();`,context);
  vm.runInContext('renderIntro=()=>{};show=()=>{};renderGame=()=>{};renderPage=()=>{};toast=()=>{};openHandoff=()=>{state.pendingHandoff=false;};',context);
  return context;
}

/** Mirrors openDecision's click handler without a DOM. */
const decide=`function botDecide(i){const ev=nextDecision();const c=ev.choices[i]||ev.choices[0];const cost=-(c[2].funds||0);if(cost>state.org.funds)return false;applyEffect(c[2]);state.lastDecisionDay=state.day;if(ev.id==="handoff-eci")state.flags.handoffResolved=true;if(ev.id==="first-response"){state.flags.firstResponse=c[0];state.player.jobStanding=clamp(state.player.jobStanding+(i===2?-8:2));}record(ev.title,c[0]);state.eventIndex++;advanceDay();return true;}
function botScene(pick){const id=state.pendingScenes[0];const x=REAL_SCENES.find(v=>v.id===id);const affordable=x.choices.filter(c=>-(c.effect.funds||0)<=state.org.funds);const choice=pick(affordable.length?affordable:[x.choices.reduce((a,b)=>(b.effect.funds||0)>(a.effect.funds||0)?b:a)]);state.sceneResponses[id]=choice.label;state.pendingScenes=state.pendingScenes.filter(v=>v!==id);applyEffect(choice.effect,"bot");}
function botTry(fn){try{const d=state.day;fn();return state.day!==d;}catch(e){return false;}}`;

const STRATEGIES={
  /** Answers dispatches, fundraises every day it can and rests only when exhausted. */
  grinder:{route:'civic',hire:false},
  /** Same, but takes on paid staff early and leans on them. */
  builder:{route:'electoral',hire:true},
  /** Only answers dispatches and waits: the lower bound. */
  passive:{route:'civic',hire:false,passive:true},
  /** Electoral and disciplined: saves for the party, builds seats, and saves the network fight for government. */
  champion:{route:'electoral',hire:true,champion:true},
  /** The champion's decisions, with donor drives and rest handed to the weekly routine. */
  routine:{route:'electoral',hire:true,champion:true,routine:true}
};

function play(name,cfg,seed=7){
  const ctx=boot(seed);const run=code=>vm.runInContext(code,ctx);
  run(decide);run('startHistoricalGame();');
  const timeline=[];const milestones={};const mark=(k)=>{if(!milestones[k])milestones[k]=run('state.date');};
  let guard=0,nextSnap=30;const decisions={};
  while(run('state.day')<DAYS&&guard++<DAYS*4){
    const s=run('state');
    // Every loop step is one decision a human would have to click.
    const year=s.date.slice(0,4);decisions[year]=(decisions[year]||0)+1;
    if(s.day>=nextSnap){timeline.push(snapshot(run));nextSnap+=30;}
    if(!s.flags.firstResponse){run('botDecide(2)');continue;}
    if(s.pendingScenes.length){run(`botScene(list=>list.reduce((a,b)=>((b.effect.credibility||0)+(b.effect.morale||0))>((a.effect.credibility||0)+(a.effect.morale||0))?b:a))`);continue;}
    if(s.date>run('timelineCutoff()')&&!s.handoff){run(`completeHandoff('Bot','Bot Movement','${cfg.route}')`);mark('handoff');continue;}
    if(s.pendingCrisis){run('resolveCrisis(1)');continue;}
    if(s.ending){mark('ending:'+s.ending.id);break;}
    if(s.handoff&&run('CAREER_CHAPTERS[state.careerChapter||0]?.done()'))run('advanceChapter()');
    const ch=s.careerChapter||0;if(s.handoff)for(let i=1;i<=ch;i++)mark('chapter'+i);
    if(cfg.passive){run('waitForDispatch()');continue;}
    if(s.player.energy<22){run(`performAction('rest')`);continue;}
    // Act 3: answer cases (evidence first), channel anger, pursue the network, legislate.
    const answered=run(`(()=>{for(const x of openInjustices()){const t=INJUSTICE_CASES.find(c=>c.id===x.id);const order=t.responses.map((r,i)=>i).filter(i=>!${cfg.champion?'true':'false'}||state.phase!=='movement'||-(t.responses[i].effect.funds||0)<=3000).sort((a,b)=>(t.responses[b].evidence||0)-(t.responses[a].evidence||0));for(const i of order){try{respondInjustice(x.uid,i);return true;}catch(e){}}}return false;})()`);
    if(answered)continue;
    if(s.org.legal>=60&&s.org.funds>=30000){if(run(`botTry(()=>channelOutrage('counsel'))`))continue;}
    if(s.outrage>=50&&s.org.funds>=10000&&s.player.energy>=12){if(run(`botTry(()=>channelOutrage('protest'))`))continue;}
    // Save for the general election: in the 90 days before it opens and while it is open, keep ₹60,000 back.
    const electionDue=s.phase!=='movement'&&run(`(()=>{const e=openElection('general')||nextElection('general');return !!e&&!state.contested[e.id]&&e.opens<=addDays(state.date,90);})()`);
    const thrifty=cfg.champion&&(s.phase==='movement'||electionDue&&s.org.funds<110000);
    if(s.handoff&&!thrifty){
      const act=run(`(()=>{for(const m of NETWORK.filter(memberVisible)){const n=state.network[m.id];
        if(n.stage==='free'&&n.evidence>=6)try{networkAction('complain',m.id);return true;}catch(e){}
        if(n.stage==='trial'&&!(n.shieldUntil>state.date)&&state.org.funds>=40000)try{networkAction('protect',m.id);return true;}catch(e){}
        if(n.stage==='investigation'&&state.org.funds>=60000&&state.day%4===0)try{networkAction('push',m.id);return true;}catch(e){}
        if(n.stage==='acquitted'&&state.org.funds>=25000)try{networkAction('appeal',m.id);return true;}catch(e){}
        if(m.id==='chairman'&&state.org.funds>=60000)try{networkAction('audit',m.id);return true;}catch(e){}}
        if(state.phase==='government')for(const b of BILLS){const x=state.bills[b.id];if(!x?.passedOn&&!x?.voteOn)try{introduceBill(b.id);return true;}catch(e){}}
        return false;})()`);
      if(act)continue;
      if(!thrifty&&s.phase==='government'&&s.org.funds>=150000&&s.lastPhaseActionDay!==s.day){if(run(`botTry(()=>performAction('services'))`))continue;}
    }
    if(run('Object.keys(state.jantarTasks).length')===13)mark('jantar13');
    // Historical window priorities.
    if(s.date>='2026-05-16'&&s.date<='2026-06-20'&&run('Object.keys(state.jantarTasks).length')<13){
      const next=run(`Object.entries(JANTAR_TASKS).find(([k,c])=>!state.jantarTasks[k]&&c<=state.org.funds)?.[0]`);
      if(next&&run(`botTry(()=>prepareJantar('${next}'))`))continue;
    }
    if(s.date>='2026-06-06'&&s.date<='2026-07-25'&&s.jantarCampaign.lastDate!==s.date){if(run(`botTry(()=>{runCampaignDay(state.jantarCampaign.days%3===0?'mobilise':'student_help');advanceDay();})`))continue;}
    if(s.date>='2026-07-20'&&s.date<='2026-07-25'&&!s.jantarCampaign.negotiation){run(`try{chooseNegotiation('exam_reform',true,false);advanceDay();}catch(e){}`);continue;}
    if(cfg.hire&&s.org.funds>40000){const hired=run(`(()=>{const x=team().find(v=>v.founding&&v.status==='available');if(!x)return false;return botTry(()=>peopleAction('hire',x.id));})()`);if(hired)continue;}
    if(s.handoff){
      // Career play: grow volunteers and presence, publish cases, then follow the route.
      if(!Object.values(s.org.presence).some(v=>v>=10)&&s.org.funds>=20000&&s.player.energy>=10){s.targetState='Maharashtra';if(run(`botTry(()=>performAction('state-visit'))`))continue;}
      const openIssue=run(`CIVIC_ISSUES.find(i=>!state.civicCases[i.id]?.outcome&&i.id!=='survivor')?.id`);
      if(openIssue&&run('majorCivicCases()')<3){const c=s.civicCases[openIssue]||{};if(run(`botTry(()=>{civicAction('${openIssue}','${c.verifiedOn?'publish':'verify'}');advanceDay();})`))continue;}
      if(cfg.route==='civic'&&run('majorCivicCases()')>=3){
        if(!run('activeCampaign()')&&s.org.funds>=50000){const next=run(`NATIONAL_CAMPAIGNS.find(d=>!state.nationalCampaigns.some(c=>c.id===d.id))?.id`);if(next&&run(`botTry(()=>campaignAction('launch','${next}'))`))continue;}
        if(run('activeCampaign()')&&s.player.energy>=8){const move=['coalition','lobby','media'][s.day%3];if(run(`botTry(()=>campaignAction('${move}'))`))continue;}
      }
      if(cfg.route==='civic'&&!s.rtiRequests.some(r=>['filed','appealed'].includes(r.status))&&s.org.funds>=1500){if(run(`botTry(()=>rtiAction('file',RTI_TOPICS[state.rtiRequests.length%RTI_TOPICS.length].id))`))continue;}
      if(cfg.route==='electoral'){
        if(s.phase==='movement'&&s.org.volunteers>=500&&s.org.credibility>=60&&s.org.funds>=250000&&s.support>=35){run(`performAction('found-party')`);mark('party');continue;}
        if(s.phase!=='movement'){
          const assembly=run(`ELECTIONS.find(e=>e.kind==='assembly'&&e.opens<=state.date&&state.date<=e.closes&&!state.contested[e.id]&&state.org.funds>=e.seats*1000)?.id`);
          if(assembly&&s.player.energy>=10){if(run(`botTry(()=>contestAssembly('${assembly}'))`)){mark('firstAssembly');continue;}}
          const general=run(`openElection('general')?.id`);
          if(general&&!s.contested[general]&&s.campaign.preparation>=30&&s.org.funds>=50000){run(`performAction('election')`);mark('election-'+general);continue;}
          const reserve=general||run(`nextElection('general')?.opens<=addDays(state.date,60)`)?50000:0;
          if(!cfg.routine&&(s.campaign.preparation<60||cfg.champion)&&s.org.funds>=25000+reserve&&s.player.energy>=8){if(cfg.champion)run(`state.targetState=Object.entries(SEAT_COUNTS).sort((a,b)=>(state.org.presence[a[0]]||0)/a[1]-(state.org.presence[b[0]]||0)/b[1]||b[1]-a[1])[0][0]`);if(run(`botTry(()=>performAction('campaign'))`))continue;}
        }
      }
      if(s.org.volunteers<500&&s.org.funds>=3000&&s.day%2===0){if(run(`botTry(()=>performAction('recruit'))`))continue;}
      if(s.support<35&&s.org.funds>=12000&&s.player.energy>=12&&!s.projects.some(p=>p.status==='active')){if(run(`botTry(()=>startProject('doorstep'))`))continue;}
      if(s.support<35&&s.org.funds>=5000&&s.day%3===0){if(run(`botTry(()=>performAction('briefing'))`))continue;}
    }
    if(cfg.routine&&s.flags.firstResponse&&s.date>='2026-05-16'){if(s.phase!=='movement')s.routine.tours=2;run(`advanceWithRoutine(7)`);continue;}
    if(run(`botTry(()=>performAction('fundraise'))`))continue;
    run(`advanceDay()`);
  }
  const final=snapshot(run);
  return {name,milestones,final,timeline,brokeMonths:run(`state.history.filter(h=>/shortfall/i.test(h.title)).length`),resignations:run(`state.history.filter(h=>h.title==='Resignation').length`),
    elections:run('state.elections.map(e=>e.contest+":"+e.seats)'),assemblies:run('state.assemblyResults.map(r=>r.state+" "+r.seats+"/"+r.total)'),reforms:run('state.nationalCampaigns.map(c=>c.id+":"+(c.outcome||"active")+"@"+Math.round(c.progress)+" "+c.startedOn+"→"+(c.closedOn||""))'),jantarDone:run('Object.keys(state.jantarTasks).length'),negotiated:!!run('state.jantarCampaign.negotiation'),
    ending:run('state.ending?.id??null'),endingDate:run('state.ending?.date??null'),convicted:run('NETWORK.filter(m=>state.network[m.id].stage==="convicted").map(m=>m.id+"@"+state.network[m.id].convictedOn)'),acquitted:run('NETWORK.filter(m=>state.network[m.id].stage==="acquitted").map(m=>m.id)'),pride:run('prideIndex()'),institutions:run('state.institutions'),cases:run('({answered:state.injustices.filter(x=>x.status==="answered").length,ignored:state.injustices.filter(x=>x.status==="ignored").length,total:state.injusticeCount})'),laws:run('Object.keys(state.bills).filter(k=>state.bills[k].passedOn)'),
    counts:run('__counts'),decisions,totalDecisions:Object.values(decisions).reduce((a,b)=>a+b,0),
    peakFunds:Math.max(...timeline.map(t=>t.funds),final.funds),lowEnergyDays:timeline.filter(t=>t.energy<20).length};
}
function snapshot(run){return run(`({date:state.date,funds:state.org.funds,volunteers:state.org.volunteers,credibility:state.org.credibility,support:state.support,energy:state.player.energy,stress:state.player.stress,health:state.player.health,job:state.player.jobStanding,money:state.player.money,staff:team().filter(x=>['paid','volunteer','on_leave'].includes(x.status)).length,payroll:GameEngine.api().payrollDue(state.world),legal:state.org.legal,outrage:Math.round(state.outrage)})`);}

const seedsArg=process.argv.find(x=>x.startsWith('--seeds='));
if(seedsArg){
  // Robustness: how often does each strategy reach each ending across different random seeds?
  const n=Number(seedsArg.split('=')[1]);
  const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7).split(',');
  for(const [name,cfg] of Object.entries(STRATEGIES).filter(([k])=>only?only.includes(k):k!=='passive')){
    const tally={};for(let seed=1;seed<=n;seed++){const r=play(name,cfg,seed*7919);const key=r.ending??'none';tally[key]=(tally[key]||0)+1;
      console.log(name,'seed',seed,r.ending,r.endingDate,'· decisions',r.totalDecisions,'· elections',r.elections.join(' '),'· convicted',r.convicted.length,'· pride',r.pride);}
    console.log('==',name,JSON.stringify(tally));
  }
  process.exit(0);
}
const results=Object.entries(STRATEGIES).map(([n,c])=>play(n,c));
if(process.argv.includes('--json'))console.log(JSON.stringify(results,null,1));
else for(const r of results){
  console.log(`\n=== ${r.name} ===`);
  console.log('milestones',JSON.stringify(r.milestones));
  if(r.assemblies.length)console.log('assemblies',r.assemblies.join(' · '));
  if(r.reforms.length)console.log('reforms',r.reforms.join(' · '));
  console.log('ENDING',r.ending,r.endingDate,'· pride',r.pride,'· institutions',JSON.stringify(r.institutions),'· laws',r.laws.length,'· cases',JSON.stringify(r.cases));
  console.log('decisions',r.totalDecisions,JSON.stringify(r.decisions));
  console.log('convicted',r.convicted.join(', ')||'none','· acquitted',r.acquitted.join(', ')||'none');
  console.log('jantar tasks',r.jantarDone,'/13 · negotiated',r.negotiated,'· elections',JSON.stringify(r.elections),'· shortfall months',r.brokeMonths,'· resignations',r.resignations,'· peak funds',r.peakFunds);
  for(const t of r.timeline.filter((_,i)=>i%2===0))console.log(`  ${t.date} funds ${String(t.funds).padStart(8)} vol ${String(t.volunteers).padStart(4)} cred ${String(t.credibility).padStart(3)} sup ${String(t.support).padStart(3)} en ${String(t.energy).padStart(3)} hp ${t.health} job ${t.job} ₹own ${t.money} staff ${t.staff} legal ${t.legal} rage ${t.outrage}`);
  console.log('  final',JSON.stringify(r.final));
}
