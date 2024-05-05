import Vector from '../map/Vector.tsx';
import { SizeVector } from '../MapData.tsx';

export default function getDecoratorIndex(
  vector: Vector,
  size: SizeVector,
): number {
  if (!size.contains(vector)) {
    throw new Error(`vector: Invalid vector '${String(vector)}'.`);
  }
  return (vector.y - 1) * size.width + (vector.x - 1);
}
