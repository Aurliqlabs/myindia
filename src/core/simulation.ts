import { createRng } from "./rng";
import { clamp } from "./math";
import { DailyReport, WorldState } from "./types";
import { processMonthEnd } from "./finance";
import { tickOperation } from "./operations";
import { tickSecretExposure } from "./secrets";
import { generateSystemEvent } from "./future";
import { resolvePersonalDay, settlePersonalMonth } from "./personal-life";
function isoAddDay(date:string):string{const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);}
function isMonthEnd(date:string):boolean{const d=new Date(`${date}T00:00:00Z`),t=new Date(d);t.setUTCDate(d.getUTCDate()+1);return t.getUTCMonth()!==d.getUTCMonth();}
export function advanceOneDay(world:WorldState):DailyReport {
  const rng=createRng(world.rngState),report:DailyReport={date:world.date,operationUpdates:[],secretExposureChecks:[],triggeredEvents:[],notes:[]};
  report.notes.push(resolvePersonalDay(world));
  for(const op of Object.values(world.operations)){const delta=tickOperation(world,op,rng);if(delta>0)report.operationUpdates.push({id:op.id,progressDelta:delta,completed:op.status==="completed"});}
  for(const secret of Object.values(world.secrets)){const result=tickSecretExposure(world,secret,rng);report.secretExposureChecks.push({id:secret.id,...result});if(result.exposed)report.notes.push(`Secret exposed: ${secret.kind}`);}
  const scheduled=world.scheduledEvents.filter(e=>e.date===world.date);report.triggeredEvents.push(...scheduled);world.scheduledEvents=world.scheduledEvents.filter(e=>e.date!==world.date);
  if(new Date(world.date)>=new Date(world.realWorldSnapshotDate)){const ev=generateSystemEvent(world,rng);if(ev){world.scheduledEvents.push(ev);report.notes.push(`Future event generated: ${ev.kind}`);}}
  if(isMonthEnd(world.date)){report.payroll=processMonthEnd(world);const personal=settlePersonalMonth(world);report.notes.push(`Personal salary ${personal.salary}; living costs ${personal.costs}; new debt ${personal.newDebt}`);}
  world.player.energy=clamp(world.player.energy-2.2-world.player.stress*.012);world.player.stress=clamp(world.player.stress+.8+(world.player.energy<30?1.8:0));world.player.sleepDebt=clamp(world.player.sleepDebt+.5,0,100);
  if(world.player.stress>85||world.player.energy<12)world.player.health=clamp(world.player.health-.7);
  for(const c of Object.values(world.characters)){if(c.employed){c.energy=clamp(c.energy-1.2-c.stress*.006);c.stress=clamp(c.stress+.25);if(c.energy<15)c.morale=clamp(c.morale-.8);}}
  world.day+=1;world.date=isoAddDay(world.date);world.player.level=1+Math.floor((world.day-1)/30);world.rngState=rng.state();report.date=world.date;return report;
}
export function advanceDays(world:WorldState,days:number):DailyReport[]{if(days<0||days>3660)throw new Error("days must be between 0 and 3660");const reports:DailyReport[]=[];for(let i=0;i<days;i++)reports.push(advanceOneDay(world));return reports;}

