import { NewGameOptions, WorldState, CharacterState, TraitId } from "./types";
import { makeId, resetIdCounter } from "./id";
import { clamp } from "./math";
const traitSkills:Record<TraitId,Partial<Record<"communication"|"strategy"|"analysis"|"leadership"|"negotiation"|"courage",number>>>={
  speaker:{communication:18,courage:7,analysis:-5},analyst:{analysis:18,strategy:8,communication:-4},organiser:{leadership:17,strategy:5,communication:3},legal_mind:{analysis:12,negotiation:10,strategy:4},outsider:{courage:12,communication:7,negotiation:-4},connector:{negotiation:13,leadership:8,strategy:4}
};
function skills(trait:TraitId,points:NewGameOptions["skillPoints"]={}){const base={communication:45,strategy:45,analysis:45,leadership:45,negotiation:45,courage:45};const allocated=Object.values(points??{});if(allocated.some(n=>!Number.isInteger(n)||n!<0)||allocated.reduce((a,b)=>a+(b??0),0)>12)throw new Error("Allocate at most 12 nonnegative skill points");for(const[k,v]of Object.entries(traitSkills[trait]))(base as any)[k]=clamp((base as any)[k]+v!);for(const[k,v]of Object.entries(points??{})){if(!(k in base))throw new Error("Unknown skill");(base as any)[k]=clamp((base as any)[k]+v!);}return base;}
function friend(id:string,name:string,role:string,skills:CharacterState["skills"],integrity:number,ambition:number):CharacterState{return{id,name,age:27,role,salaryMonthly:0,skills,energy:82,health:92,stress:18,morale:80,psychology:{ambition,integrity,greed:100-integrity,fear:30,ego:45,riskTolerance:55},employed:false,volunteer:false,joinedOn:""};}
export function createNewGame(opts:NewGameOptions):WorldState {
  resetIdCounter();const seed=opts.seed??5432026,playerId=makeId("player",seed);const characters:Record<string,CharacterState>={
    friend_asha:friend("friend_asha","Asha Menon","Friend · Law",{legal:74,analysis:68,negotiation:61},86,48),
    friend_rohan:friend("friend_rohan","Rohan Verma","Friend · Ground",{field:78,leadership:61,communication:58},62,67),
    friend_meera:friend("friend_meera","Meera Nair","Friend · Media",{media:81,communication:73,research:57},76,72),
    friend_sameer:friend("friend_sameer","Sameer Khanna","Friend · Business",{finance:77,fundraising:82,strategy:63},48,84)
  };
  const savings=opts.personalSavings??180000;if(!Number.isFinite(savings)||savings<0)throw new Error("Savings must be nonnegative");
  return{schemaVersion:1,seed,rngState:seed,date:"2026-05-14",realWorldSnapshotDate:opts.snapshotDate??"2026-09-25",day:1,phase:"movement",
    player:{id:playerId,name:opts.name,age:opts.age,homeState:opts.homeState,profession:opts.profession,trait:opts.trait,gender:opts.gender,homeDistrict:opts.homeDistrict,education:opts.education,familyBackground:opts.familyBackground,monthlyIncome:opts.monthlyIncome??35000,monthlyLivingCosts:opts.monthlyLivingCosts??22000,jobStanding:75,skills:skills(opts.trait,opts.skillPoints),energy:84,health:94,stress:22,sleepDebt:8,recognition:0,level:1,personalCash:savings,declaredAssets:savings,hiddenAssets:0},
    organisation:{id:"org_cjp",name:"CJP",abbreviation:"CJP",phase:"movement",credibility:45,mediaHeat:0,legalExposure:0,volunteers:0,members:0,statePresence:{},finance:{organisationCash:0,monthlyRecurringDonations:0,monthlyOfficeCosts:0,monthlyTechnologyCosts:0,monthlyTravelBaseline:0,outstandingPayables:0,lifetimeRaised:0,lifetimeSpent:0}},
    characters,relationships:[],memories:[],operations:{},evidence:{},evidenceEdges:[],secrets:{},
    publicOpinion:{youth:22,students:27,urban:9,rural:3,women:7,workers:6,business:2,national:5,byState:{Delhi:12,Maharashtra:7,Kerala:6}},
    macro:{growth:65,inflation:48,unemployment:58,fiscalPressure:54,institutionalTrust:51,socialStability:67},
    parties:{},scheduledEvents:[],completedEventIds:[],flags:{historical_intro_complete:false,first_response:"unanswered"}};
}
