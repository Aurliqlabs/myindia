const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('game.js','utf8').replace(/init\(\);\s*$/,'');
const saved={};
const context={console,Date,Math,Intl,localStorage:{setItem:(key,value)=>{saved[key]=value;}},document:{querySelector:()=>({textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){}}})},setTimeout:()=>0,clearTimeout:()=>{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('data/reality/historical-scenes.js','utf8'),context);
vm.runInContext(fs.readFileSync('data/reality/injustice-patterns.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/shared/campaign-rules.js','utf8'),context);
vm.runInContext(fs.readFileSync('engine/republic-engine.js','utf8'),context);
vm.runInContext(source,context);
vm.runInContext(fs.readFileSync('act3.js','utf8'),context);
vm.runInContext(fs.readFileSync('ui.js','utf8'),context);
vm.runInContext(`renderIntro=()=>{};show=()=>{};renderGame=()=>{};startHistoricalGame();`,context);
assert.equal(vm.runInContext('state.player.name',context),'Abhijeet Dipke');
assert.equal(vm.runInContext('state.historicalRoleplay',context),true);
vm.runInContext(`state.flags.firstResponse='Help students organise';waitForDispatch();`,context);
assert.equal(vm.runInContext('state.date',context),'2026-05-15','timeline stops at the first dated dispatch');
assert.ok(vm.runInContext('state.pendingScenes.includes("exam-remark")',context));
assert.equal(vm.runInContext('REAL_SCENES.find(x=>x.id==="exam-remark").sources.length',context),2,'the 15 May dispatch cites both reports');
assert.ok(vm.runInContext('REAL_SCENES.every(x=>x.sources.length&&x.sources.every(s=>s.name&&/^https:\\/\\//.test(s.url))&&x.status)',context),'every dispatch has a status and linked sources');
assert.ok(vm.runInContext('REAL_SCENES.some(x=>x.id==="cjp-campus-safety"&&x.date==="2026-09-28")',context));
vm.runInContext(`state.date='2026-09-28';state.pendingScenes=[];waitForDispatch();`,context);
assert.equal(vm.runInContext('state.date',context),'2026-09-29','historical progression stops at the player handoff');
assert.ok(vm.runInContext('careerDispatchHTML().includes("Choose who leads next")',context));
assert.throws(()=>vm.runInContext("completeHandoff('','New movement','civic')",context),/valid name/);
vm.runInContext(`completeHandoff('Johnson','New movement','civic');state.org.presence={Maharashtra:12};state.org.volunteers=125;advanceChapter();`,context);
assert.equal(vm.runInContext('state.player.name',context),'Johnson');
assert.equal(vm.runInContext('state.org.name',context),'New movement');
assert.equal(vm.runInContext('state.careerChapter',context),1);
vm.runInContext(`state={date:'2026-05-14',day:1,phase:'movement',player:{name:'Test',energy:82,stress:20},org:{funds:12000,credibility:50,media:0,legal:0},support:20};ensureState();renderPage=()=>{};civicAction('water','verify');civicAction('water','support');civicAction('water','publish');`,context);
assert.equal(vm.runInContext('timelineCutoff()',context),'2026-09-25','earlier saves keep their original simulation boundary');
assert.equal(vm.runInContext('state.civicCases.water.outcome',context),'Sourced public briefing');
assert.equal(vm.runInContext('state.org.funds',context),7000);
assert.throws(()=>vm.runInContext("civicAction('water','rage')",context),/closed/);
vm.runInContext(`civicAction('heritage','rage');`,context);
assert.equal(vm.runInContext('state.org.credibility',context),48);
assert.ok(vm.runInContext('civicDeskHTML().includes("Public record")',context));
vm.runInContext(`state={date:'2026-06-06',day:1,phase:'movement',player:{name:'Test',energy:82,health:92,stress:24,level:1,recognition:11},org:{funds:42000,volunteers:136,staff:0,credibility:52,media:18,legal:8},support:22,general:5,followers:14300,operationProgress:18};renderGame=()=>{};ensureState();startProject('campus');`,context);
let state=vm.runInContext('state',context);
assert.equal(state.day,2);
assert.equal(state.org.volunteers,166);
assert.equal(state.projects[0].status,'completed');
// People now live in the TypeScript engine world inside the same state tree.
assert.ok(vm.runInContext('state.world&&state.world.schemaVersion===1',context),'every game carries an engine world');
assert.equal(vm.runInContext('team().filter(x=>x.founding&&x.status==="available").length',context),4,'four founding friends can be invited');
vm.runInContext(`peopleAction('hire','friend_asha');`,context);
state=vm.runInContext('state',context);
assert.equal(state.world.characters.friend_asha.employed,true);
assert.equal(state.world.characters.friend_asha.roleId,'legal_lead','a hire takes the best-fit role');
assert.equal(vm.runInContext('GameEngine.api().payrollDue(state.world)',context),15000);
assert.equal(vm.runInContext('monthlyCosts()',context),6100+15000,'salaries join operating costs');
assert.ok(vm.runInContext('team().find(x=>x.id==="friend_asha").signals.length>0',context),'colleagues are described by signals, not raw numbers');
assert.ok(saved['republic543-save'].includes('friend_asha'),'the saved tree includes the engine world');
vm.runInContext(`state.phase='party';state.org.funds=500000;state.org.volunteers=600;state.org.credibility=70;state.player.energy=80;state.support=40;state.general=20;state.targetState='Kerala';`,context);
const before=JSON.stringify(vm.runInContext('simulateElection()',context));
assert.equal(JSON.stringify(vm.runInContext('simulateElection()',context)),before,'same save must yield same election');
vm.runInContext(`performAction('campaign');performAction('election');`,context);
assert.equal(vm.runInContext('state.elections.length',context),0,'no general election outside its window');
vm.runInContext(`state.date='2029-04-02';performAction('campaign');performAction('campaign');performAction('election');`,context);
assert.equal(vm.runInContext('state.elections[0].contest',context),'general-2029');
assert.equal(vm.runInContext('state.contested["general-2029"]',context),'2029-04-04','the result is tied to its window');
state=vm.runInContext('state',context);
assert.equal(state.org.presence.Kerala,45);
const result=state.elections[0];
assert.equal(Object.values(result.byState).reduce((n,x)=>n+x.total,0),543);
assert.equal(Object.values(result.byState).reduce((n,x)=>n+x.won,0),result.seats);
assert.ok(result.byState.Kerala.strength>JSON.parse(before).byState.Kerala.strength);
vm.runInContext(`state.phase='government';state.org.funds=500000;performAction('services');`,context);
assert.equal(vm.runInContext('state.governance.publicServices',context),52);
vm.runInContext(`state.date='2026-05-14';state.day=1;state.flags.firstResponse=undefined;`,context);
assert.equal(vm.runInContext('nextDecision().id',context),'first-response');
vm.runInContext(`state.flags.firstResponse='Help students organise';state.date='2026-06-05';advanceDay();`,context);
state=vm.runInContext('state',context);
assert.equal(state.date,'2026-06-06');
assert.ok(state.pendingScenes.includes('cjp-jantar'));
assert.equal(vm.runInContext('REAL_SCENES.some(x=>x.id==="cjp-jantar"&&!x.archive&&x.choices.length===3)',context),true);
assert.equal(vm.runInContext('REAL_SCENES.every((x,i,a)=>i===0||a[i-1].date<=x.date)',context),true);
vm.runInContext(`state.date='2026-06-06';state.flags.firstResponse='Help students organise';state.player.trait='organiser';state.player.skills={...TRAIT_SKILLS.organiser};state.player.jobStanding=75;state.org.funds=50000;state.jantarTasks={water:true,security:true,permissions:true};state.jantarCampaign={days:0,crowdTrust:38,studentTrust:35,evidenceQuality:20,legalPressure:0,fatigue:0,offers:0};runCampaignDay('mobilise');`,context);
state=vm.runInContext('state',context);
assert.ok(state.jantarCampaign.crowdTrust>38 && state.org.funds===43500,'prepared mobilisation must improve crowd trust and spend cash');
assert.ok(state.player.jobStanding<75,'fieldwork must cost job standing');
assert.throws(()=>vm.runInContext("runCampaignDay('mobilise')",context),/already made/);
vm.runInContext(`state.jantarCampaign={days:0,crowdTrust:38,studentTrust:35,evidenceQuality:20,legalPressure:0,fatigue:0,offers:0};state.jantarTasks={};runCampaignDay('mobilise');`,context);
assert.ok(vm.runInContext('state.jantarCampaign.crowdTrust<38 && state.jantarCampaign.legalPressure>0',context),'unsafe mobilisation must lower trust');
vm.runInContext(`state.date='2026-07-21';chooseNegotiation('exam_reform',true,false);`,context);
assert.equal(vm.runInContext('state.jantarCampaign.negotiation.demand',context),'exam_reform');
const profile=vm.runInContext(`buildCitizenProfile({name:'Citizen',age:28,homeState:'Kerala',profession:'Analyst',trait:'analyst',monthlyIncome:50000,savings:25000,monthlyLivingCosts:30000,points:{analysis:8,communication:4}})`,context);
assert.equal(profile.skills.analysis,73);
assert.equal(profile.monthlyIncome,50000);
assert.throws(()=>vm.runInContext(`buildCitizenProfile({name:'Bad',age:28,trait:'speaker',monthlyIncome:1,savings:0,monthlyLivingCosts:0,points:{analysis:13}})`,context),/12 skill points/);
assert.notEqual(vm.runInContext('TRAIT_SKILLS.analyst.communication',context),vm.runInContext('TRAIT_SKILLS.speaker.communication',context));
vm.runInContext(`state.date='2026-05-14';`,context);
assert.equal(vm.runInContext('sceneArchiveHTML().includes("An education minister resigns")',context),false,'future source records must not spoil the player timeline');
const shared=require('../src/shared/campaign-rules.js');
const caseInput={focus:'mobilise',skill:60,prepared:3,crowdSafety:true,fatigue:12};
const nodeResult=shared.resolveFieldDay(caseInput);
const browserResult=vm.runInContext('RepublicCampaignRules.resolveFieldDay('+JSON.stringify(caseInput)+')',context);
assert.equal(JSON.stringify(browserResult),JSON.stringify(nodeResult),'browser and core must use the same campaign rules');
const worldFactory=require('../dist/src/core/world.js');
const coreCampaign=require('../dist/src/game/campaign-2026.js');
const parity=worldFactory.createNewGame({name:'Parity',age:28,homeState:'Kerala',profession:'Teacher',trait:'organiser'});
parity.date='2026-06-06';parity.flags.first_response='organise';
parity.organisation.finance.organisationCash=50000;
for(const task of ['water','security','permissions'])parity.flags['jantar_'+task]=50;
coreCampaign.organiseProtestDay(parity,'mobilise');
vm.runInContext(`state.date='2026-06-06';state.flags.firstResponse='Organise';state.jantarTasks={water:true,security:true,permissions:true};state.jantarCampaign={days:0,crowdTrust:38,studentTrust:35,evidenceQuality:20,legalPressure:0,fatigue:0,offers:0};state.player.skills={...TRAIT_SKILLS.organiser};state.org.funds=50000;state.org.volunteers=0;runCampaignDay('mobilise');`,context);
const browser=vm.runInContext('state',context);
assert.equal(browser.org.funds,parity.organisation.finance.organisationCash);
assert.equal(browser.org.volunteers,parity.organisation.volunteers);
assert.equal(browser.jantarCampaign.crowdTrust,parity.campaign2026.crowdTrust);
assert.equal(browser.jantarCampaign.legalPressure,parity.campaign2026.legalPressure);
vm.runInContext(`state.date='2026-08-15';state.org.funds=60000;state.schoolAudits=[];schoolAuditAction('open');`,context);
let audit=vm.runInContext('state.schoolAudits[0]',context);
assert.equal(audit.status,'UNVERIFIED');
assert.equal(audit.fictionalComposite,true);
assert.throws(()=>vm.runInContext("schoolAuditAction('publish','audit-1')",context),/Legal review/);
vm.runInContext(`schoolAuditAction('document','audit-1');schoolAuditAction('witness','audit-1');schoolAuditAction('request','audit-1');schoolAuditAction('response','audit-1','denied');schoolAuditAction('review','audit-1');schoolAuditAction('publish','audit-1');`,context);
audit=vm.runInContext('state.schoolAudits[0]',context);
assert.equal(audit.status,'DISPUTED','official denial must remain disputed');
assert.ok(audit.publishedOn>audit.openedOn,'audit takes multiple days');
assert.throws(()=>vm.runInContext("schoolAuditAction('document','audit-1')",context),/closed/);
vm.runInContext("schoolAuditAction('open');schoolAuditAction('document','audit-2');schoolAuditAction('witness','audit-2');schoolAuditAction('request','audit-2');schoolAuditAction('response','audit-2','acknowledged');schoolAuditAction('review','audit-2');schoolAuditAction('publish','audit-2');",context);
assert.equal(vm.runInContext('state.schoolAudits[0].status',context),'VERIFIED');
vm.runInContext("schoolAuditAction('open');schoolAuditAction('document','audit-3');schoolAuditAction('request','audit-3');schoolAuditAction('response','audit-3','acknowledged');schoolAuditAction('review','audit-3');",context);
assert.throws(()=>vm.runInContext("schoolAuditAction('publish','audit-3')",context),/document and witness/);
assert.ok(saved['republic543-save'].includes('fictionalComposite'));
vm.runInContext(`state.date='2026-05-15';state.day=2;state.phase='movement';state.flags.firstResponse='Contact a journalist';state.pendingScenes=[];state.pendingCrisis=null;state.pendingTip=null;state.player.energy=60;state.player.stress=20;waitForDispatch();`,context);
state=vm.runInContext('state',context);
assert.equal(state.date,'2026-05-16','waiting must stop at the first historical dispatch');
assert.ok(state.pendingScenes.length>0,'historical response must remain pending');
assert.equal(state.player.energy,60,'routine waiting must not drain the player as if they worked every day');
const blockedDay=state.day;
vm.runInContext('waitForDispatch()',context);
assert.equal(vm.runInContext('state.day',context),blockedDay,'waiting must not bypass an unanswered dispatch');
assert.ok(saved['republic543-save'].includes('pendingScenes'),'waiting must persist the paused state');
vm.runInContext(`state.date='2034-04-02';state.day=141;state.phase='party';state.pendingScenes=[];state.pendingTip=null;state.flags.handoffResolved=true;state.elections=[];state.campaign={preparation:30,spend:0};state.org.funds=100000;state.org.credibility=0;state.org.volunteers=0;state.org.presence={};state.support=0;state.general=0;performAction('election');`,context);
state=vm.runInContext('state',context);
assert.equal(state.elections[0].seats,0,'low-support party must be able to lose all seats');
assert.equal(state.phase,'party','zero seats must not unlock parliamentary opposition actions');
assert.ok(vm.runInContext('careerObjectiveHTML()',context).includes('Rebuild after election night'),'a losing career needs a clear next objective');
vm.runInContext(`var realSpawn=spawnInjustice;spawnInjustice=()=>{};state.injustices=[];state.pendingScenes=[];state.pendingCrisis=null;state.pendingTip={rivalId:'test',offeredOn:'2026-09-30'};state.phase='party';state.date='2026-10-02';const beforeWaitDay=state.day;waitForDispatch();spawnInjustice=realSpawn;`,context);
state=vm.runInContext('state',context);
assert.equal(state.date,'2026-11-01','future waiting may cover a month when no new alert arrives');
assert.equal(state.day-vm.runInContext('beforeWaitDay',context),30,'future wait must still process each calendar day');
const peopleRules=require('../src/shared/people-rules.js');
let wellbeing={energy:8,stress:55,morale:70,employed:true};let leave;
for(let day=14;day<21&&!leave;day++){const next=peopleRules.dailyWellbeing(wellbeing,`2026-05-${day}`,()=>.5);wellbeing={...wellbeing,...next};if(next.forcedLeave)leave=next.onLeaveUntil;}
assert.ok(leave,'shared staff wellbeing must trigger leave after sustained exhaustion');

// GameEngine store: fresh historical game → full save tree round-trip, including engine world state.
vm.runInContext(`startHistoricalGame();state.flags.firstResponse='Help students organise';state.org.funds=90000;peopleAction('hire','friend_meera');peopleAction('recognise','friend_meera');`,context);
const beforeSave=JSON.parse(saved['republic543-save']);
assert.equal(beforeSave.saveVersion,3);
assert.ok(beforeSave.world.memories.some(m=>m.characterId==='friend_meera'&&m.type==='founding_recognition'),'engine memories are saved');
vm.runInContext(`state={};GameEngine.load(${JSON.stringify(saved['republic543-save'])});`,context);
assert.equal(vm.runInContext('state.world.characters.friend_meera.employed',context),true,'engine state survives a reload');
const idCounter=vm.runInContext('state.world.idCounter',context);
vm.runInContext(`peopleAction('defend','friend_meera');`,context);
assert.ok(vm.runInContext('state.world.idCounter',context)>idCounter,'reloaded worlds keep issuing unique ids');
assert.throws(()=>vm.runInContext(`peopleAction('recognise','friend_meera')`,context),/already been recognised/);
vm.runInContext(`GameEngine.load(GameEngine.exportData());`,context);
assert.equal(vm.runInContext('state.world.characters.friend_meera.foundingMember',context),true,'export wrapper imports cleanly');

// Saves made before the engine was connected: paid template advisers become engine colleagues.
vm.runInContext(`GameEngine.load({date:'2026-07-01',day:49,phase:'movement',player:{name:'Old',trait:'organiser',energy:70,stress:30,health:90,level:7,recognition:3,money:1000},org:{name:'CJP',funds:40000,volunteers:90,staff:2,credibility:50,media:5,legal:3,monthlyBurn:36100},support:25,general:5,followers:100,advisers:[{name:'Aditi Rao',role:'Movement Lead',energy:60,loyalty:70,stress:20,morale:65},{name:'Imran Khan',role:'Strategy',energy:40,loyalty:30},{name:'Kavya Menon',role:'Media',energy:78,loyalty:62}]});`,context);
state=vm.runInContext('state',context);
assert.equal(state.advisers,undefined);
assert.equal(state.org.monthlyBurn,6100,'adviser salaries move from fixed costs to engine payroll');
assert.equal(vm.runInContext('GameEngine.api().payrollDue(state.world)',context),30000);
assert.equal(vm.runInContext('JSON.stringify(team().filter(x=>x.status==="paid").map(x=>x.name))',context),'["Aditi Rao","Imran Khan"]');

// Month end: salaries come out of what is left; a shortfall hits each unpaid colleague individually.
vm.runInContext(`state.date='2026-07-31';state.org.funds=10000;state.pendingScenes=[];advanceDay();`,context);
state=vm.runInContext('state',context);
assert.equal(state.org.funds,0,'operating costs and salaries drain available cash');
assert.ok(state.history.some(h=>h.title==='Staff payroll shortfall'),'payroll shortfall is reported');
assert.ok(state.world.characters.adviser_1.unpaidStreak>=1||state.world.characters.adviser_1.volunteer||!state.world.characters.adviser_1.employed,'each colleague responds to missed pay');

// Dispatch choices reach team morale through the engine.
vm.runInContext(`startHistoricalGame();state.flags.firstResponse='Organise';state.org.funds=50000;peopleAction('volunteer','friend_rohan');state.date='2026-07-25';state.pendingScenes=['cjp-minister'];`,context);
const moraleBefore=vm.runInContext('state.world.characters.friend_rohan.morale',context);
vm.runInContext(`applyEffect(REAL_SCENES.find(x=>x.id==='cjp-minister').choices[1].effect,'Thanked the volunteers.');`,context);
assert.equal(vm.runInContext('state.world.characters.friend_rohan.morale',context),Math.min(100,moraleBefore+6),'thanking volunteers lifts team morale');
assert.ok(vm.runInContext(`effectChips({funds:-3000,morale:6,legal:2})`,context).includes('Team morale +6'),'choices preview their consequences');

// 29 September handoff opens once, then each route unlocks its own desk.
vm.runInContext(`state.date='2026-09-28';state.pendingScenes=[];state.flags.firstResponse='Organise';advanceDay();`,context);
assert.equal(vm.runInContext('state.date',context),'2026-09-29');
assert.equal(vm.runInContext('state.pendingHandoff',context),true,'the handoff is queued on 29 September');
assert.ok(vm.runInContext('HANDOFF_ROUTES.map(r=>r.id).join()',context)==='civic,electoral');
vm.runInContext(`completeHandoff('Abhijeet Dipke','Cockroach Janta Party','civic');state.org.funds=200000;`,context);
assert.equal(vm.runInContext('state.player.name',context),'Abhijeet Dipke','players may keep the historical name');
assert.equal(vm.runInContext('routeOpen("civic")&&!routeOpen("electoral")',context),true);
assert.throws(()=>vm.runInContext(`electoralAction('ad')`,context),/electoral route/);
assert.throws(()=>vm.runInContext(`suitAction('file')`,context),/documented evidence/,'a petition needs a documented basis');
vm.runInContext(`rtiAction('file','school-repairs');`,context);
assert.throws(()=>vm.runInContext(`rtiAction('file','school-repairs')`,context),/already pending/);
const rtiDue=vm.runInContext('state.rtiRequests[0].dueOn',context);
vm.runInContext(`while(state.date<'${rtiDue}')advanceDay();`,context);
let rti=vm.runInContext('state.rtiRequests[0]',context);
assert.ok(['records','partial','refused'].includes(rti.status),'the RTI reply arrives on its due date');
if(rti.status==='refused'){vm.runInContext(`rtiAction('appeal','rti-1');{const due=state.rtiRequests[0].dueOn;while(state.date<due)advanceDay();}`,context);rti=vm.runInContext('state.rtiRequests[0]',context);assert.ok(['records','closed'].includes(rti.status));}
if(['records','partial'].includes(rti.status)){
 const cases=vm.runInContext('majorCivicCases()',context);
 vm.runInContext(`rtiAction('publish','rti-1');suitAction('file');`,context);
 assert.equal(vm.runInContext('majorCivicCases()',context),cases+1,'a published RTI report is a major civic case');
 const hearing=vm.runInContext('state.legalSuits[0].hearingOn',context);
 vm.runInContext(`while(state.date<'${hearing}')advanceDay();`,context);
 assert.ok(['notice','dismissed'].includes(vm.runInContext('state.legalSuits[0].status',context)),'the court rules on the hearing date');
}
// A well-drafted request is answered in full; the report and a petition built on it both follow.
vm.runInContext(`state.player.energy=80;rtiAction('file','water-tests');state.rtiRequests[0].quality=100;{const due=state.rtiRequests[0].dueOn;while(state.date<due)advanceDay();}`,context);
assert.equal(vm.runInContext('state.rtiRequests[0].status',context),'records');
const casesBefore=vm.runInContext('majorCivicCases()',context);
vm.runInContext(`rtiAction('publish',state.rtiRequests[0].id);`,context);
assert.equal(vm.runInContext('majorCivicCases()',context),casesBefore+1,'a published RTI report is a major civic case');
assert.throws(()=>vm.runInContext(`rtiAction('publish',state.rtiRequests[0].id)`,context),/nothing new/);
vm.runInContext(`suitAction('file');`,context);
assert.throws(()=>vm.runInContext(`suitAction('file')`,context),/pending hearing/);
vm.runInContext(`state.legalSuits[0].strength=100;{const hearing=state.legalSuits[0].hearingOn;while(state.date<hearing)advanceDay();}`,context);
assert.equal(vm.runInContext('state.legalSuits[0].status',context),'notice','a strong petition draws notice on its hearing date');
assert.equal(vm.runInContext('majorCivicCases()',context),casesBefore+2);
// Switching route opens the electoral desk: voter groups, ads and candidates feed the engine election.
vm.runInContext(`performAction('switch-route');state.org.funds=500000;state.player.energy=80;state.targetSegment='students';`,context);
const students=vm.runInContext('state.world.publicOpinion.students',context);
vm.runInContext(`electoralAction('ad');`,context);
assert.ok(vm.runInContext('state.world.publicOpinion.students',context)>students,'a targeted ad moves its voter group');
assert.throws(()=>vm.runInContext(`electoralAction('candidates')`,context),/Found the party/);
vm.runInContext(`state.phase='party';state.targetState='Kerala';electoralAction('candidates');`,context);
assert.equal(vm.runInContext('state.candidates.Kerala.seats',context),20);
vm.runInContext(`state.campaign.preparation=40;state.support=30;state.general=15;state.org.presence.Kerala=60;`,context);
const withSlate=vm.runInContext('simulateElection()',context);
vm.runInContext(`state.candidates.Kerala.quality=5;`,context);
const weakSlate=vm.runInContext('simulateElection()',context);
assert.ok(withSlate.byState.Kerala.voteShare>weakSlate.byState.Kerala.voteShare,'candidate quality changes the engine result');
assert.equal(Object.values(withSlate.byState).reduce((n,x)=>n+x.total,0),543);

// Balance rules found by scripts/balance-sim.cjs.
vm.runInContext(`startHistoricalGame();state.flags.firstResponse='Organise';state.date='2026-05-20';state.pendingScenes=[];state.org.funds=0;state.player.energy=90;performAction('fundraise');`,context);
const firstDrive=vm.runInContext('state.donations[0].amount',context);
vm.runInContext(`state.pendingScenes=[];performAction('fundraise');`,context);
assert.ok(vm.runInContext('state.donations[0].amount',context)<firstDrive,'back-to-back donor drives raise less');
assert.equal(vm.runInContext('state.donorFatigue',context),20,'repeated appeals build donor fatigue');
vm.runInContext(`for(let i=0;i<12;i++)advanceDay();`,context);
assert.equal(vm.runInContext('state.donorFatigue',context),0,'donors recover after a break');
vm.runInContext(`state.support=30;performAction('rest');`,context);
assert.equal(vm.runInContext('state.support',context),30,'resting does not cost national support');
vm.runInContext(`state.support=80;applyEffect({support:2});state.org.credibility=95;applyEffect({credibility:2});`,context);
assert.equal(vm.runInContext('state.support',context),80,'support gains flatten near the top');
assert.equal(vm.runInContext('state.org.credibility',context),95,'credibility gains flatten near the top');
const beforeCollapse=vm.runInContext('state.day',context);
vm.runInContext(`state.player.health=14;state.player.energy=5;advanceDay();`,context);
assert.equal(vm.runInContext('state.day',context)-beforeCollapse,4,'collapse costs three extra days');
assert.ok(vm.runInContext('state.player.health>30&&state.history.some(h=>h.title==="Collapse")',context));
vm.runInContext(`state.player.money=1000;state.player.jobStanding=0;state.player.debt=0;settlePersonalMonth();`,context);
assert.equal(vm.runInContext('state.player.debt',context),21000,'unpaid living costs become personal debt');
vm.runInContext(`state.player.jobStanding=100;state.player.monthlyIncome=35000;settlePersonalMonth();`,context);
assert.equal(vm.runInContext('state.player.debt',context),8000,'salary pays debt down first');

// Election calendar: five-year cycles, one contest per window, assembly results feed local presence.
assert.equal(vm.runInContext('ELECTIONS.filter(e=>e.kind==="general").map(e=>e.opens).join()',context),'2029-04-01,2034-04-01');
assert.equal(vm.runInContext('ELECTIONS.find(e=>e.id==="assembly-Uttar Pradesh-2027").seats',context),403);
assert.equal(vm.runInContext('new Set(ELECTIONS.filter(e=>e.kind==="assembly"&&e.opens<"2032-01-01").map(e=>e.state)).size',context),31,'every assembly appears once per cycle');
vm.runInContext(`startHistoricalGame();state.flags.firstResponse='Organise';state.date='2027-02-10';state.pendingScenes=[];completeHandoff('Bot','Party','electoral');`,context);
assert.throws(()=>vm.runInContext(`contestAssembly('assembly-Punjab-2027')`,context),/Found the party/);
vm.runInContext(`state.phase='party';state.org.funds=500000;state.player.energy=80;state.org.presence.Punjab=40;state.support=30;contestAssembly('assembly-Punjab-2027');`,context);
const punjab=vm.runInContext('state.assemblyResults[0]',context);
assert.equal(punjab.total,117);
assert.ok(vm.runInContext('state.org.presence.Punjab',context)>=42,'contesting builds local presence');
assert.throws(()=>vm.runInContext(`contestAssembly('assembly-Punjab-2027')`,context),/Already contested/);
assert.throws(()=>vm.runInContext(`contestAssembly('assembly-Gujarat-2027')`,context),/not open/);

// Civic national campaigns: locked until three cases, fade when neglected, close on the deadline.
vm.runInContext(`startHistoricalGame();state.flags.firstResponse='Organise';state.date='2026-10-01';state.pendingScenes=[];completeHandoff('Bot','Watch','civic');state.org.funds=400000;state.player.energy=90;`,context);
assert.throws(()=>vm.runInContext(`campaignAction('launch','school-standards')`,context),/three major cases/);
vm.runInContext(`for(const id of ['water','caste','heritage']){civicAction(id,'verify');civicAction(id,'publish');}campaignAction('launch','school-standards');`,context);
assert.throws(()=>vm.runInContext(`campaignAction('launch','exam-integrity')`,context),/current campaign/);
vm.runInContext(`campaignAction('coalition');`,context);
const momentum=vm.runInContext('activeCampaign().progress',context);
assert.ok(momentum>0,'a campaign move builds momentum');
vm.runInContext(`for(let i=0;i<9;i++)advanceDay();`,context);
assert.ok(vm.runInContext('activeCampaign().progress',context)<momentum,'neglected campaigns lose momentum');
vm.runInContext(`activeCampaign().progress=99;state.player.energy=90;campaignAction('lobby');`,context);
assert.equal(vm.runInContext('state.nationalCampaigns[0].outcome',context),'adopted');
vm.runInContext(`campaignAction('launch','water-disclosure');const c=activeCampaign();while(state.date<c.deadline)advanceDay();`,context);
assert.equal(vm.runInContext('state.nationalCampaigns[0].outcome',context),'stalled','the deadline closes an unfinished campaign');

// Act 3: every fictional case follows a sourced background record.
assert.ok(vm.runInContext('INJUSTICE_CASES.every(c=>BEFORE_THE_MOVEMENT.some(b=>b.id===c.pattern)&&c.responses.length>=2&&c.ignored.text)',context));
assert.ok(vm.runInContext('BEFORE_THE_MOVEMENT.every(b=>b.date===undefined&&b.year<=2026&&/^https:\\/\\//.test(b.url))',context),'background records are sourced and predate the story');
assert.ok(vm.runInContext('INJUSTICE_CASES.filter(c=>c.lead).every(c=>NETWORK.some(m=>m.id===c.lead))',context),'every lead points at a network member');
// The feed: cases arrive, answered ones yield evidence, ignored ones hurt and feed outrage.
vm.runInContext(`startHistoricalGame();state.flags.firstResponse='Organise';state.date='2026-10-01';state.pendingScenes=[];completeHandoff('Bot','Watch','civic');state.org.funds=300000;state.player.energy=100;for(let i=0;i<40&&openInjustices().length<2;i++){state.player.energy=100;advanceDay();}`,context);
assert.ok(vm.runInContext('openInjustices().length',context)>=1,'injustice cases arrive over time');
const inj=vm.runInContext('(()=>{const x=openInjustices()[0];return {uid:x.uid,lead:INJUSTICE_CASES.find(c=>c.id===x.id).lead,i:INJUSTICE_CASES.find(c=>c.id===x.id).responses.findIndex(r=>r.evidence)};})()',context);
if(inj.lead&&inj.i>=0){const before=vm.runInContext(`state.network["${inj.lead}"].evidence`,context);vm.runInContext(`respondInjustice("${inj.uid}",${inj.i})`,context);assert.ok(vm.runInContext(`state.network["${inj.lead}"].evidence`,context)>before,'a careful response yields evidence');}
vm.runInContext(`state.injustices.filter(x=>x.status==='open').forEach(x=>x.dueOn=state.date);var outrageBefore=state.outrage;var openBefore=openInjustices().length;`,context);
if(vm.runInContext('openBefore',context)>0){vm.runInContext('advanceDay()',context);assert.ok(vm.runInContext('state.injustices.some(x=>x.status==="ignored")&&state.outrage>outrageBefore-1',context),'ignored cases close badly and feed outrage');}
// Outrage can be channelled; unchannelled it risks unrest.
vm.runInContext(`state.outrage=60;state.org.volunteers=300;state.org.legal=10;state.player.energy=90;var sup=state.support;channelOutrage('protest');`,context);
assert.ok(vm.runInContext('state.support>sup&&state.outrage<=21',context),'a protest turns outrage into support');
assert.throws(()=>vm.runInContext(`channelOutrage('protest')`,context),/not high enough/);
// The network: complaint, investigation, trial, verdict; the Chairman is out of reach until institutions change.
vm.runInContext(`state.network.sood.evidence=12;networkAction('complain','sood');`,context);
assert.equal(vm.runInContext('state.network.sood.stage',context),'investigation');
vm.runInContext(`state.institutions={agency:90,courts:90,protection:90};for(let i=0;i<800&&!['convicted','acquitted'].includes(state.network.sood.stage);i++){state.player.energy=100;state.player.health=100;state.org.legal=0;advanceDay();}`,context);
assert.ok(['convicted','acquitted'].includes(vm.runInContext('state.network.sood.stage',context)),'investigations lead to a verdict');
vm.runInContext(`state.network.chairman.revealed=true;state.network.chairman.evidence=20;state.institutions.agency=40;`,context);
assert.throws(()=>vm.runInContext(`networkAction('complain','chairman')`,context),/independence reaches 70/,'the Chairman needs an independent agency');
// Government: bills change institutions and the pride index.
vm.runInContext(`state.phase='government';state.governance.mandate=90;state.elections.unshift({seats:320});state.org.funds=500000;var inst=state.institutions.protection;introduceBill('witness');state.bills.witness.voteOn=state.date;var realRoll=roll;roll=()=>0;advanceDay();roll=realRoll;`,context);
assert.ok(vm.runInContext('state.bills.witness.passedOn&&state.institutions.protection>inst',context),'a passed bill strengthens institutions');
// Endings: victory needs government, the Chairman convicted and a pride index of 70.
vm.runInContext(`state.ending=null;state.network.chairman.stage='convicted';state.network.chairman.sentence=12;state.network.chairman.convictedOn=state.date;for(const k in state.pride)state.pride[k]=66;checkEndings();`,context);
assert.equal(vm.runInContext('state.ending',context),null,'victory needs the whole network behind bars');
vm.runInContext(`for(const m of NETWORK){state.network[m.id].stage='convicted';state.network[m.id].sentence??=5;}checkEndings();`,context);
assert.equal(vm.runInContext('state.ending.id',context),'restored');
assert.ok(vm.runInContext('endingStory().lines.join(" ")',context).includes('Chairman'),'the ending tells the story');
vm.runInContext(`state.ending=null;state.org.legal=100;checkEndings();`,context);
assert.equal(vm.runInContext('state.ending.id',context),'arrested','unchecked legal pressure ends the story');

// The weekly routine runs upkeep by itself and stops for anything that needs the player.
vm.runInContext(`startHistoricalGame();state.flags.firstResponse='Organise';state.date='2026-10-05';state.pendingScenes=[];completeHandoff('Bot','Watch','civic');state.org.funds=50000;state.player.energy=90;state.routine={fundraise:2,rest:1,tours:0};state.pendingTip={rivalId:'oberoi',offeredOn:'2026-01-01'};var realSpawn2=spawnInjustice;spawnInjustice=()=>{};var d0=state.day,gifts=state.donations.length;advanceWithRoutine(7);spawnInjustice=realSpawn2;`,context);
assert.equal(vm.runInContext('state.day-d0',context),7,'a quiet week runs all seven days');
assert.equal(vm.runInContext('state.donations.length-gifts',context),2,'the routine runs the chosen donor drives');
assert.ok(vm.runInContext('state.history.some(h=>h.title==="Routine")',context),'the week is summarised in one log entry');
vm.runInContext(`d0=state.day;state.injustices=[];for(let i=0;i<60&&!openInjustices().length;i++)advanceDay();state.injustices=[];var stop=state.day;advanceWithRoutine(28);`,context);
assert.ok(vm.runInContext('state.day-stop<=28',context));
assert.ok(vm.runInContext('state.lastCaseOn===state.date||state.day-stop===28',context),'a new case stops the routine on the day it arrives');
vm.runInContext(`state.pendingScenes=['exam-remark'];`,context);
assert.ok(vm.runInContext('routineBlocked()',context),'the routine waits while a dispatch is unanswered');
console.log('Browser campaign, audit, timeline, election, staff, engine store, handoff, route, balance, calendar, campaign, Act 3 and routine checks passed.');
