import type { DailyReport, WorldState } from "../core/types";
import { clamp } from "../core/math";
import { advanceOneDay } from "../core/simulation";
import { jantarReadiness } from "./opening";

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
  const cost={student_help:3800,document_demands:2800,mobilise:6500}[focus];
  if(world.organisation.finance.organisationCash<cost)throw new Error("Insufficient movement funds");
  const delegate=delegateId?world.characters[delegateId]:undefined;
  if(delegateId&&!delegate)throw new Error("Unknown delegate");
  const skillKey=focus==="student_help"?"leadership":focus==="document_demands"?"analysis":"communication";
  const skill=delegate?.skills[skillKey]??world.player.skills[skillKey];
  const readiness=jantarReadiness(world);
  const quality=clamp((skill-45)/8+(readiness.prepared-4)*.65-(c.fatigue/18));
  world.organisation.finance.organisationCash-=cost;
  world.organisation.finance.lifetimeSpent+=cost;
  c.daysOrganised++;
  c.lastActionDate=world.date;
  c.fatigue=clamp(c.fatigue+(delegate?1:4));
  if(delegate){delegate.energy=clamp(delegate.energy-7);delegate.stress=clamp(delegate.stress+3);}
  else {world.player.energy=clamp(world.player.energy-9);world.player.jobStanding=clamp(world.player.jobStanding-2);world.player.stress=clamp(world.player.stress+3);}
  if(focus==="student_help"){
    c.studentTrust=clamp(c.studentTrust+3+quality);
    c.crowdTrust=clamp(c.crowdTrust+(readiness.crowdSafety?2:-3));
    if(!readiness.crowdSafety)c.legalPressure=clamp(c.legalPressure+2);
  }else if(focus==="document_demands"){
    c.evidenceQuality=clamp(c.evidenceQuality+4+quality);
    c.studentTrust=clamp(c.studentTrust+1);
  }else{
    const unsafe=!readiness.crowdSafety;
    world.organisation.volunteers=Math.max(0,world.organisation.volunteers+(unsafe?2:Math.round(7+quality)));
    c.crowdTrust=clamp(c.crowdTrust+(unsafe?-6:2+quality));
    c.legalPressure=clamp(c.legalPressure+(unsafe?6:1));
    world.organisation.mediaHeat=clamp(world.organisation.mediaHeat+4);
  }
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
  c.offers=clamp(25+Math.round(skill/5)+Math.round(c.evidenceQuality/4)+Math.round(c.studentTrust/7)-Math.round(c.legalPressure/3));
  if(input.pauseDemonstrations){c.fatigue=clamp(c.fatigue-12);c.crowdTrust=clamp(c.crowdTrust-3);}
  if(input.publicBriefing){world.organisation.mediaHeat=clamp(world.organisation.mediaHeat+5);world.player.stress=clamp(world.player.stress+3);}
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
