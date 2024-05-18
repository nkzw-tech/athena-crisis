import { Ability } from '../info/Unit.tsx';
import type Vector from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';

export default function getRescuableVectors(map: MapData, position: Vector) {
  const unitA = map.units.get(position);
  return new Set(
    unitA?.info.hasAbility(Ability.Rescue)
      ? position
          .adjacent()
          .filter((vector) => map.units.get(vector)?.player === 0)
      : [],
  );
}
