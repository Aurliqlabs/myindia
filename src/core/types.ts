export type Id = string;
export type Phase = "movement" | "party" | "opposition" | "government" | "exile" | "retired";
export type EvidenceStatus = "VERIFIED"|"OFFICIAL_RECORD"|"COURT_FINDING"|"UNDER_INVESTIGATION"|"OFFICIAL_ALLEGATION"|"POLITICAL_ALLEGATION"|"DISPUTED"|"DENIED"|"UNVERIFIED"|"SIMULATED";
export type SkillKey = "communication"|"strategy"|"analysis"|"leadership"|"negotiation"|"courage";
export type StaffSkillKey = SkillKey|"legal"|"media"|"finance"|"research"|"field"|"fundraising";
export type TraitId = "speaker"|"analyst"|"organiser"|"legal_mind"|"outsider"|"connector";

export interface PlayerProfile {
  id: Id; name: string; age: number; homeState: string; profession: string; trait: TraitId;
  skills: Record<SkillKey,number>; energy:number; health:number; stress:number; sleepDebt:number;
  recognition:number; level:number; personalCash:number; declaredAssets:number; hiddenAssets:number;
}
export interface CharacterPsychology { ambition:number; integrity:number; greed:number; fear:number; ego:number; riskTolerance:number; }
export interface CharacterState {
  id:Id; name:string; age:number; role:string; salaryMonthly:number; skills:Partial<Record<StaffSkillKey,number>>;
  energy:number; health:number; stress:number; morale:number; psychology:CharacterPsychology;
  employed:boolean; volunteer:boolean; joinedOn:string;
}
export interface RelationshipState {
  actorA:Id; actorB:Id; trust:number; loyalty:number; personal:number; ideologicalAlignment:number; fear:number; resentment:number;
}
export type MemoryType = "promotion"|"firing"|"betrayal"|"support"|"humiliation"|"financial_favour"|"legal_protection"|"denied_request"|"political_ticket"|"overwork"|"salary_missed";
export interface CharacterMemory { id:Id; characterId:Id; date:string; type:MemoryType; salience:number; note:string; }

export interface FinanceState {
  organisationCash:number; monthlyRecurringDonations:number; monthlyOfficeCosts:number; monthlyTechnologyCosts:number;
  monthlyTravelBaseline:number; outstandingPayables:number; lifetimeRaised:number; lifetimeSpent:number;
}
export interface OrganisationState {
  id:Id; name:string; abbreviation:string; phase:Phase; credibility:number; mediaHeat:number; legalExposure:number;
  volunteers:number; members:number; statePresence:Record<string,number>; finance:FinanceState;
}
export type OperationKind = "protest"|"school_audit"|"public_investigation"|"state_visit"|"press_conference"|"fundraising"|"recruitment"|"legal_challenge"|"social_campaign";
export interface OperationState {
  id:Id; kind:OperationKind; title:string; location:string; startedOn:string; targetProgress:number; progress:number;
  budgetAllocated:number; spent:number; staffIds:Id[]; volunteerAllocation:number; mediaAttention:number; legalRisk:number;
  publicMomentum:number; status:"planned"|"active"|"paused"|"completed"|"failed";
}
export type EvidenceKind = "document"|"transaction"|"witness"|"message"|"contract"|"meeting"|"public_record";
export interface EvidenceNode { id:Id; caseId:Id; kind:EvidenceKind; label:string; confidence:number; visibility:"private"|"team"|"public"|"authorities"; }
export interface EvidenceEdge { id:Id; from:Id; to:Id; relation:string; confidence:number; }
export type SecretKind = "hidden_donation"|"illegal_favour"|"nepotism"|"obstruction"|"misuse_of_funds"|"abuse_of_power";
export interface SecretState {
  id:Id; kind:SecretKind; createdOn:string; severity:number; exposureRisk:number; legalRisk:number; politicalRisk:number;
  witnessIds:Id[]; evidenceIds:Id[]; exposed:boolean;
}
export interface PublicOpinionState {
  youth:number; students:number; urban:number; rural:number; women:number; workers:number; business:number; national:number; byState:Record<string,number>;
}
export interface MacroState { growth:number; inflation:number; unemployment:number; fiscalPressure:number; institutionalTrust:number; socialStability:number; }
export interface ConstituencyBaseline {
  id:Id; name:string; state:string; electorate:number; turnoutBase:number; partyBaseline:Record<string,number>; volatility:number;
}
export interface PartyState { id:Id; name:string; abbreviation:string; nationalOrganisation:number; funds:number; leadershipStrength:number; baseSupport:number; }
export interface ElectionResult { constituencyId:Id; turnout:number; votes:Record<string,number>; winnerPartyId:Id; }
export interface ScheduledEvent { id:Id; date:string; kind:string; payload:Record<string,unknown>; }

export interface WorldState {
  schemaVersion:number; seed:number; rngState:number; date:string; realWorldSnapshotDate:string; day:number; phase:Phase;
  player:PlayerProfile; organisation:OrganisationState; characters:Record<Id,CharacterState>; relationships:RelationshipState[];
  memories:CharacterMemory[]; operations:Record<Id,OperationState>; evidence:Record<Id,EvidenceNode>; evidenceEdges:EvidenceEdge[];
  secrets:Record<Id,SecretState>; publicOpinion:PublicOpinionState; macro:MacroState; parties:Record<Id,PartyState>;
  scheduledEvents:ScheduledEvent[]; completedEventIds:Id[]; flags:Record<string,boolean|number|string>;
}
export interface NewGameOptions { name:string; age:number; homeState:string; profession:string; trait:TraitId; seed?:number; snapshotDate?:string; }
export interface DailyReport {
  date:string; payroll?:{due:number;paid:number;shortfall:number}; operationUpdates:Array<{id:Id;progressDelta:number;completed:boolean}>;
  secretExposureChecks:Array<{id:Id;exposed:boolean;roll:number;threshold:number}>; triggeredEvents:ScheduledEvent[]; notes:string[];
}
