import { clamp } from "./math";
import { CharacterMemory, MemoryType, RelationshipState, WorldState } from "./types";
import { makeId } from "./id";
export function getRelationship(world:WorldState,a:string,b:string):RelationshipState|undefined {
  return world.relationships.find(r=>(r.actorA===a&&r.actorB===b)||(r.actorA===b&&r.actorB===a));
}
export function adjustRelationship(world:WorldState,a:string,b:string,delta:Partial<Omit<RelationshipState,"actorA"|"actorB">>):void {
  let r=getRelationship(world,a,b);
  if(!r){r={actorA:a,actorB:b,trust:50,loyalty:50,personal:50,ideologicalAlignment:50,fear:0,resentment:0};world.relationships.push(r);}
  for(const [k,v] of Object.entries(delta)) if(typeof v==="number") (r as any)[k]=clamp((r as any)[k]+v);
}
export function remember(world:WorldState,characterId:string,type:MemoryType,salience:number,note:string):CharacterMemory {
  const memory={id:makeId("mem",world.seed),characterId,date:world.date,type,salience:clamp(salience),note};
  world.memories.push(memory); if(world.memories.length>5000)world.memories.splice(0,world.memories.length-5000); return memory;
}
