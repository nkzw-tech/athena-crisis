import { DecoratorsPerSide } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { css, cx } from '@emotion/css';
import { memo, useMemo } from 'react';
import maskClassName, { MaskPointerClassName } from './lib/maskClassName.tsx';
import { BaseMaskProps } from './Mask.tsx';
import { MapEnterType } from './Types.tsx';

export default memo(function MaskWithSubtiles({
  enter,
  map,
  ref,
  select,
  tileSize: size,
  zIndex,
}: Omit<BaseMaskProps, 'cancel' | 'enter' | 'select'> & {
  enter: (vector: Vector, subVector: Vector, type: MapEnterType) => void;
  select: (vector: Vector, subVector: Vector) => void;
}) {
  const decoratorSize = size / DecoratorsPerSide;
  return useMemo(
    () => (
      <div className={cx(maskStyle, MaskPointerClassName)} ref={ref}>
        {map
          .mapFields((vector) => {
            const list = [];
            for (let x = 1; x <= DecoratorsPerSide; x++) {
              for (let y = 1; y <= DecoratorsPerSide; y++) {
                const subVector = vec(
                  (vector.x - 1) * DecoratorsPerSide + x,
                  (vector.y - 1) * DecoratorsPerSide + y,
                );
                list.push(
                  <div
                    className={maskClassName(vector)}
                    key={String(subVector)}
                    onClick={() => select(vector, subVector)}
                    onPointerEnter={() => enter(vector, subVector, 'pointer')}
                    style={{
                      height: decoratorSize,
                      left: (subVector.x - 1) * decoratorSize,
                      position: 'absolute',
                      top: (subVector.y - 1) * decoratorSize,
                      width: decoratorSize,
                      zIndex,
                    }}
                  />,
                );
              }
            }
            return list;
          })
          .flat()}
      </div>
    ),
    // eslint-disable-next-line react-hooks/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [decoratorSize, enter, map.size, select, zIndex],
  );
});

const maskStyle = css`
  cursor: none;

  &.${MaskPointerClassName} {
    cursor: pointer;
  }
`;
