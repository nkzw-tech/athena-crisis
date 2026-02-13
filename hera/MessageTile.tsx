import { PlayerID } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import { SquarePulseStyle } from '@deities/ui/PulseStyle.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { memo, useEffect, useRef } from 'react';
import sprite from './lib/sprite.tsx';
import { NewMapMessageAnimation } from './MapAnimations.tsx';
import Tick from './Tick.tsx';
import { TimerFunction } from './Types.tsx';

const defaultPosition = vec(1, 1);

export default memo(function MessageTile({
  absolute,
  animation,
  distance,
  highlight,
  isValuable,
  onAnimationComplete,
  player,
  position = defaultPosition,
  press,
  pulse,
  scheduleTimer,
  size,
  zIndex,
}: {
  absolute?: boolean;
  animation?: NewMapMessageAnimation;
  distance: number | null;
  highlight?: boolean;
  isValuable?: boolean;
  onAnimationComplete?: (position: Vector, animation: NewMapMessageAnimation) => void;
  player: PlayerID;
  position?: Vector;
  press?: boolean;
  pulse?: boolean;
  scheduleTimer?: TimerFunction;
  size: number;
  zIndex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { x, y } = position;
  const positionX = (x - 1) * size;
  const positionY = (y - 1) * size + 2;

  useEffect(() => {
    const element = ref.current;
    if (element && animation) {
      if (!scheduleTimer || !onAnimationComplete) {
        throw new Error(
          `Building: 'scheduleTimer' or 'onAnimationComplete' props is missing for message animation at '${position}'.`,
        );
      }

      AudioPlayer.playSound('Unit/Spawn');

      scheduleTimer(() => {
        for (const node of element.children) {
          node.classList.add(pressStyle);
        }

        onAnimationComplete(position, animation);
      }, 200);
    }
  }, [animation, onAnimationComplete, position, scheduleTimer]);

  return (
    <div
      className={cx(baseStyle, absolute && absoluteStyle)}
      ref={ref}
      style={{
        height: size,
        opacity: 1 - (Math.min(Math.max(distance ?? 5, 2), 5) - 2) / 6,
        [vars.set('brightness')]:
          distance === 0
            ? isValuable
              ? 1.6
              : 1.45
            : highlight || (distance != null && distance <= 1)
              ? 1.25
              : 1.05,
        [vars.set('x')]: `${positionX}px`,
        [vars.set('y')]: `${positionY}px`,
        width: size,
        zIndex: zIndex ?? 0,
      }}
    >
      <div
        className={cx(
          baseStyle,
          absolute && absoluteStyle,
          pulse && SquarePulseStyle,
          press && pressStyle,
        )}
        style={{
          backgroundImage: `url(${Sprites.MessageShadow})`,
          backgroundPositionX: `calc(${Tick.vars.apply('unit')} * ${-size}px)`,
          backgroundPositionY: isValuable ? -size : '0px',
          height: size,
          opacity: isValuable ? 0.66 : 0.33,
          width: size,
        }}
      />
      <div
        className={cx(
          absolute && absoluteStyle,
          sprite('Message', player),
          pulse && SquarePulseStyle,
          press && pressStyle,
        )}
        style={{
          backgroundPositionX: `calc(${Tick.vars.apply('unit')} * ${-size}px)`,
          backgroundPositionY: '0px',
          height: size,
          width: size,
        }}
      />
    </div>
  );
});

const vars = new CSSVariables<'brightness' | 'saturation' | 'x' | 'y'>('b');

const absoluteStyle = css`
  position: absolute;
`;

const baseStyle = css`
  ${vars.set('x', 0)}
  ${vars.set('y', 0)}
  ${vars.set('brightness', 1.05)}
  ${vars.set('saturation', 1)}

  filter: brightness(${vars.apply('brightness')}) saturate(${vars.apply('saturation')});
  pointer-events: none;
  transform: translate3d(${vars.apply('x')}, ${vars.apply('y')}, 0);
  transition:
    filter 250ms ease-in-out,
    opacity 250ms ease-in-out;
`;

const pressStyle = css`
  animation: ${keyframes`
    0% {
      transform: scale(1);
    }
    33% {
      transform: scale(0.8);
    }
    66% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  `} 300ms 1;
`;
