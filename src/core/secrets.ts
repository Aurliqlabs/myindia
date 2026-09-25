import { clamp } from "./math";
import { EvidenceKind, SecretKind, SecretState, WorldState } from "./types";
import { makeId } from "./id";
export function createEvidence(world:WorldState,caseId:string,kind:EvidenceKind,label:string,confidence=.75):string {
  const id=makeId("evidence",world.seed);world.evidence[id]={id,caseId,kind,label,confidence:clamp(confidence,0,1),visibility:"private"};return id;
}
export function createSecret(world:WorldState,input:{kind:SecretKind;severity:number;witnessIds?:string[];evidence?:Array<{kind:EvidenceKind;label:string;confidence?:number}>}):SecretState {
  const id=makeId("secret",world.seed),caseId=`case_${id}`;const evidenceIds=(input.evidence??[]).map(e=>createEvidence(world,caseId,e.kind,e.label,e.confidence));
  const s:SecretState={id,kind:input.kind,createdOn:world.date,severity:clamp(input.severity),exposureRisk:clamp(2+input.severity*.12),legalRisk:clamp(input.severity*.75),politicalRisk:clamp(input.severity*.85),witnessIds:input.witnessIds??[],evidenceIds,exposed:false};world.secrets[id]=s;return s;
}
export function tickSecretExposure(world:WorldState,secret:SecretState,rng:{next():number}):{exposed:boolean;roll:number;threshold:number} {
  if(secret.exposed)return{exposed:true,roll:0,threshold:1};const evidencePressure=secret.evidenceIds.reduce((sum,id)=>sum+(world.evidence[id]?.confidence??0),0);
  const threshold=clamp(secret.exposureRisk+evidencePressure+secret.witnessIds.length*.8+world.organisation.mediaHeat*.018+world.organisation.legalExposure*.014,0,70)/1000;const roll=rng.next();
  if(roll<threshold){secret.exposed=true;for(const id of secret.evidenceIds)if(world.evidence[id])world.evidence[id].visibility="public";world.organisation.credibility=clamp(world.organisation.credibility-secret.politicalRisk*.18);world.organisation.legalExposure=clamp(world.organisation.legalExposure+secret.legalRisk*.25);}
  else secret.exposureRisk=clamp(secret.exposureRisk+.03+evidencePressure*.01);return{exposed:secret.exposed,roll,threshold};
}
