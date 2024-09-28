import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 48;
const frames = generateFrames(spriteSize, 13, 'vertical');

export default function BuildingCreate({
  onCreate,
  position: { x, y },
  size,
  update,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  onCreate?: StateToStateLike;
  position: Vector;
  update: UpdateFunction;
}) {
  return (
    <Animation
      frames={frames}
      onStep={useCallback(
        (step: number) => {
          if (onCreate && step === 2) {
            update(onCreate);
          }
        },
        [onCreate, update],
      )}
      position={
        new SpriteVector(
          (x - 1) * size - (spriteSize - size) / 2,
          (y - 1) * size - ((spriteSize - size) / 3) * 2,
        )
      }
      size={spriteSize}
      sound="Unit/CreateBuilding"
      sprite="Building-Create"
      {...props}
    />
  );
}
