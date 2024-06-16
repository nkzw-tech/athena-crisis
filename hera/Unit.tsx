import { AttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import { MovementType } from '@deities/athena/info/MovementType.tsx';
import { isSea, TileInfo } from '@deities/athena/info/Tile.tsx';
import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import hasLowAmmoSupply from '@deities/athena/lib/hasLowAmmoSupply.tsx';
import isFuelConsumingUnit from '@deities/athena/lib/isFuelConsumingUnit.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  MaxHealth,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { ShadowImages, Sprites } from 'athena-crisis:images';
import { useEffect, useRef } from 'react';
import { AnimationDirection } from './animations/Animation.tsx';
import Label from './Label.tsx';
import getFlashDelay from './lib/getFlashDelay.tsx';
import getUnitDirection from './lib/getUnitDirection.tsx';
import sprite from './lib/sprite.tsx';
import {
  AttackAnimation,
  MoveAnimation,
  UnfoldAnimation,
  UnitAnimation,
  UnitExplosionAnimation,
  UnitHealAnimation,
} from './MapAnimations.tsx';
import Tick from './Tick.tsx';
import {
  GetLayerFunction,
  RequestFrameFunction,
  TimerFunction,
} from './Types.tsx';

enum ActionStyle {
  Capture = '-35px',
  Rescue = '-42px',
  Transport = '-28px',
}

enum FuelStyle {
  Low = '0px',
  None = '-7px',
}

enum AmmoStyle {
  Low = '-14px',
  None = '-21px',
}

const getFuelStyle = (unit: Unit) => {
  return unit.fuel === 0
    ? FuelStyle.None
    : unit.fuel <= unit.info.configuration.fuel * 0.25
      ? FuelStyle.Low
      : null;
};

const getAmmoStyle = (unit: Unit) => {
  const { ammo } = unit;
  if (ammo?.size) {
    if (ammo.size === 1) {
      const [weaponA, supplyA] = ammo.entries().next().value;
      return supplyA === 0
        ? AmmoStyle.None
        : hasLowAmmoSupply(unit, weaponA, supplyA)
          ? AmmoStyle.Low
          : null;
    } else if (ammo.size === 2) {
      const iterator = ammo.entries();
      const [weaponA, supplyA] = iterator.next().value;
      const [weaponB, supplyB] = iterator.next().value;
      return supplyA === 0 && supplyB === 0
        ? AmmoStyle.None
        : hasLowAmmoSupply(unit, weaponA, supplyA) ||
            hasLowAmmoSupply(unit, weaponB, supplyB)
          ? AmmoStyle.Low
          : null;
    }

    const ammoArray = [...ammo];
    if (ammoArray.every(([, s]) => s === 0)) {
      return AmmoStyle.None;
    } else if (
      ammoArray.some(([weapon, supply]) =>
        hasLowAmmoSupply(unit, weapon, supply),
      )
    ) {
      return AmmoStyle.Low;
    }
  }

  return null;
};

const Action = ({
  actionStyle,
  hide,
  unit,
}: {
  actionStyle: ActionStyle | null;
  hide: boolean;
  unit: Unit;
}) => {
  return unit.health && actionStyle ? (
    <div
      className={cx(absoluteStyle, iconStyle, hide && hideStyle, statusStyle)}
      style={{
        [vars.set('status-1')]: actionStyle,
      }}
    />
  ) : null;
};

const Status = ({
  actionStyle,
  ammoStyle,
  fuelStyle,
  hide,
  unit,
}: {
  actionStyle: ActionStyle | null;
  ammoStyle: AmmoStyle | null;
  fuelStyle: FuelStyle | null;
  hide: boolean;
  unit: Unit;
}) => {
  const hasOne = !!(fuelStyle || ammoStyle);
  return (
    <>
      <Action actionStyle={actionStyle} hide={hide} unit={unit} />
      {unit.health ? (
        <div
          className={cx(
            absoluteStyle,
            iconStyle,
            statusStyle,
            !hide && hasOne && blinkStyle,
            (hide || !hasOne) && hideStyle,
          )}
          style={{
            [vars.set('status-1')]: fuelStyle || ammoStyle,
            [vars.set('status-2')]: ammoStyle || fuelStyle,
          }}
        />
      ) : null}
    </>
  );
};

const Health = ({
  hasStatus,
  hide,
  unit: { health },
}: {
  hasStatus: boolean;
  hide: boolean;
  unit: Unit;
}) => {
  return health > 0 && health < MaxHealth ? (
    <div
      className={cx(
        absoluteStyle,
        healthStyle,
        hide && hideStyle,
        hasStatus && healthOffsetStyle,
      )}
      style={{
        [vars.set('health')]: health + '%',
        [vars.set('health-color')]:
          health < MaxHealth / 3
            ? '#e00'
            : health < (MaxHealth / 3) * 2
              ? '#ee0'
              : '#0e0',
      }}
    />
  ) : null;
};

const getSpritePosition = (
  unit: Unit,
  animation: UnitAnimation | undefined,
  tile: TileInfo,
) => {
  const isUnfolding =
    animation?.type === 'fold' || animation?.type === 'unfold';
  const { sprite } = unit.info;
  const vector =
    ((isUnfolding || animation?.type === 'unitExplosion') &&
      animation.position) ||
    (unit.isUnfolded() && sprite.unfold) ||
    (animation?.type === 'unitHeal' && sprite.healSprite?.position) ||
    (animation?.type === 'attack' && sprite.attackStance
      ? sprite.position.down(1)
      : null) ||
    (unit.isTransportingUnits() &&
      ((unit.transports.length > 1 && sprite.transportsMany) ||
        sprite.transports)) ||
    (sprite.alternative && !isSea(tile.id) && sprite.alternative) ||
    sprite.position;

  return sprite.leaderAlternative && !unit.isLeader() ? vector.down(6) : vector;
};

const getDirection = (
  attackDirection: AttackDirection,
  spriteDirection: 1 | -1,
) => {
  const { direction } = attackDirection;
  return direction === 'left' || direction === 'right'
    ? spriteDirection === -1
      ? 'horizontalAlternative'
      : 'horizontal'
    : direction;
};

const getAnimationStyle = (
  animation: UnitAnimation | undefined,
  spriteDirection: 1 | -1,
) => {
  if (
    (animation?.type === 'attack' || animation?.type === 'capture') &&
    animation.weapon.animation.recoil
  ) {
    return recoilAnimationStyle[
      getDirection(animation.direction, spriteDirection)
    ];
  } else if (animation?.type === 'attackUnitFlash') {
    return attackFlashStyle[getDirection(animation.direction, spriteDirection)];
  } else if (
    animation?.type === 'rescue' ||
    animation?.type === 'sabotage' ||
    animation?.type === 'heal'
  ) {
    return flashStyle;
  }
  return null;
};

const getDirectionOffset = (info: UnitInfo, direction?: AnimationDirection) =>
  direction
    ? (direction == 'down' ? 1 : direction == 'up' ? 2 : 0) *
      info.sprite.directionOffset
    : 0;

export default function UnitTile({
  absolute,
  animation,
  animationConfig,
  animationKey,
  biome,
  dim,
  direction,
  firstPlayerID,
  getLayer = () => 0,
  highlightStyle,
  maybeOutline,
  onAnimationComplete = () => void 0,
  outline,
  position = vec(1, 1),
  power,
  requestFrame,
  scheduleTimer,
  size,
  tile,
  unit,
}: {
  absolute?: boolean;
  animation?: UnitAnimation;
  animationConfig: AnimationConfig;
  animationKey?: Vector;
  biome: Biome;
  dim?: 'dim' | 'flip';
  direction?: AttackDirection;
  firstPlayerID: PlayerID;
  getLayer?: GetLayerFunction;
  highlightStyle?: 'move' | 'idle' | 'idle-null' | 'move-null' | undefined;
  maybeOutline?: boolean;
  onAnimationComplete?: (position: Vector, animation: UnitAnimation) => void;
  outline?: 'attack' | 'sabotage' | 'defense' | 'rescue' | undefined;
  position?: Vector;
  power?: boolean;
  requestFrame?: RequestFrameFunction;
  scheduleTimer?: TimerFunction;
  size: number;
  tile: TileInfo;
  unit: Unit;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const innerElementRef = useRef<HTMLDivElement>(null);
  const shadowElementRef = useRef<HTMLDivElement>(null);
  const { info, player } = unit;
  const isMoving = animation?.type === 'move';
  const isAttacking = animation?.type === 'attack';
  const hasAttackStance = isAttacking && info.sprite.attackStance;
  const isSpawning = animation?.type === 'spawn' && !animationConfig.Instant;
  const isAnimating =
    animation &&
    (hasAttackStance ||
      animation.type === 'fold' ||
      animation.type === 'unfold' ||
      animation.type === 'unitExplosion' ||
      animation.type === 'unitHeal');
  const spritePosition = getSpritePosition(unit, animation, tile);
  const spriteAnimationOffset =
    isMoving ||
    isAnimating ||
    ((highlightStyle === 'move' || highlightStyle === 'move-null') &&
      player > 0 &&
      unit.canMove() &&
      !unit.isUnfolded())
      ? 0
      : 1;

  const animationOffset =
    info.sprite.invert && !hasAttackStance
      ? (spriteAnimationOffset - 1) * -1 * idleOffset
      : spriteAnimationOffset * idleOffset;

  const animationIsLocked =
    player === 0 ||
    (isAnimating && (animation.locked || !isFuelConsumingUnit(unit, tile)));

  // The `hasAttackStance` piece here is a hack to ensure that React will
  // reset `backgroundPositionX` upon reconciliation after the animation
  // completes. This is necessary because the background position gets mutated
  // directly via the DOM, without React's knowledge. There is no other trigger
  // within this unit for the animation complete event.
  const backgroundPositionX = `calc(${hasAttackStance ? '1/1' : '1'} * ${
    animationIsLocked
      ? ''
      : `(${Tick.vars.apply('unit')} * ${-spriteSize}px) - `
  }${(spritePosition.x + animationOffset) * spriteSize}px)`;
  const backgroundPositionY = -(spritePosition.y * spriteSize) + 'px';
  const { x, y } = isMoving ? animation.from : position;
  const unitDirection =
    getUnitDirection(firstPlayerID, unit) === 'left' ? -1 : 1;
  const { direction: currentDirection = null } =
    (animation && 'direction' in animation && animation.direction) ||
    direction ||
    {};

  const actualUnitDirection = currentDirection
    ? info.sprite.direction * (currentDirection === 'left' ? 1 : -1)
    : unitDirection;
  const positionOffset =
    (isAnimating && animation?.offset) || info.sprite.offset || {};
  const zIndex = getLayer(
    position.y + (currentDirection === 'up' && unit.health > 0 ? 1 : 0),
    'unit',
  );
  const style = {
    [vars.set('direction')]: '' + actualUnitDirection,
    [vars.set('x')]: `${
      (x - 1) * size + (positionOffset.x || 0) * actualUnitDirection
    }px`,
    [vars.set('recoil-delay')]: `${
      animationConfig.ExplosionStep *
      (hasAttackStance &&
      animation.hasAttackStance &&
      animation.weapon.animation.recoil
        ? 8
        : isAttacking
          ? animation.weapon.animation.recoilDelay
          : 4)
    }ms`,
    [vars.set('y')]: `${(y - 1) * size + (positionOffset.y || 0)}px`,
    [vars.set('z-index')]: zIndex,
    height: size + 'px',
    width: size + 'px',
    // Do not cut unit off during recoil animation.
    // Also use the "reset" hack because zIndex is set imperatively.
    zIndex: `calc(${isMoving ? '1/1' : '1'} * ${zIndex})`,

    ...(isMoving && animation.pathVisibility?.length
      ? {
          opacity: animation.pathVisibility[0] ? '1' : '0',
        }
      : isSpawning
        ? { opacity: '0' }
        : null),
  };

  useEffect(() => {
    if (isAnimating) {
      if (!animationKey || !requestFrame || !scheduleTimer) {
        throw new Error(
          `Unit: 'animationKey', 'scheduleTimer' or 'requestFrame' props are missing for animation at position '${position}'.`,
        );
      }

      const animate = (
        animation:
          | UnfoldAnimation
          | UnitExplosionAnimation
          | AttackAnimation
          | UnitHealAnimation,
      ) => {
        const { frames } = animation;
        if (!frames) {
          return;
        }

        const complete = () => {
          if (!hasAttackStance) {
            requestFrame(() => onAnimationComplete(animationKey, animation));
          }
        };

        if (!elementRef.current || !innerElementRef.current) {
          complete();
          return;
        }

        const rate =
          AnimationConfig.AnimationDuration / animationConfig.AnimationDuration;
        if (animation.type === 'unitExplosion') {
          AudioPlayer.playSound('Explosion/Infantry', rate);
        } else if (animation.type === 'fold' || animation.type === 'unfold') {
          const sound = info.sprite.unfoldSounds?.[animation.type];
          if (sound) {
            AudioPlayer.playSound(sound, rate);
          }
        }

        const { style } = elementRef.current;
        const { style: unitStyle } = innerElementRef.current;
        const shadowStyle = shadowElementRef.current?.style;

        let start = 0;
        const offset = animation.type === 'fold' ? animation.frames - 1 : 0;
        const next = (timestamp: number) => {
          if (!start) {
            start = timestamp;
          }

          const totalProgress = timestamp - start;
          const animationStep =
            Math.round(totalProgress / animationConfig.UnitAnimationStep) %
            frames;
          const backgroundPositionX =
            -(
              info.sprite.position.x +
              animationOffset +
              Math.abs(offset - animationStep)
            ) *
              spriteSize +
            'px';
          unitStyle.backgroundPositionX = backgroundPositionX;
          if (shadowStyle) {
            shadowStyle.backgroundPositionX = backgroundPositionX;
          }

          if (animationStep < frames - 1) {
            requestFrame(next);
            return;
          }

          if (animation.locked) {
            const multiplier =
              animation.type === 'unitExplosion' &&
              animation.fade &&
              !animation.withExplosion
                ? 1.5
                : 0;
            const backgroundPositionX =
              -(
                info.sprite.position.x +
                animationOffset +
                Math.abs(offset - animationStep)
              ) *
                spriteSize +
              'px';
            unitStyle.backgroundPositionX = backgroundPositionX;
            if (shadowStyle) {
              shadowStyle.backgroundPositionX = backgroundPositionX;
            }
            style.setProperty(
              vars.set('transition-multiplier'),
              String(multiplier),
            );
            style.opacity = '0';
            scheduleTimer(
              complete,
              animationConfig.UnitMoveDuration * (multiplier + 1),
            );
          } else if (hasAttackStance) {
            if (hasAttackStance === 'short') {
              const backgroundPositionX = `calc((${Tick.vars.apply(
                'unit-attack-stance',
              )} * ${-spriteSize}px) - ${
                (spritePosition.x + animationOffset) * spriteSize
              }px)`;
              unitStyle.backgroundPositionX = backgroundPositionX;
              if (shadowStyle) {
                shadowStyle.backgroundPositionX = backgroundPositionX;
              }
            }
            // `complete` is called via the weapon animation callback, so it
            // does not need to be called here.
          } else {
            complete();
          }
        };

        const backgroundPositionX =
          -(info.sprite.position.x + animationOffset + offset) * spriteSize +
          'px';
        const backgroundPositionY =
          -(
            spritePosition.y +
            getDirectionOffset(
              info,
              animation.type === 'unitExplosion' || animation.type === 'attack'
                ? animation.direction?.direction
                : undefined,
            )
          ) *
            spriteSize +
          'px';
        unitStyle.backgroundPositionX = backgroundPositionX;
        unitStyle.backgroundPositionY = backgroundPositionY;
        if (shadowStyle) {
          shadowStyle.backgroundPositionX = backgroundPositionX;
          shadowStyle.backgroundPositionY = backgroundPositionY;
        }

        if (animation.locked) {
          scheduleTimer(
            () => requestFrame(next),
            animationConfig.UnitMoveDuration,
          );
        } else {
          requestFrame(next);
        }
      };

      animate(animation);
    }

    if (isMoving || (isSpawning && player > 0)) {
      if (!animationKey || !scheduleTimer || !requestFrame) {
        throw new Error(
          `Unit: 'animationKey', 'scheduleTimer' or 'requestFrame' props are missing for animation at position '${position}'.`,
        );
      }

      const move = (animation: MoveAnimation, complete: () => void) => {
        let { from: position, path, pathVisibility, tiles } = animation;
        if (!elementRef.current || !innerElementRef.current) {
          complete();
          return;
        }
        const { style } = elementRef.current;
        const { style: unitStyle } = innerElementRef.current;
        const shadowStyle = shadowElementRef.current?.style;
        const rate =
          AnimationConfig.AnimationDuration / animationConfig.AnimationDuration;
        const stepDuration =
          animationConfig.UnitMoveDuration * (info.sprite.slow ? 1.5 : 1);
        const third = stepDuration / 3;
        const quarter = stepDuration / 4;
        const pixelsPerStep = size / stepDuration;
        let currentSpritePosition = spritePosition;
        let first = true;
        let isVisible: boolean | null;
        let moveStart: number | null = null;
        let posX: number;
        let posY: number;
        let start: number | null = null;
        let tile: TileInfo;
        let previousTile: TileInfo;
        let previousType: MovementType;
        let to: Vector;
        let toX: number;
        let toY: number;

        const setDirection = () => {
          const direction = isSpawning ? 0 : toY > 0 ? 1 : toY < 0 ? 2 : 0;
          const backgroundPositionY =
            -(
              currentSpritePosition.y +
              direction * info.sprite.directionOffset
            ) *
              spriteSize +
            'px';
          unitStyle.backgroundPositionY = backgroundPositionY;
          if (shadowStyle) {
            shadowStyle.backgroundPositionY = backgroundPositionY;
          }
        };

        const step = (timestamp: number) => {
          if (!moveStart) {
            moveStart = timestamp;
          }
          if (!start) {
            start = timestamp;
          }

          const progress = Math.min(timestamp - start, stepDuration);
          style.setProperty(
            vars.set('x'),
            posX +
              (positionOffset.x || 0) +
              progress * pixelsPerStep * toX +
              'px',
          );
          style.setProperty(
            vars.set('y'),
            posY +
              (positionOffset.y || 0) +
              progress * pixelsPerStep * toY +
              'px',
          );
          if (progress > stepDuration / 2 && previousTile !== tile) {
            currentSpritePosition = getSpritePosition(unit, animation, tile);
            previousTile = tile;
            setDirection();
          }

          if (progress < stepDuration) {
            requestFrame(step);
          } else {
            next(timestamp);
          }
        };

        const playSound = () => {
          const { movementType } = info;
          const type =
            (movementType.alternative &&
              !isSea(tile.id) &&
              movementType.alternative) ||
            movementType;

          if (previousType && previousType.sound !== type.sound) {
            AudioPlayer.stop(previousType.sound, third);
          }

          previousType = type;

          if (first && animation.startSound) {
            AudioPlayer.playOrContinueSound(animation.startSound, rate);
          }

          // Only initiate a `playOrContinueSound` call if we won't immediately stop it.
          const endSound = animation.endSound || type.endSound;
          if (path.length || !endSound) {
            AudioPlayer.playOrContinueSound(type.sound, rate);
          }

          if (!path.length) {
            scheduleTimer(
              () => {
                AudioPlayer.stop(type.sound, third);
                if (endSound) {
                  AudioPlayer.playOrContinueSound(endSound, rate);
                }
              },
              endSound
                ? endSound === type.endSound && type.endDelay === 'quarter'
                  ? quarter
                  : 0
                : third * 2,
            );
          }
          first = false;
        };

        const next = (timestamp: number) => {
          if (to) {
            position = to;
          }

          to = path[0];
          tile = tiles[0];
          if (to) {
            path = path.slice(1);
            tiles = tiles.slice(1);
            start = null;
            posX = (position.x - 1) * size;
            posY = (position.y - 1) * size;
            toX = to.x - position.x;
            toY = to.y - position.y;
            setDirection();

            playSound();

            if (!isSpawning) {
              style.zIndex = String(getLayer(to.y, 'unit'));
              style.setProperty(
                vars.set('direction'),
                String(toX * -info.sprite.direction || 1),
              );
            }
            if (pathVisibility?.length) {
              // `pathVisibility` has one more item than `path`. The first item
              // is the "from" position, which we are skipping here but is relevant
              // for the initial style of the unit.
              pathVisibility = pathVisibility.slice(1);
              isVisible = pathVisibility[0];

              style.opacity = isVisible ? '1' : '0.5';
            }
            step(timestamp);
            return;
          }

          if (!animation.partial) {
            unitStyle.backgroundPositionY = backgroundPositionY;
            if (shadowStyle) {
              shadowStyle.backgroundPositionY = backgroundPositionY;
            }
            style.setProperty(vars.set('direction'), String(unitDirection));
          }

          if (pathVisibility?.length && !pathVisibility[0]) {
            style.opacity = '0';
            scheduleTimer(complete, animationConfig.UnitMoveDuration);
          } else {
            complete();
          }
        };

        requestFrame(next);
      };

      move(
        animation.type === 'spawn'
          ? {
              from: new SpriteVector(position.x, position.y + 1 / 12),
              // This will be handled through the <Spawn /> animation component.
              onComplete: () => null,
              partial: false,
              path: [position],
              pathVisibility: null,
              tiles: [tile],
              type: 'move',
            }
          : animation,
        () =>
          !isSpawning &&
          requestFrame(() => onAnimationComplete(animationKey, animation)),
      );
    }

    if (isSpawning && scheduleTimer) {
      scheduleTimer(() => {
        if (elementRef.current) {
          elementRef.current.style.opacity = '1';
        }
      }, animationConfig.ExplosionStep / 2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation]);

  const isCompleted = unit.isCompleted();
  const animationStyle =
    getAnimationStyle(animation, info.sprite.direction) ||
    (!isCompleted &&
      power &&
      (maybeOutline
        ? brightnessAnimationOutlineStyle
        : brightnessAnimationStyle));

  const highlightOutline =
    highlightStyle &&
    highlightStyle !== 'idle-null' &&
    highlightStyle !== 'move-null' &&
    !isAnimating &&
    !isMoving &&
    !animationStyle;
  const shadowImage = ShadowImages.get(info.sprite.name);
  const innerStyle = {
    backgroundPositionX,
    backgroundPositionY: currentDirection
      ? -(spritePosition.y + getDirectionOffset(info, currentDirection)) *
          spriteSize +
        'px'
      : backgroundPositionY,
    ...getFlashDelay(animation, animationConfig),
  };

  const hide = !!animation;
  const actionStyle = unit.isTransportingUnits()
    ? ActionStyle.Transport
    : unit.isCapturing()
      ? ActionStyle.Capture
      : unit.isBeingRescued()
        ? ActionStyle.Rescue
        : null;
  const fuelStyle = getFuelStyle(unit);
  const ammoStyle = getAmmoStyle(unit);

  return (
    <div
      className={cx(
        baseStyle,
        absolute ? absoluteStyle : relativeStyle,
        dim && dimStyle,
        dim === 'flip' && dimFlipStyle,
      )}
      ref={elementRef}
      style={style}
    >
      <Label entity={unit} hide={hide} />
      {shadowImage && (
        <div
          className={cx(spriteStyle, shadowStyle, animationStyle)}
          ref={shadowElementRef}
          style={{
            ...innerStyle,
            backgroundImage: `url(${shadowImage})`,
          }}
        />
      )}
      <div
        className={cx(
          sprite(info.sprite.name, player, biome),
          spriteStyle,
          baseUnitStyle,
          player === 0 && neutralStyle,
          (maybeOutline || highlightOutline) && maybeOutlineStyle,
          outline === 'attack' || outline === 'sabotage'
            ? biome === Biome.Volcano || biome === Biome.Luna
              ? alternateAttackOutlineStyle
              : attackOutlineStyle
            : outline === 'defense'
              ? defenseOutlineStyle
              : outline === 'rescue'
                ? rescuedOutlineStyle
                : null,
          highlightStyle && highlightStyle !== 'move-null' && brightStyle,
          isCompleted && completedStyle,
          isCompleted &&
            (player === 2 || player === 3 || player === 5 || player === 7) &&
            darkCompletedStyle,
          animationStyle,
        )}
        ref={innerElementRef}
        style={innerStyle}
      />
      <Status
        actionStyle={actionStyle}
        ammoStyle={ammoStyle}
        fuelStyle={fuelStyle}
        hide={hide}
        unit={unit}
      />
      <Health
        hasStatus={!!(ammoStyle || fuelStyle || actionStyle)}
        hide={hide}
        unit={unit}
      />
    </div>
  );
}

const vars = new CSSVariables<
  | 'brightness'
  | 'direction'
  | 'drop-shadow-color'
  | 'drop-shadow-size'
  | 'health-color'
  | 'health'
  | 'recoil-delay'
  | 'saturation'
  | 'status-1'
  | 'status-2'
  | 'transition-multiplier'
  | 'x'
  | 'y'
  | 'z-index'
>('u');

const spriteSize = 32;
const idleOffset = 8;
// Apply `translateZ(0)` to get GPU acceleration and ensure
// that `filter` works properly in Safari.
const scale = `translateZ(0) scale(${vars.apply('direction')}, 1)`;

const absoluteStyle = css`
  position: absolute;
`;

const relativeStyle = css`
  position: relative;
`;

const transition = `
  filter calc(${applyVar('animation-duration')} / 2 * ${vars.apply(
    'transition-multiplier',
  )})
    ease-in-out,
  opacity calc(${applyVar('unit-move-duration')} * ${vars.apply(
    'transition-multiplier',
  )}) ease-in-out;
`;

const baseStyle = css`
  ${vars.set('brightness', 1.1)}
  ${vars.set('drop-shadow-color', 'rgba(0, 0, 0, 0)')}
  ${vars.set('drop-shadow-size', '0.5px')}
  ${vars.set('recoil-delay', applyVar('animation-duration'))}
  ${vars.set('saturation', 1)}
  ${vars.set('transition-multiplier', 1)}
  ${vars.set('x', 0)}
  ${vars.set('y', 0)}

  pointer-events: none;
  transform: translate3d(${vars.apply('x')}, ${vars.apply('y')}, 0);
  transition: ${transition};
`;

const dimStyle = css`
  opacity: 0.5;
`;

const dimFlipStyle = css`
  animation: ${keyframes`
    0%, 100% {
      z-index: ${vars.apply('z-index')};
      opacity: 0.5;
    }
    50% {
      z-index: calc(${vars.apply('z-index')} + 1);
      opacity: 1;
    }
  `} 1.5s steps(1) infinite;
`;

const neutralStyle = css`
  ${vars.set('brightness', 1.05)}
`;

const spriteStyle = css`
  height: ${spriteSize}px;
  left: -4px;
  position: absolute;
  top: -8px;
  transform: ${scale};
  transition: ${transition};
  width: ${spriteSize}px;
`;

const baseUnitStyle = css`
  filter: brightness(${vars.apply('brightness')})
    saturate(${vars.apply('saturation')});
`;

const shadowStyle = css`
  opacity: 0.5;
`;

const maybeOutlineStyle = css`
  filter: brightness(${vars.apply('brightness')})
    saturate(${vars.apply('saturation')})
    drop-shadow(
      ${vars.apply('drop-shadow-size')} ${vars.apply('drop-shadow-size')} 0px
        ${vars.apply('drop-shadow-color')}
    )
    drop-shadow(
      calc(-1 * ${vars.apply('drop-shadow-size')})
        calc(-1 * ${vars.apply('drop-shadow-size')}) 0px
        ${vars.apply('drop-shadow-color')}
    )
    drop-shadow(
      calc(-1 * ${vars.apply('drop-shadow-size')})
        ${vars.apply('drop-shadow-size')} 0px ${vars.apply('drop-shadow-color')}
    )
    drop-shadow(
      ${vars.apply('drop-shadow-size')}
        calc(-1 * ${vars.apply('drop-shadow-size')}) 0px
        ${vars.apply('drop-shadow-color')}
    );
`;

const brightnessAnimationStyle = css`
  animation: ${keyframes`
    0%, 100% {
      filter: brightness(${vars.apply('brightness')})
       saturate(${vars.apply('saturation')});
    }
    50% {
      filter: brightness(calc(${vars.apply('brightness')} + 0.5))
        saturate(${vars.apply('saturation')});
    }
  `} 1.5s ease-in-out infinite;
`;

const brightnessAnimationOutlineStyle = css`
  animation: ${keyframes`
    0%, 100% {
      filter: brightness(${vars.apply('brightness')})
       saturate(${vars.apply('saturation')})
       drop-shadow(
          ${vars.apply('drop-shadow-size')} ${vars.apply('drop-shadow-size')} 0px
            ${vars.apply('drop-shadow-color')}
        )
        drop-shadow(
          calc(-1 * ${vars.apply('drop-shadow-size')})
            calc(-1 * ${vars.apply('drop-shadow-size')}) 0px
            ${vars.apply('drop-shadow-color')}
        )
        drop-shadow(
          calc(-1 * ${vars.apply('drop-shadow-size')})
            ${vars.apply('drop-shadow-size')} 0px ${vars.apply('drop-shadow-color')}
        )
        drop-shadow(
          ${vars.apply('drop-shadow-size')}
            calc(-1 * ${vars.apply('drop-shadow-size')}) 0px
            ${vars.apply('drop-shadow-color')}
        );
    }
    50% {
      filter: brightness(calc(${vars.apply('brightness')} + 0.5))
        saturate(${vars.apply('saturation')})
        drop-shadow(
          ${vars.apply('drop-shadow-size')} ${vars.apply('drop-shadow-size')} 0px
            ${vars.apply('drop-shadow-color')}
        )
        drop-shadow(
          calc(-1 * ${vars.apply('drop-shadow-size')})
            calc(-1 * ${vars.apply('drop-shadow-size')}) 0px
            ${vars.apply('drop-shadow-color')}
        )
        drop-shadow(
          calc(-1 * ${vars.apply('drop-shadow-size')})
            ${vars.apply('drop-shadow-size')} 0px ${vars.apply('drop-shadow-color')}
        )
        drop-shadow(
          ${vars.apply('drop-shadow-size')}
            calc(-1 * ${vars.apply('drop-shadow-size')}) 0px
            ${vars.apply('drop-shadow-color')}
        );
    }
  `} 1.5s ease-in-out infinite;
`;

const completedStyle = css`
  ${vars.set('saturation', 0.15)}
`;

const darkCompletedStyle = css`
  ${vars.set('brightness', 0.85)}
`;

const brightStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(255, 255, 255)')}
  ${vars.set('brightness', 1.4)}
`;

const attackOutlineStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(210, 18, 24)')}
`;
const alternateAttackOutlineStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(255, 215, 0)')}
`;
const defenseOutlineStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(24, 18, 210)')}
`;
const rescuedOutlineStyle = css`
  ${vars.set('drop-shadow-color', 'rgb(24, 210, 18)')}
`;

const healthStyle = css`
  ${pixelBorder('rgba(0, 0, 0, 0.75)', 1)}

  background-image: linear-gradient(
    to right,
    ${vars.apply('health-color')} 0%,
    ${vars.apply('health-color')} ${vars.apply('health')},
    rgba(0, 0, 0, 0) calc(${vars.apply('health')} + 1%)
  );
  bottom: 0px;
  height: 3px;
  left: 2px;
  opacity: 0.85;
  right: 2px;
  transition: opacity ${applyVar('animation-duration-70')} ease-in-out;
`;

const healthOffsetStyle = css`
  right: 9px;
`;

const iconStyle = css`
  background-image: url('${Sprites.UnitIcons}');
  background-position: 0 ${vars.apply('status-1')};
  height: 7px;
  opacity: 1;
  transition: opacity ${applyVar('animation-duration-70')} ease-in-out;
  width: 7px;
`;

const hideStyle = css`
  opacity: 0;
`;

const statusStyle = css`
  right: 0px;
  bottom: -1px;
`;

const blinkStyle = css`
  animation-duration: ${AnimationConfig.AnimationDuration * 8}ms;
  animation-iteration-count: infinite;
  animation-timing-function: steps(1);
  animation-name: ${keyframes`
    0%, 100% {
      opacity: 1;
      background-position-y: ${vars.apply('status-1')};
    }
    25%, 75% {
      opacity: 0;
    }
    50% {
      opacity: 1;
      background-position-y: ${vars.apply('status-2')};
    }
  `};
`;

const getRecoilAnimation = (keyframes: string) => css`
  animation-delay: ${vars.apply('recoil-delay')};
  animation-duration: ${applyVar('animation-duration-70')};
  animation-iteration-count: 1;
  animation-name: ${keyframes};
  animation-timing-function: ease-out;
`;

const recoilAnimationStyle = {
  down: getRecoilAnimation(keyframes`
    0%, 100% {
      transform: ${scale}  translate3d(0, 0, 0);
    }
    40%, 80% {
      transform: ${scale} translate3d(0, -2px, 0);
    }
  `),
  horizontal: getRecoilAnimation(keyframes`
    0%, 100% {
      transform: ${scale} translate3d(0, 0, 0);
    }
    40%, 80% {
      transform: ${scale} translate3d(2px, 0, 0);
    }
  `),
  horizontalAlternative: getRecoilAnimation(keyframes`
    0%, 100% {
      transform: ${scale} translate3d(0, 0, 0);
    }
    40%, 80% {
      transform: ${scale} translate3d(-2px, 0, 0);
    }
  `),
  up: getRecoilAnimation(keyframes`
    0%, 100% {
      transform: ${scale}  translate3d(0, 0, 0);
    }
    40%, 80% {
      transform: ${scale}  translate3d(0, 2px, 0);
    }
  `),
};

const getAttackFlashAnimation = (keyframes: string) => css`
  animation-delay: ${applyVar('animation-duration-70')};
  animation-duration: ${applyVar('animation-duration-30')};
  animation-iteration-count: 1;
  animation-name: ${keyframes};
  animation-timing-function: linear;
`;

const attackFlashStyle = {
  down: getAttackFlashAnimation(keyframes`
    0%, 100% {
      opacity: 1;
      transform: ${scale} translate3d(0, 0, 0);
    }
    20%, 90% {
      ${vars.set('saturation', 0.5)}
      opacity: 0.3;
      transform: ${scale} translate3d(0, -3px, 0);
    }
  `),
  horizontal: getAttackFlashAnimation(keyframes`
    0%, 100% {
      opacity: 1;
      transform: ${scale} translate3d(0, 0, 0);
    }
    20%, 90% {
      ${vars.set('saturation', 0.5)}
      opacity: 0.3;
      transform: ${scale} translate3d(3px, 0, 0);
    }
  `),
  horizontalAlternative: getAttackFlashAnimation(keyframes`
    0%, 100% {
        opacity: 1;
        transform: ${scale} translate3d(0, 0, 0);
      }
      20%, 90% {
        ${vars.set('saturation', 0.5)}
        opacity: 0.3;
        transform: ${scale} translate3d(-3px, 0, 0);
    }
  `),
  up: getAttackFlashAnimation(keyframes`
    0%, 100% {
      opacity: 1;
      transform: ${scale} translate3d(0, 0, 0);
    }
    20%, 90% {
      ${vars.set('saturation', 0.5)}
      opacity: 0.3;
      transform: ${scale} translate3d(0, 3px, 0);
    }
  `),
};

const flashStyle = getAttackFlashAnimation(keyframes`
  0%, 100% {
    opacity: 1;
  }
  20%, 90% {
    ${vars.set('saturation', 0.5)}
    opacity: 0.3;
  }
`);
