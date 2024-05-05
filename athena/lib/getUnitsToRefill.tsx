import { Ability } from '../info/Unit.tsx';
import Player from '../map/Player.tsx';
import Vector, { isVector } from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { VisionT } from '../Vision.tsx';
import { UnitsWithPosition } from './getUnitsByPositions.tsx';

export default function getUnitsToRefill(
  map: MapData,
  vision: VisionT,
  player: Player,
  supplyUnits: Vector | ReadonlyArray<Vector>,
): UnitsWithPosition {
  const unitsWithPosition = new Map();
  const list = isVector(supplyUnits)
    ? supplyUnits.adjacent().map((adjacent) => [supplyUnits, adjacent])
    : supplyUnits.flatMap((vector) =>
        vector.adjacent().flatMap((adjacent) => [[vector, adjacent]]),
      );

  for (const [parent, vector] of list) {
    const parentUnit = parent && map.units.get(parent);
    const unit = vector && map.units.get(vector);
    if (
      unit &&
      parentUnit?.info.hasAbility(Ability.Supply) &&
      parentUnit.info.configuration.supplyTypes?.has(unit.info.type) &&
      map.matchesPlayer(player, unit) &&
      vision.isVisible(map, vector) &&
      (unit.fuel < unit.info.configuration.fuel ||
        [...(unit.info.getAmmunitionSupply() || [])]?.some(
          ([weapon, supply]) => supply > (unit.ammo?.get(weapon) || 0),
        ))
    ) {
      unitsWithPosition.set(vector, unit);
    }
  }
  return unitsWithPosition;
}
