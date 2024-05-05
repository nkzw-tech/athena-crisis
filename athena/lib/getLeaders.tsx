import { PlayerID } from '../map/Player.tsx';
import Unit, { TransportedUnit } from '../map/Unit.tsx';
import MapData from '../MapData.tsx';

export default function getLeaders(
  map: MapData,
  player?: PlayerID,
): Readonly<{
  addLeader: (player: PlayerID, id: number) => void;
  hasLeader: (player: PlayerID, id: number) => boolean;
}> {
  const leaders = new Map<PlayerID, Set<number>>();
  const addLeader = (player: PlayerID, id: number) => {
    const set = leaders.get(player);
    if (set) {
      set.add(id);
    } else {
      leaders.set(player, new Set([id]));
    }
  };

  const addLeaders = (unit: Unit | TransportedUnit) => {
    if ((player == null || unit.player === player) && unit.isLeader()) {
      addLeader(unit.player, unit.id);
    }

    if (unit.transports) {
      for (const transportedUnit of unit.transports) {
        addLeaders(transportedUnit);
      }
    }
  };

  const hasLeader = (player: PlayerID, id: number) =>
    leaders.get(player)?.has(id) || false;

  for (const [, unit] of map.units) {
    addLeaders(unit);
  }

  return { addLeader, hasLeader };
}
