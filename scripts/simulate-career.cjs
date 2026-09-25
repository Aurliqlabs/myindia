const {createRepublic543Game}=require("../dist/src/game/index.js");
const {hireCharacter,startOperation}=require("../dist/src/core/index.js");
const {advanceDays}=require("../dist/src/core/simulation.js");

const days=Math.max(1,Math.min(3650,Number(process.argv[2]||120)));
const w=createRepublic543Game({name:"Simulation Test",age:28,homeState:"Kerala",profession:"Analyst",trait:"analyst",seed:5432026});
hireCharacter(w,"friend_rohan","Field Lead",60000);
startOperation(w,{kind:"protest",title:"Jantar Mantar",location:"New Delhi",targetProgress:100,budgetAllocated:10000,staffIds:["friend_rohan"],volunteerAllocation:100,mediaAttention:30,legalRisk:10,publicMomentum:25});
const reports=advanceDays(w,days);
const triggered=reports.flatMap(r=>r.triggeredEvents);
console.log(JSON.stringify({
  simulatedDays:days,
  finalDate:w.date,
  phase:w.phase,
  cash:w.organisation.finance.organisationCash,
  credibility:w.organisation.credibility,
  player:{energy:w.player.energy,health:w.player.health,stress:w.player.stress},
  operation:Object.values(w.operations)[0],
  historicalEventsTriggered:triggered.filter(e=>e.kind==="historical_event").map(e=>({date:e.date,id:e.id,title:e.payload.title})),
  futureEventsGenerated:w.scheduledEvents.filter(e=>e.kind!=="historical_event").length
},null,2));
