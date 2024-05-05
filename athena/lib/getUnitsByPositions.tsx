import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export type UnitsWithPosition = ReadonlyMap<Vector, Unit>;

export default function getUnitsByPositions(
  map: MapData,
  positions: ReadonlyArray<Vector>,
): UnitsWithPosition {
  const result = new Map();
  for (const position of positions) {
    const unit = map.units.get(position);
    if (unit) {
      result.set(position, unit);
    }
  }
  return result;
}
