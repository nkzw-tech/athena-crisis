import { TileInfo } from '@deities/athena/info/Tile.tsx';
import { Modifier } from '@deities/athena/lib/Modifier.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { isSafari } from '@deities/ui/Browser.tsx';
import { css, cx } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import React, { memo } from 'react';
import Tick from './Tick.tsx';

const defaultPosition = vec(1, 1);

// Add 0.1px to prevent a tiny gap between the tile and the decorator.
// This washes out pixels completely in Safari, so we only do this in Chrome.
const pixelGap = isSafari ? 0 : 0.1;

export default memo(function TileDecorator({
  absolute,
  dim,
  fade,
  modifier,
  position,
  size,
  tile,
  zIndex,
}: {
  absolute?: boolean;
  dim?: boolean | null;
  fade?: boolean;
  modifier: Modifier;
  position?: Vector;
  size: number;
  tile: TileInfo;
  zIndex?: number;
}) {
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
        backgroundPositionX: -positionX * size + 'px',
        backgroundPositionY: decorator.animation
          ? `calc(${Tick.vars.apply('tile-decorator')} * ${-size}px + ${pixelGap}px)`
          : -positionY * size + pixelGap + 'px',
        height: size + 3 + 'px',
        opacity: dim ? 0.65 : 1,
        pointerEvents: 'none',
        transform: `translate3d(${(x - 1) * size}px, ${(y - 1) * size}px, 0)`,
        transition: `opacity ${dim ? 200 : 0}ms ease-in-out`,
        width: size + 'px',
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
  mask-image: linear-gradient(
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.65) 65%,
    rgba(0, 0, 0, 1) 85%
  );
  mask-type: alpha;
`;
