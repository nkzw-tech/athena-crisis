import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import getEntityPosition from '../render/getEntityPosition.tsx';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { MapAnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const layout = { anchor: { x: 12, y: 16 }, frameSize: 48 } as const;
const frames = generateFrames(layout.frameSize, 13, 'vertical');

export default function BuildingCreate({
  entitySize,
  onCreate,
  position,
  tileSize,
  update,
  ...props
}: Omit<MapAnimationProps, 'sound'> & {
  onCreate?: StateToStateLike;
  position: Vector;
  update: UpdateFunction;
}) {
  const { x, y } = getEntityPosition(position, tileSize, entitySize);
  return (
    <Animation
      frames={frames}
      frameSize={layout.frameSize}
      onStep={useCallback(
        (step: number) => {
          if (onCreate && step === 2) {
            update(onCreate);
          }
        },
        [onCreate, update],
      )}
      position={new SpriteVector(x - layout.anchor.x, y - layout.anchor.y)}
      sound="Unit/CreateBuilding"
      sprite="Building-Create"
      {...props}
    />
  );
}
