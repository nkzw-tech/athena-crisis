import { Weapons } from '@deities/athena/info/Unit.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import React from 'react';
import { UpdateFunction } from '../Types.tsx';
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
  position: { x, y },
  size,
  update,
  ...props
}: Omit<AnimationProps, 'sound'> & {
  animation: 'fire' | 'power';
  delay: number;
  position: Vector;
  update: UpdateFunction;
}) {
  if (fireAnimation && animation === 'fire') {
    return (
      <AttackAnimation
        animation={fireAnimation}
        direction="left"
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
