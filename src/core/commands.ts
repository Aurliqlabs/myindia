import { WorldState, OperationState, OperationKind } from "./types";
import { hireCharacter, restCharacter } from "./characters";
import { startOperation } from "./operations";
import { receiveDonation, spendOrganisation } from "./finance";
import { createSecret } from "./secrets";
import { advanceDays } from "./simulation";
import { clamp } from "./math";

export type GameCommand =
  | { type:"HIRE_CHARACTER"; characterId:string; role:string; salaryMonthly:number; volunteer?:boolean }
  | { type:"REST_PLAYER"; days?:number }
  | { type:"START_OPERATION"; operation:{kind:OperationKind;title:string;location:string;targetProgress:number;budgetAllocated:number;staffIds:string[];volunteerAllocation:number;mediaAttention:number;legalRisk:number;publicMomentum:number} }
  | { type:"RECEIVE_SMALL_DONATION"; amount:number; recurringMonthly?:number }
  | { type:"ACCEPT_HIDDEN_DONATION"; amount:number; intermediaryWitnessId?:string }
  | { type:"SPEND_ORGANISATION"; amount:number; purpose:string }
  | { type:"ADVANCE_DAYS"; days:number };

export interface CommandResult { ok:boolean; message:string; createdId?:string; reports?:ReturnType<typeof advanceDays>; }

export function executeCommand(world:WorldState,command:GameCommand):CommandResult {
  switch(command.type){
    case "HIRE_CHARACTER":
      hireCharacter(world,command.characterId,command.role,command.salaryMonthly,command.volunteer??false);
      return{ok:true,message:`${world.characters[command.characterId].name} joined the organisation.`};
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
  }
}
