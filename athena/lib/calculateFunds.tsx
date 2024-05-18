import type { PlayerID } from '../map/Player.tsx';
import type Player from '../map/Player.tsx';
import type MapData from '../MapData.tsx';

export default function calculateFunds(
  map: MapData,
  player: Player | PlayerID,
): number {
  return (
    map.buildings.reduce(
      (sum, building) =>
        sum +
        (map.matchesPlayer(player, building)
          ? building.info.configuration.funds
          : 0),
      0,
    ) * map.config.multiplier
  );
}

export function calculateTotalPossibleFunds(map: MapData): number {
  return map.buildings.reduce(
    (sum, building) => sum + building.info.configuration.funds,
    0,
  );
}
