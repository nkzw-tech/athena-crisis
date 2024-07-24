import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import React from 'react';
import { UpdateFunction } from '../Types.tsx';
import Animation, { AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 48;
const frameCount = 18;
const frames = generateFrames(spriteSize, frameCount, 'vertical');

export default function DamageAnimation({
  position: { x, y },
  size,
  update,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  delay: number;
  position: Vector;
  update: UpdateFunction;
}) {
  return (
    <Animation
      frames={frames}
      position={
        new SpriteVector(
          (x - 1) * size - (spriteSize - size) / 2,
          (y - 1.65) * size,
        )
      }
      size={spriteSize}
      sound="Unit/Spawn"
      source={Sprites.Damage}
      {...props}
    />
  );
}
