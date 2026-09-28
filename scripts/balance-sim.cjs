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
  for(const file of ['data/reality/historical-scenes.js','src/shared/campaign-rules.js','engine/republic-engine.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
  vm.runInContext(fs.readFileSync('game.js','utf8').replace(/init\(\);\s*$/,'')+'\n;this.__g={get state(){return state;},set state(v){state=v;}};',context);
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
  passive:{route:'civic',hire:false,passive:true}
};

function play(name,cfg,seed=7){
  const ctx=boot(seed);const run=code=>vm.runInContext(code,ctx);
  run(decide);run('startHistoricalGame();');
  const timeline=[];const milestones={};const mark=(k)=>{if(!milestones[k])milestones[k]=run('state.date');};
  let guard=0,nextSnap=30;
  while(run('state.day')<DAYS&&guard++<DAYS*4){
    const s=run('state');
    if(s.day>=nextSnap){timeline.push(snapshot(run));nextSnap+=30;}
    if(!s.flags.firstResponse){run('botDecide(2)');continue;}
    if(s.pendingScenes.length){run(`botScene(list=>list.reduce((a,b)=>((b.effect.credibility||0)+(b.effect.morale||0))>((a.effect.credibility||0)+(a.effect.morale||0))?b:a))`);continue;}
    if(s.date>run('timelineCutoff()')&&!s.handoff){run(`completeHandoff('Bot','Bot Movement','${cfg.route}')`);mark('handoff');continue;}
    if(s.pendingCrisis){run('resolveCrisis(1)');continue;}
    if(s.handoff&&run('CAREER_CHAPTERS[state.careerChapter||0]?.done()'))run('advanceChapter()');
    const ch=s.careerChapter||0;if(s.handoff)for(let i=1;i<=ch;i++)mark('chapter'+i);
    if(cfg.passive){run('waitForDispatch()');continue;}
    if(s.player.energy<22){run(`performAction('rest')`);continue;}
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
      if(cfg.route==='civic'&&!s.rtiRequests.some(r=>['filed','appealed'].includes(r.status))&&s.org.funds>=1500){if(run(`botTry(()=>rtiAction('file',RTI_TOPICS[state.rtiRequests.length%RTI_TOPICS.length].id))`))continue;}
      if(cfg.route==='electoral'){
        if(s.phase==='movement'&&s.org.volunteers>=500&&s.org.credibility>=60&&s.org.funds>=250000&&s.support>=35){run(`performAction('found-party')`);mark('party');continue;}
        if(s.phase!=='movement'){
          if(s.campaign.preparation>=30){if(s.org.funds>=50000){run(`performAction('election')`);mark('election');continue;}}
          else if(s.org.funds>=25000&&s.player.energy>=8){if(run(`botTry(()=>performAction('campaign'))`))continue;}
        }
      }
      if(s.org.volunteers<500&&s.org.funds>=3000&&s.day%2===0){if(run(`botTry(()=>performAction('recruit'))`))continue;}
      if(s.support<35&&s.org.funds>=12000&&s.player.energy>=12&&!s.projects.some(p=>p.status==='active')){if(run(`botTry(()=>startProject('doorstep'))`))continue;}
      if(s.support<35&&s.org.funds>=5000&&s.day%3===0){if(run(`botTry(()=>performAction('briefing'))`))continue;}
    }
    if(run(`botTry(()=>performAction('fundraise'))`))continue;
    run(`advanceDay()`);
  }
  const final=snapshot(run);
  return {name,milestones,final,timeline,brokeMonths:run(`state.history.filter(h=>/shortfall/i.test(h.title)).length`),resignations:run(`state.history.filter(h=>h.title==='Resignation').length`),
    elections:run('state.elections.map(e=>e.seats)'),jantarDone:run('Object.keys(state.jantarTasks).length'),negotiated:!!run('state.jantarCampaign.negotiation'),
    peakFunds:Math.max(...timeline.map(t=>t.funds),final.funds),lowEnergyDays:timeline.filter(t=>t.energy<20).length};
}
function snapshot(run){return run(`({date:state.date,funds:state.org.funds,volunteers:state.org.volunteers,credibility:state.org.credibility,support:state.support,energy:state.player.energy,stress:state.player.stress,health:state.player.health,job:state.player.jobStanding,money:state.player.money,staff:team().filter(x=>['paid','volunteer','on_leave'].includes(x.status)).length,payroll:GameEngine.api().payrollDue(state.world)})`);}

const results=Object.entries(STRATEGIES).map(([n,c])=>play(n,c));
if(process.argv.includes('--json'))console.log(JSON.stringify(results,null,1));
else for(const r of results){
  console.log(`\n=== ${r.name} ===`);
  console.log('milestones',JSON.stringify(r.milestones));
  console.log('jantar tasks',r.jantarDone,'/13 · negotiated',r.negotiated,'· elections',JSON.stringify(r.elections),'· shortfall months',r.brokeMonths,'· resignations',r.resignations,'· peak funds',r.peakFunds);
  for(const t of r.timeline.filter((_,i)=>i%2===0))console.log(`  ${t.date} funds ${String(t.funds).padStart(8)} vol ${String(t.volunteers).padStart(4)} cred ${String(t.credibility).padStart(3)} sup ${String(t.support).padStart(3)} en ${String(t.energy).padStart(3)} hp ${t.health} job ${t.job} ₹own ${t.money} staff ${t.staff}`);
  console.log('  final',JSON.stringify(r.final));
}
