/* The browser client's single entry point into the TypeScript simulation.
 * Ownership is explicit so the two halves never both tick the same number:
 * - the engine owns people (psychology, burnout, memory, relationships, careers, recruitment, payroll responses),
 *   voter demographics and the seat-by-seat election model;
 * - the browser owns the dated historical timeline, campaign actions and presentation, and mirrors its
 *   organisation metrics into the world before every engine step. */
import type { CharacterState, OrgRole, PartyState, StaffSkillKey, TraitId, WorldState } from "../core/types";
import { createNewGame } from "../core/world";
import { deserializeWorld, serializeWorld } from "../core/save";
import { createRng } from "../core/rng";
import { clamp } from "../core/math";
import { executeCommand, GameCommand, CommandResult } from "../core/commands";
import { dailyCharacterTick, evaluateMonthlyCareers } from "../core/careers";
import { processMonthEnd, monthlyPayrollDue } from "../core/finance";
import { characterSignals } from "../core/signals";
import { remember } from "../core/relationships";
import { recallMemories } from "../core/memory";
import { effectiveSkill, restCharacter, workCharacter } from "../core/characters";
import { roleFitScore, roleTitle, ROLE_PROFILES } from "../core/roles";
import { assessCandidate } from "../core/recruitment";
import { simulateConstituency } from "../core/elections";

export const BROWSER_SNAPSHOT_DATE="2026-09-28";

const TRAIT_MAP:Record<string,TraitId>={speaker:"speaker",analyst:"analyst",organiser:"organiser",lawyer:"legal_mind",outsider:"outsider",networker:"connector"};
const FRIEND_ROLES:Record<string,OrgRole>={friend_asha:"legal_lead",friend_rohan:"field_organiser",friend_meera:"media_lead",friend_sameer:"finance_lead"};
const HIREABLE_ROLES:OrgRole[]=["legal_lead","research_lead","media_lead","finance_lead","field_organiser","state_coordinator","district_coordinator"];
export const DEMOGRAPHICS=["youth","students","urban","rural","women","workers","business"] as const;
export type Demographic=typeof DEMOGRAPHICS[number];
const DEMOGRAPHIC_WEIGHTS:Record<Demographic,number>={youth:.2,students:.1,urban:.15,rural:.25,women:.15,workers:.1,business:.05};

export interface BrowserPlayerSeed {
  name:string; age:number; homeState:string; profession:string; trait:string; skills:Record<string,number>;
  monthlyIncome:number; monthlyLivingCosts:number; savings:number; seed:number; gender?:string; district?:string; education?:string; family?:string;
}
export interface OrgSnapshot { date:string; day:number; funds:number; volunteers:number; credibility:number; media:number; legal:number; playerName:string; orgName:string; }
export interface PeopleEvent { characterId:string; name:string; type:string; note:string; date:string; }
export interface TickReport { events:PeopleEvent[]; credibilityDelta:number; }
export interface MonthReport extends TickReport { due:number; paid:number; shortfall:number; fundsAfter:number; }

export function createBrowserWorld(seed:BrowserPlayerSeed):WorldState {
  const world=createNewGame({name:seed.name,age:seed.age,homeState:seed.homeState||"Delhi",profession:seed.profession||"Citizen",trait:TRAIT_MAP[seed.trait]??"speaker",seed:seed.seed,snapshotDate:BROWSER_SNAPSHOT_DATE,
    gender:seed.gender,homeDistrict:seed.district,education:seed.education,familyBackground:seed.family,monthlyIncome:seed.monthlyIncome,personalSavings:seed.savings,monthlyLivingCosts:seed.monthlyLivingCosts});
  for(const [key,value] of Object.entries(seed.skills??{}))if(key in world.player.skills)(world.player.skills as Record<string,number>)[key]=clamp(value);
  world.organisation.name="Cockroach Janta Party";
  world.flags.content_version=BROWSER_SNAPSHOT_DATE;
  return world;
}

/** Restores defaults and the id counter exactly as a core save load would. */
export function hydrateWorld(raw:unknown):WorldState { return deserializeWorld(typeof raw==="string"?raw:JSON.stringify(raw)); }
export function serialize(world:WorldState):string { return serializeWorld(world); }

/** The browser remains authoritative for organisation metrics; the world mirrors them before any engine step. */
export function syncFromBrowser(world:WorldState,snap:OrgSnapshot):void {
  world.date=snap.date; world.day=snap.day;
  world.player.name=snap.playerName; world.organisation.name=snap.orgName;
  world.organisation.finance.organisationCash=Math.max(0,snap.funds);
  world.organisation.volunteers=Math.max(0,snap.volunteers);
  world.organisation.credibility=clamp(snap.credibility);
  world.organisation.mediaHeat=clamp(snap.media);
  world.organisation.legalExposure=clamp(snap.legal);
}

function eventsSince(world:WorldState,from:number):PeopleEvent[] {
  return world.characterEvents.slice(from).map(e=>({characterId:e.characterId,name:world.characters[e.characterId]?.name??"A colleague",type:e.type,note:e.note,date:e.date}));
}

/** One day of staff wellbeing: energy, stress, burnout leave and stress-driven mistakes. */
export function dailyPeopleTick(world:WorldState):TickReport {
  const rng=createRng(world.rngState),mark=world.characterEvents.length,credibility=world.organisation.credibility;
  for(const c of Object.values(world.characters))dailyCharacterTick(world,c,rng);
  world.rngState=rng.state();
  return {events:eventsSince(world,mark),credibilityDelta:world.organisation.credibility-credibility};
}

/** Month end for people: salaries from the remaining cash (each unpaid person responds individually), then careers evolve. */
export function monthEnd(world:WorldState,fundsAvailable:number):MonthReport {
  const rng=createRng(world.rngState),mark=world.characterEvents.length;
  const f=world.organisation.finance;
  f.organisationCash=Math.max(0,fundsAvailable);f.monthlyOfficeCosts=0;f.monthlyTechnologyCosts=0;f.monthlyTravelBaseline=0;
  const credibility=world.organisation.credibility;
  const payroll=processMonthEnd(world,rng);
  evaluateMonthlyCareers(world,rng);
  world.rngState=rng.state();
  return {...payroll,fundsAfter:f.organisationCash,events:eventsSince(world,mark),credibilityDelta:world.organisation.credibility-credibility};
}

export function payrollDue(world:WorldState):number { return monthlyPayrollDue(world)+world.organisation.finance.outstandingPayables; }

function activeStaff(world:WorldState):CharacterState[] {
  return Object.values(world.characters).filter(c=>c.employed&&!(c.onLeaveUntil&&world.date<c.onLeaveUntil));
}

/** Choices that land on the whole team: everyone active feels it, and a large swing is remembered. */
export function teamMoraleShift(world:WorldState,delta:number,note:string):number {
  const staff=activeStaff(world);
  for(const c of staff){
    c.morale=clamp(c.morale+delta);
    if(Math.abs(delta)>=4)remember(world,c.id,delta>0?"support":"overwork",clamp(40+Math.abs(delta)*4),note,{emotionalValence:clamp(delta*8,-80,80)});
  }
  return staff.length;
}

/** The best available colleague for a skill does the work: their skill becomes the action's bonus and the effort costs them energy. */
export function useStaff(world:WorldState,skill:StaffSkillKey,intensity=4):{bonus:number;id?:string;name?:string} {
  const best=activeStaff(world).map(c=>({c,score:effectiveSkill(c,skill)})).sort((a,b)=>b.score-a.score)[0];
  if(!best||best.score<25)return {bonus:0};
  workCharacter(best.c,intensity);
  return {bonus:Math.round((best.score-25)/5),id:best.c.id,name:best.c.name};
}

/** The network approaches the colleague it judges easiest to buy. Integrity and greed decide; the player only
 * learns that someone refused, or that a file leaked. */
export function bribeAttempt(world:WorldState):{id:string;name:string;accepted:boolean}|null {
  const staff=activeStaff(world);if(!staff.length)return null;
  const rng=createRng(world.rngState);
  const target=staff.sort((a,b)=>(a.psychology.integrity-a.psychology.greed)-(b.psychology.integrity-b.psychology.greed))[0];
  const accepted=rng.next()<clamp((target.psychology.greed-target.psychology.integrity+30)/120,0,.8);
  world.rngState=rng.state();
  if(accepted)remember(world,target.id,"betrayal",75,"Took money to pass the movement's case files to the network.",{emotionalValence:-30,politicalRelevance:80});
  else{target.morale=clamp(target.morale+5);remember(world,target.id,"support",65,"Refused a bribe to betray the movement.",{emotionalValence:55,politicalRelevance:60});}
  return {id:target.id,name:target.name,accepted};
}

export interface PersonView {
  id:string; name:string; role:string; background:string; homeState:string; founding:boolean;
  status:"available"|"volunteer"|"paid"|"on_leave"|"former"; salaryMonthly:number; suggestedRole:OrgRole; suggestedRoleTitle:string;
  signals:string[]; memories:string[]; request?:{type:string;detail:string};
}
export function peopleView(world:WorldState):PersonView[] {
  return Object.values(world.characters).map(c=>{
    const onLeave=!!(c.employed&&c.onLeaveUntil&&world.date<c.onLeaveUntil);
    const status:PersonView["status"]=onLeave?"on_leave":c.employed?(c.volunteer?"volunteer":"paid"):c.joinedOn?"former":"available";
    const suggestedRole=FRIEND_ROLES[c.id]??bestRole(c.skills);
    return {id:c.id,name:c.name,role:c.employed?c.role:status==="former"?"Former colleague":c.role,background:c.background??"",homeState:c.homeState??"",founding:!!c.foundingMember,
      status,salaryMonthly:c.salaryMonthly,suggestedRole,suggestedRoleTitle:roleTitle(suggestedRole),
      signals:c.joinedOn?characterSignals(world,c.id):[],
      memories:recallMemories(world,c.id,{minEffectiveSalience:25}).slice(0,2).map(m=>m.note),
      request:c.pendingRequest?{type:c.pendingRequest.type,detail:c.pendingRequest.detail}:undefined};
  });
}

function bestRole(skills:CharacterState["skills"]):OrgRole {
  return HIREABLE_ROLES.map(role=>({role,score:roleFitScore(skills,role)})).sort((a,b)=>b.score-a.score)[0].role;
}

function hash(text:string):number { let h=2166136261; for(const ch of text){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);} return h>>>0; }

/** Impressions are stable between renders: the noise depends only on the candidate and how well they have been interviewed. */
export function recruitmentView(world:WorldState) {
  return world.recruitmentPool.map(candidate=>{
    const impression=assessCandidate(candidate,createRng(hash(candidate.id)+candidate.interviewLevel*7919));
    const role=bestRole(candidate.trueSkills);
    return {id:candidate.id,name:candidate.name,age:candidate.age,homeState:candidate.homeState,background:candidate.background,interviewLevel:candidate.interviewLevel,
      suggestedRole:role,suggestedRoleTitle:roleTitle(role),...impression};
  });
}

export type PeopleCommand=GameCommand|{type:"GIVE_TIME_OFF";characterId:string;days:number};

/** People commands go through the core command layer; paid hires receive their best-fit role. */
export function executePeopleCommand(world:WorldState,command:PeopleCommand):CommandResult {
  if(command.type==="GIVE_TIME_OFF"){
    const c=world.characters[command.characterId];if(!c||!c.employed)throw new Error("Only a current colleague can take time off.");
    if(c.onLeaveUntil&&world.date<c.onLeaveUntil)throw new Error(`${c.name} is already on leave.`);
    const d=new Date(world.date+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+command.days);c.onLeaveUntil=d.toISOString().slice(0,10);
    restCharacter(c,30);c.morale=clamp(c.morale+6);c.burnoutStreak=0;
    remember(world,c.id,"support",50,"Was given time off to recover.",{emotionalValence:40});
    return {ok:true,message:`${c.name} is on leave until ${c.onLeaveUntil}.`};
  }
  if(command.type==="HIRE_CHARACTER"){
    const c=world.characters[command.characterId];if(!c)throw new Error("Unknown colleague.");
    if(c.employed)throw new Error(`${c.name} is already part of the team.`);
    const roleId=command.roleId??FRIEND_ROLES[c.id]??bestRole(c.skills);
    return executeCommand(world,{...command,role:ROLE_PROFILES[roleId].title,roleId});
  }
  if(command.type==="HIRE_CANDIDATE"){
    const candidate=world.recruitmentPool.find(x=>x.id===command.candidateId);if(!candidate)throw new Error("That candidate is no longer available.");
    const roleId=bestRole(candidate.trueSkills);
    const result=executeCommand(world,{...command,role:ROLE_PROFILES[roleId].title});
    if(result.createdId)world.characters[result.createdId].roleId=roleId;
    return result;
  }
  return executeCommand(world,command);
}

/** Opinion among voter groups, as a turnout-weighted national figure. */
export function demographicIndex(world:WorldState):number {
  return DEMOGRAPHICS.reduce((sum,key)=>sum+world.publicOpinion[key]*DEMOGRAPHIC_WEIGHTS[key],0);
}
export function demographicsView(world:WorldState) {
  return DEMOGRAPHICS.map(key=>({key,value:Math.round(world.publicOpinion[key]),weight:DEMOGRAPHIC_WEIGHTS[key]}));
}

/** A targeted ad moves one group; a weak or distrusted organisation gets a smaller shift and some backlash elsewhere. */
export function runCampaignAd(world:WorldState,segment:Demographic,quality:number):{gain:number;backlash?:Demographic} {
  if(!DEMOGRAPHICS.includes(segment))throw new Error("Choose a voter group.");
  const gain=Math.max(1,Math.round(2+quality/12+world.organisation.credibility/25));
  world.publicOpinion[segment]=clamp(world.publicOpinion[segment]+gain);
  if(world.organisation.credibility<40){
    const backlash=DEMOGRAPHICS.find(k=>k!==segment&&world.publicOpinion[k]>3)!;
    if(backlash){world.publicOpinion[backlash]=clamp(world.publicOpinion[backlash]-2);return {gain,backlash};}
  }
  return {gain};
}

export interface NationalElectionInput {
  seed:number; partyName:string; seatCounts:Record<string,number>; strengthByState:Record<string,number>;
  candidateQuality?:Record<string,number>; demographicIndex?:number;
}
export interface NationalElectionResult { seats:number; voteShare:number; turnout:number; byState:Record<string,{won:number;total:number;strength:number;voteShare:number}>; }

/** Every one of the 543 seats is simulated by the core constituency model against three generic, fictional blocs. */
export function simulateNationalElection(input:NationalElectionInput):NationalElectionResult {
  const rng=createRng(input.seed);
  const party=(id:string,name:string,base:number):PartyState=>({id,name,abbreviation:id.toUpperCase(),nationalOrganisation:50,funds:0,leadershipStrength:50,baseSupport:base});
  const parties=[party("player",input.partyName,0),party("ruling","Ruling alliance",31),party("opposition","Opposition alliance",25),party("regional","Regional and independent candidates",14)];
  const swing=clamp(((input.demographicIndex??13)-13)*.2,-6,8);
  const byState:NationalElectionResult["byState"]={};let seats=0,playerVotes=0,totalVotes=0,turnoutSum=0,seatTotal=0;
  for(const [name,count] of Object.entries(input.seatCounts)){
    const strength=input.strengthByState[name]??1;let won=0,statePlayer=0,stateTotal=0;
    // Each state has its own political landscape: some are ruling-alliance strongholds, others belong to regional parties.
    const h=hash(name),ruling=24+h%17,opposition=18+(h>>>5)%15,regional=8+(h>>>10)%23;
    for(let i=0;i<count;i++){
      const id=`${name}-${i+1}`;
      const result=simulateConstituency({id,name:id,state:name,electorate:1800000,turnoutBase:66,partyBaseline:{player:strength,ruling,opposition,regional},volatility:18},
        parties,{nationalSwing:{player:swing},organisationByParty:{player:50,ruling:50,opposition:50,regional:50},candidateStrength:{[id]:{player:input.candidateQuality?.[name]??45}}},rng);
      if(result.winnerPartyId==="player")won++;
      const votes=Object.values(result.votes).reduce((a,b)=>a+b,0);
      statePlayer+=result.votes.player;stateTotal+=votes;turnoutSum+=result.turnout;seatTotal++;
    }
    byState[name]={won,total:count,strength:Math.round(strength*10)/10,voteShare:stateTotal?Math.round(statePlayer/stateTotal*1000)/10:0};
    seats+=won;playerVotes+=statePlayer;totalVotes+=stateTotal;
  }
  return {seats,voteShare:totalVotes?Math.round(playerVotes/totalVotes*1000)/10:0,turnout:seatTotal?Math.round(turnoutSum/seatTotal*1000)/10:0,byState};
}
