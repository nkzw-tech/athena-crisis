import type { ActiveUnitTypes } from '../info/Skill.tsx';
import type Unit from '../map/Unit.tsx';
import type Vector from '../map/Vector.tsx';

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
