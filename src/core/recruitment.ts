import { clamp } from "./math";
import { CandidateImpression, CandidateProfile, CharacterPsychology, CharacterState, StaffSkillKey, WorldState } from "./types";
import { makeId } from "./id";
import { hireCharacter } from "./characters";
import { Rng } from "./rng";

const FIRST_NAMES=["Priya","Arjun","Neha","Vikram","Fatima","Rahul","Ananya","Karan","Divya","Suresh","Leela","Imran"];
const LAST_NAMES=["Sharma","Iyer","Khan","Patil","Reddy","Bose","Nair","Singh","Gupta","Fernandes"];
const BACKGROUNDS=[
  "Spent years as a local trade-union organiser.","Left a corporate finance job to join the movement.","A former journalist covering state politics.",
  "Built a small NGO before it folded for lack of funds.","Recently graduated, hungry to prove themselves.","A retired schoolteacher with deep local contacts."
];
const HOME_STATES=["Delhi","Maharashtra","Uttar Pradesh","Kerala","Karnataka","Bihar","West Bengal","Rajasthan","Tamil Nadu","Gujarat"];
const SKILL_KEYS:StaffSkillKey[]=["communication","strategy","analysis","leadership","negotiation","courage","legal","media","finance","research","field","fundraising"];

function band(value:number):"weak"|"average"|"strong"|"excellent"{return value<40?"weak":value<60?"average":value<80?"strong":"excellent";}

/** True stats stay hidden on the world object; only the derived impression is meant to reach the player. */
export function generateCandidate(world:WorldState,rng:Rng):CandidateProfile {
  const name=`${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
  const skillCount=2+rng.integer(0,2);
  const trueSkills:Partial<Record<StaffSkillKey,number>>={};
  const pool=[...SKILL_KEYS];
  for(let i=0;i<skillCount;i++){const idx=rng.integer(0,pool.length-1);const key=pool.splice(idx,1)[0];trueSkills[key]=clamp(35+rng.integer(0,55));}
  const truePsychology:CharacterPsychology={
    ambition:clamp(rng.integer(20,90)),integrity:clamp(rng.integer(15,90)),greed:clamp(rng.integer(10,85)),
    fear:clamp(rng.integer(10,70)),ego:clamp(rng.integer(15,90)),riskTolerance:clamp(rng.integer(15,90)),ideologicalCommitment:clamp(rng.integer(20,90))
  };
  return {
    id:makeId("candidate",world.seed),name,age:22+rng.integer(0,28),homeState:rng.pick(HOME_STATES),background:rng.pick(BACKGROUNDS),
    trueSkills,truePsychology,interviewLevel:0,generatedOn:world.date
  };
}

export function refreshRecruitmentPool(world:WorldState,rng:Rng,size=3):void {
  world.recruitmentPool=Array.from({length:size},()=>generateCandidate(world,rng));
}

/** Interviewing narrows the noise on skill estimates and adds one qualitative concern the interviewer picked up on. */
export function interviewCandidate(world:WorldState,candidateId:string,rng:Rng):void {
  const candidate=world.recruitmentPool.find(c=>c.id===candidateId); if(!candidate)throw new Error("Unknown candidate");
  candidate.interviewLevel=Math.min(2,candidate.interviewLevel+1);
}

/** What the player actually sees: qualitative impressions, not the true hidden numbers. Noise shrinks as interviewLevel rises. */
export function assessCandidate(candidate:CandidateProfile,rng:Rng):CandidateImpression {
  const noise=candidate.interviewLevel>=2?4:candidate.interviewLevel===1?10:20;
  const estimatedSkills:CandidateImpression["estimatedSkills"]={};
  for(const [key,value] of Object.entries(candidate.trueSkills)){
    const observed=clamp((value as number)+(rng.next()*2-1)*noise);
    estimatedSkills[key as StaffSkillKey]=band(observed);
  }
  const headline:string[]=[];
  const topSkill=Object.entries(candidate.trueSkills).sort((a,b)=>(b[1]??0)-(a[1]??0))[0];
  if(topSkill&&band(topSkill[1]??0)!=="weak")headline.push(`${topSkill[1]!>=80?"Excellent":"Strong"} ${topSkill[0]}.`);
  if(candidate.truePsychology.ambition>70)headline.push("Very ambitious.");
  else if(candidate.truePsychology.ambition<35)headline.push("Seems content staying in a supporting role.");

  const concerns:string[]=[];
  if(candidate.interviewLevel>=1){
    if(candidate.truePsychology.integrity<35)concerns.push("References describe them as difficult to manage.");
    if(candidate.truePsychology.greed>70)concerns.push("Seemed unusually focused on compensation.");
    if(candidate.truePsychology.ego>75)concerns.push("Came across as hard to take direction from.");
  }
  if(candidate.interviewLevel>=2&&candidate.truePsychology.riskTolerance>75)concerns.push("Comfortable with tactics that carry real legal risk.");

  return {headline:headline.length?headline:["No strong impression either way."],estimatedSkills,concerns};
}

export function hireCandidate(world:WorldState,candidateId:string,role:string,salaryMonthly:number,volunteer=false):CharacterState {
  const candidate=world.recruitmentPool.find(c=>c.id===candidateId); if(!candidate)throw new Error("Unknown candidate");
  const id=makeId("staff",world.seed);
  world.characters[id]={
    id,name:candidate.name,age:candidate.age,role,homeState:candidate.homeState,background:candidate.background,
    salaryMonthly:0,skills:candidate.trueSkills,energy:80,health:90,stress:20,morale:70,
    psychology:candidate.truePsychology,employed:false,volunteer:false,joinedOn:"",unpaidStreak:0
  };
  hireCharacter(world,id,role,salaryMonthly,volunteer);
  world.recruitmentPool=world.recruitmentPool.filter(c=>c.id!==candidateId);
  return world.characters[id];
}
