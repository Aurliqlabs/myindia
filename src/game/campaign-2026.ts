import type { DailyReport, WorldState } from "../core/types";
import { clamp } from "../core/math";
import { advanceOneDay } from "../core/simulation";
import { jantarReadiness } from "./opening";
import { resolveFieldDay, resolveNegotiation } from "../shared/campaign-rules";

export type CampaignFocus="student_help"|"document_demands"|"mobilise";
export type NegotiationDemand="exam_reform"|"protester_protection"|"ministerial_accountability";
export interface Campaign2026State {
  daysOrganised:number; crowdTrust:number; studentTrust:number; evidenceQuality:number;
  legalPressure:number; fatigue:number; offers:number; lastActionDate?:string;
  negotiation?:{date:string;demand:NegotiationDemand;publicBriefing:boolean;pauseDemonstrations:boolean;delegateId?:string};
  historicalOutcomeRecorded:boolean;
}

export function campaign2026(world:WorldState):Campaign2026State {
  return world.campaign2026??(world.campaign2026={daysOrganised:0,crowdTrust:38,studentTrust:35,evidenceQuality:20,legalPressure:0,fatigue:0,offers:0,historicalOutcomeRecorded:false});
}

/** One field decision per day. Quality depends on the citizen's strengths and the actual preparations made. */
export function organiseProtestDay(world:WorldState,focus:CampaignFocus,delegateId?:string):Campaign2026State {
  if(world.date<"2026-06-06"||world.date>"2026-07-25")throw new Error("The documented protest campaign is outside this date");
  if(world.flags.first_response==="unanswered")throw new Error("Resolve the citizen's first response");
  const c=campaign2026(world);
  if(c.lastActionDate===world.date)throw new Error("A field decision was already made today");
  if(!["student_help","document_demands","mobilise"].includes(focus))throw new Error("Unknown campaign focus");
  const delegate=delegateId?world.characters[delegateId]:undefined;
  if(delegateId&&!delegate)throw new Error("Unknown delegate");
  const skillKey=focus==="student_help"?"leadership":focus==="document_demands"?"analysis":"communication";
  const readiness=jantarReadiness(world);
  const result=resolveFieldDay({focus,skill:delegate?.skills[skillKey]??world.player.skills[skillKey],prepared:readiness.prepared,crowdSafety:readiness.crowdSafety,fatigue:c.fatigue,delegated:!!delegate});
  if(world.organisation.finance.organisationCash<result.cost)throw new Error("Insufficient movement funds");
  world.organisation.finance.organisationCash-=result.cost;
  world.organisation.finance.lifetimeSpent+=result.cost;
  c.daysOrganised++;
  c.lastActionDate=world.date;
  c.fatigue=clamp(c.fatigue+result.fatigue);
  c.crowdTrust=clamp(c.crowdTrust+result.crowdTrust);
  c.studentTrust=clamp(c.studentTrust+result.studentTrust);
  c.evidenceQuality=clamp(c.evidenceQuality+result.evidenceQuality);
  c.legalPressure=clamp(c.legalPressure+result.legalPressure);
  world.organisation.volunteers=Math.max(0,world.organisation.volunteers+result.volunteers);
  world.organisation.mediaHeat=clamp(world.organisation.mediaHeat+result.mediaHeat);
  if(delegate){delegate.energy=clamp(delegate.energy-result.energy);delegate.stress=clamp(delegate.stress+3);}
  else {world.player.energy=clamp(world.player.energy-result.energy);world.player.jobStanding=clamp(world.player.jobStanding-result.jobStanding);world.player.stress=clamp(world.player.stress+3);}
  return c;
}

/** Negotiation can change the player's terms and relationships, never the documented resignation. */
export function negotiate2026(world:WorldState,input:{demand:NegotiationDemand;publicBriefing:boolean;pauseDemonstrations:boolean;delegateId?:string}):Campaign2026State {
  if(world.date<"2026-07-20"||world.date>"2026-07-25")throw new Error("Negotiations are not open");
  const c=campaign2026(world);
  if(c.negotiation)throw new Error("Negotiation position already recorded");
  if(!["exam_reform","protester_protection","ministerial_accountability"].includes(input.demand))throw new Error("Unknown demand");
  if(input.delegateId&&!world.characters[input.delegateId])throw new Error("Unknown delegate");
  c.negotiation={...input,date:world.date};
  const skill=input.delegateId?(world.characters[input.delegateId].skills.negotiation??45):world.player.skills.negotiation;
  const result=resolveNegotiation({skill,evidenceQuality:c.evidenceQuality,studentTrust:c.studentTrust,legalPressure:c.legalPressure,pauseDemonstrations:input.pauseDemonstrations,publicBriefing:input.publicBriefing});
  c.offers=result.offers;
  c.fatigue=clamp(c.fatigue+result.fatigue);
  c.crowdTrust=clamp(c.crowdTrust+result.crowdTrust);
  world.organisation.mediaHeat=clamp(world.organisation.mediaHeat+result.mediaHeat);
  world.player.stress=clamp(world.player.stress+result.stress);
  world.flags.negotiation_demand=input.demand;
  return c;
}

/** Report source events after the core day tick; the player's state cannot veto them. */
export function advanceCampaignDay(world:WorldState):DailyReport {
  const report=advanceOneDay(world);
  for(const event of report.triggeredEvents){
    if(event.id==="cjp_2026_07_25_minister_resignation"){
      campaign2026(world).historicalOutcomeRecorded=true;
      world.flags.reported_ministerial_resignation=true;
      report.notes.push("Historical anchor: reported Education Minister resignation; player contribution remains simulated.");
    }
    if(event.kind==="historical_event")world.completedEventIds.push(event.id);
  }
  return report;
}

