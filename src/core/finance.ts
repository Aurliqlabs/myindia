import { WorldState } from "./types";
import { remember, adjustRelationship } from "./relationships";
export function monthlyPayrollDue(world:WorldState):number {
  return Object.values(world.characters).filter(c=>c.employed&&!c.volunteer).reduce((sum,c)=>sum+c.salaryMonthly,0);
}
export function organisationMonthlyBurn(world:WorldState):number {
  const f=world.organisation.finance; return monthlyPayrollDue(world)+f.monthlyOfficeCosts+f.monthlyTechnologyCosts+f.monthlyTravelBaseline;
}
export function processMonthEnd(world:WorldState):{due:number;paid:number;shortfall:number} {
  const f=world.organisation.finance; const payroll=monthlyPayrollDue(world);
  const fixed=f.monthlyOfficeCosts+f.monthlyTechnologyCosts+f.monthlyTravelBaseline;
  f.organisationCash+=f.monthlyRecurringDonations; f.lifetimeRaised+=f.monthlyRecurringDonations;
  const total=payroll+fixed+f.outstandingPayables; const paid=Math.min(total,f.organisationCash);
  f.organisationCash-=paid; f.lifetimeSpent+=paid; const shortfall=total-paid; f.outstandingPayables=shortfall;
  if(shortfall>0){world.organisation.credibility=Math.max(0,world.organisation.credibility-2);
    for(const c of Object.values(world.characters).filter(x=>x.employed&&!x.volunteer)){c.morale=Math.max(0,c.morale-7);c.stress=Math.min(100,c.stress+5);remember(world,c.id,"salary_missed",70,"The organisation could not fully meet payroll.");adjustRelationship(world,world.player.id,c.id,{trust:-4,resentment:5,loyalty:-3});}}
  return {due:total,paid,shortfall};
}
export function spendOrganisation(world:WorldState,amount:number):boolean {
  if(amount<0)throw new Error("amount must be positive"); if(world.organisation.finance.organisationCash<amount)return false;
  world.organisation.finance.organisationCash-=amount; world.organisation.finance.lifetimeSpent+=amount; return true;
}
export function receiveDonation(world:WorldState,amount:number,recurringMonthly=0):void {
  if(amount<0||recurringMonthly<0)throw new Error("donations cannot be negative");
  world.organisation.finance.organisationCash+=amount; world.organisation.finance.lifetimeRaised+=amount; world.organisation.finance.monthlyRecurringDonations+=recurringMonthly;
}
