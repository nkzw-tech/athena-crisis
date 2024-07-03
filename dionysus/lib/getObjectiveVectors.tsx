import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { objectiveHasVectors } from '@deities/athena/Objectives.tsx';

export default function getObjectiveVectors(map: MapData, unit: Unit) {
  const vectors = new Set<Vector>();
  for (const [, objective] of map.config.objectives) {
    if (
      objectiveHasVectors(objective) &&
      (!objective.players || objective.players.includes(unit.player)) &&
      !objective.completed?.has(unit.player) &&
      (!objective.label?.size ||
        (unit.label != null && objective.label.has(unit.label)))
    ) {
      for (const vector of objective.vectors) {
        vectors.add(vector);
      }
    }
  }
  return vectors;
}
