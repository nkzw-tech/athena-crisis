import Vector from '@deities/athena/map/Vector.tsx';
import syncAnimation from '@deities/ui/lib/syncAnimation.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { memo, useState } from 'react';

export default memo(function Cursor({
  color,
  paused,
  position,
  size,
  zIndex,
}: {
  color?: 'red' | null;
  paused?: boolean;
  position: Vector | null;
  size: number;
  zIndex: number;
}) {
  const [previousPosition, setPreviousPosition] = useState<Vector | null>(null);
  const [transform, setTransform] = useState<string>('');

  // Keep track of the previous position so that the cursor doesn't flash
  // on (1|1) when leaving and re-entering the Map.
  if (previousPosition !== position) {
    setPreviousPosition(position);

    const currentPosition = position || previousPosition;
    setTransform(
      currentPosition
        ? `translate3d(${(currentPosition.x - 1) * size - 1}px, ${
            (currentPosition.y - 1) * size - 1
          }px, 0)`
        : '',
    );
  }

  return (
    <div
      className={cx(baseStyle, color && colors[color])}
      ref={syncAnimation}
      style={{
        opacity: position ? 1 : 0,
        transform,
        zIndex,
      }}
    />
  );
});

const size = '26px';
const baseStyle = css`
  background-image: url('${Sprites.Cursor}');
  background-position-y: 0;
  height: ${size};
  pointer-events: none;
  position: absolute;
  transition: opacity 250ms ease-in-out;
  width: ${size};

  animation: ${keyframes`
    0% {
      background-position-x: 0;
    }
    100% {
      background-position-x: -104px;
    }
  `} 720ms steps(4) infinite;
`;

const colors = {
  red: css`
    background-position-y: -${size};
  `,
};
