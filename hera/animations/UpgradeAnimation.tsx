import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import React, { useCallback } from 'react';
import type { StateToStateLike, UpdateFunction } from '../Types.tsx';
import type { AnimationProps } from './Animation.tsx';
import Animation from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 80;
const frameCount = 23;
const upgrade = 3;
const frames = generateFrames(spriteSize, frameCount, 'vertical');

export default function UpgradeAnimation({
  onUpgrade,
  position: { x, y },
  size,
  update,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  delay: number;
  onUpgrade: StateToStateLike;
  position: Vector;
  update: UpdateFunction;
}) {
  return (
    <Animation
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
