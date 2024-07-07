import FastPriorityQueue from 'fastpriorityqueue';
import { Skill } from './info/Skill.tsx';
import { TileInfo, TileTypes } from './info/Tile.tsx';
import { UnitInfo } from './info/Unit.tsx';
import canLoad from './lib/canLoad.tsx';
import getVectorRadius from './lib/getVectorRadius.tsx';
import { EntityType } from './map/Entity.tsx';
import Unit from './map/Unit.tsx';
import vec from './map/vec.tsx';
import Vector from './map/Vector.tsx';
import MapData from './MapData.tsx';

type RadiusConfiguration = {
  getCost(map: MapData, unit: Unit, vector: Vector, index?: number): number;
  getResourceValue(unit: Unit): number;
  getTransitionCost(
    info: UnitInfo,
    current: TileInfo,
    parent: TileInfo,
  ): number;
  isAccessible(map: MapData, unit: Unit, vector: Vector): boolean;
};

export type RadiusItem = Readonly<{
  cost: number;
  parent: Vector | null;
  vector: Vector;
}>;

export const RadiusItem = (
  vector: Vector,
  cost: number = 0,
  parent?: Vector | null,
) => ({
  cost,
  parent: parent && !vector.equals(parent) ? parent : null,
  vector,
});

const cacheMap = new Map();

function getCostBase(map: MapData, unit: Unit, vector: Vector, index?: number) {
  const tileInfo = map.maybeGetTileInfo(vector, undefined, index);
  return tileInfo ? tileInfo.getMovementCost(unit.info) : -1;
}

function getTransitionCostBase(
  info: UnitInfo,
  current: TileInfo,
  parent: TileInfo,
) {
  if (parent.group !== current.group) {
    return parent.getTransitionCost(info) + current.getTransitionCost(info);
  }
  return 0;
}

function isAccessibleBase(map: MapData, unit: Unit, vector: Vector) {
  const unitB = map.units.get(vector);
  if (unitB && map.isOpponent(unitB, unit)) {
    return false;
  }
  const building = map.buildings.get(vector);
  return !(building && !building.info.isAccessibleBy(unit.info));
}

function isAccessible(map: MapData, unit: Unit, vector: Vector) {
  const key = vector.toJSON();
  let accessible = cacheMap.get(key);
  if (accessible != null) {
    return accessible;
  }
  accessible = isAccessibleBase(map, unit, vector);
  cacheMap.set(key, accessible);
  return accessible;
}

export const MoveConfiguration = {
  getCost: getCostBase,
  getResourceValue: (unit: Unit) => unit.fuel,
  getTransitionCost: getTransitionCostBase,
  isAccessible,
} as const;

const VisionConfiguration = {
  getCost: (map: MapData, unit: Unit, vector: Vector, index?: number) =>
    map.maybeGetTileInfo(vector, undefined, index)?.configuration.vision || -1,
  getResourceValue: () => Number.POSITIVE_INFINITY,
  getTransitionCost: () => 0,
  isAccessible: (map: MapData, unit: Unit, vector: Vector) =>
    map.contains(vector),
} as const;

function calculateRadius(
  map: MapData,
  unit: Unit,
  start: Vector,
  radius: number,
  {
    getResourceValue,
    getTransitionCost,
    isAccessible,
  }: RadiusConfiguration = MoveConfiguration,
): Map<Vector, RadiusItem> {
  const closed: { [key: number]: 1 } = {};
  const paths = new Map<Vector, RadiusItem>();
  const queue = new FastPriorityQueue<RadiusItem>((a, b) => a.cost < b.cost);
  const minRadius = Math.min(radius, getResourceValue(unit));
  queue.add(RadiusItem(start));

  let index: number = map.getTileIndex(start);
  do {
    const { cost: parentCost, vector } = queue.poll()!;
    index = map.getTileIndex(vector);
    if (closed[index]) {
      continue;
    }
    closed[index] = 1;

    const vectors = vector.adjacent();
    const parentTileInfo = map.getTileInfo(vector, undefined, index);
    for (const currentVector of vectors) {
      if (!map.contains(currentVector)) {
        continue;
      }
      const currentIndex = map.getTileIndex(currentVector);
      if (closed[currentIndex]) {
        continue;
      }
      const currentTileInfo = map.getTileInfo(
        currentVector,
        undefined,
        currentIndex,
      );
      const cost = currentTileInfo.getMovementCost(unit.info);
      if (cost < 0 || !isAccessible(map, unit, currentVector)) {
        closed[currentIndex] = 1;
        continue;
      }
      const nextCost =
        parentCost +
        cost +
        getTransitionCost(unit.info, parentTileInfo, currentTileInfo);
      if (nextCost > minRadius) {
        continue;
      }
      const previousPath = paths.get(currentVector);
      if (!previousPath || nextCost < previousPath.cost) {
        const item = RadiusItem(currentVector, nextCost, vector);
        paths.set(currentVector, item);
        if (nextCost < radius) {
          queue.add(item);
        }
      }
    }
  } while (!queue.isEmpty());
  return paths;
}

export function moveable(
  map: MapData,
  unit: Unit,
  start: Vector,
  radius: number = unit.info.getRadiusFor(map.getPlayer(unit)),
  configuration: RadiusConfiguration = MoveConfiguration,
  withStart = false,
): ReadonlyMap<Vector, RadiusItem> {
  const moveable = calculateRadius(map, unit, start, radius, configuration);
  if (withStart) {
    moveable.set(start, RadiusItem(start));
  }
  return moveable;
}

export function getPathCost(
  map: MapData,
  unit: Unit,
  start: Vector,
  path: ReadonlyArray<Vector>,
  radius: number = unit.info.getRadiusFor(map.getPlayer(unit)),
  {
    getCost,
    getResourceValue,
    getTransitionCost,
    isAccessible,
  }: RadiusConfiguration = MoveConfiguration,
) {
  const { info } = unit;
  const seen = new Set([start]);
  let previousVector = start;
  let totalCost = 0;
  const previousVectorTileInfo = map.getTileInfo(previousVector);

  for (const vector of path) {
    if (seen.has(vector) || !map.contains(vector)) {
      return -1;
    }

    seen.add(vector);
    if (previousVector.distance(vector) > 1) {
      return -1;
    }

    const cost = getCost(map, unit, vector);
    if (cost < 0 || !isAccessible(map, unit, vector)) {
      return -1;
    }

    totalCost +=
      cost +
      getTransitionCost(info, map.getTileInfo(vector), previousVectorTileInfo);

    if (totalCost > radius || totalCost > getResourceValue(unit)) {
      return -1;
    }

    previousVector = vector;
  }

  const unitB = map.units.get(previousVector);
  return !unitB || canLoad(map, unitB, unit, previousVector) ? totalCost : -1;
}

function getVisionRange(
  map: MapData,
  unit: Unit,
  start: Vector,
  radius: number,
) {
  const range = unit.isUnfolded()
    ? 2
    : unit.info.type === EntityType.Infantry &&
        map.getTileInfo(start).type & TileTypes.Mountain
      ? 1
      : 0;
  return radius + range;
}

export function visible(
  map: MapData,
  unit: Unit,
  start: Vector,
  radius: number = unit.info.configuration.vision,
): ReadonlyMap<Vector, RadiusItem> {
  const vision = getVisionRange(map, unit, start, radius);
  const visible = calculateRadius(
    map,
    unit,
    start,
    vision,
    VisionConfiguration,
  );
  const player = map.getPlayer(unit);
  const canSeeHiddenFields =
    player.activeSkills.size &&
    player.activeSkills.has(Skill.UnitInfantryForestDefenseIncrease);

  for (const [vector] of visible) {
    if (
      !canSeeHiddenFields &&
      vector.distance(start) > 1 &&
      map.getTileInfo(vector).style.hidden
    ) {
      visible.delete(vector);
    }
  }

  for (const vector of start.expand()) {
    if (map.contains(vector)) {
      visible.set(vector, RadiusItem(vector));
    }
  }
  return visible;
}

export function attackable(
  map: MapData,
  unit: Unit,
  start: Vector,
  optimize: 'cost' | 'cover',
  radius?: number,
): ReadonlyMap<Vector, RadiusItem> {
  const player = map.getPlayer(unit);
  if (radius == null) {
    radius = unit.info.getRadiusFor(player);
  }

  const { info } = unit;
  const attackable = new Map<Vector, RadiusItem>();
  if (!info.hasAttack()) {
    return attackable;
  }

  const range = info.getRangeFor(player);
  if (info.isLongRange() && range) {
    const [low, high] = range;
    for (let x = 0; x <= high; x++) {
      for (let y = 0; y <= high - x; y++) {
        const v1 = vec(start.x + x, start.y + y);
        if (start.distance(v1) >= low) {
          const s2 = { x: start.x + x, y: start.y - y };
          const v2 = map.contains(s2) && vec(s2.x, s2.y);
          const s3 = { x: start.x - x, y: start.y + y };
          const v3 = map.contains(s3) && vec(s3.x, s3.y);
          const s4 = { x: start.x - x, y: start.y - y };
          const v4 = map.contains(s4) && vec(s4.x, s4.y);
          if (map.contains(v1)) {
            attackable.set(v1, RadiusItem(v1));
          }
          if (v2) {
            attackable.set(v2, RadiusItem(v2));
          }
          if (v3) {
            attackable.set(v3, RadiusItem(v3));
          }
          if (v4) {
            attackable.set(v4, RadiusItem(v4));
          }
        }
      }
    }
  }

  if (info.isShortRange() || info.canAttackAt(1, range)) {
    for (const currentVector of start.adjacent()) {
      if (map.contains(currentVector)) {
        attackable.set(
          currentVector,
          RadiusItem(
            currentVector,
            map.getTileInfo(currentVector).configuration.cover,
            start,
          ),
        );
      }
    }

    if (unit.canMove()) {
      const moveable = calculateRadius(map, unit, start, radius);
      for (const [, parent] of moveable) {
        const parentCost =
          optimize === 'cover'
            ? -map.getTileInfo(parent.vector).configuration.cover
            : parent.cost;
        const unitB = map.units.get(parent.vector);
        // If there is a unit that you own, and it hasn't moved yet,
        // you can move it out of the way to make the fields around it attackable.
        if (
          unitB &&
          ((unitB.hasMoved() && map.matchesPlayer(unitB, unit)) ||
            !map.isOpponent(unitB, unit))
        ) {
          continue;
        }

        const vectors = parent.vector.adjacent();
        const len = vectors.length;
        for (let i = 0; i < len; i++) {
          const vector = vectors[i];
          if (map.contains(vector)) {
            const itemB = attackable.get(vector);
            if (
              !itemB ||
              (parentCost < itemB.cost && vector.distance(start) > 1)
            ) {
              attackable.set(
                vector,
                RadiusItem(vector, parentCost, parent.vector),
              );
            }
          }
        }
      }

      if (info.isLongRange() && info.canAttackAt(2, range)) {
        const canAttackLargeArea = info.canAttackAt(3, range);
        for (const [, item] of Array.from(moveable)) {
          const list = canAttackLargeArea
            ? getVectorRadius(map, item.vector, 3)
            : item.vector.adjacentStar();

          for (const vector of list) {
            const currentAttackable = attackable.get(vector);
            if (
              map.contains(vector) &&
              (!currentAttackable ||
                (currentAttackable.parent &&
                  map.units.has(currentAttackable.parent) &&
                  !map.units.has(item.vector)))
            ) {
              attackable.set(
                vector,
                RadiusItem(vector, item.cost, item.vector),
              );
            }
          }
        }
      }
    }
  }

  return attackable;
}
