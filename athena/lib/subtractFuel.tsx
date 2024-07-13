import MapData, { PlayerOrPlayerID } from '../MapData.tsx';
import isFuelConsumingUnit from './isFuelConsumingUnit.tsx';

export default function subtractFuel(map: MapData, player: PlayerOrPlayerID) {
  return map.copy({
    units: map.units.map((unit, vector) =>
      map.matchesPlayer(player, unit) &&
      isFuelConsumingUnit(unit, map.getTileInfo(vector))
        ? unit.modifyFuel(-1)
        : unit,
    ),
  });
}
