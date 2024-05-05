import { UnitInfo } from '../info/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export default function canDeploy(
  map: MapData,
  unit: UnitInfo,
  to: Vector,
  ignoreBlocklist: boolean,
) {
  const building = map.buildings.get(to);
  return (
    map.contains(to) &&
    map.getTileInfo(to).getMovementCost(unit) !== -1 &&
    !map.units.get(to) &&
    (ignoreBlocklist || !map.config.blocklistedUnits.has(unit.id)) &&
    (!building || building.info.isAccessibleBy(unit))
  );
}
