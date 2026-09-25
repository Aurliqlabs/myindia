/* Pure, deterministic rules used by both the browser and the TypeScript game. */
(function(root,factory){
  const rules=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=rules;
  if(root)root.RepublicCampaignRules=rules;
})(typeof globalThis!=="undefined"?globalThis:null,function(){
  const clamp=n=>Math.max(0,Math.min(100,n));

  function resolveFieldDay(input){
    const {focus,skill,prepared,crowdSafety,fatigue,delegated=false}=input;
    if(!["student_help","document_demands","mobilise"].includes(focus))throw Error("Unknown field focus");
    if(!Number.isFinite(skill)||!Number.isFinite(prepared)||!Number.isFinite(fatigue))throw Error("Invalid campaign input");
    const quality=clamp((skill-45)/8+(prepared-4)*.65-fatigue/18);
    const result={cost:{student_help:3800,document_demands:2800,mobilise:6500}[focus],quality,
      crowdTrust:0,studentTrust:0,evidenceQuality:0,legalPressure:0,volunteers:0,mediaHeat:0,
      fatigue:delegated?1:4,energy:delegated?7:9,jobStanding:delegated?0:2};
    if(focus==="student_help"){
      result.studentTrust=3+quality;
      result.crowdTrust=crowdSafety?2:-3;
      result.legalPressure=crowdSafety?0:2;
    }else if(focus==="document_demands"){
      result.evidenceQuality=4+quality;
      result.studentTrust=1;
    }else{
      result.volunteers=crowdSafety?Math.round(7+quality):2;
      result.crowdTrust=crowdSafety?2+quality:-6;
      result.legalPressure=crowdSafety?1:6;
      result.mediaHeat=4;
    }
    return result;
  }

  function resolveNegotiation(input){
    const {skill,evidenceQuality,studentTrust,legalPressure,pauseDemonstrations,publicBriefing}=input;
    if([skill,evidenceQuality,studentTrust,legalPressure].some(n=>!Number.isFinite(n)))throw Error("Invalid negotiation input");
    return {offers:clamp(25+Math.round(skill/5)+Math.round(evidenceQuality/4)+Math.round(studentTrust/7)-Math.round(legalPressure/3)),
      fatigue:pauseDemonstrations?-12:0,crowdTrust:pauseDemonstrations?-3:0,
      mediaHeat:publicBriefing?5:0,stress:publicBriefing?3:0};
  }
  return Object.freeze({resolveFieldDay,resolveNegotiation});
});
