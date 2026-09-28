const fs=require('node:fs');
const path=require('node:path');
const destination=path.join(__dirname,'..','dist','src','shared');
fs.mkdirSync(destination,{recursive:true});
for(const file of ['campaign-rules.js','people-rules.js'])fs.copyFileSync(path.join(__dirname,'..','src','shared',file),path.join(destination,file));
