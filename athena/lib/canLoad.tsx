import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export default function canLoad(
  map: MapData,
  maybeTransporter: Unit,
  unitA: Unit,
  vector: Vector,
) {
  return (
    map.matchesPlayer(unitA, maybeTransporter) &&
    maybeTransporter.info.canTransport(unitA.info, map.getTileInfo(vector)) &&
    !maybeTransporter.isFull()
  );
}
