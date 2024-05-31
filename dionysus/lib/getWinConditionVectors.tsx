import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { winConditionHasVectors } from '@deities/athena/WinConditions.tsx';

export default function getWinConditionVectors(map: MapData, unit: Unit) {
  const vectors = new Set<Vector>();
  for (const condition of map.config.winConditions) {
    if (
      winConditionHasVectors(condition) &&
      (!condition.players || condition.players.includes(unit.player)) &&
      !condition.completed?.has(unit.player) &&
      (!condition.label?.size ||
        (unit.label != null && condition.label.has(unit.label)))
    ) {
      for (const vector of condition.vectors) {
        vectors.add(vector);
      }
    }
  }
  return vectors;
}
