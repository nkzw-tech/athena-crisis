import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { ComponentProps } from 'react';
import Cursor from '../Cursor.tsx';
import getSymmetricPositions from './lib/getSymmetricPositions.tsx';
import { DrawingMode } from './Types.tsx';

export default function MapEditorMirrorCursors({
  drawingMode,
  mapSize,
  origin: orign,
  ...props
}: {
  drawingMode: DrawingMode | undefined;
  mapSize: SizeVector;
  origin: Vector | null;
} & Omit<ComponentProps<typeof Cursor>, 'position'>) {
  if (!orign || !drawingMode || drawingMode === 'regular') {
    return null;
  }

  const vectors = getSymmetricPositions(orign, drawingMode, mapSize);
  return vectors.size
    ? [...vectors].map((vector) => <Cursor {...props} key={vector.toString()} position={vector} />)
    : null;
}
