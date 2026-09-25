const core=require('../dist/src/core/index.js');
const {createRng}=require('../dist/src/core/rng.js');
function ok(condition,message){if(!condition)throw new Error(message);}
const w=core.createNewGame({name:'Test',age:28,homeState:'Kerala',profession:'Analyst',trait:'analyst',seed:543});
const same=core.createNewGame({name:'Test',age:28,homeState:'Kerala',profession:'Analyst',trait:'analyst',seed:543});
ok(JSON.stringify(w)===JSON.stringify(same),'new-game state must be deterministic');
core.hireCharacter(w,'friend_rohan','Field Lead',60000);
const op=core.startOperation(w,{kind:'protest',title:'Test Protest',location:'Delhi',targetProgress:100,budgetAllocated:10000,staffIds:['friend_rohan'],volunteerAllocation:80,mediaAttention:10,legalRisk:5,publicMomentum:10});
core.advanceDays(w,5);ok(op.progress>0,'operations must progress');
const secret=core.createSecret(w,{kind:'hidden_donation',severity:70,witnessIds:['friend_sameer'],evidence:[{kind:'transaction',label:'Undisclosed transfer',confidence:.9}]});ok(secret.evidenceIds.length===1,'secret must create evidence');
const roundTrip=core.deserializeWorld(core.serializeWorld(w));ok(roundTrip.day===w.day,'save round-trip failed');
const parties=[{id:'a',name:'A',abbreviation:'A',nationalOrganisation:60,funds:1,leadershipStrength:50,baseSupport:40},{id:'b',name:'B',abbreviation:'B',nationalOrganisation:50,funds:1,leadershipStrength:50,baseSupport:35}];
const result=core.simulateConstituency({id:'x',name:'X',state:'S',electorate:1000000,turnoutBase:68,partyBaseline:{a:44,b:40},volatility:5},parties,{nationalSwing:{},organisationByParty:{}},createRng(10));ok(['a','b'].includes(result.winnerPartyId),'election must produce a winner');
console.log('REPUBLIC: 543 core smoke tests passed');
