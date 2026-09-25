import type { EvidenceKind, EvidenceStatus, WorldState } from "../core/types";
import { makeId } from "../core/id";
import { clamp } from "../core/math";
import { spendOrganisation } from "../core/finance";
import { createEvidence } from "../core/secrets";

export interface SchoolAuditCase {
  id:string; district:string; claim:string; openedOn:string; leadId:string; claimEvidenceId:string;
  evidenceIds:string[]; requestedResponseOn?:string; officialResponse?:"acknowledged"|"denied"|"no_response";
  responseOn?:string; lastEvidenceOn?:string; legalReviewedOn?:string; status:EvidenceStatus; publishedOn?:string; fictionalComposite:true;
}

function getCase(world:WorldState,id:string):SchoolAuditCase {
  const entry=world.schoolAudits?.[id];if(!entry)throw new Error("Unknown school audit");return entry;
}

/** A tip is a claim. Fictional composite cases must never be presented as actual schools. */
export function openSchoolAudit(world:WorldState,input:{district:string;claim:string;leadId:string;travelBudget:number}):SchoolAuditCase {
  if(world.date<"2026-08-15")throw new Error("School Thik Karo has not begun");
  if(!input.district.trim()||!input.claim.trim()||input.claim.length>500)throw new Error("A district and concise claim are required");
  const lead=world.characters[input.leadId];if(!lead)throw new Error("Assign a field lead");
  if(!Number.isInteger(input.travelBudget)||input.travelBudget<5000)throw new Error("An audit needs a travel and documentation budget");
  if(!spendOrganisation(world,input.travelBudget))throw new Error("Insufficient movement funds");
  lead.energy=clamp(lead.energy-8);lead.stress=clamp(lead.stress+4);
  const id=makeId("audit",world.seed),claimEvidenceId=createEvidence(world,id,"message",input.claim,.25);
  world.evidence[claimEvidenceId].visibility="team";
  world.evidence[claimEvidenceId].classification="UNVERIFIED";
  const entry:SchoolAuditCase={id,district:input.district.trim(),claim:input.claim.trim(),openedOn:world.date,leadId:input.leadId,claimEvidenceId,evidenceIds:[],status:"UNVERIFIED",fictionalComposite:true};
  (world.schoolAudits??={})[id]=entry;return entry;
}

export function addSchoolEvidence(world:WorldState,id:string,input:{kind:EvidenceKind;label:string;origin:string;confidence:number;supports:boolean}):string {
  const entry=getCase(world,id);
  if(entry.publishedOn)throw new Error("Published audit is closed to new evidence");
  if(world.date<=entry.openedOn||entry.lastEvidenceOn===world.date)throw new Error("Travel and each independent evidence visit require a new day");
  if(!["document","witness","public_record"].includes(input.kind))throw new Error("School audit requires a document, witness or public record");
  if(!input.origin.trim()||!input.label.trim()||!Number.isFinite(input.confidence)||input.confidence<0||input.confidence>1)throw new Error("Evidence needs provenance and confidence");
  if(entry.evidenceIds.some(eid=>world.evidence[eid].origin===input.origin&&world.evidence[eid].kind===input.kind))throw new Error("This source was already recorded");
  if(!spendOrganisation(world,1000))throw new Error("Insufficient documentation funds");
  const evidenceId=createEvidence(world,id,input.kind,input.label,input.confidence);
  const node=world.evidence[evidenceId];node.origin=input.origin;node.collectedOn=world.date;node.visibility="team";node.classification="UNDER_INVESTIGATION";
  entry.evidenceIds.push(evidenceId);
  entry.lastEvidenceOn=world.date;
  world.evidenceEdges.push({id:makeId("edge",world.seed),from:evidenceId,to:entry.claimEvidenceId,relation:input.supports?"supports":"contests",confidence:input.confidence});
  entry.status=input.supports?"UNDER_INVESTIGATION":"DISPUTED";
  return evidenceId;
}

export function requestSchoolResponse(world:WorldState,id:string):void {
  const entry=getCase(world,id);if(entry.requestedResponseOn)throw new Error("Official response already requested");
  if(entry.lastEvidenceOn===world.date)throw new Error("Send the request after today's field visit");
  if(!spendOrganisation(world,500))throw new Error("Insufficient communication funds");
  entry.requestedResponseOn=world.date;
}

export function recordSchoolResponse(world:WorldState,id:string,response:"acknowledged"|"denied"|"no_response",summary:string):void {
  const entry=getCase(world,id);
  if(!entry.requestedResponseOn||entry.officialResponse)throw new Error("Request a response first");
  if(!summary.trim())throw new Error("Record the response or follow-up attempt");
  if(world.date<=entry.requestedResponseOn)throw new Error("Allow time for an official response");
  entry.officialResponse=response;
  entry.responseOn=world.date;
  const evidenceId=createEvidence(world,id,"public_record",summary,response==="no_response"?.35:.9);
  const node=world.evidence[evidenceId];node.origin="official_response";node.collectedOn=world.date;node.visibility="team";
  node.classification=response==="denied"?"DENIED":response==="acknowledged"?"OFFICIAL_RECORD":"UNVERIFIED";
  entry.evidenceIds.push(evidenceId);
  if(response==="denied")entry.status="DISPUTED";
}

export function reviewSchoolAudit(world:WorldState,id:string,lawyerId?:string):void {
  const entry=getCase(world,id);if(entry.legalReviewedOn)throw new Error("Legal review already completed");
  if(!entry.responseOn||world.date<=entry.responseOn)throw new Error("Review the response on a later day");
  const lawyer=lawyerId?world.characters[lawyerId]:undefined;
  if(lawyerId&&(!lawyer||(lawyer.skills.legal??0)<55))throw new Error("Assign a qualified legal reviewer");
  if(!lawyer&&!spendOrganisation(world,3500))throw new Error("Insufficient funds for external legal review");
  if(lawyer){lawyer.energy=clamp(lawyer.energy-7);lawyer.stress=clamp(lawyer.stress+2);}
  entry.legalReviewedOn=world.date;
}

export function publishSchoolAudit(world:WorldState,id:string):EvidenceStatus {
  const entry=getCase(world,id);if(entry.publishedOn)throw new Error("Audit already published");
  if(entry.legalReviewedOn&&world.date<=entry.legalReviewedOn)throw new Error("Publish after the legal review day");
  if(!entry.legalReviewedOn||!entry.officialResponse)throw new Error("Legal review and an official response attempt are required");
  const supports=entry.evidenceIds.filter(eid=>world.evidenceEdges.some(edge=>edge.from===eid&&edge.relation==="supports"&&edge.confidence>=.7));
  const kinds=new Set(supports.map(eid=>world.evidence[eid].kind));
  if(!kinds.has("document")||!kinds.has("witness"))throw new Error("Independent document and witness evidence are required");
  entry.status=entry.officialResponse==="acknowledged"?"VERIFIED":entry.officialResponse==="denied"?"DISPUTED":"UNDER_INVESTIGATION";
  entry.publishedOn=world.date;
  for(const eid of entry.evidenceIds)world.evidence[eid].visibility="public";
  world.evidence[entry.claimEvidenceId].classification=entry.status;
  if(entry.status==="VERIFIED")world.organisation.credibility=clamp(world.organisation.credibility+3);
  return entry.status;
}
