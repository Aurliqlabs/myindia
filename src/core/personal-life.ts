import type { WorldState } from "./types";
import { clamp } from "./math";
import { adjustRelationship, remember } from "./relationships";

export type DailyCommitment="work"|"movement"|"delegate"|"rest";
export interface PersonalLifeState {
  employment:"employed"|"unemployed";
  attendedWorkDays:number; missedWorkDays:number; personalDebt:number; familyTrust:number;
  planned?:{date:string;choice:DailyCommitment;delegateId?:string};
  lastResolvedDate?:string;
}

export function personalLife(world:WorldState):PersonalLifeState {
  return world.life??(world.life={employment:world.player.profession.toLowerCase()==="unemployed"?"unemployed":"employed",attendedWorkDays:0,missedWorkDays:0,personalDebt:0,familyTrust:65});
}

export function isWorkday(date:string):boolean {
  const day=new Date(date+"T00:00:00Z").getUTCDay();
  return day>=1&&day<=5;
}

export function planPersonalDay(world:WorldState,choice:DailyCommitment,delegateId?:string):void {
  const life=personalLife(world);
  if(life.planned?.date===world.date||life.lastResolvedDate===world.date)throw new Error("Today's personal commitment is already set");
  if(!["work","movement","delegate","rest"].includes(choice))throw new Error("Unknown commitment");
  if(choice==="delegate"&&(!delegateId||!world.characters[delegateId]))throw new Error("Choose an available colleague to delegate to");
  life.planned={date:world.date,choice,delegateId};
}

/** A work shift is the default; political involvement costs work time unless delegated. */
export function resolvePersonalDay(world:WorldState):string {
  const life=personalLife(world);
  if(life.lastResolvedDate===world.date)throw new Error("Personal day already resolved");
  const choice=life.planned?.date===world.date?life.planned.choice:"work";
  const delegateId=life.planned?.date===world.date?life.planned.delegateId:undefined;
  const shift=isWorkday(world.date)&&life.employment==="employed";
  let note:string;
  if(choice==="work"||choice==="delegate"){
    if(shift){life.attendedWorkDays++;world.player.jobStanding=clamp(world.player.jobStanding+.5);world.player.energy=clamp(world.player.energy-1.5);}
    else world.player.energy=clamp(world.player.energy+5);
    life.familyTrust=clamp(life.familyTrust+.2);
    note=shift?"Attended the work shift.":"No scheduled work shift.";
    if(choice==="delegate"){
      const colleague=world.characters[delegateId!];
      colleague.energy=clamp(colleague.energy-6);
      colleague.stress=clamp(colleague.stress+2);
      adjustRelationship(world,world.player.id,colleague.id,{trust:2,loyalty:1});
      const memoryKey=`delegated_${colleague.id}_${world.date.slice(0,7)}`;
      if(!world.flags[memoryKey]){remember(world,colleague.id,"support",55,"Trusted to lead while the player met personal obligations.");world.flags[memoryKey]=true;}
      note="Attended work and delegated movement responsibility.";
    }
  }else if(choice==="movement"){
    if(shift){life.missedWorkDays++;world.player.jobStanding=clamp(world.player.jobStanding-4);}
    world.player.energy=clamp(world.player.energy-5);
    world.player.stress=clamp(world.player.stress+2);
    life.familyTrust=clamp(life.familyTrust-.7);
    world.organisation.volunteers+=world.player.skills.leadership>=55?2:1;
    note=shift?"Led the movement and missed a paid work shift.":"Led the movement on a day off.";
  }else{
    if(shift){life.missedWorkDays++;world.player.jobStanding=clamp(world.player.jobStanding-1);}
    world.player.energy=clamp(world.player.energy+18);
    world.player.stress=clamp(world.player.stress-7);
    life.familyTrust=clamp(life.familyTrust+2);
    note=shift?"Rested and missed a paid work shift.":"Rested on a day off.";
  }
  if(life.employment==="employed"&&world.player.jobStanding<15&&life.missedWorkDays>=5){
    life.employment="unemployed";
    note+=" Employment ended after repeated absence and poor standing.";
  }
  if(world.date==="2026-06-05")note+=" A protest planning meeting and work obligation competed for the same day.";
  life.planned=undefined;
  life.lastResolvedDate=world.date;
  return note;
}

export function settlePersonalMonth(world:WorldState):{salary:number;costs:number;newDebt:number} {
  const life=personalLife(world),d=new Date(world.date+"T00:00:00Z");
  const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
  let weekdays=0;for(let day=1;day<=last;day++)if(isWorkday(`${world.date.slice(0,7)}-${String(day).padStart(2,"0")}`))weekdays++;
  const salary=Math.round(world.player.monthlyIncome*life.attendedWorkDays/weekdays);
  const costs=world.player.monthlyLivingCosts;
  const available=world.player.personalCash+salary;
  const paid=Math.min(available,costs);
  world.player.personalCash=available-paid;
  world.player.declaredAssets=world.player.personalCash;
  life.personalDebt+=costs-paid;
  life.attendedWorkDays=0;life.missedWorkDays=0;
  return {salary,costs,newDebt:costs-paid};
}
