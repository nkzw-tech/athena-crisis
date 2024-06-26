import { SizeVector } from '../MapData.tsx';

export const AnimationSpeed = 180;

export const AnimationConfig = {
  AnimationDuration: AnimationSpeed * 2,
  ExplosionStep: AnimationSpeed / 2,
  Instant: false,
  MessageSpeed: AnimationSpeed * 2,
  UnitAnimationStep: (AnimationSpeed * 2) / 3,
  UnitMoveDuration: AnimationSpeed as number,
} as const;

export type AnimationConfig = Omit<typeof AnimationConfig, 'Instant'> &
  Readonly<{ Instant: boolean }>;

export const FastAnimationConfig: AnimationConfig = {
  AnimationDuration: AnimationConfig.AnimationDuration / 4,
  ExplosionStep: AnimationConfig.ExplosionStep / 4,
  Instant: false,
  MessageSpeed: AnimationConfig.AnimationDuration / 2,
  UnitAnimationStep: AnimationConfig.UnitAnimationStep / 4,
  UnitMoveDuration: AnimationConfig.UnitMoveDuration / 2,
};

export const SlowAnimationConfig: AnimationConfig = {
  AnimationDuration: AnimationConfig.AnimationDuration * 4,
  ExplosionStep: AnimationConfig.ExplosionStep * 4,
  Instant: false,
  MessageSpeed: AnimationConfig.AnimationDuration * 2,
  UnitAnimationStep: AnimationConfig.UnitAnimationStep * 4,
  UnitMoveDuration: AnimationConfig.UnitMoveDuration * 4,
};

export const InstantAnimationConfig: AnimationConfig = {
  AnimationDuration: 0,
  ExplosionStep: 0,
  Instant: true,
  MessageSpeed: 0,
  UnitAnimationStep: 0,
  UnitMoveDuration: 0,
};

export const getDecoratorLimit = (size: SizeVector) =>
  (size.width * size.height * DecoratorsPerSide) / 2;

export const DecoratorsPerSide = 4;
export const TileSize = 24;
export const DoubleSize = TileSize * 2;
export const MaxHealth = 100;
export const MinDamage = 5;
export const HealAmount = 50;
export const BuildingCover = 10;
export const MinSize = 5;
export const MaxSize = 40;
export const MaxMessageLength = 512;
export const LeaderStatusEffect = 0.05;
export const CounterAttack = 0.75;
export const RaisedCounterAttack = 0.9;
export const CreateTracksCost = 50;
export const Charge = 1500;
export const MaxCharges = 10;
export const AllowedMisses = 2;
export const DefaultMapSkillSlots = 2;
