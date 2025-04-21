import { Weapon } from '../info/Unit.tsx';
import { MaxHealth, MinDamage } from '../map/Configuration.tsx';
import Entity, { isEntityWithoutCover, isUnit } from '../map/Entity.tsx';
import Unit from '../map/Unit.tsx';

export default function calculateDamage(
  unitA: Unit,
  entityB: Entity,
  weapon: Weapon,
  coverA: number,
  coverB: number,
  attackStatusEffect: number,
  defenseStatusEffect: number,
  luckA: number,
): number {
  if (weapon.flatDamage) {
    return Math.max(MinDamage, weapon.getDamage(entityB) || 0);
  }

  const health = 0.666 * (unitA.health / MaxHealth) + 0.334;
  const offenseA =
    isUnit(entityB) && entityB.shield
      ? 0
      : weapon.getDamage(entityB) * attackStatusEffect;
  const defenseB = entityB.info.defense * defenseStatusEffect;
  const coverA2 = isEntityWithoutCover(unitA) ? 1 : 1 + coverA / 400;
  const coverB2 = isEntityWithoutCover(entityB) ? 1 : 1 + coverB / 100;
  return Math.max(
    MinDamage,
    health * offenseA * coverA2 * luckA - defenseB * coverB2,
  );
}
