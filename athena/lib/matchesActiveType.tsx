import { ActiveUnitTypes } from '../info/Skill.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';

export default function matchesActiveType(
  types: ActiveUnitTypes | undefined,
  unit: Unit,
  vector: Vector | null,
) {
  return !!(
    types &&
    (types === 'all' ||
      types.has(unit.id) ||
      types.has(unit.info.movementType) ||
      (vector && types.has(vector)))
  );
}
