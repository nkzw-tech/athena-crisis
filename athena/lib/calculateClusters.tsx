import skmeans from 'skmeans';
import type Vector from '../map/Vector.tsx';
import type { SizeVector } from '../MapData.tsx';
import vec from './../map/vec.tsx';

const getClusterCount = (size: SizeVector, max: number) =>
  Math.min(
    max,
    Math.ceil(3 + ((size.height * size.width) / /* scale */ 200) ** 1.2),
  );

export default function calculateClusters(
  size: SizeVector,
  vectors: ReadonlyArray<Vector>,
  maxClusters = 10,
): ReadonlyArray<Vector> {
  const count = getClusterCount(size, maxClusters);
  if (vectors.length <= count) {
    if (vectors.length === 1) {
      return vectors;
    }

    const fields = new Set();
    return [
      ...new Set(
        vectors.filter((vector) => {
          if (fields.has(vector)) {
            return false;
          }

          fields.add(vector);
          for (const adjacent of vector
            .adjacentStar()
            .flatMap((vector) => vector.adjacent())) {
            fields.add(adjacent);
          }
          return true;
        }),
      ),
    ];
  }

  return skmeans(
    vectors.map((vector) => [vector.x, vector.y]),
    count,
    'kmpp',
    10,
    ([xA, yA], [xB, yB]) => Math.abs(xA - xB) + Math.abs(yA - yB),
  )
    .centroids.map((centroid) => {
      if (Array.isArray(centroid)) {
        return vec(Math.round(centroid[0]), Math.round(centroid[1]));
      }
      // Make TypeScript happy.
      return vec(-1, -1);
    })
    .filter((vector) => vector && size.contains(vector));
}
