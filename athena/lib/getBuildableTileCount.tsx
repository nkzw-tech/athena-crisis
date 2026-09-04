import { BuildableTiles } from '../info/Building.tsx';
import MapData from '../MapData.tsx';
import reduceIterable from './reduceIterable.tsx';

export default function getBuildableTileCount(map: MapData) {
  return reduceIterable(
    map.fields(),
    (sum, vector) =>
      sum + (BuildableTiles.has(map.getTileInfo(vector)) && !map.buildings.has(vector) ? 1 : 0),
    0,
  );
}
