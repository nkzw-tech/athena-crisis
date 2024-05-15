import Vector from '@deities/athena/map/Vector.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import { ComponentProps, memo } from 'react';
import Cursor from '../Cursor.tsx';
import getSymmetricDrawingModePositions from './lib/getSymmetricDrawingModePositions.tsx';
import { SymmetricDrawingMode } from './Types.tsx';

export default memo(function MapEditorExtraCursors({
  defaultCursorPosition,
  mapSize,
  symmetricDrawingMode,
  ...props
}: {
  defaultCursorPosition: Vector | null;
  mapSize: SizeVector;
  symmetricDrawingMode: SymmetricDrawingMode | undefined;
} & Omit<ComponentProps<typeof Cursor>, 'position'>) {
  if (
    !defaultCursorPosition ||
    !symmetricDrawingMode ||
    symmetricDrawingMode === 'regular'
  ) {
    return null;
  }

  const vectors = getSymmetricDrawingModePositions(
    defaultCursorPosition,
    symmetricDrawingMode,
    mapSize,
  );

  if (!vectors.length) {
    return null;
  }

  return vectors.map((vector) => (
    <Cursor key={vector.toString()} {...props} position={vector} />
  ));
});
