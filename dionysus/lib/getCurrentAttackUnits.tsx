import Player from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';

export default function getCurrentAttackUnits(
  map: MapData,
  currentPlayer: Player,
  dirtyUnits: ReadonlySet<Vector>,
): Array<[Vector, Unit]> {
  const units: Array<[Vector, Unit]> = [];
  for (const vector of dirtyUnits) {
    const unit = map.units.get(vector);
    if (
      unit &&
      !unit.isCompleted() &&
      unit.info.hasAttack() &&
      !unit.isCapturing() &&
      map.matchesPlayer(currentPlayer, unit)
    ) {
      units.push([vector, unit]);
    }
  }
  return units;
}
