import { generateUnitName } from '../info/UnitNames.tsx';
import Unit, { TransportedUnit } from '../map/Unit.tsx';
import MapData from '../MapData.tsx';
import getLeaders from './getLeaders.tsx';

export default function assignUnitNames(map: MapData): MapData {
  const { addLeader, hasLeader } = getLeaders(map);

  const assignName = <T extends Unit | TransportedUnit>(unit: T): T => {
    if (!unit.hasName()) {
      const isLeader = unit.player > 0 && !hasLeader(unit.player, unit.id);
      const name = generateUnitName(isLeader);
      if (isLeader) {
        addLeader(unit.player, unit.id);
      }
      unit = unit.withName(name) as T;
    }

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map(assignName),
      }) as T;
    }

    return unit;
  };

  return map.copy({
    units: map.units.map(assignName),
  });
}
