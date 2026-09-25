import { WorldState } from "./types";
export const CURRENT_SCHEMA_VERSION=1;
export function serializeWorld(world:WorldState):string{return JSON.stringify(world);}
export function deserializeWorld(raw:string):WorldState{const parsed=JSON.parse(raw) as WorldState;if(parsed.schemaVersion!==CURRENT_SCHEMA_VERSION)throw new Error(`Unsupported save schema ${parsed.schemaVersion}`);return parsed;}
