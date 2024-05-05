import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { VisionT } from '../Vision.tsx';

export default function followMovementPath(
  map: MapData,
  path: ReadonlyArray<Vector>,
  vision: VisionT,
): { blockedBy: Vector | null; path: ReadonlyArray<Vector> } {
  let blockedBy: Vector | null = null;
  for (const vector of path) {
    if (!vision.isVisible(map, vector) && map.units.has(vector)) {
      blockedBy = vector;
      break;
    }
  }
  return {
    blockedBy,
    path: blockedBy ? path.slice(0, path.indexOf(blockedBy)) : path,
  };
}
