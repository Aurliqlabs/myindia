import type { WorldState, SkillKey } from "../core/types";
import { clamp } from "../core/math";

export type FirstResponse="post"|"journalist"|"organise"|"donate"|"quiet";
const firstEffects:Record<FirstResponse,{energy:number;stress:number;cash:number;standing:number;recognition:number;volunteers:number}>={
  post:{energy:-3,stress:4,cash:0,standing:-2,recognition:5,volunteers:1},
  journalist:{energy:-5,stress:3,cash:0,standing:-3,recognition:3,volunteers:0},
  organise:{energy:-9,stress:5,cash:0,standing:-8,recognition:2,volunteers:5},
  donate:{energy:0,stress:0,cash:-2000,standing:0,recognition:0,volunteers:0},
  quiet:{energy:4,stress:-2,cash:0,standing:2,recognition:0,volunteers:0}
};

/** A personal response to a fictional composite student's examination crisis. */
export function chooseFirstResponse(world:WorldState,choice:FirstResponse):void {
  if(world.date>"2026-05-16"||world.flags.first_response!=="unanswered")throw new Error("First response already resolved or window closed");
  const effect=firstEffects[choice];if(!effect)throw new Error("Unknown response");
  if(world.player.personalCash+effect.cash<0)throw new Error("Insufficient personal savings");
  const p=world.player;
  p.energy=clamp(p.energy+effect.energy);p.stress=clamp(p.stress+effect.stress);
  p.personalCash+=effect.cash;p.declaredAssets+=effect.cash;
  p.jobStanding=clamp(p.jobStanding+effect.standing);p.recognition=clamp(p.recognition+effect.recognition);
  world.organisation.volunteers+=effect.volunteers;
  world.flags.first_response=choice;
  world.memories.push({id:"first_response",characterId:p.id,date:world.date,type:"support",salience:85,note:`Response to examination crisis: ${choice}`});
}

/** Recorded small donations are movement cash, never personal income. */
export function raiseSmallDonations(world:WorldState,hours:number):number {
  if(world.date<"2026-05-16"||!Number.isInteger(hours)||hours<1||hours>8)throw new Error("Choose one to eight hours after the movement forms");
  if(world.player.energy<hours*2)throw new Error("Too exhausted to fundraise");
  const amount=Math.round(hours*(240+world.player.skills.communication*8+Math.min(50,world.organisation.volunteers)*15));
  world.organisation.finance.organisationCash+=amount;
  world.organisation.finance.lifetimeRaised+=amount;
  world.player.energy=clamp(world.player.energy-hours*2);
  world.player.jobStanding=clamp(world.player.jobStanding-hours*.8);
  return amount;
}

export type ProtestPreparation="travel"|"volunteers"|"stage"|"permissions"|"lawyers"|"media"|"food"|"water"|"security"|"communications"|"student_groups"|"spokespersons"|"accommodation";
const tasks:Record<ProtestPreparation,{cost:number;hours:number;skill:SkillKey;volunteers:number;legal:number;media:number}>={
  travel:{cost:4500,hours:5,skill:"strategy",volunteers:8,legal:0,media:0},
  volunteers:{cost:1200,hours:7,skill:"leadership",volunteers:14,legal:0,media:0},
  stage:{cost:8000,hours:6,skill:"strategy",volunteers:0,legal:0,media:2},
  permissions:{cost:1200,hours:8,skill:"negotiation",volunteers:0,legal:-6,media:0},
  lawyers:{cost:7500,hours:4,skill:"analysis",volunteers:0,legal:-8,media:0},
  media:{cost:2500,hours:5,skill:"communication",volunteers:0,legal:0,media:6},
  food:{cost:4800,hours:4,skill:"strategy",volunteers:0,legal:0,media:0},
  water:{cost:2200,hours:3,skill:"strategy",volunteers:0,legal:0,media:0},
  security:{cost:5500,hours:5,skill:"leadership",volunteers:0,legal:-4,media:0},
  communications:{cost:1500,hours:5,skill:"communication",volunteers:0,legal:0,media:2},
  student_groups:{cost:1800,hours:7,skill:"negotiation",volunteers:12,legal:0,media:0},
  spokespersons:{cost:1000,hours:5,skill:"communication",volunteers:0,legal:0,media:3},
  accommodation:{cost:5500,hours:4,skill:"strategy",volunteers:0,legal:0,media:0}
};

/** Preparation is available after the movement forms; no action can alter a reported historical anchor. */
export function prepareJantarMantar(world:WorldState,task:ProtestPreparation,delegateId?:string):void {
  if(world.date<"2026-05-16"||world.date>"2026-06-20")throw new Error("Jantar Mantar operation is not active");
  if(world.flags.first_response==="unanswered")throw new Error("Resolve the ordinary-life opening first");
  const spec=tasks[task];if(!spec)throw new Error("Unknown logistics task");
  const key=`jantar_${task}`;if(world.flags[key])throw new Error("Task already prepared");
  if(world.organisation.finance.organisationCash<spec.cost)throw new Error("Insufficient movement funds");
  const delegate=delegateId?world.characters[delegateId]:undefined;
  if(delegateId&&!delegate)throw new Error("Unknown delegate");
  const skill=delegate?.skills[spec.skill]??world.player.skills[spec.skill];
  const quality=clamp(45+(skill-45)*.55+(delegate?delegate.energy-world.player.energy:0)*.1);
  world.organisation.finance.organisationCash-=spec.cost;
  world.organisation.finance.lifetimeSpent+=spec.cost;
  world.organisation.volunteers+=spec.volunteers;
  world.organisation.mediaHeat=clamp(world.organisation.mediaHeat+spec.media);
  world.organisation.legalExposure=clamp(world.organisation.legalExposure+spec.legal);
  if(delegate){delegate.energy=clamp(delegate.energy-spec.hours*1.3);delegate.stress=clamp(delegate.stress+spec.hours*.6);}
  else {world.player.energy=clamp(world.player.energy-spec.hours*1.6);world.player.stress=clamp(world.player.stress+spec.hours*.5);world.player.jobStanding=clamp(world.player.jobStanding-spec.hours*.65);}
  world.flags[key]=Math.round(quality);
  world.flags.jantar_prepared=Number(world.flags.jantar_prepared??0)+1;
}

export function jantarReadiness(world:WorldState):{prepared:number;quality:number;gaps:ProtestPreparation[];crowdSafety:boolean}{
  const entries=Object.keys(tasks) as ProtestPreparation[];
  const done=entries.filter(k=>typeof world.flags[`jantar_${k}`]==="number");
  const gaps=entries.filter(k=>!done.includes(k));
  return {prepared:done.length,quality:done.length?Math.round(done.reduce((sum,k)=>sum+Number(world.flags[`jantar_${k}`]),0)/done.length):0,gaps,crowdSafety:done.includes("water")&&done.includes("security")&&done.includes("permissions")};
}
