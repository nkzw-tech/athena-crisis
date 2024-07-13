import { Ability } from '../info/Unit.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export default function maybeConvertPlayer(
  map: MapData,
  unit: Unit,
  vector: Vector,
  attackingUnit: Unit | null | undefined,
  state: 'recover' | 'complete',
) {
  const newUnit = attackingUnit?.info.hasAbility(Ability.Convert)
    ? unit.setPlayer(attackingUnit.player)[state]()
    : unit;

  if (newUnit.isCapturing()) {
    const building = map.buildings.get(vector);
    if (building && map.matchesTeam(building, newUnit)) {
      return newUnit.stopCapture();
    }
  }

  return newUnit;
}
