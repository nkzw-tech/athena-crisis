import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';

export default function getCompletedObjectives(
  map: MapData,
  player: PlayerID,
): ReadonlyArray<number> {
  const list = [];
  const team = [...map.getTeam(player).players.keys()];
  for (const [index, objective] of map.config.objectives) {
    if (
      objective.type !== Criteria.Default &&
      team.some((playerID) => objective.completed?.has(playerID))
    ) {
      list.push(index);
    }
  }
  return list;
}
