import { WorldState, OperationState, OperationKind, OrgRole } from "./types";
import { hireCharacter, restCharacter, fireCharacter } from "./characters";
import { startOperation } from "./operations";
import { receiveDonation, spendOrganisation } from "./finance";
import { createSecret } from "./secrets";
import { advanceDays } from "./simulation";
import { clamp } from "./math";
import { grantRequest, denyRequest } from "./careers";
import { refreshRecruitmentPool, interviewCandidate, hireCandidate } from "./recruitment";
import { defendPublicly, humiliatePublicly, provideLegalProtection, recognizeFoundingMember } from "./relationships";
import { createRng } from "./rng";

export type GameCommand =
  | { type:"HIRE_CHARACTER"; characterId:string; role:string; salaryMonthly:number; volunteer?:boolean; roleId?:OrgRole }
  | { type:"FIRE_CHARACTER"; characterId:string }
  | { type:"REST_PLAYER"; days?:number }
  | { type:"START_OPERATION"; operation:{kind:OperationKind;title:string;location:string;targetProgress:number;budgetAllocated:number;staffIds:string[];volunteerAllocation:number;mediaAttention:number;legalRisk:number;publicMomentum:number} }
  | { type:"RECEIVE_SMALL_DONATION"; amount:number; recurringMonthly?:number }
  | { type:"ACCEPT_HIDDEN_DONATION"; amount:number; intermediaryWitnessId?:string }
  | { type:"SPEND_ORGANISATION"; amount:number; purpose:string }
  | { type:"ADVANCE_DAYS"; days:number }
  | { type:"GRANT_REQUEST"; characterId:string }
  | { type:"DENY_REQUEST"; characterId:string }
  | { type:"REFRESH_RECRUITMENT"; size?:number }
  | { type:"INTERVIEW_CANDIDATE"; candidateId:string }
  | { type:"HIRE_CANDIDATE"; candidateId:string; role:string; salaryMonthly:number; volunteer?:boolean }
  | { type:"DEFEND_PUBLICLY"; characterId:string }
  | { type:"HUMILIATE_PUBLICLY"; characterId:string }
  | { type:"PROVIDE_LEGAL_PROTECTION"; characterId:string }
  | { type:"RECOGNIZE_FOUNDING_MEMBER"; characterId:string };

export interface CommandResult { ok:boolean; message:string; createdId?:string; reports?:ReturnType<typeof advanceDays>; }

export function executeCommand(world:WorldState,command:GameCommand):CommandResult {
  switch(command.type){
    case "HIRE_CHARACTER":
      hireCharacter(world,command.characterId,command.role,command.salaryMonthly,command.volunteer??false,command.roleId);
      return{ok:true,message:`${world.characters[command.characterId].name} joined the organisation.`};
    case "FIRE_CHARACTER":
      fireCharacter(world,command.characterId);
      return{ok:true,message:`${world.characters[command.characterId].name} was removed from the organisation.`};
    case "REST_PLAYER":{
      const days=Math.max(1,Math.min(7,command.days??1));restCharacter(world.player as any,16*days);world.player.sleepDebt=clamp(world.player.sleepDebt-14*days,0,100);world.organisation.mediaHeat=clamp(world.organisation.mediaHeat-days);
      return{ok:true,message:`Rested for ${days} day(s).`,reports:advanceDays(world,days)};
    }
    case "START_OPERATION":{
      const op=startOperation(world,command.operation as Omit<OperationState,"id"|"startedOn"|"progress"|"spent"|"status">);return{ok:true,message:`Operation started: ${op.title}`,createdId:op.id};
    }
    case "RECEIVE_SMALL_DONATION":
      receiveDonation(world,command.amount,command.recurringMonthly??0);world.organisation.credibility=clamp(world.organisation.credibility+.5);return{ok:true,message:"Transparent donation recorded."};
    case "ACCEPT_HIDDEN_DONATION":{
      receiveDonation(world,command.amount);const secret=createSecret(world,{kind:"hidden_donation",severity:clamp(35+Math.log10(Math.max(1,command.amount))*8),witnessIds:command.intermediaryWitnessId?[command.intermediaryWitnessId]:[],evidence:[{kind:"transaction",label:"Undisclosed political contribution",confidence:.9}]});
      return{ok:true,message:"Funds received. A hidden liability now exists.",createdId:secret.id};
    }
    case "SPEND_ORGANISATION":
      if(!spendOrganisation(world,command.amount))return{ok:false,message:"Insufficient organisation funds."};return{ok:true,message:`₹${command.amount.toLocaleString("en-IN")} spent on ${command.purpose}.`};
    case "ADVANCE_DAYS": return{ok:true,message:`Advanced ${command.days} day(s).`,reports:advanceDays(world,command.days)};
    case "GRANT_REQUEST":
      grantRequest(world,command.characterId);
      return{ok:true,message:`${world.characters[command.characterId].name}'s request was granted.`};
    case "DENY_REQUEST":
      denyRequest(world,command.characterId);
      return{ok:true,message:`${world.characters[command.characterId].name}'s request was denied.`};
    case "REFRESH_RECRUITMENT":
      refreshRecruitmentPool(world,createRng(world.rngState+world.day),command.size??3);
      return{ok:true,message:`${world.recruitmentPool.length} candidate(s) available.`};
    case "INTERVIEW_CANDIDATE":
      interviewCandidate(world,command.candidateId,createRng(world.rngState+world.day));
      return{ok:true,message:"Interview completed."};
    case "HIRE_CANDIDATE":{
      const hired=hireCandidate(world,command.candidateId,command.role,command.salaryMonthly,command.volunteer??false);
      return{ok:true,message:`${hired.name} joined the organisation.`,createdId:hired.id};
    }
    case "DEFEND_PUBLICLY":
      defendPublicly(world,command.characterId);
      return{ok:true,message:`${world.characters[command.characterId].name} was defended publicly.`};
    case "HUMILIATE_PUBLICLY":
      humiliatePublicly(world,command.characterId);
      return{ok:true,message:`${world.characters[command.characterId].name} was publicly humiliated.`};
    case "PROVIDE_LEGAL_PROTECTION":
      provideLegalProtection(world,command.characterId);
      return{ok:true,message:`${world.characters[command.characterId].name} was given legal protection.`};
    case "RECOGNIZE_FOUNDING_MEMBER":
      recognizeFoundingMember(world,command.characterId);
      return{ok:true,message:`${world.characters[command.characterId].name} was recognised as a founding member.`};
  }
}
