import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import type { AnimationProps } from './Animation.tsx';
import Animation from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 36;
const frames = generateFrames(spriteSize, 18, 'vertical');

export default function Heal({
  position: { x, y },
  size,
  unitDirection,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  position: Vector;
  unitDirection: 'left' | 'right';
}) {
  return (
    <Animation
      direction={unitDirection}
      frames={frames}
      position={
        new SpriteVector(
          (x - 1) * size - (spriteSize - size) / 2,
          (y - 1) * size - (spriteSize - size - 2),
        )
      }
      size={spriteSize}
      sound="Unit/Heal"
      source={Sprites.Heal}
      {...props}
    />
  );
}
