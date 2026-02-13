import maxBy from '@nkzw/core/maxBy.js';
import { Barracks, SpawnPlatform } from '../info/Building.tsx';
import Player, { PlayerID, PlayerIDSet } from '../map/Player.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import { Criteria, Objectives } from '../Objectives.tsx';
import getVectorRadius from './getVectorRadius.tsx';

const getIgnoredLabels = (objectives: Objectives): PlayerIDSet | null => {
  let labels: Set<PlayerID> | null = null;
  for (const [, objective] of objectives) {
    if (objective.type === Criteria.DestroyLabel && objective.label) {
      for (const label of objective.label) {
        if (!labels) {
          labels = new Set();
        }

        labels.add(label);
      }
    }
  }
  return labels;
};

export default function pickNewHQ(map: MapData, player: PlayerID | Player) {
  const ignoredLabels = getIgnoredLabels(map.config.objectives);
  const possibleVectors = new Set<Vector>();
  for (const [vector, building] of map.buildings) {
    if (
      map.matchesPlayer(building, player) &&
      (building.id === Barracks.id || building.id === SpawnPlatform.id) &&
      (building.label == null || !ignoredLabels?.has(building.label))
    ) {
      const unit = map.units.get(vector);
      if (!unit || map.matchesTeam(unit, player)) {
        possibleVectors.add(vector);
      }
    }
  }

  return maxBy(
    [...possibleVectors].map(
      (vector) =>
        [
          vector,
          getVectorRadius(map, vector, 4).reduce((sum, vector) => {
            const unit = map.units.get(vector);
            return unit
              ? sum + (map.matchesPlayer(unit, player) ? 2 : map.matchesTeam(unit, player) ? 1 : -2)
              : sum;
          }, 0),
        ] as const,
    ),
    ([, count]) => count,
  )?.[0];
}
