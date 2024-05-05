import { spriteImage } from '@deities/art/Sprites.tsx';
import { DecoratorInfo } from '@deities/athena/info/Decorator.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { DecoratorsPerSide } from '@deities/athena/map/Configuration.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import useVisibilityState from '@deities/ui/hooks/useVisibilityState.tsx';
import { css, cx } from '@emotion/css';
import { memo, useLayoutEffect, useRef } from 'react';
import { useSprites } from './hooks/useSprites.tsx';
import tick, { getFrame, getTick } from './lib/tick.tsx';

const renderDecorator = (
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  frame: number,
  decorator: DecoratorInfo,
  vector: Vector,
  size: number,
  biome: Biome,
) => {
  const targetX = (vector.x * size) / DecoratorsPerSide + size / 2 - 1;
  const targetY = (vector.y * size) / DecoratorsPerSide;
  const { x, y } = decorator.position;
  const biomeStyle = decorator.biomeStyle?.get(biome);
  context.drawImage(
    image,
    (x + (biomeStyle?.x || 0) + frame) * size,
    (y + (biomeStyle?.y || 0)) * size,
    size,
    size,
    targetX,
    targetY,
    size,
    size,
  );
};

export default memo(function Decorators({
  aboveFog,
  dim,
  map,
  outline,
  paused,
  tileSize: size,
}: {
  aboveFog?: boolean;
  dim?: boolean;
  map: MapData;
  outline?: boolean;
  paused?: boolean;
  tileSize: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hasSprites = useSprites('all');
  const { biome } = map.config;
  const isVisible = useVisibilityState();

  useLayoutEffect(() => {
    if (!hasSprites || !isVisible || !ref.current) {
      return;
    }

    const image = spriteImage('Decorators', biome);
    const context = ref.current.getContext('2d')!;
    context.clearRect(0, 0, ref.current.width, ref.current.height);

    const currentTick = getTick();
    const animatedDecorators = new Map<Vector, DecoratorInfo>();
    map.forEachDecorator((decorator, vector) => {
      renderDecorator(
        context,
        image,
        (!paused && getFrame(decorator, 0, currentTick)) || 0,
        decorator,
        vector,
        size,
        map.config.biome,
      );

      if (decorator.animation) {
        animatedDecorators.set(vector, decorator);
      }
    });

    if (!paused && isVisible && animatedDecorators.size) {
      return tick((tick) => {
        animatedDecorators.forEach(
          (decorator: DecoratorInfo, vector: Vector) => {
            const frame = getFrame(decorator, 0, tick);
            if (frame != null) {
              renderDecorator(
                context,
                image,
                frame,
                decorator,
                vector,
                size,
                map.config.biome,
              );
            }
          },
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biome, hasSprites, isVisible, map.size, map.decorators, paused, size]);

  return (
    <div
      className={cx(
        style,
        aboveFog && aboveFogStyle,
        dim && dimStyle,
        outline && outlineStyle,
      )}
      style={{
        height: map.size.height * size,
        width: map.size.width * size,
      }}
    >
      <canvas
        height={(map.size.height + 2) * size}
        ref={ref}
        style={{
          left: -size,
          position: 'absolute',
          top: -size,
        }}
        width={(map.size.width + 2) * size}
      />
    </div>
  );
});

const vars = new CSSVariables('d');
const style = css`
  pointer-events: none;
  position: absolute;
  z-index: 2;
`;

const aboveFogStyle = css`
  z-index: 10;
`;

const dimStyle = css`
  opacity: 0.7;
`;

const outlineStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(210, 18, 24)')}

  filter: drop-shadow(0.75px 0.75px 0px ${vars.apply('drop-shadow-color')})
    drop-shadow(-0.75px -0.75px 0px ${vars.apply('drop-shadow-color')})
    drop-shadow(-0.75px 0.75px 0px ${vars.apply('drop-shadow-color')})
    drop-shadow(0.75px -0.75px 0px ${vars.apply('drop-shadow-color')});
`;
