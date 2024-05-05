import { Plain, RailBridge, RailTrack, River } from '../info/Tile.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import canPlaceTile from './canPlaceTile.tsx';

export default function canPlaceRailTrack(map: MapData, vector: Vector) {
  if (map.buildings.has(vector)) {
    return false;
  }

  const tile = map.getTileInfo(vector);
  const filter = (vector: Vector) =>
    map.contains(vector) && map.getTileInfo(vector) === RailTrack;
  if (tile.id === Plain.id) {
    return (
      canPlaceTile(map, vector, RailTrack) && vector.adjacent().some(filter)
    );
  }

  if (tile.id === River.id) {
    const vertical = [vector.up(), vector.down()].filter(filter);
    const horizontal = [vector.left(), vector.right()].filter(filter);
    return (
      canPlaceTile(map, vector, RailBridge) &&
      ((vertical.length === 2 && horizontal.length === 0) ||
        (horizontal.length === 2 && vertical.length === 0))
    );
  }

  return false;
}
