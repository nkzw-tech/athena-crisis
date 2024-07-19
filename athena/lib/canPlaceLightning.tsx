import { Lightning, StormCloud } from '../info/Tile.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import canPlaceTile from './canPlaceTile.tsx';

export default function canPlaceLightning(map: MapData, vector: Vector) {
  const tile = map.getTileInfo(vector);
  const unit = map.units.get(vector);
  return (
    tile !== StormCloud &&
    tile !== Lightning &&
    !map.buildings.has(vector) &&
    (!unit || !map.matchesTeam(map.getCurrentPlayer(), unit)) &&
    canPlaceTile(map, vector, Lightning)
  );
}
