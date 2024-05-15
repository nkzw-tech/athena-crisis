import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { ComponentProps, memo } from 'react';
import Cursor from '../Cursor.tsx';
import getSymmetricPositions from './lib/getSymmetricPositions.tsx';
import { DrawingMode } from './Types.tsx';

export default memo(function MapEditorExtraCursors({
  defaultCursorPosition,
  drawingMode,
  mapSize,
  ...props
}: {
  defaultCursorPosition: Vector | null;
  drawingMode: DrawingMode | undefined;
  mapSize: SizeVector;
} & Omit<ComponentProps<typeof Cursor>, 'position'>) {
  if (!defaultCursorPosition || !drawingMode || drawingMode === 'regular') {
    return null;
  }

  const vectors = getSymmetricPositions(
    defaultCursorPosition,
    drawingMode,
    mapSize,
  );

  if (!vectors.length) {
    return null;
  }

  return vectors.map((vector) => (
    <Cursor key={vector.toString()} {...props} position={vector} />
  ));
});
