import Building from '@deities/athena/map/Building.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { State } from '../../Types.tsx';

type AttackableEntities = {
  building: Building | null;
  unit: Unit | null;
};

export default function getAttackableEntities(
  vector: Vector,
  state: State,
): AttackableEntities {
  const { attackable, map, selectedUnit, vision } = state;
  if (
    selectedUnit &&
    attackable &&
    attackable.has(vector) &&
    vision.isVisible(map, vector)
  ) {
    const unit = map.units.get(vector);
    const building = map.buildings.get(vector);
    return {
      building:
        building &&
        map.isOpponent(building, selectedUnit) &&
        selectedUnit.getAttackWeapon(building)
          ? building
          : null,
      unit:
        unit &&
        map.isOpponent(unit, selectedUnit) &&
        selectedUnit.getAttackWeapon(unit)
          ? unit
          : null,
    };
  }
  return { building: null, unit: null };
}
