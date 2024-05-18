import type Unit from '../map/Unit.tsx';

export default function hasLowAmmoSupply(
  unit: Unit,
  weaponId: number,
  currentSupply: number,
): boolean {
  const supply = unit.info.attack.weapons?.get(weaponId)?.supply || 0;
  return !!(supply && currentSupply <= supply * 0.3);
}
