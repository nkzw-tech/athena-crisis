import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { DrawingMode } from '../Types.tsx';
import { mirrorVector } from './mirrorVector.tsx';

export default function getSymmetricPositions(
  origin: Vector,
  drawingMode: DrawingMode,
  mapSize: SizeVector,
) {
  const vectors = new Set<Vector>();

  if (drawingMode !== 'regular') {
    if (drawingMode === 'horizontal-vertical') {
      vectors.add(mirrorVector(origin, mapSize, 'horizontal'));
      vectors.add(mirrorVector(origin, mapSize, 'vertical'));
      vectors.add(
        mirrorVector(
          mirrorVector(origin, mapSize, 'horizontal'),
          mapSize,
          'vertical',
        ),
      );
    } else {
      vectors.add(mirrorVector(origin, mapSize, drawingMode));
    }
  }

  vectors.delete(origin);
  return vectors;
}
