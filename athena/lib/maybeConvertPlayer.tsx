import ImmutableMap from '@nkzw/immutable-map';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import assignDeterministicUnitNames from './assignDeterministicUnitNames.tsx';

export default function maybeConvertPlayer(
  map: MapData,
  unit: Unit,
  vector: Vector,
  attackingUnit: Unit | null | undefined,
  state: 'recover' | 'complete',
) {
  if (!attackingUnit?.canConvert(map.getPlayer(attackingUnit.player))) {
    return unit;
  }

  let newUnit = unit.withName(null).setPlayer(attackingUnit.player)[state]();

  if (newUnit.isCapturing()) {
    const building = map.buildings.get(vector);
    if (building && map.matchesTeam(building, newUnit)) {
      newUnit = newUnit.stopCapture();
    }
  }

  return assignDeterministicUnitNames(
    map,
    ImmutableMap<Vector, Unit>([[vector, newUnit]]),
  ).get(vector)!;
}
