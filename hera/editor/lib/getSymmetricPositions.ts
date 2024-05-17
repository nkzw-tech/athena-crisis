import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { DrawingMode } from '../Types.tsx';
import { mirrorVector } from './mirrorVector.ts';

export default function getSymmetricPositions(
  vector: Vector,
  drawingMode: DrawingMode,
  mapSize: SizeVector,
) {
  const vectors: Vector[] = [];

  if (drawingMode !== 'regular') {
    if (drawingMode === 'horizontal-vertical') {
      vectors.push(
        mirrorVector(vector, mapSize, 'horizontal'),
        mirrorVector(vector, mapSize, 'vertical'),
        mirrorVector(
          mirrorVector(vector, mapSize, 'horizontal'),
          mapSize,
          'vertical',
        ),
      );
    } else {
      vectors.push(mirrorVector(vector, mapSize, drawingMode));
    }
  }

  return vectors.filter((v) => !vector.equals(v));
}
