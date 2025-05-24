import { AttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import { SoundName } from '@deities/athena/info/Music.tsx';
import { TileInfo } from '@deities/athena/info/Tile.tsx';
import { UnitAnimationSprite, Weapon } from '@deities/athena/info/Unit.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  InstantAnimationConfig,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { BaseColor } from '@deities/ui/getColor.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import ImmutableMap from '@nkzw/immutable-map';
import { AnimatePresence } from 'framer-motion';
import {
  ComponentType,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AttackAnimation from './animations/AttackAnimation.tsx';
import BuildingCreate from './animations/BuildingCreate.tsx';
import CrystalAnimation from './animations/CrystalAnimation.tsx';
import DamageAnimation from './animations/DamageAnimation.tsx';
import Explosion, { ExplosionStyle } from './animations/Explosion.tsx';
import Fireworks from './animations/Fireworks.tsx';
import Heal from './animations/Heal.tsx';
import HealthAnimation from './animations/HealthAnimation.tsx';
import Rescue from './animations/Rescue.tsx';
import Sabotage from './animations/Sabotage.tsx';
import Shake from './animations/Shake.tsx';
import Spawn from './animations/Spawn.tsx';
import UpgradeAnimation from './animations/UpgradeAnimation.tsx';
import {
  Actions,
  ClearTimerFunction,
  GetLayerFunction,
  PlayerDetails,
  State,
  StateToStateLike,
  TimerFunction,
} from './Types.tsx';
import Banner from './ui/Banner.tsx';
import CharacterMessage from './ui/CharacterMessage.tsx';
import FlashFlyout from './ui/FlashFlyout.tsx';
import { FlyoutColor, FlyoutItem } from './ui/Flyout.tsx';
import Message from './ui/Message.tsx';
import Notice from './ui/Notice.tsx';

type UnitDirection = 'left' | 'right';

export type BaseAnimationProps = Readonly<{
  animationConfig: AnimationConfig;
  clearTimer: ClearTimerFunction;
  onComplete: () => void;
  rate: number;
  scheduleTimer: TimerFunction;
  zIndex: number;
}>;

export type ExplosionAnimation = Readonly<{
  direction?: AttackDirection;
  onComplete: StateToStateLike;
  onExplode?: StateToStateLike;
  position?: Vector;
  style: ExplosionStyle;
  type: 'explosion';
}>;

export type SpawnAnimation = Readonly<{
  locked: false;
  onComplete: StateToStateLike;
  onSpawn?: StateToStateLike;
  speed: 'fast' | 'slow';
  type: 'spawn' | 'despawn';
  unitDirection: UnitDirection;
  variant: PlayerID;
}>;

export type CreateBuildingAnimation = Readonly<{
  onComplete: StateToStateLike;
  onCreate?: StateToStateLike;
  type: 'createBuilding';
  variant: PlayerID;
}>;

export type HealAnimation = Readonly<{
  onComplete: StateToStateLike;
  type: 'heal';
  unitDirection: UnitDirection;
}>;

type RescueAnimation = Readonly<{
  onComplete: StateToStateLike;
  onRescue?: StateToStateLike;
  type: 'rescue';
  unitDirection: UnitDirection;
  variant: PlayerID;
}>;

type SabotageAnimation = Readonly<{
  onComplete: StateToStateLike;
  type: 'sabotage';
  unitDirection: UnitDirection;
}>;

export type FireworksAnimation = Readonly<{
  onComplete: StateToStateLike;
  type: 'fireworks';
}>;

export type UpgradeAnimation = Readonly<{
  onComplete: StateToStateLike;
  onUpgrade: StateToStateLike;
  type: 'upgrade';
}>;

export type DamageAnimation = Readonly<{
  animation: 'fire' | 'power';
  onComplete: StateToStateLike;
  onDamage?: StateToStateLike;
  type: 'damage';
}>;

export type ShakeAnimation = Readonly<{
  type: 'shake';
}>;

export type ScrollIntoView = Readonly<{
  onComplete: StateToStateLike;
  positions: ReadonlyArray<Vector>;
  type: 'scrollIntoView';
}>;

export type HealthAnimation = Readonly<{
  change: number;
  position: Vector;
  previousHealth: number;
  type: 'health';
}>;

export type MoveAnimation = Readonly<{
  endSound?: SoundName;
  from: Vector;
  onComplete: StateToStateLike;
  partial: boolean;
  path: ReadonlyArray<Vector>;
  pathVisibility: ReadonlyArray<boolean> | null;
  startSound?: SoundName;
  tiles: ReadonlyArray<TileInfo>;
  type: 'move';
}>;

export type AttackAnimation = Readonly<{
  direction: AttackDirection;
  frames?: 8 | 16;
  hasAttackStance: boolean;
  locked?: undefined;
  offset?: undefined;
  onComplete: StateToStateLike;
  style: 'unfold' | null;
  type: 'attack';
  variant: PlayerID;
  weapon: Weapon;
}>;

export type UnitExplosionAnimation = UnitAnimationSprite &
  Readonly<{
    direction?: AttackDirection;
    locked: boolean;
    onComplete: StateToStateLike;
    type: 'unitExplosion';
    withExplosion?: boolean;
  }>;

export type UnfoldAnimation = UnitAnimationSprite &
  Readonly<{
    locked?: undefined;
    onComplete: StateToStateLike;
    type: 'fold' | 'unfold';
  }>;

export type UnitHealAnimation = UnitAnimationSprite &
  Readonly<{
    locked?: undefined;
    type: 'unitHeal';
  }>;

type _FlashAnimation = Readonly<{
  direction: AttackDirection;
  hasAttackStance: boolean;
  variant: PlayerID;
  weapon?: Weapon;
}>;

export type AttackUnitFlashAnimation = _FlashAnimation &
  Readonly<{
    type: 'attackUnitFlash';
  }>;

export type AttackBuildingFlashAnimation = _FlashAnimation &
  Readonly<{
    type: 'attackBuildingFlash';
  }>;

export type CaptureAnimation = Readonly<{
  direction: AttackDirection;
  onComplete: StateToStateLike;
  type: 'capture';
  variant: 0;
  weapon: Weapon;
}>;

export type FlashAnimation = Readonly<{
  children: ReactNode;
  color: FlyoutColor;
  onComplete: StateToStateLike;
  position: Vector;
  sound?: SoundName;
  type: 'flash';
}>;

export type BannerAnimation = Readonly<{
  color?: BaseColor | ReadonlyArray<BaseColor>;
  component?: ComponentType<{ duration: number; isVisible: boolean }>;
  direction?: 'up';
  length: 'short' | 'medium' | 'long';
  onComplete?: StateToStateLike;
  padding?: 'small';
  player: PlayerID;
  sound: SoundName | null;
  style?: 'regular' | 'flashy';
  text: string;
  type: 'banner';
}>;

export type CharacterMessageAnimation = Readonly<{
  map: MapData;
  onComplete?: StateToStateLike;
  player: PlayerID;
  position?: 'top' | 'bottom';
  silhouette: boolean;
  text: string;
  type: 'characterMessage';
  unitId: number;
  variant?: number;
  viewer?: PlayerID;
}>;

export type MessageAnimation = Readonly<{
  color?: BaseColor | ReadonlyArray<BaseColor>;
  onComplete?: StateToStateLike;
  position?: 'top' | 'bottom';
  text: string;
  type: 'message';
}>;

export type NoticeAnimation = Readonly<{
  color?: BaseColor;
  onComplete?: StateToStateLike;
  text: string;
  type: 'notice';
}>;

export type CrystalAnimation = Readonly<{
  crystal: Crystal;
  onComplete?: StateToStateLike;
  onConvert: StateToStateLike;
  type: 'crystal';
}>;

export type UnitAnimation =
  | AttackAnimation
  | AttackUnitFlashAnimation
  | CaptureAnimation
  | HealAnimation
  | MoveAnimation
  | RescueAnimation
  | SabotageAnimation
  | SpawnAnimation
  | UnfoldAnimation
  | UnitExplosionAnimation
  | UnitHealAnimation;

export type BuildingAnimation =
  | AttackBuildingFlashAnimation
  | CreateBuildingAnimation
  | CaptureAnimation;

export type Animation = { completed?: boolean } & (
  | BannerAnimation
  | BuildingAnimation
  | BuildingAnimation
  | CharacterMessageAnimation
  | CrystalAnimation
  | DamageAnimation
  | ExplosionAnimation
  | FireworksAnimation
  | FlashAnimation
  | HealthAnimation
  | MessageAnimation
  | NoticeAnimation
  | ScrollIntoView
  | ShakeAnimation
  | UnitAnimation
  | UpgradeAnimation
);

export type Animations = ImmutableMap<Vector, Animation>;

const withTransition = new Set([
  'flash',
  'damage',
  'banner',
  'notice',
  'characterMessage',
  'message',
]);

const unitAnimations = new Set([
  'attack',
  'attackUnitFlash',
  'capture',
  'damage',
  'despawn',
  'fold',
  'heal',
  'move',
  'rescue',
  'sabotage',
  'spawn',
  'unfold',
  'unitExplosion',
  'unitHeal',
]);

export function isUnitAnimation(
  animation?: Animation,
): animation is UnitAnimation {
  return !!(animation && unitAnimations.has(animation.type));
}
export function isBuildingAnimation(
  animation?: Animation,
): animation is BuildingAnimation {
  return !!(
    animation &&
    (animation.type === 'createBuilding' ||
      animation.type === 'attackBuildingFlash' ||
      animation.type === 'capture')
  );
}

export function hasNotableAnimation(animations: Animations) {
  return animations.some(
    (animation) =>
      animation.type !== 'move' &&
      (isBuildingAnimation(animation) || isUnitAnimation(animation)),
  );
}

export function hasCharacterMessage(animations: Animations) {
  return animations.some((animation) => animation.type === 'characterMessage');
}

const ScrollIntoViewEffect = ({
  onComplete,
  positions,
  scrollIntoView,
  update,
}: {
  onComplete: StateToStateLike;
  positions: ReadonlyArray<Vector>;
  scrollIntoView: Actions['scrollIntoView'];
  update: Actions['update'];
}) => {
  useEffect(() => {
    scrollIntoView(positions).then(async () =>
      update(onComplete(await update(null))),
    );
  }, [onComplete, positions, scrollIntoView, update]);

  return null;
};

const MapAnimation = ({
  actions: { clearTimer, requestFrame, scheduleTimer, scrollIntoView, update },
  animation,
  animationComplete,
  animationConfig: initialAnimationConfig,
  biome,
  getLayer,
  playerDetails: initialPlayerDetails,
  position,
  scale,
  skipBanners,
  tileSize,
  width,
  zIndex,
}: {
  actions: Actions;
  animation: Animation;
  animationComplete: (position: Vector, animation: Animation) => void;
  animationConfig: AnimationConfig;
  biome: Biome;
  getLayer: GetLayerFunction;
  playerDetails: PlayerDetails;
  position: Vector;
  scale: number;
  skipBanners?: boolean;
  tileSize: number;
  width: number;
  zIndex: number;
}) => {
  const { completed } = animation;
  const [animationConfig] = useState(initialAnimationConfig);

  // `playerDetails` should never change during an animation.
  const [playerDetails] = useState(initialPlayerDetails);
  const onComplete = useCallback(
    () => animationComplete(position, animation),
    [animation, animationComplete, position],
  );

  return useMemo(() => {
    const props = {
      animationConfig,
      clearTimer,
      onComplete,
      rate:
        AnimationConfig.AnimationDuration / animationConfig.AnimationDuration,
      scheduleTimer,
      zIndex,
    };

    const { type } = animation;

    if (completed) {
      return null;
    }

    switch (type) {
      case 'explosion':
        return (
          <Explosion
            biome={biome}
            delay={animationConfig.ExplosionStep}
            onExplode={animation.onExplode}
            position={animation.position || position}
            requestFrame={requestFrame}
            size={tileSize}
            style={animation.style}
            update={update}
            {...props}
            zIndex={getLayer((animation.position || position).y, 'animation')}
          />
        );
      case 'despawn':
      case 'spawn':
        return (
          <Spawn
            delay={
              animationConfig.ExplosionStep /
              (animation.speed === 'fast' ? 2 : 1)
            }
            onSpawn={animation.onSpawn}
            position={position}
            requestFrame={requestFrame}
            size={tileSize}
            type={animation.type}
            unitDirection={animation.unitDirection}
            update={update}
            variant={animation.variant}
            {...props}
          />
        );
      case 'shake':
        return <Shake {...props} />;
      case 'createBuilding':
        return (
          <BuildingCreate
            delay={animationConfig.ExplosionStep}
            onCreate={animation.onCreate}
            position={position}
            requestFrame={requestFrame}
            size={tileSize}
            update={update}
            variant={animation.variant}
            {...props}
          />
        );
      case 'fireworks':
        return (
          <Fireworks
            delay={animationConfig.ExplosionStep}
            position={position}
            requestFrame={requestFrame}
            size={tileSize}
            {...props}
          />
        );
      case 'damage':
        return (
          <DamageAnimation
            delay={animationConfig.ExplosionStep}
            position={position}
            requestFrame={requestFrame}
            size={tileSize}
            update={update}
            {...animation}
            {...props}
          />
        );
      case 'upgrade':
        return (
          <UpgradeAnimation
            position={position}
            requestFrame={requestFrame}
            size={tileSize}
            update={update}
            {...animation}
            {...props}
          />
        );
      case 'heal':
        return (
          <Heal
            delay={animationConfig.ExplosionStep}
            position={position}
            requestFrame={requestFrame}
            size={tileSize}
            unitDirection={animation.unitDirection}
            {...props}
            zIndex={getLayer(position.y, 'animation')}
          />
        );
      case 'rescue':
        return (
          <Rescue
            delay={animationConfig.ExplosionStep}
            onRescue={animation.onRescue}
            position={position}
            requestFrame={requestFrame}
            size={tileSize}
            unitDirection={animation.unitDirection}
            update={update}
            variant={animation.variant}
            {...props}
            zIndex={getLayer(position.y, 'animation')}
          />
        );
      case 'sabotage':
        return (
          <Sabotage
            delay={animationConfig.ExplosionStep}
            position={position}
            requestFrame={requestFrame}
            size={tileSize}
            unitDirection={animation.unitDirection}
            {...props}
            zIndex={getLayer(position.y, 'animation')}
          />
        );
      case 'capture':
      case 'attackUnitFlash':
      case 'attackBuildingFlash':
      case 'attack': {
        const isFlash =
          animation.type === 'attackUnitFlash' ||
          animation.type === 'attackBuildingFlash';
        const initialDelay =
          (type === 'attack' || isFlash) && animation.hasAttackStance
            ? animationConfig.UnitAnimationStep * 4
            : undefined;
        const style = (animation.type === 'attack' && animation.style) || null;
        const maybeAnimation = isFlash
          ? animation.weapon?.hitAnimation
          : animation.weapon?.animation;
        const weaponAnimation = Array.isArray(maybeAnimation)
          ? maybeAnimation[
              animation.direction.direction === 'down'
                ? 2
                : animation.direction.direction === 'up'
                  ? 1
                  : 0
            ]
          : maybeAnimation;

        if (weaponAnimation) {
          const direction = animation.direction.direction;
          const isVertical = direction === 'up' || direction === 'down';
          const positions =
            (style === 'unfold' && weaponAnimation.unfoldPositions) ||
            weaponAnimation.positions;
          return (
            <>
              {weaponAnimation.mirror && (
                <AttackAnimation
                  animation={weaponAnimation}
                  delay={animationConfig.ExplosionStep}
                  direction={
                    isFlash &&
                    isVertical &&
                    !Array.isArray(maybeAnimation) &&
                    !positions?.[direction]
                      ? 'right'
                      : direction
                  }
                  initialDelay={initialDelay}
                  mirror
                  position={position}
                  requestFrame={requestFrame}
                  size={tileSize}
                  sound={null}
                  style={style}
                  variant={animation.variant}
                  {...props}
                  onComplete={undefined}
                />
              )}
              <AttackAnimation
                animation={weaponAnimation}
                delay={animationConfig.ExplosionStep}
                direction={
                  isFlash && isVertical && !positions?.[direction]
                    ? 'left'
                    : direction
                }
                initialDelay={initialDelay}
                position={position}
                requestFrame={requestFrame}
                size={tileSize}
                sound={weaponAnimation.sound}
                style={style}
                variant={animation.variant}
                {...props}
                onComplete={isFlash ? undefined : props.onComplete}
              />
            </>
          );
        }
        return null;
      }
      case 'flash':
        return (
          <FlashFlyout
            items={
              <FlyoutItem color={animation.color}>
                {animation.children}
              </FlyoutItem>
            }
            // Use the position in the map for the key, but use the position
            // on the object for actual location. This allows to duplicate
            // multiple flyouts in the same place. See addFlashAnimation.
            position={animation.position}
            sound={animation.sound}
            tileSize={tileSize}
            width={width}
            {...props}
            animationConfig={AnimationConfig}
          />
        );
      case 'health':
        return (
          <HealthAnimation tileSize={tileSize} {...animation} {...props} />
        );
      case 'banner':
        return (
          <Banner
            {...animation}
            {...props}
            animationConfig={
              skipBanners ? InstantAnimationConfig : animationConfig
            }
          />
        );
      case 'notice':
        return (
          <Notice color={animation.color} text={animation.text} {...props} />
        );
      case 'crystal':
        return (
          <CrystalAnimation
            {...animation}
            {...props}
            scale={scale}
            update={update}
          />
        );
      case 'characterMessage': {
        return (
          <CharacterMessage
            playerDetails={playerDetails}
            {...animation}
            {...props}
          />
        );
      }
      case 'message': {
        return <Message {...animation} color={animation.color} {...props} />;
      }
      case 'scrollIntoView': {
        return (
          <ScrollIntoViewEffect
            scrollIntoView={scrollIntoView}
            update={update}
            {...animation}
          />
        );
      }
      // Handled directly within Buildings/Units.
      case 'fold':
      case 'move':
      case 'unfold':
      case 'unitExplosion':
      case 'unitHeal':
        return null;
      default: {
        animation satisfies never;
        throw new UnknownTypeError('MapAnimation', type);
      }
    }
  }, [
    animation,
    animationConfig,
    biome,
    clearTimer,
    completed,
    getLayer,
    onComplete,
    playerDetails,
    position,
    requestFrame,
    scale,
    scheduleTimer,
    scrollIntoView,
    skipBanners,
    tileSize,
    update,
    width,
    zIndex,
  ]);
};

export function MapAnimations({
  actions,
  animationComplete,
  getLayer,
  scale,
  skipBanners,
  state: {
    animationConfig,
    animations,
    map: {
      config: { biome },
      size: { width },
    },
    playerDetails,
    tileSize,
    zIndex,
  },
}: {
  actions: Actions;
  animationComplete: (position: Vector, animation: Animation) => void;
  getLayer: GetLayerFunction;
  scale: number;
  skipBanners?: boolean;
  state: State;
}) {
  const animationsWithTransitions: Array<ReactElement> = [];
  const mainAnimations: Array<ReactElement> = [];
  animations.forEach((animation, position) => {
    const { type } = animation;
    if (
      type === 'fold' ||
      type === 'move' ||
      type === 'unfold' ||
      type === 'unitExplosion'
    ) {
      return;
    }

    (withTransition.has(type)
      ? animationsWithTransitions
      : mainAnimations
    ).push(
      <MapAnimation
        actions={actions}
        animation={animation}
        animationComplete={animationComplete}
        animationConfig={animationConfig}
        biome={biome}
        getLayer={getLayer}
        key={String(position)}
        playerDetails={playerDetails}
        position={position}
        scale={scale}
        skipBanners={skipBanners}
        tileSize={tileSize}
        width={width}
        zIndex={zIndex}
      />,
    );
  });
  return (
    <>
      {mainAnimations}
      <AnimatePresence>{animationsWithTransitions}</AnimatePresence>
    </>
  );
}
