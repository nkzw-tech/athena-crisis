import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import { useMemo } from 'react';
import Animation, { AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const layout = { anchor: { x: 48, y: 48 }, frameSize: 64 } as const;
const frames = generateFrames(layout.frameSize, 10, 'horizontal');

export default function Fireworks({
  delay,
  position: { x, y },
  tileSize,
  ...props
}: Omit<AnimationProps, 'sound' | 'frameSize'> & {
  delay: number;
  position: Vector;
  tileSize: number;
}) {
  return (
    <Animation
      delay={useMemo(
        () => frames.map((_, index) => (index < 3 ? delay * 0.75 : delay * 1.75)),
        [delay],
      )}
      frames={frames}
      frameSize={layout.frameSize}
      position={
        new SpriteVector(
          (x - 0.5) * tileSize - layout.anchor.x,
          (y - 0.5) * tileSize - layout.anchor.y,
        )
      }
      sound="Fireworks"
      source={Sprites.Fireworks}
      {...props}
    />
  );
}
