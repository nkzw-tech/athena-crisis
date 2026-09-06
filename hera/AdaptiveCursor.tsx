import Vector from '@deities/athena/map/Vector.tsx';
import syncAnimation from '@deities/ui/lib/syncAnimation.tsx';
import { css, keyframes } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { memo, useState } from 'react';
import type { CursorProps } from './Cursor.tsx';

const layout = { frameSize: 26, inset: 1 } as const;
const corners = [
  { bottom: false, right: false },
  { bottom: false, right: true },
  { bottom: true, right: false },
  { bottom: true, right: true },
] as const;

export default memo(function AdaptiveCursor({ color, position, tileSize, zIndex }: CursorProps) {
  const [previousPosition, setPreviousPosition] = useState<Vector | null>(null);
  if (position && previousPosition !== position) {
    setPreviousPosition(position);
  }
  const currentPosition = position || previousPosition;

  return (
    <div
      className={baseStyle}
      style={{
        height: tileSize + layout.inset * 2,
        opacity: position ? 1 : 0,
        transform: currentPosition
          ? `translate3d(${(currentPosition.x - 1) * tileSize - layout.inset}px, ${(currentPosition.y - 1) * tileSize - layout.inset}px, 0)`
          : '',
        width: tileSize + layout.inset * 2,
        zIndex,
      }}
    >
      {corners.map(({ bottom, right }, index) => (
        <div
          className={cornerStyle}
          key={index}
          style={{
            bottom: bottom ? 0 : undefined,
            left: right ? undefined : 0,
            right: right ? 0 : undefined,
            top: bottom ? undefined : 0,
          }}
        >
          <div
            className={frameStyle}
            ref={syncAnimation}
            style={{
              backgroundPositionY: color === 'red' ? -layout.frameSize : 0,
              left: right ? -layout.frameSize / 2 : 0,
              top: bottom ? -layout.frameSize / 2 : 0,
            }}
          />
        </div>
      ))}
    </div>
  );
});

const baseStyle = css`
  pointer-events: none;
  position: absolute;
  transition: opacity 250ms ease-in-out;
`;

const cornerStyle = css`
  height: ${layout.frameSize / 2}px;
  overflow: hidden;
  position: absolute;
  width: ${layout.frameSize / 2}px;
`;

const frameStyle = css`
  background-image: url('${Sprites.Cursor}');
  height: ${layout.frameSize}px;
  position: absolute;
  width: ${layout.frameSize}px;
  animation: ${keyframes`
    0% {
      background-position-x: 0;
    }
    100% {
      background-position-x: -${layout.frameSize * 4}px;
    }
  `}
    720ms steps(4) infinite;
`;
