import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { SymmetricDrawingMode } from '../Types.tsx';

export default function getSymmetricDrawingModePositions(
  vector: Vector,
  symmetricDrawingMode: SymmetricDrawingMode,
  mapSize: SizeVector,
) {
  const vectors: Vector[] = [];

  if (symmetricDrawingMode !== 'regular') {
    if (symmetricDrawingMode === 'horizontal-vertical') {
      vectors.push(
        vector.mirror(mapSize, 'horizontal'),
        vector.mirror(mapSize, 'vertical'),
        vector.mirror(mapSize, 'vertical').mirror(mapSize, 'horizontal'),
      );
    } else {
      vectors.push(vector.mirror(mapSize, symmetricDrawingMode));
    }
  }

  return vectors;
}
