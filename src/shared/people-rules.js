/* Daily staff wellbeing rule shared by the browser and TypeScript simulation. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.RepublicPeopleRules=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const clamp=value=>Math.max(0,Math.min(100,value));
  const addDays=(date,days)=>{const d=new Date(date+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  function dailyWellbeing(input,date,next){
    const result={energy:input.energy,stress:input.stress,morale:input.morale,burnoutStreak:input.burnoutStreak||0,onLeaveUntil:input.onLeaveUntil,mistake:false,forcedLeave:false};
    if(!input.employed)return result;
    if(result.onLeaveUntil&&date<result.onLeaveUntil)return result;
    if(result.onLeaveUntil&&date>=result.onLeaveUntil)result.onLeaveUntil=undefined;
    result.energy=clamp(result.energy-1.2-result.stress*.006);
    result.stress=clamp(result.stress+.25);
    result.burnoutStreak=result.energy<20?result.burnoutStreak+1:0;
    if(result.energy<15)result.morale=clamp(result.morale-.8);
    if(result.stress>72&&next()<.03){result.morale=clamp(result.morale-3);result.mistake=true;}
    if(result.burnoutStreak>=6){
      result.onLeaveUntil=addDays(date,3+Math.round(next()*3));
      result.energy=clamp(result.energy+28);
      result.stress=clamp(result.stress-18);
      result.burnoutStreak=0;
      result.forcedLeave=true;
    }
    return result;
  }
  return {dailyWellbeing};
});
