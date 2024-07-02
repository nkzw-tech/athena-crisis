import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import { getEntityGroup } from '@deities/athena/map/Entity.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { MoveConfiguration, RadiusItem } from '@deities/athena/Radius.tsx';
import minBy from '@deities/hephaestus/minBy.tsx';
import getAttackableArea from './getAttackableArea.tsx';
import getObjectiveVectors from './getObjectiveVectors.tsx';

export default function findPathToTarget(
  map: MapData,
  unit: Unit,
  to: RadiusItem,
  moveableRadius: ReadonlyMap<Vector, RadiusItem>,
  radiusToTarget: ReadonlyMap<Vector, RadiusItem>,
  considerRange?: boolean,
): Vector | null {
  const { info } = unit;
  let target: RadiusItem | null = to;
  const minimumDistance =
    (considerRange &&
      !getObjectiveVectors(map, unit).has(to.vector) &&
      info.getRangeFor(map.getPlayer(unit))?.[0]) ||
    0;

  const isWithinOpponentAttackableArea = (vector: Vector) => {
    if (
      unit.matchesBehavior(AIBehavior.Defense) ||
      unit.matchesBehavior(AIBehavior.Passive)
    ) {
      return getAttackableArea(
        map,
        new Set(
          map
            .getPlayers()
            .filter((player) => map.isOpponent(player, unit.player))
            .map(({ id }) => id),
        ),
      ).has(vector);
    }

    return false;
  };

  let radius: number | null = null;
  const getRadius = () =>
    radius ?? (radius = unit.info.getRadiusFor(map.getPlayer(unit)));

  const canAccess = (vector: Vector) =>
    moveableRadius.has(vector) &&
    MoveConfiguration.isAccessible(map, unit, vector) &&
    !map.units.has(vector) &&
    (!to || vector.distance(to.vector) >= minimumDistance) &&
    !isWithinOpponentAttackableArea(vector);

  const minByDistance = (
    target: Vector,
    filter: (vector: Vector) => boolean | undefined,
  ) =>
    minBy([...moveableRadius.keys()].filter(filter), (vector) =>
      vector.distance(target),
    );

  while (target) {
    if (canAccess(target.vector)) {
      const targetVector = target.vector;
      if (map.config.fog && !map.getTileInfo(target.vector).style.hidden) {
        const hiddenTarget =
          minByDistance(
            targetVector,
            (vector) =>
              map.getTileInfo(vector).style.hidden && canAccess(vector),
          ) || target.vector;

        // Only hide if the distance to the hidden field isn't too large.
        if (targetVector.distance(hiddenTarget) < getRadius() / 2) {
          return hiddenTarget;
        }
      } else if (
        unit.info.canTransportUnits() &&
        !unit.isTransportingUnits() &&
        getEntityGroup(unit) === 'naval' &&
        !unit.info.canDropFrom(map.getTileInfo(target.vector))
      ) {
        const dropTarget =
          minByDistance(
            targetVector,
            (vector) =>
              unit.info.canDropFrom(map.getTileInfo(vector)) &&
              canAccess(vector),
          ) || target.vector;

        // Only consider the drop target if the distance to the final target isn't large.
        if (dropTarget.distance(to.vector) < getRadius()) {
          return dropTarget;
        }
      }

      return target.vector;
    }
    target = (target.parent && radiusToTarget.get(target.parent)) || null;
  }
  return null;
}
