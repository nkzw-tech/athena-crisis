import { getEntityGroup } from '../map/Entity.tsx';
import Player from '../map/Player.tsx';
import MapData from '../MapData.tsx';

export default function getAirUnitsToRecover(map: MapData, player: Player) {
  return map.units.filter(
    (unit) =>
      map.matchesPlayer(unit, player) &&
      getEntityGroup(unit) === 'air' &&
      (unit.isCompleted() || unit.hasMoved()),
  );
}
