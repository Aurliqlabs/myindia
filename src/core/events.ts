import { WorldState } from "./types";
import { clamp } from "./math";
import { createSecret } from "./secrets";

export interface EventChoiceEffect {
  playerEnergy?:number;playerStress?:number;recognition?:number;organisationCash?:number;volunteers?:number;credibility?:number;mediaHeat?:number;legalExposure?:number;youthOpinion?:number;nationalOpinion?:number;
  secret?:{kind:"hidden_donation"|"illegal_favour"|"nepotism"|"obstruction"|"misuse_of_funds"|"abuse_of_power";severity:number};
  flags?:Record<string,boolean|number|string>;
}
export interface GameEventChoice { id:string;label:string;description:string;effect:EventChoiceEffect; }
export interface GameEventDefinition { id:string;title:string;body:string;category:string;earliestDate?:string;latestDate?:string;condition?:(world:WorldState)=>boolean;choices:GameEventChoice[]; }

export function isEventEligible(world:WorldState,event:GameEventDefinition):boolean {
  if(world.completedEventIds.includes(event.id))return false;if(event.earliestDate&&world.date<event.earliestDate)return false;if(event.latestDate&&world.date>event.latestDate)return false;return event.condition?event.condition(world):true;
}
export function applyEventChoice(world:WorldState,event:GameEventDefinition,choiceId:string):void {
  const c=event.choices.find(x=>x.id===choiceId);if(!c)throw new Error(`Unknown choice ${choiceId}`);const e=c.effect;
  world.player.energy=clamp(world.player.energy+(e.playerEnergy??0));world.player.stress=clamp(world.player.stress+(e.playerStress??0));world.player.recognition=clamp(world.player.recognition+(e.recognition??0));
  world.organisation.finance.organisationCash=Math.max(0,world.organisation.finance.organisationCash+(e.organisationCash??0));world.organisation.volunteers=Math.max(0,world.organisation.volunteers+(e.volunteers??0));
  world.organisation.credibility=clamp(world.organisation.credibility+(e.credibility??0));world.organisation.mediaHeat=clamp(world.organisation.mediaHeat+(e.mediaHeat??0));world.organisation.legalExposure=clamp(world.organisation.legalExposure+(e.legalExposure??0));
  world.publicOpinion.youth=clamp(world.publicOpinion.youth+(e.youthOpinion??0));world.publicOpinion.national=clamp(world.publicOpinion.national+(e.nationalOpinion??0));
  if(e.flags)Object.assign(world.flags,e.flags);if(e.secret)createSecret(world,{kind:e.secret.kind,severity:e.secret.severity});world.completedEventIds.push(event.id);
}
