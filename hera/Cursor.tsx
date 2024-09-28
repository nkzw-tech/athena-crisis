import Vector from '@deities/athena/map/Vector.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import { css, cx } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { memo, useCallback, useRef, useState } from 'react';
import { useTick } from './lib/tick.tsx';

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

  const ref = useRef<HTMLDivElement>(null);
  useTick(
    paused,
    useCallback((tick: number) => {
      ref.current?.style.setProperty(vars.set('tick'), String(tick % 4));
    }, []),
    [],
  );

  return (
    <div
      className={cx(baseStyle, color && colors[color])}
      ref={ref}
      style={{
        opacity: position ? 1 : 0,
        transform,
        zIndex,
      }}
    />
  );
});

const vars = new CSSVariables<'tick' | 'background-position-y' | 'size'>('c');

const baseStyle = css`
  ${vars.set('background-position-y', 0)}
  ${vars.set('size', '26px')}
  ${vars.set('tick', 0)}

  background-image: url('${Sprites.Cursor}');
  background-position: calc(${vars.apply('tick')} * ${vars.apply('size')} * -1)
    ${vars.apply('background-position-y')};
  height: ${vars.apply('size')};
  pointer-events: none;
  position: absolute;
  transition: opacity 250ms ease-in-out;
  width: ${vars.apply('size')};
`;

const colors = {
  red: css`
    ${vars.set('background-position-y', `calc(${vars.apply('size')} * -1)`)}
  `,
};
