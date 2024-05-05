import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import React, { useCallback } from 'react';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 48;
const frames = generateFrames(spriteSize, 18, 'vertical');

export default function Spawn({
  onSpawn,
  position: { x, y },
  size,
  unitDirection,
  update,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  onSpawn?: StateToStateLike;
  position: Vector;
  unitDirection: 'left' | 'right';
  update: UpdateFunction;
}) {
  return (
    <Animation
      direction={unitDirection}
      frames={frames}
      onStep={useCallback(
        (step: number) => {
          if (onSpawn && step === 8) {
            update(onSpawn);
          }
        },
        [onSpawn, update],
      )}
      position={
        new SpriteVector(
          (x - 1) * size - (spriteSize - size) / 2,
          (y - 1) * size - ((spriteSize - size) / 3) * 2,
        )
      }
      size={spriteSize}
      sound="Unit/Spawn"
      sprite="Spawn"
      {...props}
    />
  );
}
