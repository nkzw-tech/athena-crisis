import { FastAnimationConfig } from '@deities/athena/map/Configuration.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import { useCallback } from 'react';
import getEntityPosition from '../render/getEntityPosition.tsx';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { MapAnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

const layout = { anchor: { x: 23.2, y: 36 }, frameSize: 80 } as const;
const frameCount = 23;
const upgrade = 2;
const frames = generateFrames(layout.frameSize, frameCount, 'vertical');

export default function UpgradeAnimation({
  entitySize,
  onUpgrade,
  position,
  tileSize,
  update,
  ...props
}: Omit<MapAnimationProps, 'sound' | 'delay'> & {
  onUpgrade: StateToStateLike;
  position: Vector;
  update: UpdateFunction;
}) {
  const { x, y } = getEntityPosition(position, tileSize, entitySize);
  return (
    <Animation
      delay={FastAnimationConfig.ExplosionStep}
      frames={frames}
      frameSize={layout.frameSize}
      onStep={useCallback(
        (step: number) => {
          if (onUpgrade && step === upgrade) {
            update(onUpgrade);
          }
        },
        [onUpgrade, update],
      )}
      position={new SpriteVector(x - layout.anchor.x, y - layout.anchor.y)}
      sound="Unit/Spawn"
      source={Sprites.Upgrade}
      {...props}
    />
  );
}
