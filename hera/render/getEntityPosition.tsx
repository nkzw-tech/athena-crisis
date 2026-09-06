import type { VectorLike } from '@deities/athena/map/Vector.tsx';

export default function getEntityPosition(
  position: VectorLike,
  tileSize: number,
  entitySize: number,
) {
  const inset = (tileSize - entitySize) / 2;
  return {
    x: (position.x - 1) * tileSize + inset,
    y: (position.y - 1) * tileSize + inset,
  };
}
