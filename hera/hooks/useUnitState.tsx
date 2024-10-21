import { AttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Ability, UnitAnimationSprite } from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import randomEntry from '@deities/hephaestus/randomEntry.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { ComponentProps, useEffect, useMemo, useState } from 'react';
import getAnyUnitTile from '../lib/getAnyUnitTile.tsx';
import UnitTile from '../Unit.tsx';

const defaultVector = vec(1, 1);
const onComplete = () => null;

type UnitBehavior = 'idle' | 'move' | 'attack' | 'unfold' | 'fold' | 'heal';
type UnitState = Pick<
  ComponentProps<typeof UnitTile>,
  'animation' | 'direction' | 'highlightStyle'
> &
  Readonly<{ type: UnitBehavior }>;

const fallbackDirection = new AttackDirection('right');
const directions = [
  new AttackDirection('up'),
  new AttackDirection('down'),
  new AttackDirection('left'),
  fallbackDirection,
];

const idle = (unitState: UnitState) => {
  const animation = unitState.animation;
  return {
    direction:
      unitState.direction ||
      (animation && 'direction' in animation && animation.direction) ||
      fallbackDirection,
    type: 'idle',
  } as const;
};

const attack = (unitState: UnitState, unit: Unit) => {
  const { info, player } = unit;
  const { attackStance } = info.sprite;
  return {
    animation: {
      direction: unitState.direction || fallbackDirection,
      frames: attackStance ? (attackStance === 'long' ? 16 : 8) : undefined,
      hasAttackStance: !!attackStance,
      onComplete,
      style: unit.isUnfolded() ? 'unfold' : null,
      type: 'attack',
      variant: player,
      weapon: info.attack.weapons!.values().next().value!,
    },
    type: 'attack',
  } as const;
};

const heal = (unitState: UnitState, sprite: UnitAnimationSprite) =>
  ({
    animation: {
      ...sprite,
      type: 'unitHeal',
    },
    direction: unitState.direction || fallbackDirection,
    type: 'heal',
  }) as const;

const fold = (
  type: 'unfold' | 'fold',
  unitState: UnitState,
  unfoldSprite: UnitAnimationSprite,
) =>
  ({
    animation: {
      ...unfoldSprite,
      onComplete,
      type: 'unfold',
    },
    direction: unitState.direction || fallbackDirection,
    type,
  }) as const;

const getNextUnitState = (unitState: UnitState, unit: Unit): UnitState => {
  const { info } = unit;
  const { sprite } = info;
  const stateType = unitState.type;
  switch (stateType) {
    case 'idle':
      return {
        direction: randomEntry(directions),
        highlightStyle: 'move-null',
        type: 'move',
      };
    case 'move': {
      if (info.hasAttack()) {
        if (info.hasAbility(Ability.Unfold) && sprite.unfoldSprite) {
          return fold('unfold', unitState, sprite.unfoldSprite);
        }
        return attack(unitState, unit);
      }
      return idle(unitState);
    }
    case 'unfold':
      return attack(unitState, unit);
    case 'attack': {
      if (info.hasAbility(Ability.Unfold) && sprite.unfoldSprite) {
        return fold('fold', unitState, sprite.unfoldSprite);
      }
      if (info.hasAbility(Ability.Heal) && sprite.healSprite) {
        return heal(unitState, sprite.healSprite);
      }
      return idle(unitState);
    }
    case 'fold':
    case 'heal':
      return idle(unitState);
    default: {
      stateType satisfies never;
      throw new UnknownTypeError('getNextUnitState', stateType);
    }
  }
};

export default function useUnitState(
  unit: Unit,
  biome: Biome,
  offset = 0,
): readonly [unit: Unit, map: MapData, props: Omit<UnitState, 'type'>] {
  const { info, player } = unit;
  const [currentState, setUnitState] = useState<UnitState>({ type: 'idle' });
  const { type, ...props } = currentState;
  const [shouldApplyOffset, setShouldApplyOffset] = useState(offset > 0);

  const [entity, map] = useMemo(() => {
    let entity = info.create(player);
    if (info.hasAbility(Ability.Unfold)) {
      entity = entity[type === 'attack' ? 'unfold' : 'fold']();
    }
    if (unit.isTransportingUnits()) {
      entity = entity.copy({
        transports: unit.transports,
      });
    }
    return [
      entity,
      withModifiers(
        MapData.createMap({
          config: {
            biome,
          },
          map: [(getAnyUnitTile(info) || Plain).id],
          modifiers: [0],
        }).copy({ units: ImmutableMap([[defaultVector, entity]]) }),
      ),
    ];
  }, [info, biome, player, type, unit]);

  useEffect(() => {
    if (player > 0) {
      if (shouldApplyOffset) {
        const timer = setTimeout(() => setShouldApplyOffset(false), offset);
        return () => clearTimeout(timer);
      }

      const interval = setInterval(
        () => {
          setUnitState(getNextUnitState(currentState, entity));
        },
        AnimationConfig.AnimationDuration *
          (currentState.type === 'heal' ? 3 : 8),
      );
      return () => clearInterval(interval);
    }
  }, [
    currentState,
    info.sprite.portrait.variants,
    entity,
    player,
    shouldApplyOffset,
    offset,
  ]);

  return [entity, map, props];
}
