import { clamp } from "./math";
import { CharacterMemory, MemoryType, WorldState } from "./types";

function daysBetween(a:string,b:string):number{return Math.max(0,Math.round((new Date(b+"T00:00:00Z").getTime()-new Date(a+"T00:00:00Z").getTime())/86400000));}

/** Higher salience persists longer; a very high-salience memory never fully fades. */
export function defaultDecay(salience:number):number{return clamp(.2+salience*.007,0,.95);}

export function effectiveSalience(memory:CharacterMemory,onDate:string):number{
  const decay=memory.decay??defaultDecay(memory.salience);
  const halfLifeDays=30+decay*700;
  const daysSince=daysBetween(memory.date,onDate);
  const decayed=memory.salience*Math.pow(.5,daysSince/halfLifeDays);
  const floor=memory.salience>=80?memory.salience*.35:0;
  return clamp(Math.max(decayed,floor));
}

export function recallMemories(world:WorldState,characterId:string,opts:{type?:MemoryType;minEffectiveSalience?:number}={}):Array<CharacterMemory&{effectiveSalience:number}> {
  const min=opts.minEffectiveSalience??0;
  return world.memories
    .filter(m=>m.characterId===characterId&&(!opts.type||m.type===opts.type)&&(!m.involvedIds||m.involvedIds.includes(characterId)||m.characterId===characterId))
    .map(m=>({...m,effectiveSalience:effectiveSalience(m,world.date)}))
    .filter(m=>m.effectiveSalience>=min)
    .sort((a,b)=>b.effectiveSalience-a.effectiveSalience);
}

/** Net emotional weight of a character's remembered history: positive valence outweighs negative, scaled by how vivid each memory still is. */
export function memoryWeight(world:WorldState,characterId:string,type?:MemoryType):number {
  return recallMemories(world,characterId,{type}).reduce((sum,m)=>sum+(m.emotionalValence??0)*(m.effectiveSalience/100),0);
}
