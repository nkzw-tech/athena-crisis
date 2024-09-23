import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import React, { useMemo } from 'react';
import Animation, { AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 64;
const frames = generateFrames(spriteSize, 10, 'horizontal');

export default function Fireworks({
  delay,
  position: { x, y },
  size,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  delay: number;
  position: Vector;
}) {
  return (
    <Animation
      delay={useMemo(
        () =>
          frames.map((_, index) => (index < 3 ? delay * 0.75 : delay * 1.75)),
        [delay],
      )}
      frames={frames}
      position={new SpriteVector((x - 2.5) * size, (y - 2.5) * size)}
      size={spriteSize}
      sound="Fireworks"
      source={Sprites.Fireworks}
      {...props}
    />
  );
}
