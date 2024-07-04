import { hasCounterAttackSkill } from '@deities/athena/info/Skill.tsx';
import calculateLikelyDamage from '@deities/athena/lib/calculateLikelyDamage.tsx';
import getAttackStatusEffect from '@deities/athena/lib/getAttackStatusEffect.tsx';
import getDefenseStatusEffect from '@deities/athena/lib/getDefenseStatusEffect.tsx';
import {
  CounterAttack,
  MaxHealth,
  RaisedCounterAttack,
} from '@deities/athena/map/Configuration.tsx';
import Entity from '@deities/athena/map/Entity.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import { css } from '@emotion/css';
import { fbt } from 'fbt';
import { useCallback, useMemo } from 'react';
import BuildingTile from '../../Building.tsx';
import Tick from '../../Tick.tsx';
import { Actions, State } from '../../Types.tsx';
import { Fbt } from '../../types/Fbt.tsx';
import EntityPickerFlyout from '../../ui/EntityPickerFlyout.tsx';
import FlashFlyout from '../../ui/FlashFlyout.tsx';
import { FlyoutColor, FlyoutItem } from '../../ui/Flyout.tsx';
import UnitTile from '../../Unit.tsx';
import getAttackableEntities from './getAttackableEntities.tsx';
import getDamageColor from './getDamageColor.tsx';

export default function AttackSelector({
  actions,
  onSelect,
  origin,
  state,
}: {
  actions: Actions;
  onSelect: (entity: Entity) => void;
  origin: Vector | null;
  state: State;
}) {
  const {
    animationConfig,
    map,
    position,
    selectedAttackable,
    selectedPosition,
    selectedUnit,
    tileSize,
    zIndex,
  } = state;

  const entities = useMemo(() => {
    if (selectedPosition && selectedUnit) {
      if (selectedAttackable) {
        return getAttackableEntities(selectedAttackable, state);
      } else if (position) {
        return getAttackableEntities(position, state);
      }
    }
    return { building: null, unit: null };
  }, [position, selectedAttackable, selectedPosition, selectedUnit, state]);

  const selectBuilding = useCallback(() => {
    if (entities.building) {
      onSelect(entities.building);
    }
  }, [entities.building, onSelect]);

  const selectUnit = useCallback(() => {
    if (entities.unit) {
      onSelect(entities.unit);
    }
  }, [entities.unit, onSelect]);

  if (!selectedPosition || !selectedUnit) {
    return null;
  }

  if (selectedAttackable) {
    if (entities.unit && entities.building) {
      return (
        <EntityPickerFlyout
          animationConfig={animationConfig}
          biome={map.config.biome}
          building={entities.building}
          firstPlayerID={map.getFirstPlayerID()}
          onSelectBuilding={selectBuilding}
          onSelectUnit={selectUnit}
          position={selectedAttackable}
          resetPosition={actions.resetPosition}
          tileSize={tileSize}
          unit={entities.unit}
          width={map.size.width}
          zIndex={zIndex}
        />
      );
    }
  } else if (position) {
    if (entities.building || entities.unit) {
      const isShortRange = selectedUnit.info.isShortRange();
      const targetPosition = origin || selectedPosition;
      const unitDamage =
        entities.unit &&
        getDamageInformation(
          selectedUnit,
          entities.unit,
          map,
          targetPosition,
          position,
        );
      const buildingDamage =
        entities.building &&
        getDamageInformation(
          selectedUnit,
          entities.building,
          map,
          targetPosition,
          position,
        );
      const unitB = entities.unit?.modifyHealth(-(unitDamage?.damage || 0));
      const playerB = unitB && map.getPlayer(unitB);
      const hasCounterAttackPower =
        playerB && hasCounterAttackSkill(playerB.activeSkills);
      const counterAttack = hasCounterAttackPower
        ? 1
        : playerB && hasCounterAttackSkill(playerB.skills)
          ? RaisedCounterAttack
          : CounterAttack;
      const counterDamage =
        entities.unit &&
        unitB &&
        unitB.player !== 0 &&
        playerB &&
        !unitB.isDead() &&
        unitB.canAttackAt(1, playerB) &&
        (!origin || origin.distance(position) === 1) &&
        (isShortRange ||
          selectedUnit.canAttackAt(1, map.getPlayer(selectedUnit))) &&
        unitB.getAttackWeapon(selectedUnit) &&
        getDamageInformation(
          hasCounterAttackPower ? entities.unit : unitB,
          selectedUnit,
          map,
          position,
          targetPosition,
          counterAttack,
        );

      return (
        <Tick animationConfig={animationConfig}>
          <FlashFlyout
            align={
              entities.building ||
              (entities.unit && entities.unit.health < MaxHealth)
                ? 'top'
                : 'top-lower'
            }
            animationConfig={animationConfig}
            items={[
              entities.building && buildingDamage ? (
                <FlyoutItem
                  color={buildingDamage.color}
                  icon={
                    unitDamage && (
                      <BuildingTile
                        biome={map.config.biome}
                        building={entities.building}
                        position={new SpriteVector(1, 1.5)}
                        size={tileSize}
                      />
                    )
                  }
                  key="building"
                >
                  {buildingDamage.damage != null &&
                  buildingDamage.damage > 0 ? (
                    <>
                      {entities.building.health} - {buildingDamage.damage}
                      {' → '}
                      {Math.max(
                        0,
                        entities.building.health - buildingDamage.damage,
                      )}
                      <Icon className={iconStyle} icon={Heart} />
                    </>
                  ) : (
                    buildingDamage.text
                  )}
                </FlyoutItem>
              ) : null,
              entities.unit && unitDamage ? (
                <FlyoutItem
                  color={unitDamage.color}
                  icon={
                    (buildingDamage || counterDamage) && (
                      <UnitTile
                        animationConfig={animationConfig}
                        biome={map.config.biome}
                        firstPlayerID={map.getFirstPlayerID()}
                        size={tileSize}
                        tile={map.getTileInfo(position)}
                        unit={entities.unit}
                      />
                    )
                  }
                  key="unit"
                >
                  {unitDamage.damage != null && unitDamage.damage > 0 ? (
                    <>
                      {entities.unit.health} - {unitDamage.damage}
                      {' → '}
                      {Math.max(0, entities.unit.health - unitDamage.damage)}
                      <Icon className={iconStyle} icon={Heart} />
                    </>
                  ) : (
                    unitDamage.text
                  )}
                </FlyoutItem>
              ) : null,
              entities.unit && counterDamage ? (
                <FlyoutItem
                  icon={
                    <UnitTile
                      animationConfig={animationConfig}
                      biome={map.config.biome}
                      firstPlayerID={map.getFirstPlayerID()}
                      size={tileSize}
                      tile={map.getTileInfo(selectedPosition)}
                      unit={selectedUnit}
                    />
                  }
                  key="counter"
                >
                  {counterDamage.damage != null && counterDamage.damage > 0 ? (
                    <>
                      {selectedUnit.health} - {counterDamage.damage}
                      {' → '}
                      {Math.max(0, selectedUnit.health - counterDamage.damage)}
                      <Icon className={iconStyle} icon={Heart} />
                    </>
                  ) : (
                    counterDamage.text
                  )}
                </FlyoutItem>
              ) : null,
            ]}
            position={position}
            tileSize={tileSize}
            width={map.size.width}
            zIndex={zIndex}
          />
        </Tick>
      );
    }
  }
  return null;
}

const getDamageInformation = (
  unitA: Unit,
  entityB: Entity,
  map: MapData,
  from: Vector,
  to: Vector,
  modifier = 1,
): { color: FlyoutColor; damage: number | null; text: Fbt | null } => {
  const damage = calculateLikelyDamage(
    unitA,
    entityB,
    map,
    from,
    to,
    getAttackStatusEffect(map, unitA, map.getTileInfo(from)),
    getDefenseStatusEffect(map, entityB, map.getTileInfo(to)),
    modifier,
  );
  return {
    color: getDamageColor(damage, entityB.health),
    damage: damage === null ? damage : Math.min(MaxHealth, damage),
    text: damage ? null : fbt('No damage!', 'No damage label'),
  };
};

const iconStyle = css`
  margin: 1px 0 0 1.5px;
`;
