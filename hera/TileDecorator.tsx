import { TileInfo } from '@deities/athena/info/Tile.tsx';
import { Modifier } from '@deities/athena/lib/Modifier.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { css, cx } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { memo } from 'react';
import { TileDecoratorSpriteLayout } from './render/MapSpriteLayout.tsx';
import Tick from './Tick.tsx';

const defaultPosition = vec(1, 1);

export default memo(function TileDecorator({
  absolute,
  dim,
  fade,
  modifier,
  position,
  tile,
  tileSize,
  zIndex,
}: {
  absolute?: boolean;
  dim?: boolean | null;
  fade?: boolean;
  modifier: Modifier;
  position?: Vector;
  tile: TileInfo;
  tileSize: number;
  zIndex?: number;
}) {
  const { anchor, frameSize, overlap } = TileDecoratorSpriteLayout;
  const { decorator } = tile.style;
  if (!decorator) {
    return null;
  }

  let modifierVector = tile.sprite.modifiers.get(modifier);
  if (Array.isArray(modifierVector)) {
    modifierVector = new SpriteVector(0, 0);
  }

  const { x, y } = position || defaultPosition;
  const positionX = decorator.position.x + (modifierVector?.x || 0);
  const positionY = decorator.position.y + (modifierVector?.y || 0);

  return (
    <div
      className={cx(absolute && absoluteStyle, fade && fadeStyle)}
      style={{
        backgroundImage: `url('${Sprites.TileDecorators}')`,
        backgroundPositionX: -positionX * frameSize + 'px',
        backgroundPositionY: decorator.animation
          ? `calc(${Tick.vars.apply('tile-decorator')} * ${-frameSize}px)`
          : -positionY * frameSize + 'px',
        height: frameSize + overlap + 'px',
        opacity: dim ? 0.65 : 1,
        pointerEvents: 'none',
        transform: `translate3d(${(x - 0.5) * tileSize - anchor.x}px, ${y * tileSize - anchor.y}px, 0)`,
        transition: `opacity ${dim ? 200 : 0}ms ease-in-out`,
        width: frameSize + 'px',
        zIndex: zIndex ?? 0,
      }}
    />
  );
});

const absoluteStyle = css`
  pointer-events: none;
  position: absolute;
`;

const fadeStyle = css`
  mask-image: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.65) 65%, rgba(0, 0, 0, 1) 85%);
  mask-type: alpha;
`;
