import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import getEntityPosition from '../render/getEntityPosition.tsx';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { MapAnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const layout = { anchor: { x: 12, y: 14.4 }, frameSize: 48 } as const;
const frames = generateFrames(layout.frameSize, 17, 'vertical');

export default function Rescue({
  entitySize,
  onRescue,
  position,
  tileSize,
  unitDirection,
  update,
  ...props
}: Omit<MapAnimationProps, 'sound'> & {
  onRescue?: StateToStateLike;
  position: Vector;
  unitDirection: 'left' | 'right';
  update: UpdateFunction;
}) {
  const { x, y } = getEntityPosition(position, tileSize, entitySize);
  return (
    <Animation
      direction={unitDirection}
      frames={frames}
      frameSize={layout.frameSize}
      onStep={useCallback(
        (step: number) => {
          if (onRescue && step === 6) {
            update(onRescue);
          }
        },
        [onRescue, update],
      )}
      position={new SpriteVector(x - layout.anchor.x, y - layout.anchor.y)}
      sound="Unit/Heal"
      sprite="Rescue"
      {...props}
    />
  );
}
