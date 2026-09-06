import { SoundName } from '@deities/athena/info/Music.tsx';
import { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Sprites } from 'athena-crisis:images';
import { CSSProperties, useCallback } from 'react';
import getEntityPosition from '../render/getEntityPosition.tsx';
import { StateToStateLike, UpdateFunction } from '../Types.tsx';
import Animation, { MapAnimationProps } from './Animation.tsx';
import generateFrames from './generateFrames.tsx';

export type ExplosionStyle = 'normal' | 'building' | 'land' | 'air' | 'naval' | 'naval-death';

const spriteSize = 72;
const frameCount = 20;
const frames = generateFrames(spriteSize, frameCount, 'vertical');

type ExplosionConfiguration = Readonly<{
  anchor: Readonly<{ x: number; y: number }>;
  cel: number;
  explode: number | null;
  frames: ReadonlyArray<CSSProperties>;
  sound: SoundName;
  source?: string;
  sprite?: SpriteVariant;
}>;

const animationStyle: Record<Exclude<ExplosionStyle, 'building'>, ExplosionConfiguration> = {
  air: {
    anchor: { x: 24, y: 33.6 },
    cel: 2,
    explode: 3,
    frames: frames.slice(0, 15),
    sound: 'Explosion/Air',
    source: Sprites.Explosion,
  },
  land: {
    anchor: { x: 24, y: 45.6 },
    cel: 1,
    explode: 3,
    frames: frames.slice(0, 16),
    sound: 'Explosion/Ground',
    source: Sprites.Explosion,
  },
  naval: {
    anchor: { x: 24, y: 44.4 },
    cel: 0,
    explode: 4,
    frames: frames.slice(0, 17),
    sound: 'Explosion/Naval',
    sprite: 'NavalExplosion',
  },
  'naval-death': {
    anchor: { x: 24, y: 44.4 },
    cel: 1,
    explode: null,
    frames,
    sound: 'Explosion/Naval',
    sprite: 'NavalExplosion',
  },
  normal: {
    anchor: { x: 24, y: 37.92 },
    cel: 0,
    explode: 10,
    frames,
    sound: 'Explosion/Building',
    source: Sprites.Explosion,
  },
};

export default function Explosion({
  biome,
  entitySize,
  onExplode,
  position,
  style,
  tileSize,
  update,
  ...props
}: Omit<MapAnimationProps, 'delay' | 'sound'> & {
  biome: Biome;
  delay: number;
  onExplode?: StateToStateLike;
  position: Vector;
  style: ExplosionStyle;
  update: UpdateFunction;
}) {
  const { anchor, cel, explode, frames, sound, source, sprite } =
    animationStyle[style === 'building' ? 'normal' : style];

  const { x, y } = getEntityPosition(position, tileSize, entitySize);

  return (
    <Animation
      cell={cel}
      frames={frames}
      frameSize={spriteSize}
      onStep={useCallback(
        (step: number) => {
          if (onExplode && step === explode) {
            update(onExplode);
          }
        },
        [explode, onExplode, update],
      )}
      position={new SpriteVector(x - anchor.x, y - anchor.y)}
      rumble="explosion"
      rumbleDuration={frames.length * 0.5 * props.delay}
      sound={sound}
      source={source}
      sprite={sprite}
      variant={biome}
      {...props}
    />
  );
}
