import { createNewGame } from "../core/world";
import type { NewGameOptions, WorldState } from "../core/types";
import { installHistoricalTimeline } from "./history";
import { movementTimeline2026 } from "../content/movement-2026";

export function createRepublic543Game(options:NewGameOptions):WorldState {
  const world=createNewGame(options);
  installHistoricalTimeline(world,movementTimeline2026);
  world.flags.content_version="2026.09.25";
  world.flags.history_mode="playable_between_documented_anchors";
  return world;
}
