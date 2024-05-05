import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { RadiusItem } from '../Radius.tsx';
import { VisionT } from '../Vision.tsx';

export default function getMovementPath(
  map: MapData,
  to: Vector,
  fields: ReadonlyMap<Vector, RadiusItem>,
  vision: VisionT | null,
): { blockedBy: Vector | null; path: ReadonlyArray<Vector> } {
  let item = fields.get(to);
  let blockedBy: Vector | null = null;
  const path: Set<Vector> = new Set();
  while (item?.parent && !path.has(item.vector)) {
    const { parent, vector } = item;
    path.add(vector);
    if (vision && !vision.isVisible(map, vector) && map.units.has(vector)) {
      blockedBy = vector;
    }
    item = fields.get(parent);
  }
  const list = [...path].reverse();
  return {
    blockedBy,
    path: blockedBy ? list.slice(0, list.indexOf(blockedBy)) : list,
  };
}
