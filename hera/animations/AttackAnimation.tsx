import { AttackSprite } from '@deities/athena/info/AttackSprite.tsx';
import { SoundName } from '@deities/athena/info/Music.tsx';
import {
  AttackSpriteWithVariants,
  WeaponAnimation,
} from '@deities/athena/info/Unit.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { AttackSprites } from 'athena-crisis:images';
import { CSSProperties } from 'react';
import attackSpriteHasVariants from '../lib/attackSpriteHasVariants.tsx';
import Animation, { AnimationDirection, AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const actualDirections: Record<AnimationDirection, AnimationDirection> = {
  down: 'down',
  left: 'right',
  right: 'left',
  up: 'up',
};

const frameCache = new Map<
  AttackSprite | AttackSpriteWithVariants,
  ReadonlyArray<CSSProperties>
>();
const getFrames = (animation: WeaponAnimation) => {
  const { sprite } = animation;
  const frames = frameCache.get(sprite);
  if (frames) {
    return frames;
  }

  const newFrames = generateFrames(
    animation.size,
    animation.frames,
    'vertical',
  );
  frameCache.set(sprite, newFrames);
  return newFrames;
};

export default function AttackAnimation({
  animation,
  delay,
  direction,
  initialDelay,
  mirror,
  onComplete,
  onStep,
  position,
  rate,
  requestFrame,
  scheduleTimer,
  size: tileSize,
  sound,
  style,
  variant,
  zIndex,
}: Omit<AnimationProps, 'delay' | 'leadingDelay' | 'trailingDelay'> & {
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
  const spriteOffset = Math.abs(animation.size - tileSize);
  const offset = animation.getPosition(style, direction, mirror);

  // Resetting the direction after receiving offsets allows them
  // to be applied based on the real direction. This is primarily
  // useful for offsetting hit animations that aren't rotated and don't
  // normally need offsets.
  if (!animation.rotate) {
    direction = 'right';
  }

  const x =
    position.x + (offset?.x || 0) * (direction === 'left' || mirror ? 1 : -1);
  const y = position.y + (offset?.y || 0);

  return (
    <Animation
      cell={animation.cell}
      delay={delay}
      direction={actualDirections[direction] || direction}
      frames={frames}
      initialDelay={(initialDelay || 0) + animation.leadingFrames * delay}
      onComplete={onComplete}
      onStep={onStep}
      position={
        new SpriteVector(
          (x - 1) * tileSize - spriteOffset / 2,
          (y - 1) * tileSize - spriteOffset,
        )
      }
      rate={rate}
      repeat={animation.repeat}
      requestFrame={requestFrame}
      scheduleTimer={scheduleTimer}
      size={animation.size}
      sound={sound}
      source={!hasVariants ? AttackSprites[animation.sprite] : undefined}
      sprite={hasVariants ? animation.sprite : undefined}
      trailingDelay={animation.trailingFrames * delay}
      variant={variant}
      zIndex={zIndex}
    />
  );
}
