import type { PlayerID } from '../map/Player.tsx';
import type Player from '../map/Player.tsx';
import type MapData from '../MapData.tsx';

export default function getUnitsToHealOnBuildings(
  map: MapData,
  player: Player | PlayerID,
) {
  return map.units.filter((unit, vector) => {
    if (!map.matchesPlayer(unit, player)) {
      return false;
    }
    const building = map.buildings.get(vector);
    return (
      building &&
      map.matchesPlayer(building, unit) &&
      building.info.canHeal(unit.info)
    );
  });
}
