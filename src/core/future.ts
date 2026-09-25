import { clamp } from "./math";
import { ScheduledEvent, WorldState } from "./types";
import { makeId } from "./id";
export function generateSystemEvent(world:WorldState,rng:{next():number}):ScheduledEvent|undefined {
  const m=world.macro;const pressures=[
    {kind:"youth_protest",score:m.unemployment*.55+(100-m.institutionalTrust)*.25+(100-m.socialStability)*.2},
    {kind:"cost_of_living_pressure",score:m.inflation*7+(100-world.publicOpinion.workers)*.15},
    {kind:"government_scandal",score:world.organisation.mediaHeat*.25+world.organisation.legalExposure*.35+Object.values(world.secrets).filter(s=>!s.exposed).length*6},
    {kind:"party_faction_dispute",score:Math.max(0,55-world.organisation.credibility)*.7+world.player.stress*.2}
  ];const strongest=pressures.sort((a,b)=>b.score-a.score)[0];const probability=clamp((strongest.score-30)/220,0,.18);
  if(rng.next()>probability)return undefined;return{id:makeId("sys_evt",world.seed),date:world.date,kind:strongest.kind,payload:{severity:Math.round(clamp(strongest.score,10,100))}};
}
