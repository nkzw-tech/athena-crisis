import Player from '../map/Player.tsx';
import MapData from '../MapData.tsx';
import getUnitValue from './getUnitValue.tsx';

export default function calculateUnitValue(
  map: MapData,
  player: Player,
): number {
  let sum = 0;

  for (const [, unit] of map.units) {
    if (map.matchesPlayer(player, unit)) {
      sum += getUnitValue(unit, player);
    }
  }

  return sum;
}
