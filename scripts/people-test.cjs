const core=require('../dist/src/core/index.js');
const {createRng}=require('../dist/src/core/rng.js');
function ok(condition,message){if(!condition)throw new Error(message);}
function freshWorld(seed=90210){return core.createNewGame({name:'Chief',age:30,homeState:'Delhi',profession:'Organiser',trait:'organiser',seed});}
function snapshotRel(w,id){const r=core.getRelationship(w,w.player.id,id);return {...r};}

// 1. relationship changes evolve through actual events, not flat constants
(function relationshipChanges(){
  const w=freshWorld();
  core.hireCharacter(w,'friend_rohan','Field Lead',40000);
  const before=snapshotRel(w,'friend_rohan');
  core.defendPublicly(w,'friend_rohan');
  const afterDefend=snapshotRel(w,'friend_rohan');
  ok(afterDefend.trust>before.trust&&afterDefend.loyalty>before.loyalty,'public defence must raise trust and loyalty');
  core.humiliatePublicly(w,'friend_rohan');
  const afterHumiliate=snapshotRel(w,'friend_rohan');
  ok(afterHumiliate.trust<afterDefend.trust&&afterHumiliate.resentment>afterDefend.resentment,'public humiliation must lower trust and raise resentment');
})();

// 2. long-term memory: high-salience events persist for years, low-salience ones fade to near nothing
(function longTermMemory(){
  const w=freshWorld();
  core.hireCharacter(w,'friend_meera','Media Lead',35000);
  core.recognizeFoundingMember(w,'friend_meera');
  const [founding]=core.recallMemories(w,'friend_meera',{type:'founding_recognition'});
  ok(founding&&founding.salience>=80,'founding recognition must be created as a high-salience memory');
  const twoYearsLater=new Date('2026-05-14T00:00:00Z');twoYearsLater.setUTCFullYear(twoYearsLater.getUTCFullYear()+2);
  const farDate=twoYearsLater.toISOString().slice(0,10);
  const persisted=core.effectiveSalience(founding,farDate);
  ok(persisted>15,'a high-salience founding memory must still be meaningfully present two years later');
  const trivial={id:'m',characterId:'friend_meera',date:'2026-05-14',type:'support',salience:12,note:'minor',decay:core.defaultDecay(12)};
  const faded=core.effectiveSalience(trivial,farDate);
  ok(faded<2,'a low-salience memory must fade to near nothing over two years');
})();

// 3. burnout: sustained exhaustion forces leave, not just a stat dip
(function burnout(){
  const w=freshWorld();
  core.hireCharacter(w,'friend_sameer','Finance Lead',30000);
  const c=w.characters.friend_sameer;
  c.energy=8;
  const rng=createRng(w.seed);
  let onLeave=false;
  for(let i=0;i<10&&!onLeave;i++){
    core.dailyCharacterTick(w,c,rng);
    c.energy=Math.min(c.energy,8);
    if(c.onLeaveUntil)onLeave=true;
  }
  ok(onLeave,'sustained exhaustion must eventually force leave');
  ok(w.characterEvents.some(e=>e.characterId==='friend_sameer'&&e.type==='burnout_leave'),'burnout must be logged as a career event');
  ok(w.memories.some(m=>m.characterId==='friend_sameer'&&m.type==='burnout'),'burnout must leave a memory');
})();

// 4. missed payroll: loyalty, greed and bond history produce different individual responses
(function missedPayroll(){
  const w=freshWorld();
  core.hireCharacter(w,'friend_asha','Legal Lead',50000);
  core.hireCharacter(w,'friend_sameer','Finance Lead',50000);
  const loyal=w.characters.friend_asha, mercenary=w.characters.friend_sameer;
  core.adjustRelationship(w,w.player.id,loyal.id,{loyalty:40,personal:30,trust:20});
  loyal.psychology.greed=15;
  core.adjustRelationship(w,w.player.id,mercenary.id,{loyalty:-30,trust:-20});
  mercenary.psychology.greed=90;
  const outcomes={loyal:new Set(),mercenary:new Set()};
  const rng=createRng(w.seed);
  for(let i=0;i<40;i++){
    loyal.unpaidStreak=0;mercenary.unpaidStreak=0;
    outcomes.loyal.add(core.respondToMissedPay(w,loyal,rng));
    outcomes.mercenary.add(core.respondToMissedPay(w,mercenary,rng));
  }
  ok(!outcomes.loyal.has('resigned'),'a highly loyal, low-greed character must not resign over missed pay in this sample');
  ok(outcomes.mercenary.has('resigned'),'a high-greed, low-loyalty character must resign over sustained missed pay');
})();

// 5. promotion response: granting and denying a request diverge sharply
(function promotionResponse(){
  const w=freshWorld();
  core.hireCharacter(w,'friend_rohan','Field Organiser',40000,false,'field_organiser');
  const c=w.characters.friend_rohan;
  c.pendingRequest={type:'promotion',askedOn:w.date,detail:'test',targetRole:'state_coordinator'};
  const before=snapshotRel(w,c.id);
  core.grantRequest(w,c.id);
  ok(c.roleId==='state_coordinator','granting a promotion request must change the role');
  ok(snapshotRel(w,c.id).trust>before.trust,'granting a promotion must raise trust');

  const w2=freshWorld();
  core.hireCharacter(w2,'friend_meera','Media Lead',40000);
  const c2=w2.characters.friend_meera;
  c2.pendingRequest={type:'raise',askedOn:w2.date,detail:'test',amount:5000};
  const before2=snapshotRel(w2,c2.id);
  core.denyRequest(w2,c2.id);
  const after2=snapshotRel(w2,c2.id);
  ok(after2.trust<before2.trust&&after2.resentment>before2.resentment,'denying a request must lower trust and raise resentment');
  ok(w2.memories.some(m=>m.characterId===c2.id&&m.type==='denied_request'),'a denial must leave a memory');
})();

// 6. firing: response scales with ego and prior bond, not a flat constant
(function firingVaries(){
  const wHighEgo=freshWorld();
  core.hireCharacter(wHighEgo,'friend_sameer','Finance Lead',40000);
  wHighEgo.characters.friend_sameer.psychology.ego=95;
  core.fireCharacter(wHighEgo,'friend_sameer');
  const highEgoResentment=core.getRelationship(wHighEgo,wHighEgo.player.id,'friend_sameer').resentment;

  const wLowEgo=freshWorld();
  core.hireCharacter(wLowEgo,'friend_asha','Legal Lead',40000);
  wLowEgo.characters.friend_asha.psychology.ego=10;
  core.fireCharacter(wLowEgo,'friend_asha');
  const lowEgoResentment=core.getRelationship(wLowEgo,wLowEgo.player.id,'friend_asha').resentment;

  ok(highEgoResentment>lowEgoResentment,'a high-ego character must resent being fired more than a low-ego character');
  ok(wHighEgo.memories.some(m=>m.type==='firing'&&(m.emotionalValence??0)<0),'firing must leave a negative-valence memory');
})();

// 7. loyalty and resentment accumulate across a sequence of events, not just the last one
(function loyaltyResentmentAccumulate(){
  const w=freshWorld();
  core.hireCharacter(w,'friend_meera','Media Lead',35000);
  core.defendPublicly(w,'friend_meera');
  const afterOne=core.getRelationship(w,w.player.id,'friend_meera').loyalty;
  core.defendPublicly(w,'friend_meera');
  const afterTwo=core.getRelationship(w,w.player.id,'friend_meera').loyalty;
  ok(afterTwo>afterOne,'loyalty must keep accumulating across repeated positive events');
  core.humiliatePublicly(w,'friend_meera');
  core.humiliatePublicly(w,'friend_meera');
  const resentment=core.getRelationship(w,w.player.id,'friend_meera').resentment;
  ok(resentment>30,'repeated humiliation must build substantial resentment');
})();

// 8. resignation probability is driven by circumstance and is reproducible given the same seed
(function resignationProbability(){
  function runMonths(seed,setup,months){
    const w=freshWorld(seed);
    core.hireCharacter(w,'friend_rohan','Field Organiser',40000);
    const c=w.characters.friend_rohan;
    setup(w,c);
    const rng=createRng(w.seed+7);
    let resignedOn=null;
    for(let m=0;m<months;m++){
      w.date=addMonths(w.date,1);
      core.evaluateMonthlyCareer(w,c,rng);
      if(!c.employed){resignedOn=m;break;}
    }
    return resignedOn;
  }
  function addMonths(date,n){const d=new Date(date+'T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,10);}
  const badFit=(w,c)=>{c.morale=15;core.adjustRelationship(w,w.player.id,c.id,{loyalty:-40,resentment:40,personal:-20});};
  const goodFit=(w,c)=>{c.morale=85;core.adjustRelationship(w,w.player.id,c.id,{loyalty:40,personal:30});};
  const badRun1=runMonths(4242,badFit,24);
  const badRun2=runMonths(4242,badFit,24);
  ok(badRun1===badRun2,'resignation timing must be reproducible for identical seed and circumstances');
  ok(badRun1!==null,'a badly-treated character must resign within two years in this sample');
  const goodRun=runMonths(4242,goodFit,24);
  ok(goodRun===null,'a well-treated, loyal character must not resign over the same period');
})();

// 9. skills grow through active work over time
(function skillGrowth(){
  const w=freshWorld(555);
  core.hireCharacter(w,'friend_asha','Legal Lead',40000);
  const c=w.characters.friend_asha;
  const before=Object.values(c.skills).reduce((a,b)=>a+(b||0),0);
  const rng=createRng(w.seed+3);
  for(let m=0;m<18;m++){
    w.date=(function(d){const x=new Date(d+'T00:00:00Z');x.setUTCMonth(x.getUTCMonth()+1);return x.toISOString().slice(0,10);})(w.date);
    core.evaluateMonthlyCareer(w,c,rng);
  }
  const after=Object.values(c.skills).reduce((a,b)=>a+(b||0),0);
  ok(after>before,'skills must grow over sustained employment');
  ok(w.characterEvents.some(e=>e.characterId===c.id&&e.type==='skill_growth'),'skill growth must be logged');
})();

// 10. deterministic simulation: identical seed and identical actions reproduce identical outcomes
(function deterministicSimulation(){
  function build(){
    const w=freshWorld(8181);
    core.hireCharacter(w,'friend_rohan','Field Organiser',35000);
    core.hireCharacter(w,'friend_meera','Media Lead',35000);
    core.defendPublicly(w,'friend_rohan');
    core.advanceDays(w,95);
    return w;
  }
  const a=build(),b=build();
  ok(JSON.stringify(a)===JSON.stringify(b),'identical seed and actions across the new people systems must produce identical world state');
})();

console.log('REPUBLIC: 543 people & organisation tests passed');
