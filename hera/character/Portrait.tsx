import { spriteURL } from '@deities/art/Sprites.tsx';
import type { UnitInfo } from '@deities/athena/info/Unit.tsx';
import type { DynamicPlayerID } from '@deities/athena/map/Player.tsx';
import { encodeDynamicPlayerID } from '@deities/athena/map/Player.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { memo } from 'react';
import { useSprites } from '../hooks/useSprites.tsx';

export const PortraitWidth = 55;
export const PortraitHeight = 75;

export default memo(function Portrait({
  animate,
  clip = true,
  paused,
  player,
  scale = 2,
  unit,
  variant,
}: {
  animate?: boolean;
  clip?: boolean;
  paused?: boolean;
  player: DynamicPlayerID;
  scale?: number;
  unit: UnitInfo;
  variant?: number;
}) {
  const hasPortraits = useSprites('portraits');
  const sprite = hasPortraits
    ? spriteURL('Portraits', encodeDynamicPlayerID(player))
    : '';

  const { position } = unit.sprite.portrait;
  const y = -(position.y + (variant || 0)) * PortraitHeight + 'px';
  const alternateY = -(position.y + (variant || 0) + 6) * PortraitHeight + 'px';

  return (
    <div
      className={cx(portraitStyle, clip && clipStyle)}
      style={{
        [vars.set('x')]: -position.x * PortraitWidth + 'px',
        [vars.set('y')]: y,
        [vars.set('alternate-y')]: alternateY,
        height: PortraitHeight,
        width: PortraitWidth,
        zoom: scale,
      }}
    >
      {sprite && (
        <img
          className={cx(
            spriteStyle,
            animate && animateStyle,
            paused && pausedStyle,
          )}
          src={sprite}
        />
      )}
    </div>
  );
});

const vars = new CSSVariables<'x' | 'y' | 'alternate-y'>('p');

const portraitStyle = css`
  contain: content;
  image-rendering: pixelated;
  pointer-events: none;
`;

const clipStyle = css`
  ${clipBorder(2)}
`;

const spriteStyle = css`
  transform: translate3d(${vars.apply('x')}, ${vars.apply('y')}, 0);
`;

const animateStyle = css`
  animation: ${keyframes`
    0%, 100% {
      transform: translate3d(${vars.apply('x')}, ${vars.apply('y')}, 0);
    }
    50% {
      transform: translate3d(${vars.apply('x')}, ${vars.apply('alternate-y')}, 0);
    }
  `} 1s infinite steps(1);
`;

const pausedStyle = css`
  animation-play-state: paused;
`;
