import { CharacterState, WorldState } from "./types";
import { getRelationship } from "./relationships";
import { memoryWeight, recallMemories } from "./memory";

/** Bands raw hidden numbers into player-facing language. The player never sees the underlying score, only which band it falls in. */
export function characterSignals(world:WorldState,characterId:string):string[] {
  const c=world.characters[characterId]; if(!c)throw new Error(`Unknown character ${characterId}`);
  const signals:string[]=[];
  if(c.energy<25)signals.push("Seems exhausted.");
  else if(c.energy<45)signals.push("Running low on energy.");
  if(c.stress>75)signals.push("Under serious strain.");
  else if(c.stress>55)signals.push("Increasingly frustrated.");
  if(c.health<40)signals.push("Health may be suffering.");
  if(c.morale<30)signals.push("Morale has fallen sharply.");
  else if(c.morale>80)signals.push("Clearly energised by the work.");

  const rel=getRelationship(world,world.player.id,characterId);
  if(rel){
    if(rel.trust>78)signals.push("Strongly trusts you.");
    else if(rel.trust<28)signals.push("Trust in you is thin.");
    if(rel.resentment>55)signals.push("Relationship is strained.");
    if(rel.loyalty>78)signals.push("Fiercely loyal.");
    else if(rel.loyalty<25)signals.push("Loyalty seems shallow.");
    if(rel.personal>75)signals.push("Considers you a close friend.");
  }

  if(c.psychology.ambition>65&&(c.roleId==="volunteer"||!c.roleId))signals.push("May be seeking more responsibility.");
  if(c.psychology.ego>70&&(rel?.resentment??0)>40)signals.push("Pride seems bruised.");
  if(c.psychology.integrity<35&&c.psychology.greed>60)signals.push("References describe them as difficult to manage.");
  if(c.psychology.riskTolerance>75)signals.push("Comfortable taking risks others would avoid.");
  if((c.unpaidStreak??0)>=2)signals.push("Has gone unpaid for some time.");

  const humiliations=recallMemories(world,characterId,{type:"humiliation",minEffectiveSalience:30});
  if(humiliations.length)signals.push("Has not forgotten a past humiliation.");
  const netMood=memoryWeight(world,characterId);
  if(netMood<-40)signals.push("Carries visible resentment from past events.");
  else if(netMood>40)signals.push("Speaks warmly of their history with the movement.");

  return signals.length?signals:["Nothing unusual to report."];
}

/** A short human-readable line for a roster list, favouring the strongest available signal. */
export function characterHeadline(world:WorldState,characterId:string):string {
  const signals=characterSignals(world,characterId);
  return signals[0];
}
