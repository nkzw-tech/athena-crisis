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
  getCost(map: MapData, unit: Unit, vector: Vector): number;
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

function isAccessibleBase(map: MapData, unit: Unit, vector: Vector) {
  if (!map.contains(vector)) {
    return false;
  }

  const unitB = map.units.get(vector);
  if (unitB && map.isOpponent(unitB, unit)) {
    return false;
  }

  const building = map.buildings.get(vector);
  if (building && !building.info.isAccessibleBy(unit.info)) {
    return false;
  }

  return true;
}

export const MoveConfiguration = {
  getCost: (map: MapData, unit: Unit, vector: Vector) =>
    map.maybeGetTileInfo(vector)?.getMovementCost(unit.info) || -1,
  getResourceValue: (unit: Unit) => unit.fuel,
  getTransitionCost: (info: UnitInfo, current: TileInfo, parent: TileInfo) =>
    (current.group !== parent.group &&
      parent.getTransitionCost(info) + current.getTransitionCost(info)) ||
    0,
  isAccessible: isAccessibleBase,
} as const;

const VisionConfiguration = {
  getCost: (map: MapData, unit: Unit, vector: Vector) =>
    map.maybeGetTileInfo(vector)?.configuration.vision || -1,
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
    getCost,
    getResourceValue,
    getTransitionCost,
    isAccessible,
  }: RadiusConfiguration = MoveConfiguration,
): Map<Vector, RadiusItem> {
  const { info } = unit;
  const closed = new Array(map.size.width * map.size.height);
  const paths = new Map<Vector, RadiusItem>();
  const queue = new FastPriorityQueue<RadiusItem>((a, b) => a.cost < b.cost);
  queue.add(RadiusItem(start));

  while (!queue.isEmpty()) {
    const { cost: parentCost, vector } = queue.poll()!;
    const index = map.getTileIndex(vector);
    if (closed[index]) {
      continue;
    }
    closed[index] = true;

    const vectors = vector.adjacent();
    for (let i = 0; i < vectors.length; i++) {
      const currentVector = vectors[i];
      if (!map.contains(currentVector)) {
        continue;
      }
      const currentIndex = map.getTileIndex(currentVector);
      if (closed[currentIndex]) {
        continue;
      }
      const cost = getCost(map, unit, currentVector);
      if (cost < 0 || !isAccessible(map, unit, currentVector)) {
        closed[currentIndex] = true;
        continue;
      }
      const nextCost =
        parentCost +
        cost +
        getTransitionCost(
          info,
          map.getTileInfo(vector),
          map.getTileInfo(currentVector),
        );
      const previousPath = paths.get(currentVector);
      if (
        nextCost <= radius &&
        (!previousPath || nextCost < previousPath.cost) &&
        nextCost <= getResourceValue(unit)
      ) {
        const item = {
          cost: nextCost,
          parent: vector,
          vector: currentVector,
        };
        paths.set(currentVector, item);
        if (nextCost < radius) {
          queue.add(item);
        }
      }
    }
  }
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
      getTransitionCost(
        info,
        map.getTileInfo(vector),
        map.getTileInfo(previousVector),
      );

    if (totalCost > radius || totalCost > getResourceValue(unit)) {
      return -1;
    }

    previousVector = vector;
  }

  const unitB = map.units.get(previousVector);
  return !unitB || canLoad(map, unitB, unit, previousVector) ? totalCost : -1;
}

export function visible(
  map: MapData,
  unit: Unit,
  start: Vector,
  radius: number = unit.info.configuration.vision,
): ReadonlyMap<Vector, RadiusItem> {
  const vision =
    radius +
    (unit.isUnfolded()
      ? 2
      : unit.info.type === EntityType.Infantry &&
          map.getTileInfo(start).type & TileTypes.Mountain
        ? 1
        : 0);

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
        for (let i = 0; i < vectors.length; i++) {
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
