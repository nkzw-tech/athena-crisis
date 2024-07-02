import { BuildableTiles } from '@deities/athena/info/Building.tsx';
import { Beach, isSeaTile } from '@deities/athena/info/Tile.tsx';
import { Ability } from '@deities/athena/info/Unit.tsx';
import { AIBehavior } from '@deities/athena/map/AIBehavior.tsx';
import { EntityType, getEntityGroup } from '@deities/athena/map/Entity.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import getObjectiveVectors from './getObjectiveVectors.tsx';
import needsSupply from './needsSupply.tsx';
import shouldCaptureBuilding from './shouldCaptureBuilding.tsx';

export default function getInterestingVectors(
  map: MapData,
  from: Vector,
  unit: Unit,
): ReadonlyArray<Vector> {
  const { info } = unit;
  const building = map.buildings.get(from);
  const isTransportingUnits = unit.isTransportingUnits();
  const isDefensive =
    (unit.matchesBehavior(AIBehavior.Defense) ||
      unit.matchesBehavior(AIBehavior.Adaptive)) &&
    (!building ||
      !map.matchesTeam(building, unit) ||
      !building?.canBuildUnits(map.getPlayer(unit)));
  const isInDanger =
    !isTransportingUnits &&
    (info.isLongRange() ||
      !info.hasAttack() ||
      (unit.isOutOfAmmo() &&
        !map.units.some(
          (unitB) =>
            map.matchesPlayer(unitB, unit) &&
            unitB.info.abilities.has(Ability.Supply),
        ))) &&
    from.adjacent().some((vector) => {
      const unitB = map.units.get(vector);
      return (
        unitB && map.isNonNeutralOpponent(unit, unitB) && unitB.info.hasAttack()
      );
    });

  const vectors: Array<Vector> = [];

  if (info.hasAbility(Ability.Supply)) {
    for (const [vector, unit] of map.units) {
      if (map.matchesPlayer(unit, map.currentPlayer) && needsSupply(unit)) {
        vectors.push(vector);
      }
    }
  }

  if (info.hasAbility(Ability.Capture) && !isDefensive) {
    for (const [vector, building] of map.buildings) {
      if (shouldCaptureBuilding(map, unit.player, building, vector)) {
        vectors.push(vector);
      }
    }
  }

  if (info.hasAbility(Ability.CreateBuildings)) {
    map.forEachField((vector) => {
      if (
        BuildableTiles.has(map.getTileInfo(vector)) &&
        !map.buildings.has(vector)
      ) {
        vectors.push(vector);
      }
    });
  }

  if (isInDanger) {
    for (const [vector, building] of map.buildings) {
      if (
        map.matchesPlayer(unit, building) &&
        (building.info.isHQ() ||
          building.info.canHeal(unit.info) ||
          building.canBuildUnits(map.getPlayer(unit)))
      ) {
        vectors.push(vector);
      }
    }
  }

  vectors.push(...getObjectiveVectors(map, unit));

  if (isDefensive) {
    for (const [vector, building] of map.buildings) {
      if (map.matchesPlayer(unit, building)) {
        vectors.push(vector);
      }
    }

    if (!vectors.length) {
      for (const [vector, unitB] of map.units) {
        if (map.matchesTeam(unit, unitB) && !vector.equals(from)) {
          vectors.push(vector);
        }
      }
    }

    if (!vectors.length) {
      for (const [vector, building] of map.buildings) {
        if (map.matchesTeam(unit, building)) {
          vectors.push(vector);
        }
      }
    }
    return [...new Set(vectors)];
  }

  if (unit.info.canTransportUnits()) {
    if (isTransportingUnits) {
      // Consider either offensive or defensive units but not both at the same time.
      const transports = unit.transports.some((transportedUnit) =>
        transportedUnit.info.hasAttack(),
      )
        ? unit.transports.filter((transportedUnit) =>
            transportedUnit.info.hasAttack(),
          )
        : unit.transports;

      // Do not consider ships as interesting vectors for transported units. This ensures that
      // transport units don't try to follow opposing units.
      const entityGroup = getEntityGroup(unit);
      const shouldFilterMap = entityGroup === 'naval' || entityGroup === 'air';
      const buildings = shouldFilterMap
        ? map.buildings.filter(
            (building) => building.info.isHQ() || building.label != null,
          )
        : map.buildings;

      const subsetMap = shouldFilterMap
        ? map.copy({
            buildings: buildings.size ? buildings : map.buildings,
            units: map.units.filter((unit, vector) => {
              if (unit.info.type === EntityType.Ship) {
                return false;
              }

              if (getEntityGroup(unit) === 'land') {
                return true;
              }

              const tile = map.getTileInfo(vector);
              return tile.id === Beach.id || !isSeaTile(tile);
            }),
          })
        : map;

      vectors.push(
        ...transports.flatMap((transportedUnit) =>
          getInterestingVectors(subsetMap, from, transportedUnit.deploy()),
        ),
      );
    } else {
      vectors.push(
        ...map.units
          .filter(
            (unitB, vector) =>
              map.matchesPlayer(unit, unitB) &&
              unit.info.canTransportUnitType(unitB.info) &&
              vector.distance(from) >
                unitB.info.getRadiusFor(map.getPlayer(unitB)) &&
              !vector.adjacentWithDiagonals().some((vector) => {
                const unitC = map.units.get(vector);
                return unitC && map.isNonNeutralOpponent(unit, unitC);
              }),
          )
          .keys(),
      );
    }
  }

  if (info.hasAttack()) {
    const units = map.units.filter((unitB) =>
      map.isNonNeutralOpponent(unit, unitB),
    );
    if (units.size) {
      vectors.push(...units.keys());
    } else {
      vectors.push(
        ...map.buildings
          .filter((buildingB) => map.isNonNeutralOpponent(unit, buildingB))
          .keys(),
      );
    }
  }

  return [...new Set(vectors)];
}
