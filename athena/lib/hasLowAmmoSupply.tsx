import { UnitInfo } from '../info/Unit.tsx';

export default function hasLowAmmoSupply(
  info: UnitInfo,
  weaponId: number,
  currentSupply: number,
): boolean {
  const supply = info.attack.weapons?.get(weaponId)?.supply || 0;
  return !!(supply && currentSupply <= supply * 0.3);
}
