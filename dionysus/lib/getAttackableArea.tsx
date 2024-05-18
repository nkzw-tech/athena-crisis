import type { PlayerID } from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import { attackable } from '@deities/athena/Radius.tsx';

export default function getAttackableArea(
  map: MapData,
  players: Set<PlayerID>,
) {
  return map.units
    .filter((unit) => players.has(unit.player))
    .flatMap((unit, vector) => attackable(map, unit, vector, 'cover'));
}
