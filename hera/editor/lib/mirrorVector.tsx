import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { DrawingMode } from '../Types.tsx';

export function mirrorVector(
  vector: Vector,
  { height, width }: SizeVector,
  mirrorType: Extract<DrawingMode, 'horizontal' | 'vertical' | 'diagonal'>,
) {
  const { x, y } = vector;
  if (mirrorType === 'horizontal') {
    return vec(width - x + 1, y);
  }
  if (mirrorType === 'vertical') {
    return vec(x, height - y + 1);
  }
  if (mirrorType === 'diagonal') {
    return vec(width - x + 1, height - y + 1);
  }
  return vector;
}
