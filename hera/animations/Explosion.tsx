import { SoundName } from '@deities/athena/info/Music.tsx';
import { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import React, { CSSProperties, useCallback } from 'react';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { AnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

export type ExplosionStyle =
  | 'normal'
  | 'building'
  | 'land'
  | 'air'
  | 'naval'
  | 'naval-death';

const spriteSize = 72;
const frameCount = 20;
const frames = generateFrames(spriteSize, frameCount, 'vertical');

type ExplosionConfiguration = Readonly<{
  cel: number;
  explode: number | null;
  frames: ReadonlyArray<CSSProperties>;
  offset: number;
  sound: SoundName;
  source?: string;
  sprite?: SpriteVariant;
}>;

const animationStyle: Record<
  Exclude<ExplosionStyle, 'building'>,
  ExplosionConfiguration
> = {
  air: {
    cel: 2,
    explode: 3,
    frames: frames.slice(0, 15),
    offset: 2.4,
    sound: 'Explosion/Air',
    source: Sprites.Explosion,
  },
  land: {
    cel: 1,
    explode: 3,
    frames: frames.slice(0, 16),
    offset: 2.9,
    sound: 'Explosion/Ground',
    source: Sprites.Explosion,
  },
  naval: {
    cel: 0,
    explode: 4,
    frames: frames.slice(0, 17),
    offset: 2.85,
    sound: 'Explosion/Naval',
    sprite: 'NavalExplosion',
  },
  'naval-death': {
    cel: 1,
    explode: null,
    frames,
    offset: 2.85,
    sound: 'Explosion/Naval',
    sprite: 'NavalExplosion',
  },
  normal: {
    cel: 0,
    explode: 10,
    frames,
    offset: 2.58,
    sound: 'Explosion/Building',
    source: Sprites.Explosion,
  },
};

export default function Explosion({
  biome,
  onExplode,
  position: { x, y },
  size,
  style,
  update,
  ...props
}: Omit<AnimationProps, 'delay' | 'sound'> & {
  biome: Biome;
  delay: number;
  onExplode?: StateToStateLike;
  position: Vector;
  style: ExplosionStyle;
  update: UpdateFunction;
}) {
  const { cel, explode, frames, offset, sound, source, sprite } =
    animationStyle[style === 'building' ? 'normal' : style];

  return (
    <Animation
      cell={cel}
      frames={frames}
      onStep={useCallback(
        (step: number) => {
          if (onExplode && step === explode) {
            update(onExplode);
          }
        },
        [explode, onExplode, update],
      )}
      position={
        new SpriteVector(
          (x - 1) * size - (spriteSize - size) / 2,
          (y - offset) * size,
        )
      }
      rumble="explosion"
      rumbleDuration={frames.length * 0.5 * props.delay}
      size={spriteSize}
      sound={sound}
      source={source}
      sprite={sprite}
      variant={biome}
      {...props}
    />
  );
}
