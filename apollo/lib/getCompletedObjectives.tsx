import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { WinCriteria } from '@deities/athena/WinConditions.tsx';

export default function getCompletedObjectives(
  map: MapData,
  player: PlayerID,
): ReadonlyArray<number> {
  const list = [];
  const team = [...map.getTeam(player).players.keys()];
  for (const [index, condition] of map.config.winConditions.entries()) {
    if (
      condition.type !== WinCriteria.Default &&
      team.some((playerID) => condition.completed?.has(playerID))
    ) {
      list.push(index);
    }
  }
  return list;
}
