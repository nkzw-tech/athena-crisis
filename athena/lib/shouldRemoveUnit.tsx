import { PlayerID } from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import isFuelConsumingUnit from './isFuelConsumingUnit.tsx';

export default function shouldRemoveUnit(
  map: MapData,
  vector: Vector,
  unit: Unit,
  player: PlayerID,
) {
  return (
    !unit.hasFuel() &&
    map.matchesPlayer(unit, player) &&
    isFuelConsumingUnit(unit, map.getTileInfo(vector))
  );
}
