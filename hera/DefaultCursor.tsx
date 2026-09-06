import Vector from '@deities/athena/map/Vector.tsx';
import syncAnimation from '@deities/ui/lib/syncAnimation.tsx';
import { css, keyframes } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { memo, useState } from 'react';
import type { CursorProps } from './Cursor.tsx';

export default memo(function DefaultCursor({ color, position, tileSize, zIndex }: CursorProps) {
  const [previousPosition, setPreviousPosition] = useState<Vector | null>(null);
  if (position && previousPosition !== position) {
    setPreviousPosition(position);
  }
  const currentPosition = position || previousPosition;

  return (
    <div
      className={baseStyle}
      ref={syncAnimation}
      style={{
        backgroundPositionY: color === 'red' ? -26 : 0,
        opacity: position ? 1 : 0,
        transform: currentPosition
          ? `translate3d(${(currentPosition.x - 1) * tileSize - 1}px, ${(currentPosition.y - 1) * tileSize - 1}px, 0)`
          : '',
        zIndex,
      }}
    />
  );
});

const baseStyle = css`
  background-image: url('${Sprites.Cursor}');
  height: 26px;
  pointer-events: none;
  position: absolute;
  transition: opacity 250ms ease-in-out;
  width: 26px;
  animation: ${keyframes`
    0% {
      background-position-x: 0;
    }
    100% {
      background-position-x: -104px;
    }
  `}
    720ms steps(4) infinite;
`;
