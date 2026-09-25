import type { HistoricalOperationTemplate } from "../content/types";
import type { WorldState } from "../core/types";
import { startOperation } from "../core/operations";

export function startHistoricalOperation(world:WorldState,template:HistoricalOperationTemplate,staffIds:string[],volunteers:number){
  return startOperation(world,{
    kind:template.kind,
    title:template.title,
    location:template.location,
    targetProgress:template.targetProgress,
    budgetAllocated:template.suggestedBudget,
    staffIds,
    volunteerAllocation:Math.max(0,volunteers),
    mediaAttention:template.startingMediaAttention,
    legalRisk:template.startingLegalRisk,
    publicMomentum:template.startingPublicMomentum
  });
}
