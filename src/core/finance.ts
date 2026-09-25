import { WorldState } from "./types";
import { respondToMissedPay } from "./careers";
import { Rng } from "./rng";
export function monthlyPayrollDue(world:WorldState):number {
  return Object.values(world.characters).filter(c=>c.employed&&!c.volunteer).reduce((sum,c)=>sum+c.salaryMonthly,0);
}
export function organisationMonthlyBurn(world:WorldState):number {
  const f=world.organisation.finance; return monthlyPayrollDue(world)+f.monthlyOfficeCosts+f.monthlyTechnologyCosts+f.monthlyTravelBaseline;
}
/** Each unpaid character responds according to their own loyalty, greed and bond with the player, not a single organisation-wide penalty. */
export function processMonthEnd(world:WorldState,rng:Rng):{due:number;paid:number;shortfall:number} {
  const f=world.organisation.finance; const payroll=monthlyPayrollDue(world);
  const fixed=f.monthlyOfficeCosts+f.monthlyTechnologyCosts+f.monthlyTravelBaseline;
  f.organisationCash+=f.monthlyRecurringDonations; f.lifetimeRaised+=f.monthlyRecurringDonations;
  const total=payroll+fixed+f.outstandingPayables; const paid=Math.min(total,f.organisationCash);
  f.organisationCash-=paid; f.lifetimeSpent+=paid; const shortfall=total-paid; f.outstandingPayables=shortfall;
  if(shortfall>0){
    world.organisation.credibility=Math.max(0,world.organisation.credibility-2);
    for(const c of Object.values(world.characters).filter(x=>x.employed&&!x.volunteer))respondToMissedPay(world,c,rng);
  } else {
    for(const c of Object.values(world.characters).filter(x=>x.employed))c.unpaidStreak=0;
  }
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
