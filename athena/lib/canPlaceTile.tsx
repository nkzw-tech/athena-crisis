import {
  Beach,
  DeepSea,
  GasBubbles,
  getTileInfo,
  Iceberg,
  Island,
  isSea,
  Lightning,
  MaybeTileID,
  Pier,
  Pipe,
  Reef,
  River,
  Sea,
  ShipyardConstructionSite,
  StormCloud,
  TileInfo,
  TileTypes,
  Trench,
  Weeds,
} from '../info/Tile.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import getBiomeStyle from './getBiomeStyle.tsx';
import getModifier, { getWaterfallModifier } from './getModifier.tsx';
import { Modifier } from './Modifier.tsx';

// The order matches `vector.adjacent()`.
const PierModifiers = [
  new Set([Modifier.SingleConnectingTailUp, Modifier.ConnectingTailUp]),
  new Set([Modifier.SingleConnectingTailRight, Modifier.ConnectingTailRight]),
  new Set([Modifier.SingleConnectingTailDown, Modifier.ConnectingTailDown]),
  new Set([Modifier.SingleConnectingTailLeft, Modifier.ConnectingTailLeft]),
];

const isRiver = (tile: MaybeTileID) => !tile || tile === River.id;
const isTrench = (tile: MaybeTileID) => !tile || tile === Trench.id;

const canPlacePier = (map: MapData, vector: Vector, modifier: Modifier) => {
  if (!(map.getTileInfo(vector, 0).type & TileTypes.Sea)) {
    return false;
  }

  if (
    vector.adjacent().some((vector, index) => {
      const tile = map.getTile(vector, 0);
      return (
        tile &&
        !(getTileInfo(tile).type & TileTypes.Sea) &&
        !PierModifiers[index].has(modifier)
      );
    })
  ) {
    return false;
  }
  return true;
};

export default function canPlaceTile(
  map: MapData,
  vector: Vector,
  tile: TileInfo,
): boolean {
  if (
    !map.contains(vector) ||
    getBiomeStyle(map.config.biome).tileRestrictions?.has(tile)
  ) {
    return false;
  }

  const { layer } = tile.style;
  if (
    tile === Reef ||
    tile === Island ||
    tile === Iceberg ||
    tile === Weeds ||
    tile == GasBubbles
  ) {
    if (
      tile === Island &&
      map.getTileInfo(vector, 0).type & TileTypes.DeepSea
    ) {
      return false;
    }

    return vector
      .expandWithDiagonals()
      .every(
        (vector) =>
          !map.getTile(vector, 0) ||
          map.getTileInfo(vector, 0).type & TileTypes.Sea,
      );
  }

  if (tile === Lightning) {
    const [up, right, down, left] = vector
      .adjacent()
      .map((vector) => map.getTile(vector, 1) === StormCloud.id);

    return (up && down && !left && !right) || (left && right && !up && !down);
  }

  if (tile === DeepSea) {
    return vector.adjacentWithDiagonals().every((vector) => {
      const tile = map.getTile(vector, 0);
      return !tile || isSea(tile) || tile === DeepSea.id;
    });
  }

  if (tile === Beach) {
    const currentTile = map.getTileInfo(vector, layer);
    return (
      (currentTile === Sea || currentTile === Beach) &&
      tile.sprite.modifiers.has(map.getModifier(vector, layer))
    );
  }

  if (tile === StormCloud || tile === Pier || tile === Pipe) {
    const modifier = getModifier(map, vector, tile, layer);
    return tile === Pier
      ? canPlacePier(map, vector, modifier)
      : tile.sprite.modifiers.has(modifier);
  }

  if (tile === ShipyardConstructionSite) {
    const layer0Tile = map.getTileInfo(vector, 0);
    const currentTile = map.getTile(vector, layer);
    return currentTile &&
      getTileInfo(currentTile).type & TileTypes.Pier &&
      layer0Tile.type & TileTypes.Sea &&
      canPlacePier(map, vector, getModifier(map, vector, tile, layer))
      ? tile.sprite.modifiers.has(map.getModifier(vector, layer))
      : false;
  }

  if (tile.type & TileTypes.Bridge && tile.style.connectsWith) {
    const connectionTile = tile.style.connectsWith;
    const isConnectedWith = (tile: MaybeTileID) => tile === connectionTile.id;
    const isConnectedType = (tile: MaybeTileID) =>
      !!(tile && getTileInfo(tile).group & connectionTile.type);

    const currentTile = map.getTileInfo(vector, 0);
    const [up, right, down, left] = vector.adjacent().map((vector) => {
      if (!map.contains(vector)) {
        return null;
      }
      const layer1Tile = map.contains(vector) && map.getTile(vector, 1);
      if (isConnectedType(layer1Tile)) {
        return layer1Tile;
      }

      // For the purpose of placing bridges, consider waterfalls as rivers.
      const layer0Tile = map.getTileInfo(vector, 0);
      return getWaterfallModifier(map, vector, layer0Tile, 0)
        ? River.id
        : layer0Tile.id;
    });
    const horizontal = [left, right].every(isConnectedWith);
    const vertical = [up, down].every(isConnectedWith);
    if (currentTile === River) {
      return (
        (horizontal && [up, down].every(isRiver)) ||
        (vertical && [left, right].every(isRiver))
      );
    } else if (currentTile === Trench) {
      return (
        (horizontal && [up, down].every(isTrench)) ||
        (vertical && [left, right].every(isTrench))
      );
    } else if (currentTile.type & TileTypes.Sea) {
      if (
        (horizontal && [up, down].every(isSea)) ||
        (vertical && [left, right].every(isSea))
      ) {
        return true;
      }

      if (
        (isConnectedWith(up) ||
          [up, map.getTile(vector.up(2))].every(isConnectedType)) &&
        ![left, right].some(isConnectedType)
      ) {
        return true;
      }
      if (
        (isConnectedWith(down) ||
          [down, map.getTile(vector.down(2))].every(isConnectedType)) &&
        ![left, right].some(isConnectedType)
      ) {
        return true;
      }
      if (
        (isConnectedWith(left) ||
          [left, map.getTile(vector.left(2))].every(isConnectedType)) &&
        ![up, down].some(isConnectedType)
      ) {
        return true;
      }
      if (
        (isConnectedWith(right) ||
          [right, map.getTile(vector.right(2))].every(isConnectedType)) &&
        ![up, down].some(isConnectedType)
      ) {
        return true;
      }
    }

    return false;
  }

  return true;
}
