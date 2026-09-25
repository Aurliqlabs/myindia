const fs=require("node:fs");
const path=require("node:path");
function fail(msg){console.error("Reality data validation failed:",msg);process.exit(1);}
const p=path.join(process.cwd(),"data/reality/states-and-uts.json");
const d=JSON.parse(fs.readFileSync(p,"utf8"));
if(d.states.length!==28)fail(`expected 28 states, found ${d.states.length}`);
if(d.unionTerritories.length!==8)fail(`expected 8 UTs, found ${d.unionTerritories.length}`);
const all=[...d.states,...d.unionTerritories];
if(new Set(all).size!==36)fail("duplicate state/UT names");
if(!Array.isArray(d.sources)||d.sources.length<2)fail("official sources missing");
console.log("Reality geography validation passed: 28 states + 8 union territories.");
