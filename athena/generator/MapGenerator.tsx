import isPresent from '@deities/hephaestus/isPresent.tsx';
import minBy from '@deities/hephaestus/minBy.tsx';
import random from '@deities/hephaestus/random.tsx';
import randomEntry from '@deities/hephaestus/randomEntry.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import arrayShuffle from 'array-shuffle';
import {
  Barracks,
  Factory,
  HorizontalBarrier,
  House,
  HQ,
  VerticalBarrier,
} from '../info/Building.tsx';
import {
  Beach,
  Bridge,
  ConstructionSite,
  Forest,
  Forest2,
  getTile,
  getTileInfo,
  Mountain,
  Plain,
  Reef,
  River,
  Ruins,
  Sea,
  Street,
  TileInfo,
  TileTypes,
} from '../info/Tile.tsx';
import { Pioneer } from '../info/Unit.tsx';
import calculateClusters from '../lib/calculateClusters.tsx';
import canPlaceTile from '../lib/canPlaceTile.tsx';
import convertBiome from '../lib/convertBiome.tsx';
import getBiomeStyle from '../lib/getBiomeStyle.tsx';
import getMovementPath from '../lib/getMovementPath.tsx';
import indexToVector from '../lib/indexToVector.tsx';
import withModifiers from '../lib/withModifiers.tsx';
import { Biome, Biomes } from '../map/Biome.tsx';
import Building from '../map/Building.tsx';
import { toPlayerID } from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData, { SizeVector, TileMap } from '../MapData.tsx';
import { moveable, MoveConfiguration } from '../Radius.tsx';
import vec from './../map/vec.tsx';

const minmax = (min: number, max: number, value: number) =>
  Math.max(min, Math.min(max, value));

const isEdge = (vector: Vector, size: SizeVector) =>
  vector.x === 1 ||
  vector.x === size.width ||
  vector.y === 1 ||
  vector.y === size.height;

export function generateBuildings(
  map: MapData,
  biomes: ReadonlyArray<Biome> = Biomes,
): MapData {
  let buildings = ImmutableMap<Vector, Building>();
  const tiles = map.map.slice();
  const { size } = map;
  const length = size.width * size.height;
  const seed = random(0, length / 2.5);
  for (let j = seed; j < length; j++) {
    const vector = indexToVector(j, size.width);
    const hq2Vector = vec(
      size.width - vector.x + 1 + random(-2, 2),
      size.height - vector.y + 1 + random(-2, 2),
    );
    if (
      size.contains(hq2Vector) &&
      !hq2Vector.equals(vector) &&
      !isEdge(vector, size) &&
      !isEdge(hq2Vector, size)
    ) {
      buildings = buildings
        .set(vector, HQ.create(1))
        .set(hq2Vector, HQ.create(2));
      tiles[map.getTileIndex(vector)] = Plain.id;
      tiles[map.getTileIndex(hq2Vector)] = Plain.id;
      break;
    }
  }

  const maxDistance = vec(1, 1).distance(vec(size.width, size.height)) * 2;

  if (buildings.size === 2) {
    const [start, end] = [...buildings.keys()];
    const unit = Pioneer.create(1);
    let currentMap = map.copy({ buildings });
    const streetPath = getMovementPath(
      currentMap,
      end,
      moveable(currentMap, unit, start, maxDistance),
      null,
    ).path.slice(0, -1);

    streetPath.forEach((vector) => {
      tiles[currentMap.getTileIndex(vector)] = Street.id;
    });

    const center =
      streetPath[Math.round(streetPath.length) / 2 - 1 + random(0, 1)];
    if (center && streetPath.length >= 3) {
      const [up, right, down, left] = center.adjacent();
      currentMap = map.copy({ map: tiles });
      const possibleRivers = arrayShuffle([
        currentMap.getTile(up) !== Street.id ? up : null,
        currentMap.getTile(right) !== Street.id ? right : null,
        currentMap.getTile(down) !== Street.id ? down : null,
        currentMap.getTile(left) !== Street.id ? left : null,
      ]).filter(isPresent);
      if (possibleRivers.length >= 2) {
        const [firstVector, secondVector] = possibleRivers;
        const left = vec(
          minmax(1, size.width, firstVector.x + random(-3, 3)),
          1,
        );
        const right = vec(
          minmax(1, size.width, firstVector.x + random(-3, 3)),
          size.height,
        );
        const top = vec(
          1,
          minmax(1, size.height, firstVector.y + random(-3, 3)),
        );
        const bottom = vec(
          size.width,
          minmax(1, size.height, firstVector.y + random(-3, 3)),
        );
        const [, first, second] = minBy(
          [
            [vec(firstVector.x, 1), left, right],
            [vec(firstVector.x, size.height), right, left],
            [vec(1, firstVector.y), top, bottom],
            [vec(size.width, firstVector.y), bottom, top],
          ],
          ([edge]) => firstVector.distance(edge),
        )!;

        const isAccessible = (map: MapData, unit: Unit, vector: Vector) =>
          !!(
            MoveConfiguration.isAccessible(map, unit, vector) &&
            map.getTile(vector) !== Street.id &&
            !buildings.has(vector)
          );

        const { path: firstPath } = getMovementPath(
          currentMap,
          first,
          moveable(currentMap, unit, firstVector, maxDistance, {
            getCost: () => 1,
            getResourceValue: () => Number.POSITIVE_INFINITY,
            getTransitionCost: () => 0,
            isAccessible,
          }),
          null,
        );
        const { path: secondPath } = getMovementPath(
          currentMap,
          second,
          moveable(currentMap, unit, secondVector, maxDistance, {
            getCost: () => 1,
            getResourceValue: () => Number.POSITIVE_INFINITY,
            getTransitionCost: () => 0,
            isAccessible,
          }),
          null,
        );

        if (firstPath.length && secondPath.length) {
          [
            firstVector,
            secondVector,
            ...firstPath,
            ...secondPath,
            ...(Math.abs(firstVector.x - secondVector.x) === 1 &&
            Math.abs(firstVector.y - secondVector.y) === 1
              ? [
                  vec(firstVector.x, secondVector.y),
                  vec(secondVector.x, firstVector.y),
                ].filter(
                  (vector) =>
                    isAccessible(currentMap, unit, vector) &&
                    !buildings.has(vector) &&
                    currentMap.getTile(vector) !== Street.id,
                )
              : []),
          ].forEach((vector) => {
            tiles[currentMap.getTileIndex(vector)] = River.id;
          });
        }
      }

      arrayShuffle(
        [up.left(), up.right(), down.left(), down.right()].filter((vector) => {
          const index = currentMap.getTileIndex(vector);
          return (
            currentMap.contains(vector) &&
            tiles[index] !== Street.id &&
            tiles[index] !== River.id
          );
        }),
      )
        .slice(2)
        .forEach((vector) => {
          tiles[currentMap.getTileIndex(vector)] = ConstructionSite.id;
        });

      streetPath.forEach((vector) => {
        const index = currentMap.getTileIndex(vector);
        const [up, right, down, left] = vector
          .adjacent()
          .map(
            (vector) =>
              currentMap.contains(vector) &&
              getTile(tiles[currentMap.getTileIndex(vector)], 0),
          );

        const shouldPlaceHorizontalBridge =
          up === River.id &&
          down === River.id &&
          left === Street.id &&
          right === Street.id;
        if (
          shouldPlaceHorizontalBridge ||
          (up === Street.id &&
            down === Street.id &&
            left === River.id &&
            right === River.id)
        ) {
          tiles[index] = [River.id, Bridge.id];
          if (random(0, 1)) {
            buildings = buildings.set(
              vector,
              (shouldPlaceHorizontalBridge
                ? HorizontalBarrier
                : VerticalBarrier
              ).create(0),
            );
          }
        }
      });
      currentMap = currentMap.copy({ map: tiles });
    }

    const maxFactories = 2;
    for (let playerId = 1; playerId <= 2; playerId++) {
      let factories = 0;
      const possibleBuildingTiles = arrayShuffle(
        [
          ...new Set(
            (playerId === 1 ? start : end)
              .adjacent()
              .flatMap((vector: Vector) => vector.expandStar().slice(1)),
          ),
        ].filter(
          (vector) =>
            currentMap.contains(vector) &&
            !vector.equals(start) &&
            !vector.equals(end),
        ),
      );

      possibleBuildingTiles.slice(0, 8).forEach((vector, arrayIndex) => {
        const index = currentMap.getTileIndex(vector);
        if (
          !isEdge(vector, size) &&
          tiles[index] !== Street.id &&
          tiles[index] !== River.id &&
          !buildings.has(vector)
        ) {
          tiles[currentMap.getTileIndex(vector)] = ConstructionSite.id;
          const buildingToBuild = random(0, 1);
          if (buildingToBuild === 0) {
            factories++;
          }
          const building =
            buildingToBuild === 0 && factories <= maxFactories
              ? factories == 0 || random(0, 1)
                ? Barracks
                : Factory
              : House;

          if (arrayIndex <= 5) {
            buildings = buildings.set(
              vector,
              building.create(toPlayerID(playerId)),
            );
          }
        }
      });
    }
  }
  return convertBiome(
    copyMap(map.copy({ buildings }), tiles),
    arrayShuffle(biomes)[0],
  );
}

export function generateSea(map: MapData): MapData {
  if (!random(0, 3)) {
    return map;
  }

  const seaTile =
    getBiomeStyle(map.config.biome).tileConversions?.get(Sea)?.id || Sea.id;
  const tiles = map.map.slice();
  if (random(0, 1)) {
    const queue: Array<Vector> = [];
    map.forEachField((vector, index) => {
      if (isEdge(vector, map.size) && !map.buildings.has(vector)) {
        tiles[index] = seaTile;
        queue.push(
          ...vector
            .adjacent()
            .slice(1)
            .filter((vector) => {
              const tile =
                map.contains(vector) &&
                getTile(tiles[map.getTileIndex(vector)]);
              return (
                tile &&
                tile !== River.id &&
                tile !== Street.id &&
                tile !== Bridge.id
              );
            }),
        );
      }
    });

    const seen = new Set();
    while (queue.length) {
      const vector = queue.shift()!;
      if (seen.has(vector)) {
        continue;
      }
      seen.add(vector);

      if (random(0, 1) && !map.buildings.has(vector)) {
        tiles[map.getTileIndex(vector)] = seaTile;
      }
    }
  } else {
    const clusters = calculateClusters(map.size, [
      ...map.reduceEachField((set, vector) => {
        const tile = map.getTileInfo(vector);
        if (tile && tile.type & TileTypes.Plain && !map.buildings.has(vector)) {
          return set.add(vector);
        }
        return set;
      }, new Set<Vector>()),
    ]);

    const initialVector = clusters[0];
    const queue = [initialVector];
    const seen = new Set();
    let iterations = 45;
    while (queue.length && iterations > 0) {
      const vector = queue.shift()!;
      if (seen.has(vector)) {
        continue;
      }
      seen.add(vector);
      if (!map.contains(vector)) {
        continue;
      }

      const index = map.getTileIndex(vector);
      const tile = getTileInfo(tiles[index]);
      if (
        (tile.type & TileTypes.Plain || tile.type & TileTypes.Forest) &&
        !map.buildings.has(vector) &&
        (vector.equals(initialVector) ||
          vector
            .adjacent()
            .some((vector) => tiles[map.getTileIndex(vector)] === seaTile))
      ) {
        tiles[index] = seaTile;
      }

      queue.push(
        ...vector
          .expandWithDiagonals()
          .slice(1)
          .filter((vector) => map.contains(vector)),
      );
      iterations--;
    }
  }

  map = copyMap(map, tiles);
  map.forEachField((vector) => {
    const index = map.getTileIndex(vector);
    if (
      !random(0, 4) &&
      !map.buildings.has(vector) &&
      canPlaceTile(map, vector, Reef)
    ) {
      tiles[index] = [getTileInfo(tiles[index], 0).id, Reef.id];
      map = copyMap(map, tiles);
    }
  });

  // These should be separate loops.
  map.forEachField((vector) => {
    const index = map.getTileIndex(vector);
    if (
      !random(0, 2) &&
      !map.buildings.has(vector) &&
      canPlaceTile(map, vector, Beach)
    ) {
      tiles[index] = Beach.id;
      map = copyMap(map, tiles);
    }
  });

  return map;
}

const copyMap = (mapData: MapData, map: TileMap) =>
  withModifiers(mapData.copy({ map: map.slice() }));

export function generateRandomMap(
  size: SizeVector,
  fill?: ReadonlyArray<TileInfo> | null,
): MapData {
  const map: Array<number> = [];
  const tiles: ReadonlyArray<TileInfo> = fill || [
    ...Array(28).fill(Plain),
    ...Array(6).fill(Forest),
    ...Array(3).fill(Forest2),
    ...Array(4).fill(Mountain),
    ...Array(1).fill(Ruins),
  ];
  const length = size.width * size.height;
  for (let i = 0; i < length; i++) {
    map.push(randomEntry(tiles).id);
  }

  return MapData.createMap({
    config: {
      blocklistedBuildings: [],
      fog: false,
      multiplier: 1,
      seedCapital: 500,
    },
    map,
    size: size.toJSON(),
  });
}

export function generatePlainMap(
  size: SizeVector,
  biome?: Biome,
  tile?: TileInfo,
): MapData {
  const map: Array<number> = [];
  const length = size.width * size.height;
  for (let i = 0; i < length; i++) {
    map.push((tile || Plain).id);
  }
  return MapData.createMap({
    config: {
      biome: biome || Biome.Grassland,
      blocklistedBuildings: [],
      fog: false,
      multiplier: 1,
      seedCapital: 500,
    },
    map,
    size: size.toJSON(),
  });
}
