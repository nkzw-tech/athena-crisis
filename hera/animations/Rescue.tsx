import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import type { StateToStateLike, UpdateFunction } from '../Types.tsx';
import type { AnimationProps } from './Animation.tsx';
import Animation from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 48;
const frames = generateFrames(spriteSize, 17, 'vertical');

export default function Rescue({
  onRescue,
  position: { x, y },
  size,
  unitDirection,
  update,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  onRescue?: StateToStateLike;
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
          if (onRescue && step === 6) {
            update(onRescue);
          }
        },
        [onRescue, update],
      )}
      position={
        new SpriteVector(
          (x - 1) * size - (spriteSize - size) / 2,
          (y - 1.1) * size - (spriteSize - size) / 2,
        )
      }
      size={spriteSize}
      sound="Unit/Heal"
      sprite="Rescue"
      {...props}
    />
  );
}
