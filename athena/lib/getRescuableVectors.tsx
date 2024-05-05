import { Ability } from '../info/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

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
