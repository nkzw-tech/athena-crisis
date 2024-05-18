import type { UnitInfo } from '../info/Unit.tsx';
import type { PlayerID } from '../map/Player.tsx';
import type { TransportedUnit } from '../map/Unit.tsx';
import type Unit from '../map/Unit.tsx';
import type MapData from '../MapData.tsx';

export default function removeLeader(
  map: MapData,
  player: PlayerID,
  info: UnitInfo,
): MapData {
  const removeLeader = <T extends Unit | TransportedUnit>(unit: T): T => {
    if (unit.id === info.id && unit.player === player && unit.isLeader()) {
      unit = unit.withName(null) as T;
    }

    if (unit.transports?.length) {
      unit = unit.copy({
        transports: unit.transports.map(removeLeader),
      }) as T;
    }

    return unit;
  };

  return map.copy({
    units: map.units.map(removeLeader),
  });
}
