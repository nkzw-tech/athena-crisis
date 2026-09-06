import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import getEntityPosition from '../render/getEntityPosition.tsx';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { MapAnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const layout = { anchor: { x: 12, y: 16 }, frameSize: 48 } as const;
const frames = generateFrames(layout.frameSize, 18, 'vertical');
const reverseFrames = frames.toReversed();

export default function Spawn({
  entitySize,
  onSpawn,
  position,
  tileSize,
  type,
  unitDirection,
  update,
  ...props
}: Omit<MapAnimationProps, 'sound'> & {
  onSpawn?: StateToStateLike;
  position: Vector;
  type: 'spawn' | 'despawn';
  unitDirection: 'left' | 'right';
  update: UpdateFunction;
}) {
  const { x, y } = getEntityPosition(position, tileSize, entitySize);
  return (
    <Animation
      direction={unitDirection}
      frames={type === 'despawn' ? reverseFrames : frames}
      frameSize={layout.frameSize}
      onStep={useCallback(
        (step: number) => {
          if (onSpawn && step === 8) {
            update(onSpawn);
          }
        },
        [onSpawn, update],
      )}
      position={new SpriteVector(x - layout.anchor.x, y - layout.anchor.y)}
      sound="Unit/Spawn"
      sprite="Spawn"
      {...props}
    />
  );
}
