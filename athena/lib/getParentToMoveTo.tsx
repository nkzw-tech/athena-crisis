import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { RadiusItem } from '../Radius.tsx';

export default function getParentToMoveTo(
  map: MapData,
  unit: Unit,
  from: Vector,
  to: RadiusItem | undefined,
  fields: ReadonlyMap<Vector, RadiusItem>,
) {
  const { info } = unit;
  const isLongRange = info.isLongRange();
  const player = map.getPlayer(unit);
  const parent =
    to?.parent ||
    (isLongRange && to && unit.canAttackAt(from.distance(to.vector), player)
      ? from
      : null);

  if (parent && isLongRange) {
    const range = info.getRangeFor(player);
    if (info.canAttackAt(1, range) && info.canAttackAt(2, range)) {
      const grandparent = fields.get(parent)?.parent || from;
      if (grandparent && info.canAttackAt(3, range)) {
        const greatgrandparent = fields.get(grandparent)?.parent || from;
        if (canAttackFrom(map, from, greatgrandparent, to, 3)) {
          return greatgrandparent;
        }
      }

      if (canAttackFrom(map, from, grandparent, to, 2)) {
        return grandparent;
      }
    }
  }

  return parent;
}

const canAttackFrom = (
  map: MapData,
  from: Vector,
  candidate: Vector,
  field: RadiusItem | undefined,
  distance: number,
) =>
  candidate &&
  (!field || candidate.distance(field.vector) <= distance) &&
  (from.equals(candidate) || !map.units.has(candidate));
