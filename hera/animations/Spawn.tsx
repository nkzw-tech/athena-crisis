import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 48;
const frames = generateFrames(spriteSize, 18, 'vertical');
const reverseFrames = frames.toReversed();

export default function Spawn({
  onSpawn,
  position: { x, y },
  size,
  type,
  unitDirection,
  update,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  onSpawn?: StateToStateLike;
  position: Vector;
  type: 'spawn' | 'despawn';
  unitDirection: 'left' | 'right';
  update: UpdateFunction;
}) {
  return (
    <Animation
      direction={unitDirection}
      frames={type === 'despawn' ? reverseFrames : frames}
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
