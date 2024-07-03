import { BuildableTiles } from '@deities/athena/info/Building.tsx';
import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria, objectiveHasVectors } from '@deities/athena/Objectives.tsx';
import { PotentialUnitAbilities } from './getPossibleUnitAbilities.tsx';
import needsSupply from './needsSupply.tsx';
import shouldCaptureBuilding from './shouldCaptureBuilding.tsx';

export default function getInterestingVectorsByAbilities(
  map: MapData,
  currentPlayer: Player,
  label: PlayerID | null,
  {
    canCreateBuildUnits,
    canCreateCaptureUnits,
    canCreateSupplyUnits,
  }: PotentialUnitAbilities,
): ReadonlyArray<Vector> {
  const vectors: Array<Vector> = [];

  if (canCreateSupplyUnits) {
    for (const [vector, unit] of map.units) {
      if (map.matchesPlayer(unit, map.currentPlayer) && needsSupply(unit)) {
        vectors.push(vector);
      }
    }
  }

  if (canCreateCaptureUnits) {
    for (const [vector, building] of map.buildings) {
      if (shouldCaptureBuilding(map, currentPlayer.id, building, vector)) {
        vectors.push(vector);
      }
    }
  }

  if (canCreateBuildUnits) {
    map.forEachField((vector) => {
      if (
        BuildableTiles.has(map.getTileInfo(vector)) &&
        !map.buildings.has(vector)
      ) {
        vectors.push(vector);
      }
    });
  }

  for (const [, objective] of map.config.objectives) {
    if (
      objective.type !== Criteria.Default &&
      (!objective.players || objective.players.includes(currentPlayer.id))
    ) {
      if (
        objectiveHasVectors(objective) &&
        (!objective.label?.size ||
          (label != null && objective.label.has(label)))
      ) {
        vectors.push(...objective.vectors);
      }
    }
  }

  const units = map.units.filter((unitB) =>
    map.isNonNeutralOpponent(currentPlayer, unitB),
  );
  if (units.size) {
    vectors.push(...units.keys());
  } else {
    vectors.push(
      ...map.buildings
        .filter((buildingB) =>
          map.isNonNeutralOpponent(currentPlayer, buildingB),
        )
        .keys(),
    );
  }

  return [...new Set(vectors)];
}
