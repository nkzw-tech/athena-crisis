import Unit from '../map/Unit.tsx';
import hasLowAmmoSupply from './hasLowAmmoSupply.tsx';

const needsFuel = (unit: Unit) =>
  unit.fuel <= unit.info.configuration.fuel * 0.3;

const needsAmmo = (unit: Unit) => {
  const { ammo } = unit;
  return (
    !!ammo?.size &&
    [...ammo].some(([weapon, supply]) =>
      hasLowAmmoSupply(unit.info, weapon, supply),
    )
  );
};

export default function needsSupply(unit: Unit): boolean {
  return needsFuel(unit) || needsAmmo(unit);
}
