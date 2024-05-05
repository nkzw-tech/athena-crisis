import vec from '../map/vec.tsx';
import Vector from '../map/Vector.tsx';

class AverageVector extends Vector {}

export default function getAverageVector(vectors: ReadonlyArray<Vector>) {
  const { x, y } = vectors
    .slice(1)
    .reduce<Vector>(
      (average, vector) =>
        new AverageVector(
          (average.x + vector.x) / 2,
          (average.y + vector.y) / 2,
        ),
      vectors[0] || vec(0, 0),
    );
  return vec(Math.round(x), Math.round(y));
}
