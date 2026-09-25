const fs=require('node:fs');
const path=require('node:path');
const destination=path.join(__dirname,'..','dist','src','shared');
fs.mkdirSync(destination,{recursive:true});
fs.copyFileSync(path.join(__dirname,'..','src','shared','campaign-rules.js'),path.join(destination,'campaign-rules.js'));
