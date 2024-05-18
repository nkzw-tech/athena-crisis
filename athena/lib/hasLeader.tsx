import type { UnitInfo } from '../info/Unit.tsx';
import type { PlayerID } from '../map/Player.tsx';
import type { TransportedUnit } from '../map/Unit.tsx';
import type Unit from '../map/Unit.tsx';
import type MapData from '../MapData.tsx';

export default function hasLeader(
  map: MapData,
  player: PlayerID,
  info: UnitInfo,
) {
  const hasLeader = <T extends Unit | TransportedUnit>(unit: T): boolean => {
    if (unit.id === info.id && unit.player === player && unit.isLeader()) {
      return true;
    }

    return unit.transports?.length ? unit.transports.some(hasLeader) : false;
  };

  return map.units.some(hasLeader);
}
