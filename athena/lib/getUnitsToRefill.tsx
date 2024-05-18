import { Ability } from '../info/Unit.tsx';
import type Player from '../map/Player.tsx';
import type Vector from '../map/Vector.tsx';
import { isVector } from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';
import type { VisionT } from '../Vision.tsx';
import type { UnitsWithPosition } from './getUnitsByPositions.tsx';

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
