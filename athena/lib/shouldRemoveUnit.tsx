import type { PlayerID } from '../map/Player.tsx';
import type Unit from '../map/Unit.tsx';
import type Vector from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';
import isFuelConsumingUnit from './isFuelConsumingUnit.tsx';

export default function shouldRemoveUnit(
  map: MapData,
  vector: Vector,
  unit: Unit,
  player: PlayerID,
) {
  return (
    map.matchesPlayer(unit, player) &&
    !unit.hasFuel() &&
    isFuelConsumingUnit(unit, map.getTileInfo(vector))
  );
}
