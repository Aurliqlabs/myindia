import { clamp, mean } from "./math";
import { effectiveSkill, workCharacter } from "./characters";
import { OperationKind, OperationState, WorldState } from "./types";
import { makeId } from "./id";
import { spendOrganisation } from "./finance";
const primarySkill:Record<OperationKind,"field"|"research"|"legal"|"media"|"fundraising"|"leadership">={
 protest:"field",school_audit:"research",public_investigation:"research",state_visit:"leadership",press_conference:"media",fundraising:"fundraising",recruitment:"leadership",legal_challenge:"legal",social_campaign:"media"
};
export function startOperation(world:WorldState,input:Omit<OperationState,"id"|"startedOn"|"progress"|"spent"|"status">):OperationState {
  if(input.budgetAllocated>world.organisation.finance.organisationCash)throw new Error("Insufficient organisation funds");
  const op:OperationState={...input,id:makeId("op",world.seed),startedOn:world.date,progress:0,spent:0,status:"active"};world.operations[op.id]=op;return op;
}
export function tickOperation(world:WorldState,op:OperationState,rng:{next():number}):number {
  if(op.status!=="active")return 0;const staff=op.staffIds.map(id=>world.characters[id]).filter(Boolean);const skill=primarySkill[op.kind];
  const staffPower=mean(staff.map(c=>effectiveSkill(c,skill)));const volunteerPower=Math.sqrt(Math.max(0,op.volunteerAllocation))*1.8;
  const budgetDaily=Math.min(Math.max(500,op.budgetAllocated/20),Math.max(0,op.budgetAllocated-op.spent));
  if(budgetDaily>0&&spendOrganisation(world,budgetDaily)){op.spent+=budgetDaily;}
  const budgetPower=Math.log10(1+budgetDaily)*3;const noise=.8+rng.next()*.4;let delta=(2+staffPower*.045+volunteerPower*.035+budgetPower*.08)*noise;
  delta*=1-op.legalRisk/250;delta=Math.max(.2,delta);op.progress=clamp(op.progress+delta,0,op.targetProgress);op.publicMomentum=clamp(op.publicMomentum+delta*.35-op.legalRisk*.003);op.mediaAttention=clamp(op.mediaAttention+delta*.2);
  for(const c of staff)workCharacter(c,2.5+op.mediaAttention/50);
  if(op.progress>=op.targetProgress){op.status="completed";world.organisation.credibility=clamp(world.organisation.credibility+3);world.publicOpinion.youth=clamp(world.publicOpinion.youth+2);}
  return delta;
}
