import { Weapons } from '@deities/athena/info/Unit.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import React, { useCallback } from 'react';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { AnimationProps } from './Animation.tsx';
import AttackAnimation from './AttackAnimation.tsx';
import generateFrames from './generateFrames.tsx';

const spriteSize = 48;
const frameCount = 18;
const frames = generateFrames(spriteSize, frameCount, 'vertical');

const maybeAnimation = Weapons.Flamethrower.hitAnimation;
const fireAnimation = Array.isArray(maybeAnimation)
  ? maybeAnimation[0]
  : maybeAnimation;

export default function DamageAnimation({
  animation,
  onDamage,
  position: { x, y },
  size,
  update,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  animation: 'fire' | 'power';
  delay: number;
  onDamage?: StateToStateLike;
  position: Vector;
  update: UpdateFunction;
}) {
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
        onStep={onStep}
        position={new SpriteVector(x, y)}
        size={size}
        sound={null}
        style={null}
        variant={0}
        {...props}
      />
    );
  }

  return (
    <Animation
      frames={frames}
      onStep={onStep}
      position={
        new SpriteVector(
          (x - 1) * size - (spriteSize - size) / 2,
          (y - 1.65) * size,
        )
      }
      size={spriteSize}
      sound="Unit/Spawn"
      source={Sprites.Damage}
      {...props}
    />
  );
}
