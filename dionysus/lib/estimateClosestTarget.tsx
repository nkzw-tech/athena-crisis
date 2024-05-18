import { Lightning } from '@deities/athena/info/Tile.tsx';
import { Ability } from '@deities/athena/info/Unit.tsx';
import getVectorRadius from '@deities/athena/lib/getVectorRadius.tsx';
import { getEntityGroup } from '@deities/athena/map/Entity.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import { isVector } from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { RadiusItem } from '@deities/athena/Radius.tsx';
import { moveable, MoveConfiguration } from '@deities/athena/Radius.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import maxBy from '@deities/hephaestus/maxBy.tsx';
import minBy from '@deities/hephaestus/minBy.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import getBuildingWeight from './getBuildingWeight.tsx';
import shouldCaptureBuilding from './shouldCaptureBuilding.tsx';

const minByCost = ({ cost }: RadiusItem) => cost;

const config = {
  ...MoveConfiguration,
  getResourceValue: () => Number.POSITIVE_INFINITY,
};

const getPrimaryTarget = (
  targets: ReadonlyArray<Vector>,
  radius: ReadonlyMap<Vector, RadiusItem>,
  adjacent = true,
) =>
  minBy(
    targets.map((vector) => radius.get(vector)).filter(isPresent),
    minByCost,
  ) ||
  // If the target tile is not accessible (mountain, sea, etc.),
  // check the surrounding vectors which might be accessible.
  (adjacent &&
    minBy(
      targets
        .flatMap((target) =>
          target.adjacent().map((vector) => radius.get(vector)),
        )
        .filter(isPresent),
      minByCost,
    )) ||
  null;

const maybeOptimizeTargets = (
  map: MapData,
  unit: Unit,
  radius: ReadonlyMap<Vector, RadiusItem>,
  targets: ReadonlyArray<Vector>,
) => {
  if (targets.length <= 1) {
    return targets;
  }

  if (unit.info.hasAbility(Ability.Capture)) {
    const sortedTargets = sortBy(
      targets.map((vector) => radius.get(vector)).filter(isPresent),
      minByCost,
    );

    if (sortedTargets.length <= 1) {
      return targets;
    }

    const lowestCost = sortedTargets[0].cost;
    let bestWeight = Number.NEGATIVE_INFINITY;
    let bestOption: Vector | null = null;
    for (const currentTarget of sortedTargets) {
      if (currentTarget.cost > lowestCost) {
        break;
      }

      const building = map.buildings.get(currentTarget.vector);
      if (
        shouldCaptureBuilding(map, unit.player, building, currentTarget.vector)
      ) {
        const weight =
          getBuildingWeight(building.info) -
          currentTarget.cost +
          (map.isNeutral(building) ? 0 : 5);

        if (weight > bestWeight) {
          bestWeight = weight;
          bestOption = currentTarget.vector;
        }
      }
    }

    if (bestOption) {
      return [bestOption];
    }
  }

  return targets;
};

export default function estimateClosestTarget(
  map: MapData,
  unit: Unit,
  from: Vector,
  _targets: ReadonlyArray<Vector> | Vector,
  isPendingUnit = false,
): [
  RadiusItem | null,
  ReadonlyMap<Vector, RadiusItem>,
  isObstructed: boolean,
  realTarget?: Vector | null,
  isPendingUnit?: boolean,
] {
  const targets = isVector(_targets) ? [_targets] : _targets;
  let isObstructed = false;
  let realTarget;
  if (!targets.length) {
    return [null, new Map(), isObstructed];
  }

  // Find the closest cluster in terms of travel cost,
  // assuming that no other units are in the way.
  const maxDistance = Math.min(
    vec(1, 1).distance(vec(map.size.width, map.size.height)) * 2,
    (maxBy(targets, (target) => target.distance(from)) || targets[0]).distance(
      from,
    ) * 4,
  );
  let radius = moveable(
    map,
    unit,
    from,
    maxDistance,
    isPendingUnit
      ? {
          ...config,
          isAccessible(map: MapData, unit: Unit, vector: Vector) {
            if (!map.contains(vector)) {
              return false;
            }

            const building = map.buildings.get(vector);
            if (building && !building.info.isAccessibleBy(unit.info)) {
              return false;
            }

            return true;
          },
        }
      : config,
  );

  const navalIsTransportingUnits =
    getEntityGroup(unit) === 'naval' && unit.isTransportingUnits();

  const dropTargets = new Set<Vector>();
  if (navalIsTransportingUnits) {
    for (const target of targets) {
      for (const vector of sortBy(
        getVectorRadius(map, target, 4).filter(
          (vector) =>
            unit.info.canDropFrom(map.getTileInfo(vector)) &&
            MoveConfiguration.isAccessible(map, unit, vector) &&
            !map.units.has(vector),
        ),
        (vector) => vector.distance(target),
      ).slice(0, 2)) {
        dropTargets.add(vector);
      }
    }
  }

  let target =
    (dropTargets.size && getPrimaryTarget([...dropTargets], radius, false)) ||
    getPrimaryTarget(maybeOptimizeTargets(map, unit, radius, targets), radius);

  if (!target || !radius.size) {
    isObstructed = true;
    if (isPendingUnit) {
      return [null, new Map(), isObstructed];
    }

    // Try again without obstacles so we can at least get closer to the target.
    radius = moveable(map, unit, from, maxDistance, {
      ...config,
      getCost: (map, unit, vector) =>
        map.getTile(vector, 1) === Lightning.id
          ? map.getTileInfo(vector, 0).getMovementCost(unit.info)
          : MoveConfiguration.getCost(map, unit, vector),
      isAccessible: (map, _, vector) => {
        if (!map.contains(vector)) {
          return false;
        }

        if (!navalIsTransportingUnits) {
          return true;
        }

        const building = map.buildings.get(vector);
        return (
          !building ||
          building.info.isStructure() ||
          building.info.isAccessibleBy(unit.info)
        );
      },
    });

    target = getPrimaryTarget(targets, radius);

    if (!target && navalIsTransportingUnits) {
      // The goal of the current unit is to find a way for units it is transporting to reach
      // one of its targets. We'll estimate the closest deployable field by assuming the unit is
      // at the target location and inversing its movement radius.
      const transportedUnit = unit.transports[0].deploy();
      const inverseFrom = minBy(targets, (target) => target.distance(from));
      if (inverseFrom) {
        const inverseRadius = moveable(
          map,
          transportedUnit,
          inverseFrom,
          maxDistance,
          {
            ...MoveConfiguration,
            getResourceValue: () => Number.POSITIVE_INFINITY,
          },
        );
        const inverseTargets = [];
        for (const [vector] of inverseRadius) {
          if (
            unit.info.canDropFrom(map.getTileInfo(vector)) &&
            MoveConfiguration.isAccessible(map, unit, vector) &&
            !map.units.has(vector)
          ) {
            inverseTargets.push(vector);
          }
        }
        const inverseTarget = getPrimaryTarget(inverseTargets, radius, false);
        target = (inverseTarget && radius.get(inverseTarget.vector)) || null;
        realTarget = inverseFrom;
      }
    }
  }

  return [target, radius, isObstructed, realTarget || target?.vector || null];
}
