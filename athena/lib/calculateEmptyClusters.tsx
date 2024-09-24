import MapData from '../MapData.tsx';
import calculateClusters from './calculateClusters.tsx';

export default function calculateEmptyClusters(map: MapData) {
  const movementTypes = [
    ...new Set(map.units.map((unit) => unit.info.movementType).values()),
  ];
  const occupied = new Set(
    [
      ...map.units.keys(),
      ...map.buildings.filter((building) => building.info.isHQ()).keys(),
    ].flatMap((vector) => vector.expandWithDiagonals()),
  );
  return calculateClusters(
    map.size,
    map
      .mapFields((vector) => vector)
      .filter(
        (vector) =>
          !occupied.has(vector) &&
          movementTypes.some(
            (movementType) =>
              map.getTileInfo(vector).getMovementCost({ movementType }) !== -1,
          ),
      ),
  );
}
