import Player from '../map/Player.tsx';
import MapData from '../MapData.tsx';

export default function hasUnitsOrProductionBuildings(
  map: MapData,
  player: Player,
  type: 'any' | 'with-attack',
) {
  return (
    map.units.some(
      (unit) =>
        map.matchesPlayer(unit, player) &&
        (type === 'any' || unit.info.hasAttack()),
    ) ||
    map.buildings.some(
      (building) =>
        map.matchesPlayer(building, player) && building.canBuildUnits(player),
    )
  );
}
