import { clamp } from "./math";
import { ConstituencyBaseline, ElectionResult, PartyState } from "./types";
export interface ElectionContext { nationalSwing:Record<string,number>; organisationByParty:Record<string,number>; candidateStrength?:Record<string,Record<string,number>>; }
export function simulateConstituency(c:ConstituencyBaseline,parties:PartyState[],ctx:ElectionContext,rng:{next():number}):ElectionResult {
  const raw:Record<string,number>={};
  for(const p of parties){const baseline=c.partyBaseline[p.id]??p.baseSupport;const swing=ctx.nationalSwing[p.id]??0;const org=((ctx.organisationByParty[p.id]??p.nationalOrganisation)-50)*.08;const cand=((ctx.candidateStrength?.[c.id]?.[p.id]??50)-50)*.06;const noise=(rng.next()-.5)*c.volatility;raw[p.id]=Math.max(.1,baseline+swing+org+cand+noise);}
  const totalShare=Object.values(raw).reduce((a,b)=>a+b,0);const shares=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,v/totalShare]));
  const turnout=clamp(c.turnoutBase+(rng.next()-.5)*6,35,90)/100,totalVotes=Math.round(c.electorate*turnout);
  const votes=Object.fromEntries(Object.entries(shares).map(([k,s])=>[k,Math.round(totalVotes*s)]));const winnerPartyId=Object.entries(votes).sort((a,b)=>b[1]-a[1])[0][0];
  return{constituencyId:c.id,turnout,votes,winnerPartyId};
}
export function seatTally(results:ElectionResult[]):Record<string,number>{return results.reduce((acc,r)=>{acc[r.winnerPartyId]=(acc[r.winnerPartyId]??0)+1;return acc;},{} as Record<string,number>);}
