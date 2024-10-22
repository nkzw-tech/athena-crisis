import { PoisonSkillPowerDamageMultiplier, Skill } from '../info/Skill.tsx';
import { BuildingCover, MinDamage } from '../map/Configuration.tsx';
import Entity, { isUnit } from '../map/Entity.tsx';
import Unit, { UnitStatusEffect } from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import calculateDamage from './calculateDamage.tsx';

export default function calculateLikelyDamage(
  unitA: Unit,
  entityB: Entity,
  map: MapData,
  from: Vector,
  to: Vector,
  attackStatusEffect: number,
  defenseStatusEffect: number,
  modifier: number,
  weapon = unitA.getAttackWeapon(entityB),
): number | null {
  if (weapon) {
    const coverA = map.getTileInfo(from).configuration.cover;
    const coverB = map.getTileInfo(to).configuration.cover;
    const damage = Math.max(
      MinDamage,
      Math.ceil(
        calculateDamage(
          unitA,
          entityB,
          weapon,
          (Number.isFinite(coverA) ? coverA : 0) +
            (map.buildings.has(from) ? BuildingCover : 0),
          (Number.isFinite(coverB) ? coverB : 0) +
            (map.buildings.has(to) ? BuildingCover : 0),
          attackStatusEffect,
          defenseStatusEffect,
          1,
        ) * modifier,
      ),
    );
    return isUnit(entityB) &&
      entityB.statusEffect === UnitStatusEffect.Poison &&
      map.getPlayer(unitA).activeSkills.has(Skill.BuyUnitAcidBomber)
      ? Math.floor(damage * (1 + PoisonSkillPowerDamageMultiplier))
      : damage;
  }

  return null;
}
