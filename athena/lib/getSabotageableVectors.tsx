import { Ability } from '../info/Unit.tsx';
import type Vector from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';

export default function getSabotageableVectors(
  map: MapData,
  position: Vector,
): ReadonlySet<Vector> {
  const unitA = map.units.get(position);
  return new Set(
    unitA?.info.hasAbility(Ability.Sabotage)
      ? position.adjacent().filter((vector) => {
          const unitB = map.units.get(vector);
          return (
            unitB &&
            map.isOpponent(unitB, unitA) &&
            unitA.info.canSabotageUnitType(unitB.info)
          );
        })
      : [],
  );
}
