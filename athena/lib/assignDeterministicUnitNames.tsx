import ImmutableMap from '@nkzw/immutable-map';
import { getDeterministicUnitName } from '../info/UnitNames.tsx';
import Unit, { TransportedUnit } from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import getLeaders from './getLeaders.tsx';

export default function assignDeterministicUnitNames(
  map: MapData,
  units: ImmutableMap<Vector, Unit>,
): ImmutableMap<Vector, Unit> {
  const { addLeader, hasLeader } = getLeaders(map);
  let offset = 0;
  const assignName = <T extends Unit | TransportedUnit>(
    unit: T,
    vector: Vector,
    additionalOffset: number = 0,
  ): T => {
    if (!unit.hasName()) {
      const isLeader = unit.player > 0 && !hasLeader(unit.player, unit.id);
      const name = getDeterministicUnitName(
        map,
        vector,
        unit.player,
        unit.info,
        offset++,
      );
      offset += additionalOffset;
      if (isLeader) {
        addLeader(unit.player, unit.id);
      }
      unit = unit.removeLeader().withName(name) as T;
    }

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map((unit, index) =>
          assignName(unit, vector, index + 1),
        ),
      }) as T;
    }

    return unit;
  };

  return units.map((unit, vector) => {
    unit = assignName(unit, vector);
    map = map.copy({ units: map.units.set(vector, unit) });
    return unit;
  });
}
