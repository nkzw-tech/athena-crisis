import { Weapons } from '@deities/athena/info/Unit.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import React, { useCallback } from 'react';
import getEntityPosition from '../render/getEntityPosition.tsx';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { MapAnimationProps } from './Animation.tsx';
import AttackAnimation from './AttackAnimation.tsx';
import generateFrames from './generateFrames.tsx';

const layout = { anchor: { x: 12, y: 15.6 }, frameSize: 48 } as const;
const frameCount = 18;
const frames = generateFrames(layout.frameSize, frameCount, 'vertical');

const maybeAnimation = Weapons.Flamethrower.hitAnimation;
const fireAnimation = Array.isArray(maybeAnimation) ? maybeAnimation[0] : maybeAnimation;

export default function DamageAnimation({
  animation,
  entitySize,
  onDamage,
  position,
  tileSize,
  update,
  ...props
}: Omit<MapAnimationProps, 'sound'> & {
  animation: 'fire' | 'power';
  delay: number;
  onDamage?: StateToStateLike;
  position: Vector;
  update: UpdateFunction;
}) {
  const { x, y } = getEntityPosition(position, tileSize, entitySize);
  const onStep = useCallback(
    (step: number) => {
      if (onDamage && step === 5) {
        update(onDamage);
      }
    },
    [onDamage, update],
  );

  if (fireAnimation && animation === 'fire') {
    return (
      <AttackAnimation
        animation={fireAnimation}
        direction="left"
        entitySize={entitySize}
        onStep={onStep}
        position={position}
        sound={null}
        style={null}
        tileSize={tileSize}
        variant={0}
        {...props}
      />
    );
  }

  return (
    <Animation
      frames={frames}
      frameSize={layout.frameSize}
      onStep={onStep}
      position={new SpriteVector(x - layout.anchor.x, y - layout.anchor.y)}
      sound="Unit/Spawn"
      source={Sprites.Damage}
      {...props}
    />
  );
}
