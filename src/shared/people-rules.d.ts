export interface WellbeingInput { energy:number; stress:number; morale:number; burnoutStreak?:number; onLeaveUntil?:string; employed:boolean; }
export interface WellbeingResult { energy:number; stress:number; morale:number; burnoutStreak:number; onLeaveUntil?:string; mistake:boolean; forcedLeave:boolean; }
export function dailyWellbeing(input:WellbeingInput,date:string,next:()=>number):WellbeingResult;
