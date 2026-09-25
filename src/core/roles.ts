import { OrgRole, RoleProfile, StaffSkillKey } from "./types";

export const ROLE_PROFILES:Record<OrgRole,RoleProfile> = {
  founder:{id:"founder",title:"Founder / President",level:5,primarySkill:"leadership",responsibilityWeight:1.5},
  chief_of_staff:{id:"chief_of_staff",title:"Chief of Staff",level:4,primarySkill:"leadership",responsibilityWeight:1.35},
  general_secretary:{id:"general_secretary",title:"General Secretary",level:4,primarySkill:"strategy",responsibilityWeight:1.3},
  legal_lead:{id:"legal_lead",title:"Legal Lead",level:3,primarySkill:"legal",responsibilityWeight:1.2},
  research_lead:{id:"research_lead",title:"Research Lead",level:3,primarySkill:"research",responsibilityWeight:1.15},
  media_lead:{id:"media_lead",title:"Media Lead",level:3,primarySkill:"media",responsibilityWeight:1.15},
  finance_lead:{id:"finance_lead",title:"Finance Lead",level:3,primarySkill:"finance",responsibilityWeight:1.15},
  field_organiser:{id:"field_organiser",title:"Field Organiser",level:2,primarySkill:"field",responsibilityWeight:1.05},
  state_coordinator:{id:"state_coordinator",title:"State Coordinator",level:2,primarySkill:"leadership",responsibilityWeight:1.1},
  district_coordinator:{id:"district_coordinator",title:"District Coordinator",level:1,primarySkill:"field",responsibilityWeight:1},
  volunteer:{id:"volunteer",title:"Volunteer",level:0,primarySkill:"field",responsibilityWeight:.6}
};

export function roleLevel(role?:OrgRole):number{return role?ROLE_PROFILES[role].level:0;}
export function roleTitle(role?:OrgRole):string{return role?ROLE_PROFILES[role].title:"Unassigned";}
export function nextRoleUp(role?:OrgRole):OrgRole|undefined {
  const level=roleLevel(role);
  const candidates=Object.values(ROLE_PROFILES).filter(r=>r.level===level+1&&r.id!=="founder");
  if(!candidates.length)return undefined;
  candidates.sort((a,b)=>b.responsibilityWeight-a.responsibilityWeight);
  return candidates[0].id;
}
/** A role's own skill counts double toward how well a character fills it. */
export function roleFitScore(skills:Partial<Record<StaffSkillKey,number>>,role:OrgRole):number {
  const profile=ROLE_PROFILES[role];
  const primary=skills[profile.primarySkill]??20;
  const others=Object.values(skills).filter((v):v is number=>typeof v==="number");
  const avgOther=others.length?others.reduce((a,b)=>a+b,0)/others.length:20;
  return primary*.65+avgOther*.35;
}
