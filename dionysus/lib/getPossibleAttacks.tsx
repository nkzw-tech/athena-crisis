import { MinFunds } from '@deities/athena/info/Building.tsx';
import { Ability, Pioneer } from '@deities/athena/info/Unit.tsx';
import calculateLikelyDamage from '@deities/athena/lib/calculateLikelyDamage.tsx';
import getAttackStatusEffect from '@deities/athena/lib/getAttackStatusEffect.tsx';
import getDefenseStatusEffect from '@deities/athena/lib/getDefenseStatusEffect.tsx';
import getParentToMoveTo from '@deities/athena/lib/getParentToMoveTo.tsx';
import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import {
  CounterAttack,
  MaxHealth,
  MinDamage,
} from '@deities/athena/map/Configuration.tsx';
import Entity, { isBuilding } from '@deities/athena/map/Entity.tsx';
import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { attackable, RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import shouldAttack from './shouldAttack.tsx';

export type PossibleAttack = Readonly<{
  attackable: ReadonlyMap<Vector, RadiusItem>;
  entityB: Entity;
  from: Vector;
  getWeight: () => number;
  parent: Vector;
  sabotage: boolean;
  to: RadiusItem;
  unitA: Unit;
  vector: Vector;
}>;

export default function getPossibleAttacks(
  map: MapData,
  vision: VisionT,
  units: ReadonlyArray<[Vector, Unit]>,
  labelsToPrioritize?: Set<PlayerID>,
): Array<PossibleAttack> {
  const possibleAttacks: Array<PossibleAttack> = [];
  const mapWithVision = vision.apply(map);
  units.forEach(([position, unitA]) => {
    let attackCount = 0;
    const originTile = map.getTileInfo(position);
    const attackStatusEffect = getAttackStatusEffect(map, unitA, originTile);
    const fields = attackable(
      mapWithVision,
      unitA,
      position,
      'cover',
      unitA.matchesBehavior(AIBehavior.Stay) ? 0 : undefined,
    );
    fields.forEach((item) => {
      const { parent, vector } = item;

      let _parentVector: Vector | null;
      const getParentVector = () => {
        return (
          _parentVector ||
          (_parentVector = getParentToMoveTo(
            map,
            unitA,
            position,
            item,
            fields,
          ))
        );
      };

      if (!shouldAttack(map, vision, unitA, position, vector)) {
        return;
      }

      // If the unit is not reachable by the current unit, do not attempt an attack.
      if (
        parent &&
        !position.equals(parent) &&
        mapWithVision.units.has(parent)
      ) {
        return;
      }

      const entityB = map.units.get(vector) || map.buildings.get(vector);
      if (!entityB) {
        return;
      }

      const targetTile = map.getTileInfo(vector);
      const isNeutral = map.isNeutral(entityB);
      const entityIsBuilding = isBuilding(entityB);
      const damage = calculateLikelyDamage(
        unitA,
        entityB,
        map,
        parent || position,
        vector,
        attackStatusEffect,
        getDefenseStatusEffect(map, entityB, targetTile),
        1,
      );

      if (
        entityB.player > 0 &&
        !entityIsBuilding &&
        unitA.info.hasAbility(Ability.Sabotage) &&
        unitA.info.canSabotageUnitType(entityB.info)
      ) {
        const parentVector = getParentVector();
        const sabotageWeight =
          (parentVector &&
            getSabotageWeight(entityB, map.getPlayer(entityB))) ||
          0;
        if (parentVector && sabotageWeight > 0) {
          possibleAttacks.push({
            attackable: fields,
            entityB,
            from: position,
            getWeight: () => sabotageWeight / attackCount,
            parent: parentVector,
            sabotage: true,
            to: item,
            unitA,
            vector,
          });
        }
      }

      if (
        damage == null ||
        damage <= 0 ||
        (damage === 1 && entityB.health > MinDamage) ||
        (damage === 5 &&
          entityB.health > MaxHealth / 3 &&
          entityIsBuilding &&
          entityB.info.isStructure()) ||
        (entityIsBuilding && isNeutral && !entityB.info.isStructure())
      ) {
        return;
      }

      if (
        !entityIsBuilding &&
        isNeutral &&
        (!entityB.label || !labelsToPrioritize?.has(entityB.label))
      ) {
        if (
          !entityB.isBeingRescued() ||
          entityB.isBeingRescuedBy(unitA.player)
        ) {
          return;
        }
      }

      let weight = damage;
      const isKill = damage >= entityB.health;
      if (isKill) {
        // Boost the weight when the entity will likely be killed.
        // The lower the damage, the higher the multiplier because
        // it frees up other units for higher leverage attacks.
        weight = (1 / Math.max(damage, 5)) * Math.pow(MaxHealth, 2);
      } else if (
        !entityIsBuilding &&
        unitA.info.isShortRange() &&
        entityB.info.hasAttack() &&
        entityB.info.canAttackAt(
          1,
          entityB.info.getRangeFor(map.getPlayer(entityB)),
        )
      ) {
        const counterDamage = calculateLikelyDamage(
          entityB.modifyHealth(-damage),
          unitA,
          map,
          vector,
          parent || position,
          getAttackStatusEffect(map, entityB, targetTile),
          getDefenseStatusEffect(
            map,
            unitA,
            parent ? map.getTileInfo(position) : originTile,
          ),
          CounterAttack,
        );
        // If the counter attack is worse than the attack, skip it.
        // No suicide.
        if (
          counterDamage &&
          counterDamage > 0 &&
          (counterDamage * 0.75 > damage || counterDamage > unitA.health)
        ) {
          return;
        }
      }

      // De-prioritize attacks against buildings.
      if (entityIsBuilding) {
        weight *= 0.5;
      } else {
        const building = map.buildings.get(vector);
        // If the attackable unit is capturing a building, increase the weight.
        if (building && entityB.info.hasAbility(Ability.Capture)) {
          const { funds } = building.info.configuration;
          weight *=
            (entityB.isCapturing() ? 10 : 1) *
            ((building.info.isHQ() ? 100 : funds ? funds / MinFunds : 10) +
              (map.isNeutral(building) && !building.info.isStructure()
                ? 0
                : map.matchesPlayer(unitA, building)
                  ? 5
                  : 3));
          // Prioritize transporters with loaded units, long-range units, or units on top of buildings.
        } else if (
          entityB.isTransportingUnits() ||
          entityB.info.isLongRange() ||
          ((building?.info.isHQ() ||
            building?.canBuildUnits(map.getPlayer(entityB))) &&
            map.matchesTeam(unitA, building))
        ) {
          weight *= 6;
          // If the unit has weapons, prioritize it over ones that don't have an attack.
        } else if (entityB.info.hasAttack()) {
          weight *= 5;
          // Slightly prefer attacking pioneers over the remaining units.
        } else if (Pioneer.id === entityB.id) {
          weight *= 2.5;
        }
      }

      // Increase the weight for units that should be destroyed.
      if (entityB.label != null && labelsToPrioritize?.has(entityB.label)) {
        weight *= 50;
      }

      const parentVector = getParentVector();
      if (parentVector) {
        attackCount++;
        possibleAttacks.push({
          attackable: fields,
          entityB,
          from: position,
          getWeight: () => weight / attackCount,
          parent: parentVector,
          sabotage: false,
          to: item,
          unitA,
          vector,
        });
      }
    });
  });

  return possibleAttacks;
}

const getSabotageWeight = (unit: Unit, player: Player) => {
  const { info } = unit;
  if (!info.hasAttack() || unit.health < MaxHealth / 2 || unit.fuel <= 1) {
    return 0;
  }

  const cost = info.getCostFor(player);
  return (
    (((cost < Number.POSITIVE_INFINITY ? cost / MinFunds : 0) + info.defense) *
      2 -
      info.configuration.fuel) *
    2
  );
};
