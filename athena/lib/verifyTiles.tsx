import { getTileInfo, Plain, TileLayer } from '../info/Tile.tsx';
import { DecoratorsPerSide } from '../map/Configuration.tsx';
import vec from '../map/vec.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import writeTile from '../mutation/writeTile.tsx';
import canBuild from './canBuild.tsx';
import canPlaceDecorator from './canPlaceDecorator.tsx';
import canPlaceTile from './canPlaceTile.tsx';
import getDecoratorIndex from './getDecoratorIndex.tsx';
import getModifier from './getModifier.tsx';

export default function verifyTiles(map: MapData, vectors: Set<Vector>) {
  const newMap = map.map.slice();
  const newModifiers = map.modifiers.slice();
  let reconcile = true;

  while (reconcile) {
    reconcile = false;
    for (let i = 0; i <= 1; i++) {
      const layer = i as TileLayer;
      // First ensure that the map layout is not problematic.
      vectors.forEach((vector) => {
        const index = map.getTileIndex(vector);
        const tile = map.getTile(vector, layer);
        if (!tile) {
          return;
        }

        const info = getTileInfo(tile);
        writeTile(
          newMap,
          newModifiers,
          index,
          info,
          getModifier(map, vector, info, layer),
        );

        // If the tile has a fallback tile, check if placing this tile on top of the
        // fallback tile is still legal. If not, replace it with the fallback.
        const canPlaceOnFallbackTile = () => {
          const { fallback } = info.style;
          if (!fallback) {
            return true;
          }

          const fallbackMap = newMap.slice();
          const fallbackModifiers = newModifiers.slice();
          writeTile(
            fallbackMap,
            fallbackModifiers,
            index,
            fallback,
            getModifier(map, vector, fallback, layer),
          );
          return canPlaceTile(
            map.copy({
              map: fallbackMap,
              modifiers: fallbackModifiers.slice(),
            }),
            vector,
            info,
          );
        };

        if (
          !canPlaceTile(
            map.copy({ modifiers: newModifiers.slice() }),
            vector,
            info,
          ) ||
          !canPlaceOnFallbackTile()
        ) {
          reconcile = true;
          writeTile(
            newMap,
            newModifiers,
            index,
            layer === 1 ? null : info.style.fallback || Plain,
          );
          map = map.copy({
            map: newMap.slice(),
            modifiers: newModifiers.slice(),
          });

          const building = map.buildings.get(vector);
          const mapWithoutBuilding = map.copy({
            buildings: map.buildings.delete(vector),
          });
          if (
            building &&
            !canBuild(
              mapWithoutBuilding,
              building.info,
              building.player,
              vector,
              true,
            )
          ) {
            map = mapWithoutBuilding;
          }
        }
      });

      // Then recompute all relevant modifiers again.
      vectors.forEach((vector) => {
        const tile = map.getTile(vector, layer);
        if (tile) {
          const info = getTileInfo(tile);
          writeTile(
            newMap,
            newModifiers,
            map.getTileIndex(vector),
            info,
            getModifier(map, vector, info, layer),
          );
        }
      });
    }
  }

  map = map.copy({
    map: newMap.slice(),
    modifiers: newModifiers.slice(),
  });

  const newDecorators = map.decorators.slice();
  const decoratorSize = map.size.toDecoratorSizeVector();
  map.forEachField((vector) => {
    for (let x = 1; x <= DecoratorsPerSide; x++) {
      for (let y = 1; y <= DecoratorsPerSide; y++) {
        const subVector = vec(
          (vector.x - 1) * DecoratorsPerSide + x,
          (vector.y - 1) * DecoratorsPerSide + y,
        );
        const index = getDecoratorIndex(subVector, decoratorSize);
        const decorator = newDecorators[index];
        if (
          decorator &&
          !canPlaceDecorator(
            map,
            vector,
            decorator,
            () => Number.POSITIVE_INFINITY,
          )
        ) {
          newDecorators[index] = 0;
        }
      }
    }
  });

  return map.copy({
    decorators: newDecorators.slice(),
  });
}

export function verifyMap(map: MapData) {
  return verifyTiles(map, new Set(map.mapFields((vector) => vector)));
}
