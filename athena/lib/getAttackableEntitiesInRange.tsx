import { EntityType } from '../map/Entity.tsx';
import type Vector from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';
import { attackable } from '../Radius.tsx';
import type { VisionT } from '../Vision.tsx';

export default function getAttackableEntitiesInRange(
  map: MapData,
  position: Vector,
  vision: VisionT,
) {
  const unitA = map.units.get(position);
  return new Map(
    unitA
      ? [...attackable(map, unitA, position, 'cover')].filter(([vector]) => {
          const unitB = map.units.get(vector);
          const building = map.buildings.get(vector);
          const unitIsOpponent = unitB && map.isOpponent(unitA, unitB);
          return (
            vision.isVisible(map, vector) &&
            ((unitIsOpponent && unitA.getAttackWeapon(unitB)) ||
              (building &&
                building.info.type !== EntityType.Invincible &&
                map.isOpponent(unitA, building) &&
                (!unitB || unitIsOpponent) &&
                unitA.getAttackWeapon(building)))
          );
        })
      : null,
  );
}
