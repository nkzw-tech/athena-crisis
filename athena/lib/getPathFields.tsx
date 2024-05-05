import Vector from '../map/Vector.tsx';
import { RadiusItem } from '../Radius.tsx';

export default function getPathFields(
  path: ReadonlyArray<Vector>,
  radiusFields: ReadonlyMap<Vector, RadiusItem>,
) {
  const fields = new Map<Vector, RadiusItem>();
  for (const vector of path) {
    const item = radiusFields.get(vector);
    if (item) {
      fields.set(vector, item);
    }
  }
  return fields;
}
