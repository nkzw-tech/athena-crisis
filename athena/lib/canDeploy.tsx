import { UnitInfo } from '../info/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import canAccessBridge from './canAccessBridge.tsx';

export default function canDeploy(
  map: MapData,
  unit: UnitInfo,
  to: Vector,
  ignoreBlocklist: boolean,
) {
  const building = map.buildings.get(to);
  const tile = map.contains(to) && map.getTileInfo(to);
  return (
    tile &&
    tile.getMovementCost(unit) !== -1 &&
    canAccessBridge(map, unit, to, tile) &&
    !map.units.get(to) &&
    (ignoreBlocklist || !map.config.blocklistedUnits.has(unit.id)) &&
    (!building || building.info.isAccessibleBy(unit))
  );
}
