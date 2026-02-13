import { UnitInfo } from '../info/Unit.tsx';
import { PlayerID } from '../map/Player.tsx';
import Unit, { TransportedUnit } from '../map/Unit.tsx';
import MapData from '../MapData.tsx';

export default function hasLeader(map: MapData, player: PlayerID, info: UnitInfo) {
  const hasLeader = <T extends Unit | TransportedUnit>(unit: T): boolean => {
    if (unit.id === info.id && unit.player === player && unit.isLeader()) {
      return true;
    }

    return unit.transports?.length ? unit.transports.some(hasLeader) : false;
  };

  return map.units.some(hasLeader);
}
