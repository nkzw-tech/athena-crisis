import { BuildableTiles } from '../info/Building.tsx';
import MapData from '../MapData.tsx';

export default function getBuildableTileCount(map: MapData) {
  return map.reduceEachField(
    (sum, vector) =>
      sum +
      (BuildableTiles.has(map.getTileInfo(vector)) && !map.buildings.has(vector)
        ? 1
        : 0),
    0,
  );
}
