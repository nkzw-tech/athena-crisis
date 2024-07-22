import { UnitInfo } from '../info/Unit.tsx';
import { PlayerID } from '../map/Player.tsx';
import Unit, { TransportedUnit } from '../map/Unit.tsx';
import MapData from '../MapData.tsx';

export default function getLeaders(
  map: MapData,
  player?: PlayerID,
): Readonly<{
  addLeader: (player: PlayerID, unit: UnitInfo) => void;
  hasLeader: (player: PlayerID, unit: UnitInfo) => boolean;
}> {
  const leaders = new Map<PlayerID, Set<number>>();
  const addLeader = (player: PlayerID, unit: UnitInfo) => {
    const set = leaders.get(player);
    if (set) {
      set.add(unit.id);
    } else {
      leaders.set(player, new Set([unit.id]));
    }
  };

  const addLeaders = (unit: Unit | TransportedUnit) => {
    if ((player == null || unit.player === player) && unit.isLeader()) {
      addLeader(unit.player, unit.info);
    }

    if (unit.transports) {
      for (const transportedUnit of unit.transports) {
        addLeaders(transportedUnit);
      }
    }
  };

  const hasLeader = (player: PlayerID, unit: UnitInfo) =>
    leaders.get(player)?.has(unit.id) || false;

  for (const [, unit] of map.units) {
    addLeaders(unit);
  }

  return { addLeader, hasLeader };
}
