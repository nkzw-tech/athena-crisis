import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { DrawingMode } from '../Types.tsx';

export default function getSymmetricPositions(
  vector: Vector,
  drawingMode: DrawingMode,
  mapSize: SizeVector,
) {
  const vectors: Vector[] = [];

  if (drawingMode !== 'regular') {
    if (drawingMode === 'horizontal-vertical') {
      vectors.push(
        vector.mirror(mapSize, 'horizontal'),
        vector.mirror(mapSize, 'vertical'),
        vector.mirror(mapSize, 'vertical').mirror(mapSize, 'horizontal'),
      );
    } else {
      vectors.push(vector.mirror(mapSize, drawingMode));
    }
  }

  return vectors.filter((v) => !vector.equals(v));
}
