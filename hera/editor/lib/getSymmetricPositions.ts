import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { DrawingMode } from '../Types.tsx';
import { mirrorVector } from './mirrorVector.ts';

export default function getSymmetricPositions(
  origin: Vector,
  drawingMode: DrawingMode,
  mapSize: SizeVector,
) {
  const vectors: Array<Vector> = [];

  if (drawingMode !== 'regular') {
    if (drawingMode === 'horizontal-vertical') {
      vectors.push(
        mirrorVector(origin, mapSize, 'horizontal'),
        mirrorVector(origin, mapSize, 'vertical'),
        mirrorVector(
          mirrorVector(origin, mapSize, 'horizontal'),
          mapSize,
          'vertical',
        ),
      );
    } else {
      vectors.push(mirrorVector(origin, mapSize, drawingMode));
    }
  }

  return vectors.filter((vector) => !origin.equals(vector));
}
