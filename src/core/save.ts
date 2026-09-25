import { WorldState } from "./types";
import { personalLife } from "./personal-life";
export const CURRENT_SCHEMA_VERSION=1;
export function serializeWorld(world:WorldState):string{return JSON.stringify(world);}
export function deserializeWorld(raw:string):WorldState{const parsed=JSON.parse(raw) as WorldState;if(parsed.schemaVersion!==CURRENT_SCHEMA_VERSION)throw new Error(`Unsupported save schema ${parsed.schemaVersion}`);parsed.player.monthlyIncome??=35000;parsed.player.monthlyLivingCosts??=22000;parsed.player.jobStanding??=75;personalLife(parsed);return parsed;}

