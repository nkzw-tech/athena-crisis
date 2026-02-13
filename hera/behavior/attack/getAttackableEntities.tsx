import Building from '@deities/athena/map/Building.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { State } from '../../Types.tsx';

type AttackableEntities =
  | Readonly<{
      building: Building;
      unit: Unit;
    }>
  | {
      building: Building;
      unit?: null;
    }
  | {
      building?: null;
      unit: Unit;
    }
  | null;

export default function getAttackableEntities(vector: Vector, state: State): AttackableEntities {
  const { attackable, map, selectedUnit, vision } = state;
  if (selectedUnit && attackable && attackable.has(vector) && vision.isVisible(map, vector)) {
    const targetUnit = map.units.get(vector);
    const targetBuilding = map.buildings.get(vector);
    const building =
      targetBuilding &&
      map.isOpponent(targetBuilding, selectedUnit) &&
      selectedUnit.getAttackWeapon(targetBuilding)
        ? targetBuilding
        : null;
    const unit =
      targetUnit &&
      map.isOpponent(targetUnit, selectedUnit) &&
      selectedUnit.getAttackWeapon(targetUnit)
        ? targetUnit
        : null;

    return building && unit ? { building, unit } : building ? { building } : unit ? { unit } : null;
  }
  return null;
}
