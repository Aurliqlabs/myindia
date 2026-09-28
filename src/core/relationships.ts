import { clamp } from "./math";
import { CharacterMemory, MemoryType, RelationshipState, WorldState } from "./types";
import { makeWorldId } from "./id";
import { defaultDecay } from "./memory";
export function getRelationship(world:WorldState,a:string,b:string):RelationshipState|undefined {
  return world.relationships.find(r=>(r.actorA===a&&r.actorB===b)||(r.actorA===b&&r.actorB===a));
}
export function adjustRelationship(world:WorldState,a:string,b:string,delta:Partial<Omit<RelationshipState,"actorA"|"actorB">>):void {
  let r=getRelationship(world,a,b);
  if(!r){r={actorA:a,actorB:b,trust:50,loyalty:50,personal:50,ideologicalAlignment:50,fear:0,resentment:0};world.relationships.push(r);}
  for(const [k,v] of Object.entries(delta)) if(typeof v==="number") (r as any)[k]=clamp((r as any)[k]+v);
}
export interface MemoryExtra { involvedIds?:string[]; emotionalValence?:number; decay?:number; politicalRelevance?:number; }
export function remember(world:WorldState,characterId:string,type:MemoryType,salience:number,note:string,extra:MemoryExtra={}):CharacterMemory {
  const memory:CharacterMemory={id:makeWorldId(world,"mem"),characterId,date:world.date,type,salience:clamp(salience),note,
    involvedIds:extra.involvedIds,emotionalValence:extra.emotionalValence,decay:extra.decay??defaultDecay(clamp(salience)),politicalRelevance:extra.politicalRelevance};
  world.memories.push(memory); if(world.memories.length>5000)world.memories.splice(0,world.memories.length-5000); return memory;
}

/** A character defended in public: trust and loyalty rise, and the moment is remembered vividly for years. */
export function defendPublicly(world:WorldState,characterId:string):void {
  const c=world.characters[characterId]; if(!c)throw new Error(`Unknown character ${characterId}`);
  adjustRelationship(world,world.player.id,characterId,{trust:10,loyalty:8,personal:4});
  c.morale=clamp(c.morale+6);
  remember(world,characterId,"support",78,"Was publicly defended by the player.",{emotionalValence:70,politicalRelevance:40});
}
/** Public humiliation is a high-salience wound: it scars trust immediately and resentment keeps building afterward. */
export function humiliatePublicly(world:WorldState,characterId:string):void {
  const c=world.characters[characterId]; if(!c)throw new Error(`Unknown character ${characterId}`);
  adjustRelationship(world,world.player.id,characterId,{trust:-16,loyalty:-10,resentment:20,personal:-8});
  c.morale=clamp(c.morale-14); c.stress=clamp(c.stress+10);
  remember(world,characterId,"humiliation",90,"Was publicly humiliated by the player.",{emotionalValence:-85,politicalRelevance:55});
}
/** Legal protection during trouble is one of the strongest loyalty-building events in the game. */
export function provideLegalProtection(world:WorldState,characterId:string):void {
  const c=world.characters[characterId]; if(!c)throw new Error(`Unknown character ${characterId}`);
  adjustRelationship(world,world.player.id,characterId,{trust:14,loyalty:16,fear:-6});
  remember(world,characterId,"legal_protection",82,"Was protected by the player during legal trouble.",{emotionalValence:75,politicalRelevance:60});
}
/** Recognising a founding member is a low-frequency, near-permanent morale and loyalty anchor. */
export function recognizeFoundingMember(world:WorldState,characterId:string):void {
  const c=world.characters[characterId]; if(!c)throw new Error(`Unknown character ${characterId}`);
  adjustRelationship(world,world.player.id,characterId,{trust:6,loyalty:10,personal:6});
  c.morale=clamp(c.morale+10);
  remember(world,characterId,"founding_recognition",88,"Was publicly recognised as a founding member.",{emotionalValence:80,politicalRelevance:30,decay:.9});
}
