import getFirstOrThrow from '@nkzw/core/getFirstOrThrow.js';
import ImmutableMap from '@nkzw/immutable-map';
import Building from '../map/Building.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import writeTile from '../mutation/writeTile.tsx';
import withModifiers from './withModifiers.tsx';

export default function spawnBuildings(
  map: MapData,
  buildings: ImmutableMap<Vector, Building> | undefined,
) {
  if (buildings?.size) {
    const tileMap = map.map.slice();
    const modifiers = map.modifiers.slice();
    for (const [vector, building] of buildings) {
      const { editorPlaceOn, placeOn } = building.info.configuration;
      const tiles = new Set([...(placeOn || []), ...editorPlaceOn]);
      if (!tiles.has(map.getTileInfo(vector))) {
        writeTile(
          tileMap,
          modifiers,
          map.getTileIndex(vector),
          getFirstOrThrow(tiles),
        );
      }
    }
    return withModifiers(
      map.copy({ buildings: map.buildings.merge(buildings), map: tileMap }),
    );
  }

  return map;
}
