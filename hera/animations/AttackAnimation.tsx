import { SoundName } from '@deities/athena/info/Music.tsx';
import { WeaponAnimation } from '@deities/athena/info/Unit.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { AttackSprites } from 'athena-crisis:images';
import { CSSProperties } from 'react';
import attackSpriteHasVariants from '../lib/attackSpriteHasVariants.tsx';
import getEntityPosition from '../render/getEntityPosition.tsx';
import Animation, { AnimationDirection, MapAnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const WeaponSpriteLayout = { offsetSize: 24 } as const;

const actualDirections: Record<AnimationDirection, AnimationDirection> = {
  down: 'down',
  left: 'right',
  right: 'left',
  up: 'up',
};

const frameCache = new WeakMap<WeaponAnimation, ReadonlyArray<CSSProperties>>();
const getFrames = (animation: WeaponAnimation) => {
  const frames = frameCache.get(animation);
  if (frames) {
    return frames;
  }

  const newFrames = generateFrames(animation.size, animation.frames, 'vertical');
  frameCache.set(animation, newFrames);
  return newFrames;
};

export default function AttackAnimation({
  animation,
  delay,
  direction,
  entitySize,
  initialDelay,
  mirror,
  onComplete,
  onStep,
  position,
  rate,
  requestFrame,
  scheduleTimer,
  sound,
  style,
  tileSize,
  variant,
  zIndex,
}: Omit<MapAnimationProps, 'delay' | 'leadingDelay' | 'trailingDelay'> & {
  animation: WeaponAnimation;
  delay: number;
  direction: AnimationDirection;
  mirror?: boolean;
  position: Vector;
  rate: number;
  sound: SoundName | null;
  style: 'unfold' | null;
  variant: PlayerID;
}) {
  const hasVariants = attackSpriteHasVariants(animation.sprite);
  const frames = getFrames(animation);
  const spriteOffset = animation.size - WeaponSpriteLayout.offsetSize;
  const origin = getEntityPosition(position, tileSize, entitySize);
  const offset = animation.getPosition(style, direction, mirror);

  // Resetting the direction after receiving offsets allows them
  // to be applied based on the real direction. This is primarily
  // useful for offsetting hit animations that aren't rotated and don't
  // normally need offsets.
  if (!animation.rotate) {
    direction = 'right';
  }

  const x =
    origin.x +
    (offset?.x || 0) * WeaponSpriteLayout.offsetSize * (direction === 'left' || mirror ? 1 : -1);
  const y = origin.y + (offset?.y || 0) * WeaponSpriteLayout.offsetSize;

  return (
    <Animation
      cell={animation.cell}
      delay={delay}
      direction={actualDirections[direction] || direction}
      frames={frames}
      frameSize={animation.size}
      initialDelay={(initialDelay || 0) + animation.leadingFrames * delay}
      onComplete={onComplete}
      onStep={onStep}
      position={new SpriteVector(x - spriteOffset / 2, y - spriteOffset)}
      rate={rate}
      repeat={animation.repeat}
      requestFrame={requestFrame}
      scheduleTimer={scheduleTimer}
      sound={sound}
      source={!hasVariants ? AttackSprites[animation.sprite] : undefined}
      sprite={hasVariants ? animation.sprite : undefined}
      trailingDelay={animation.trailingFrames * delay}
      variant={variant}
      zIndex={zIndex}
    />
  );
}
