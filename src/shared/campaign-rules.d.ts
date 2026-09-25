export type CampaignFocus="student_help"|"document_demands"|"mobilise";
export interface FieldDayInput {focus:CampaignFocus;skill:number;prepared:number;crowdSafety:boolean;fatigue:number;delegated?:boolean;}
export interface FieldDayResult {cost:number;quality:number;crowdTrust:number;studentTrust:number;evidenceQuality:number;legalPressure:number;volunteers:number;mediaHeat:number;fatigue:number;energy:number;jobStanding:number;}
export function resolveFieldDay(input:FieldDayInput):FieldDayResult;
export interface NegotiationInput {skill:number;evidenceQuality:number;studentTrust:number;legalPressure:number;pauseDemonstrations:boolean;publicBriefing:boolean;}
export interface NegotiationResult {offers:number;fatigue:number;crowdTrust:number;mediaHeat:number;stress:number;}
export function resolveNegotiation(input:NegotiationInput):NegotiationResult;
