import type { WorldState, ScheduledEvent } from "../core/types";
import type { HistoricalEventRecord } from "../content/types";

export function installHistoricalTimeline(world:WorldState,events:HistoricalEventRecord[]):void {
  const existing=new Set(world.scheduledEvents.map(e=>e.id));
  for(const event of events){
    if(existing.has(event.id))continue;
    const scheduled:ScheduledEvent={
      id:event.id,
      date:event.date,
      kind:"historical_event",
      payload:{
        title:event.title,
        summary:event.summary,
        status:event.status,
        sourceIds:event.sourceIds,
        tags:event.tags,
        playable:event.playable
      }
    };
    world.scheduledEvents.push(scheduled);
  }
  world.scheduledEvents.sort((a,b)=>a.date.localeCompare(b.date));
}

export function pendingHistoricalEvents(world:WorldState):ScheduledEvent[]{
  return world.scheduledEvents.filter(e=>e.kind==="historical_event"&&e.date>=world.date).sort((a,b)=>a.date.localeCompare(b.date));
}
