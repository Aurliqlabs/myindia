import type { WorldState } from "./types";
let legacyCounter=0;
export function makeId(prefix:string,seed=0):string{legacyCounter++;return `${prefix}_${seed.toString(36)}_${legacyCounter.toString(36)}`;}
export function resetIdCounter():void{legacyCounter=0;}
export function hydrateWorldIdCounter(world:WorldState):number{
  const ids=[world.player.id,...Object.keys(world.characters),...Object.keys(world.operations),...Object.keys(world.evidence),...world.evidenceEdges.map(x=>x.id),...Object.keys(world.secrets),...world.memories.map(x=>x.id),...world.scheduledEvents.map(x=>x.id),...(world.characterEvents??[]).map(x=>x.id),...(world.recruitmentPool??[]).map(x=>x.id)];
  const suffix=new RegExp(`_${world.seed.toString(36)}_([0-9a-z]+)$`);
  let highest=Math.max(1,world.idCounter??1);
  for(const id of ids){const match=id.match(suffix);if(match){const value=parseInt(match[1],36);if(Number.isFinite(value))highest=Math.max(highest,value);}}
  world.idCounter=highest;return highest;
}
export function makeWorldId(world:WorldState,prefix:string):string{
  if(world.idCounter===undefined)hydrateWorldIdCounter(world);
  world.idCounter=(world.idCounter??1)+1;
  return `${prefix}_${world.seed.toString(36)}_${world.idCounter.toString(36)}`;
}
