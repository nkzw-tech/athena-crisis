import Vector from '@deities/athena/map/Vector.tsx';

export default function maskClassName(vector: Vector) {
  return `mask-${vector.x}-${vector.y}`;
}

export const MaskPointerClassName = 'mask-pointer';
