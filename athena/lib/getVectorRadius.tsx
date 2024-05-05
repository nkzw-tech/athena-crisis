import vec from '../map/vec.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export default function getVectorRadius(
  map: MapData,
  vector: Vector,
  radius: number,
) {
  const vectors = new Set<Vector>();
  for (let x = 0; x <= radius; x++) {
    for (let y = 0; y <= radius - x; y++) {
      const s1 = { x: vector.x + x, y: vector.y + y };
      const v1 = map.contains(s1) && vec(s1.x, s1.y);

      const s2 = { x: vector.x + x, y: vector.y - y };
      const v2 = map.contains(s2) && vec(s2.x, s2.y);

      const s3 = { x: vector.x - x, y: vector.y + y };
      const v3 = map.contains(s3) && vec(s3.x, s3.y);

      const s4 = { x: vector.x - x, y: vector.y - y };
      const v4 = map.contains(s4) && vec(s4.x, s4.y);
      if (v1) {
        vectors.add(v1);
      }
      if (v2) {
        vectors.add(v2);
      }
      if (v3) {
        vectors.add(v3);
      }
      if (v4) {
        vectors.add(v4);
      }
    }
  }
  return [...vectors];
}
