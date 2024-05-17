import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { DrawingMode } from '../Types.tsx';

export function mirrorVector(
  vector: Vector,
  mapSize: SizeVector,
  mirrorType: Extract<DrawingMode, 'horizontal' | 'vertical' | 'diagonal'>,
) {
  if (mirrorType === 'horizontal') {
    return vec(mapSize.width - vector.x + 1, vector.y);
  }
  if (mirrorType === 'vertical') {
    return vec(vector.x, mapSize.height - vector.y + 1);
  }
  if (mirrorType === 'diagonal') {
    return vec(mapSize.width - vector.x + 1, mapSize.height - vector.y + 1);
  }
  return vector;
}
