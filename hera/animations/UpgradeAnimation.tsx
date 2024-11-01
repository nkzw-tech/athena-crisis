import { FastAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import { useCallback } from 'react';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 80;
const frameCount = 23;
const upgrade = 2;
const frames = generateFrames(spriteSize, frameCount, 'vertical');

export default function UpgradeAnimation({
  onUpgrade,
  position: { x, y },
  size,
  update,
  ...props
}: Omit<AnimationProps, 'sound' | 'delay'> & {
  onUpgrade: StateToStateLike;
  position: Vector;
  update: UpdateFunction;
}) {
  return (
    <Animation
      delay={FastAnimationConfig.ExplosionStep}
      frames={frames}
      onStep={useCallback(
        (step: number) => {
          if (onUpgrade && step === upgrade) {
            update(onUpgrade);
          }
        },
        [onUpgrade, update],
      )}
      position={
        new SpriteVector(
          (x - 0.8) * size - (spriteSize - size) / 2,
          (y - 2.5) * size,
        )
      }
      size={spriteSize}
      sound="Unit/Spawn"
      source={Sprites.Upgrade}
      {...props}
    />
  );
}
