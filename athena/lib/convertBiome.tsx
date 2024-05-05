import { TileInfo } from '../info/Tile.tsx';
import { Biome } from '../map/Biome.tsx';
import MapData from '../MapData.tsx';
import writeTile from '../mutation/writeTile.tsx';
import getBiomeStyle from './getBiomeStyle.tsx';
import { verifyMap } from './verifyTiles.tsx';
import withModifiers from './withModifiers.tsx';

export default function convertBiome(map: MapData, biome: Biome) {
  const fromBiome = getBiomeStyle(map.config.biome);
  const toBiome = getBiomeStyle(biome);

  const reversedConversions = new Map<TileInfo, TileInfo>();
  if (fromBiome.tileConversions) {
    for (const [from, to] of fromBiome.tileConversions) {
      if (!reversedConversions.has(to)) {
        reversedConversions.set(to, from);
      }
    }
  }

  map = map.copy({ config: map.config.copy({ biome }) });
  const newMap = map.map.slice();
  const newModifiers = map.modifiers.slice();

  map.forEachTile((vector, tile, layer) => {
    const reversedTile = reversedConversions.get(tile);
    let newTile = reversedTile || tile;
    const toTile = toBiome.tileConversions?.get(newTile);
    newTile = toTile || newTile;
    writeTile(newMap, newModifiers, map.getTileIndex(vector), newTile, layer);
  });

  map = verifyMap(
    withModifiers(map.copy({ map: newMap, modifiers: newModifiers })),
  );

  return map.copy({
    units: map.units.filter(
      (unit, vector) =>
        map.getTileInfo(vector).getMovementCost(unit.info) !== -1,
    ),
  });
}
