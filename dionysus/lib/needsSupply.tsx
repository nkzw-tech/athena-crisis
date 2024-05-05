import hasLowAmmoSupply from '@deities/athena/lib/hasLowAmmoSupply.tsx';
import Unit from '@deities/athena/map/Unit.tsx';

const needsFuel = (unit: Unit) =>
  unit.fuel <= unit.info.configuration.fuel * 0.3;

const needsAmmo = (unit: Unit) => {
  const { ammo } = unit;
  return (
    !!ammo?.size &&
    [...ammo].some(([weapon, supply]) => hasLowAmmoSupply(unit, weapon, supply))
  );
};

export default function needsSupply(unit: Unit): boolean {
  return needsFuel(unit) || needsAmmo(unit);
}
