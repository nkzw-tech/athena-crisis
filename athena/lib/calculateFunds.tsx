import Player, { PlayerID } from '../map/Player.tsx';
import MapData from '../MapData.tsx';

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
