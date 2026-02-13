import MapData from '../MapData.tsx';
import { UnitsWithPosition } from './getUnitsByPositions.tsx';

export default function refillUnits(map: MapData, unitsToRefill: UnitsWithPosition): MapData {
  return map.copy({
    units: map.units.withMutations((units) => {
      for (const [vector, unit] of unitsToRefill) {
        units.set(vector, unit.refill());
      }
    }),
  });
}
