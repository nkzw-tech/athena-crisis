import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { RadiusItem } from '../Radius.tsx';

export default function getParentToMoveTo(
  map: MapData,
  unit: Unit,
  origin: Vector,
  target: RadiusItem | undefined,
  fields: ReadonlyMap<Vector, RadiusItem>,
) {
  const { info } = unit;
  const isLongRange = info.isLongRange();
  const player = map.getPlayer(unit);
  if (
    isLongRange &&
    target &&
    unit.canAttackAt(origin.distance(target.vector), player)
  ) {
    return origin;
  }

  const parent = target?.parent;
  if (parent && isLongRange) {
    const range = info.getRangeFor(player);
    if (info.canAttackAt(1, range) && info.canAttackAt(2, range)) {
      const grandparent = fields.get(parent)?.parent;
      if (grandparent && info.canAttackAt(3, range)) {
        const greatgrandparent = fields.get(grandparent)?.parent;
        if (canAttackFrom(map, origin, greatgrandparent, target, 3)) {
          return greatgrandparent;
        }
      }

      if (canAttackFrom(map, origin, grandparent, target, 2)) {
        return grandparent;
      }
    }
  }

  return parent || null;
}

const canAttackFrom = (
  map: MapData,
  origin: Vector,
  candidate: Vector | null | undefined,
  field: RadiusItem | undefined,
  distance: number,
): candidate is Vector =>
  !!(
    candidate &&
    (!field || candidate.distance(field.vector) <= distance) &&
    (origin.equals(candidate) || !map.units.has(candidate))
  );
