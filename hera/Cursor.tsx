import Vector from '@deities/athena/map/Vector.tsx';
import { ComponentType, memo } from 'react';
import AdaptiveCursor from './AdaptiveCursor.tsx';
import DefaultCursor from './DefaultCursor.tsx';

export type CursorProps = Readonly<{
  color?: 'red' | null;
  position: Vector | null;
  tileSize: number;
  zIndex: number;
}>;

const cursors: Readonly<Partial<Record<number, ComponentType<CursorProps>>>> = {
  24: DefaultCursor,
};

export default memo(function Cursor(props: CursorProps) {
  const CursorComponent = cursors[props.tileSize] || AdaptiveCursor;
  return <CursorComponent {...props} />;
});
