import { clamp } from "./math";
import { CharacterState, OrgRole, StaffSkillKey, WorldState } from "./types";
import { adjustRelationship, getRelationship, remember } from "./relationships";
import { roleTitle } from "./roles";
export function hireCharacter(world:WorldState,id:string,role:string,salaryMonthly:number,volunteer=false,roleId?:OrgRole):void {
  const c=world.characters[id]; if(!c)throw new Error(`Unknown character ${id}`);
  c.role=role;c.salaryMonthly=volunteer?0:salaryMonthly;c.volunteer=volunteer;c.employed=true;c.joinedOn=world.date;c.unpaidStreak=0;
  if(roleId)c.roleId=roleId;
  adjustRelationship(world,world.player.id,c.id,{trust:3,loyalty:4,personal:2}); remember(world,c.id,"support",45,volunteer?"Joined as a volunteer.":"Accepted a paid role.",{emotionalValence:35});
}
/** High-ego, low-integrity characters remember being fired as a personal betrayal, not a business decision; steady, principled ones absorb it more calmly. */
export function fireCharacter(world:WorldState,id:string):void {
  const c=world.characters[id];if(!c)throw new Error(`Unknown character ${id}`);
  const rel=getRelationship(world,world.player.id,c.id);
  const priorBond=rel?(rel.trust+rel.loyalty+rel.personal)/3:50;
  const egoFactor=c.psychology.ego/50, bondFactor=priorBond/50;
  c.employed=false;c.role="Former staff";
  adjustRelationship(world,world.player.id,c.id,{
    trust:-clamp(14*bondFactor,6,26),
    loyalty:-clamp(16*bondFactor,6,28),
    resentment:clamp(18*egoFactor,8,36),
    personal:-clamp(6*bondFactor,3,14)
  });
  remember(world,c.id,"firing",clamp(70+c.psychology.ego*.3),"Was removed from the organisation.",{emotionalValence:-clamp(60+c.psychology.ego*.3,60,100)});
}
export function assignRole(world:WorldState,id:string,roleId:OrgRole):void {
  const c=world.characters[id];if(!c)throw new Error(`Unknown character ${id}`);
  c.roleId=roleId;c.role=roleTitle(roleId);
}
export function restCharacter(c:CharacterState,amount=18):void{c.energy=clamp(c.energy+amount);c.stress=clamp(c.stress-amount*.45);}
export function workCharacter(c:CharacterState,intensity:number):void{c.energy=clamp(c.energy-intensity);c.stress=clamp(c.stress+intensity*.35);if(c.energy<20)c.health=clamp(c.health-1);}
export function effectiveSkill(c:CharacterState,key:StaffSkillKey):number {
  const base=c.skills[key]??20;const energyFactor=.55+c.energy/220;const stressPenalty=c.stress>70?(c.stress-70)*.35:0;return clamp(base*energyFactor-stressPenalty);
}
