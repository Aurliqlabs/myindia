import { clamp } from "./math";
import { CareerEvent, CharacterState, OrgRole, StaffSkillKey, WorldState } from "./types";
import { adjustRelationship, getRelationship, remember } from "./relationships";
import { assignRole } from "./characters";
import { nextRoleUp, roleLevel, ROLE_PROFILES } from "./roles";
import { makeWorldId } from "./id";
import { Rng } from "./rng";
import { dailyWellbeing } from "../shared/people-rules";

function logCareerEvent(world:WorldState,characterId:string,type:CareerEvent["type"],note:string):void {
  world.characterEvents.push({id:makeWorldId(world,"career"),characterId,date:world.date,type,note});
  if(world.characterEvents.length>3000)world.characterEvents.splice(0,world.characterEvents.length-3000);
}

/** The browser and core use the same daily wellbeing rule. The core records its consequences as memory and career events. */
export function dailyCharacterTick(world:WorldState,c:CharacterState,rng:Rng):void {
  if(!c.employed)return;
  const update=dailyWellbeing(c,world.date,()=>rng.next());
  c.energy=update.energy;c.stress=update.stress;c.morale=update.morale;
  c.burnoutStreak=update.burnoutStreak;c.onLeaveUntil=update.onLeaveUntil;
  if(update.mistake){
    world.organisation.credibility=clamp(world.organisation.credibility-.5);
    logCareerEvent(world,c.id,"mistake","A stress-driven mistake affected the team's work.");
  }
  if(update.forcedLeave){
    remember(world,c.id,"burnout",65,"Burned out and took forced leave.",{emotionalValence:-40});
    logCareerEvent(world,c.id,"burnout_leave",`Took leave until ${c.onLeaveUntil}.`);
  }
}

function monthsBetween(a:string,b:string):number{const d1=new Date(a+"T00:00:00Z"),d2=new Date(b+"T00:00:00Z");return(d2.getUTCFullYear()-d1.getUTCFullYear())*12+(d2.getUTCMonth()-d1.getUTCMonth());}

/** How much of their skill set a character brings to their current role; used to judge whether they have outgrown it. */
function bestSkill(c:CharacterState):number{const values=Object.values(c.skills).filter((v):v is number=>typeof v==="number");return values.length?Math.max(...values):40;}

/** Deterministic monthly evolution: skills grow with use, requests surface from ambition, and resignation risk is scored from morale, loyalty, resentment and unmet requests. */
export function evaluateMonthlyCareer(world:WorldState,c:CharacterState,rng:Rng):void {
  if(!c.employed)return;
  const rel=getRelationship(world,world.player.id,c.id)??{trust:50,loyalty:50,personal:50,resentment:0,fear:0,ideologicalAlignment:50,actorA:"",actorB:""};
  const tenureMonths=monthsBetween(c.joinedOn||world.date,world.date);

  if(c.energy>45&&rng.next()<.35+c.psychology.ambition*.003){
    const key=(Object.entries(c.skills).sort((a,b)=>(b[1]??0)-(a[1]??0))[0]?.[0] as StaffSkillKey)??"field";
    const gain=1+Math.round(rng.next()*2);
    c.skills[key]=clamp((c.skills[key]??40)+gain);
    logCareerEvent(world,c.id,"skill_growth",`${key} improved through active work.`);
  }

  let resignScore=0;
  if(c.morale<30)resignScore+=18;
  if(rel.resentment>60)resignScore+=22;
  if(rel.loyalty<25)resignScore+=16;
  if(c.psychology.ambition>70&&(!c.roleId||c.roleId==="volunteer")&&tenureMonths>4)resignScore+=10;
  if(c.pendingRequest&&monthsBetween(c.pendingRequest.askedOn,world.date)>=2)resignScore+=14;
  resignScore-=rel.loyalty*.15+rel.personal*.08;
  resignScore*=.4+c.psychology.riskTolerance*.008;
  const resignProbability=clamp(resignScore,0,85)/100;
  if(tenureMonths>=1&&rng.next()<resignProbability){
    resignCharacter(world,c,"Resigned after accumulated dissatisfaction.");
    return;
  }

  if(!c.pendingRequest&&tenureMonths>=2){
    const wantsRaise=c.psychology.greed>55&&c.psychology.ambition>40;
    const wantsPromotion=c.psychology.ambition>65&&bestSkill(c)>=65&&roleLevel(c.roleId)<4;
    if(wantsPromotion&&rng.next()<.05+c.psychology.ambition*.002){
      const target=nextRoleUp(c.roleId);
      if(target)c.pendingRequest={type:"promotion",askedOn:world.date,detail:`Believes they are ready for ${ROLE_PROFILES[target].title}.`,targetRole:target};
    } else if(wantsRaise&&rng.next()<.05+c.psychology.greed*.0015){
      const amount=Math.round(c.salaryMonthly*(.1+c.psychology.greed*.002));
      c.pendingRequest={type:"raise",askedOn:world.date,detail:"Asking for a salary increase.",amount};
    }
  }
}

/** Missed pay lands differently on every person: loyalty and a strong personal bond buy patience or unpaid solidarity; greed and a thin bond buy an early exit; anyone in between just quietly resents it. */
export function respondToMissedPay(world:WorldState,c:CharacterState,rng:Rng):"resigned"|"volunteered"|"resentful" {
  c.unpaidStreak=(c.unpaidStreak??0)+1;
  const rel=getRelationship(world,world.player.id,c.id)??{trust:50,loyalty:50,personal:50,resentment:0,fear:0,ideologicalAlignment:50,actorA:"",actorB:""};
  c.morale=clamp(c.morale-7);c.stress=clamp(c.stress+5);
  const pResign=clamp((c.unpaidStreak-1)*15+c.psychology.greed*.3-rel.loyalty*.25,0,90)/100;
  const pVolunteer=clamp(rel.loyalty*.5+rel.personal*.3-c.psychology.greed*.2,0,80)/100;
  const roll=rng.next();
  if(roll<pResign){
    resignCharacter(world,c,"Resigned after repeated missed salary.");
    adjustRelationship(world,world.player.id,c.id,{trust:-8,resentment:14});
    return "resigned";
  }
  if(roll<pResign+pVolunteer){
    c.volunteer=true;
    adjustRelationship(world,world.player.id,c.id,{loyalty:6,trust:2});
    remember(world,c.id,"support",60,"Kept working unpaid while the organisation recovered.",{emotionalValence:30});
    logCareerEvent(world,c.id,"payroll_response","Chose to volunteer through a payroll shortfall.");
    return "volunteered";
  }
  remember(world,c.id,"salary_missed",clamp(55+c.unpaidStreak*8),"The organisation could not fully meet payroll.",{emotionalValence:-clamp(35+c.unpaidStreak*6,35,80)});
  adjustRelationship(world,world.player.id,c.id,{trust:-4,resentment:5,loyalty:-3});
  logCareerEvent(world,c.id,"payroll_response","Privately grew resentful over missed pay.");
  return "resentful";
}

function resignCharacter(world:WorldState,c:CharacterState,note:string):void {
  c.employed=false;c.pendingRequest=undefined;
  adjustRelationship(world,world.player.id,c.id,{loyalty:-6,personal:-4});
  remember(world,c.id,"resignation",72,note,{emotionalValence:-50});
  logCareerEvent(world,c.id,"resignation",note);
}

export function grantRequest(world:WorldState,characterId:string):void {
  const c=world.characters[characterId]; if(!c)throw new Error(`Unknown character ${characterId}`);
  const req=c.pendingRequest; if(!req)throw new Error("No pending request");
  if(req.type==="raise"){
    c.salaryMonthly+=req.amount??Math.round(c.salaryMonthly*.1);
    remember(world,c.id,"financial_favour",50,"Was granted a requested raise.",{emotionalValence:45});
  } else if(req.type==="promotion"&&req.targetRole){
    assignRole(world,c.id,req.targetRole);c.lastPromotionOn=world.date;
    remember(world,c.id,"promotion",70,`Promoted to ${ROLE_PROFILES[req.targetRole].title}.`,{emotionalValence:65});
  } else if(req.type==="ticket"){
    remember(world,c.id,"political_ticket",75,"Was given a political ticket.",{emotionalValence:70,politicalRelevance:80});
  }
  adjustRelationship(world,world.player.id,c.id,{trust:8,loyalty:10});
  c.morale=clamp(c.morale+10);
  c.pendingRequest=undefined;
}

/** A denial always costs something; how much depends on how proud and how ambitious the person is. */
export function denyRequest(world:WorldState,characterId:string):void {
  const c=world.characters[characterId]; if(!c)throw new Error(`Unknown character ${characterId}`);
  const req=c.pendingRequest; if(!req)throw new Error("No pending request");
  const sting=c.psychology.ego*.5+c.psychology.ambition*.3;
  adjustRelationship(world,world.player.id,c.id,{trust:-clamp(6+sting*.08,6,18),loyalty:-clamp(8+sting*.1,8,22),resentment:clamp(10+sting*.15,10,30)});
  c.morale=clamp(c.morale-8);
  remember(world,c.id,"denied_request",clamp(55+sting*.2),`Was denied a requested ${req.type}.`,{emotionalValence:-clamp(45+sting*.2,45,90)});
  c.pendingRequest=undefined;
}

export function evaluateMonthlyCareers(world:WorldState,rng:Rng):void {
  for(const c of Object.values(world.characters))evaluateMonthlyCareer(world,c,rng);
}
