import { Lightning } from '../info/Tile.tsx';
import getModifier from '../lib/getModifier.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import writeTile from './writeTile.tsx';

export default function toggleLightningTile(map: MapData, vector: Vector) {
  const newMap = map.map.slice();
  const newModifiers = map.modifiers.slice();

  writeTile(
    newMap,
    newModifiers,
    map.getTileIndex(vector),
    map.getTileInfo(vector) === Lightning ? null : Lightning,
    getModifier(map, vector, Lightning, Lightning.style.layer),
  );

  return map.copy({
    map: newMap,
    modifiers: newModifiers,
  });
}
