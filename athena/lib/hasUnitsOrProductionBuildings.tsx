import Player from '../map/Player.tsx';
import MapData from '../MapData.tsx';

export default function hasUnitsOrProductionBuildings(
  map: MapData,
  player: Player,
) {
  return (
    map.units.filter(
      (unit) => map.matchesPlayer(unit, player) && unit.info.hasAttack(),
    ).size > 0 ||
    map.buildings.filter(
      (building) =>
        map.matchesPlayer(building, player) && building.canBuildUnits(player),
    ).size > 0
  );
}
