import { Ability } from '@deities/athena/info/Unit.tsx';
import { EntityType } from '@deities/athena/map/Entity.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';

export default function shouldAttack(
  map: MapData,
  vision: VisionT,
  unitA: Unit,
  from: Vector,
  to: Vector,
) {
  if (!vision.isVisible(map, to)) {
    return false;
  }

  const entityB = map.units.get(to) || map.buildings.get(to);
  const distance = from.distance(to);
  const player = map.getPlayer(unitA);
  if (!entityB || !map.isOpponent(entityB, unitA) || !unitA.canAttack(player)) {
    return false;
  }

  if (
    unitA.info.isLongRange() &&
    !unitA.canAttackAt(distance, player) &&
    (!unitA.canMove() || !unitA.info.canAct(player))
  ) {
    return false;
  }

  if (
    !unitA.getAttackWeapon(entityB) &&
    !unitA.info.hasAbility(Ability.Sabotage)
  ) {
    return false;
  }

  // Do not attack neutral buildings that could be captured.
  if (entityB.info.type === EntityType.Building && map.isNeutral(entityB)) {
    return false;
  }

  // Do not attack if the current unit needs to move closer to the target but has already moved.
  if (distance > 1 && unitA.info.isShortRange() && !unitA.canMove()) {
    return false;
  }

  return true;
}
