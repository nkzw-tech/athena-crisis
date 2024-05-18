import { Ability } from '../info/Unit.tsx';
import { MaxHealth } from '../map/Configuration.tsx';
import type Vector from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';

export default function getHealableVectors(map: MapData, position: Vector) {
  const unitA = map.units.get(position);
  const healTypes = unitA?.info.configuration.healTypes;
  return new Set(
    healTypes && unitA.info.hasAbility(Ability.Heal)
      ? position.adjacent().filter((vector) => {
          const unitB = map.units.get(vector);
          return (
            unitB &&
            map.matchesPlayer(unitB, unitA) &&
            unitB.health < MaxHealth &&
            healTypes.has(unitB.info.type)
          );
        })
      : [],
  );
}
