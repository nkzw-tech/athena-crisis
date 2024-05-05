import { Ability } from '../info/Unit.tsx';
import Player from '../map/Player.tsx';
import MapData from '../MapData.tsx';
import { VisionT } from '../Vision.tsx';
import { UnitsWithPosition } from './getUnitsByPositions.tsx';
import getUnitsToRefill from './getUnitsToRefill.tsx';

export default function getAllUnitsToRefill(
  map: MapData,
  vision: VisionT,
  player: Player,
  type: 'visible' | 'hidden' = 'visible',
): UnitsWithPosition {
  return getUnitsToRefill(map, vision, player, [
    ...map.units
      .filter(
        (unit, vector) =>
          map.matchesPlayer(player, unit) &&
          unit.info.hasAbility(Ability.Supply) &&
          ((type === 'visible' && vision.isVisible(map, vector)) ||
            (type === 'hidden' && !vision.isVisible(map, vector))),
      )
      .keys(),
  ]);
}
