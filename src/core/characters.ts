import { clamp } from "./math";
import { CharacterState, StaffSkillKey, WorldState } from "./types";
import { adjustRelationship, remember } from "./relationships";
export function hireCharacter(world:WorldState,id:string,role:string,salaryMonthly:number,volunteer=false):void {
  const c=world.characters[id]; if(!c)throw new Error(`Unknown character ${id}`);
  c.role=role;c.salaryMonthly=volunteer?0:salaryMonthly;c.volunteer=volunteer;c.employed=true;c.joinedOn=world.date;
  adjustRelationship(world,world.player.id,c.id,{trust:3,loyalty:4,personal:2}); remember(world,c.id,"support",45,volunteer?"Joined as a volunteer.":"Accepted a paid role.");
}
export function fireCharacter(world:WorldState,id:string):void {
  const c=world.characters[id];if(!c)throw new Error(`Unknown character ${id}`);c.employed=false;c.role="Former staff";
  adjustRelationship(world,world.player.id,c.id,{trust:-18,loyalty:-20,resentment:24,personal:-8}); remember(world,c.id,"firing",85,"Was removed from the organisation.");
}
export function restCharacter(c:CharacterState,amount=18):void{c.energy=clamp(c.energy+amount);c.stress=clamp(c.stress-amount*.45);}
export function workCharacter(c:CharacterState,intensity:number):void{c.energy=clamp(c.energy-intensity);c.stress=clamp(c.stress+intensity*.35);if(c.energy<20)c.health=clamp(c.health-1);}
export function effectiveSkill(c:CharacterState,key:StaffSkillKey):number {
  const base=c.skills[key]??20;const energyFactor=.55+c.energy/220;const stressPenalty=c.stress>70?(c.stress-70)*.35:0;return clamp(base*energyFactor-stressPenalty);
}
