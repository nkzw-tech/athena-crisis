import { generateRandomMap } from '@deities/athena/generator/MapGenerator.tsx';
import { Decorator } from '@deities/athena/info/Decorator.tsx';
import { getTileInfo, TileTypes } from '@deities/athena/info/Tile.tsx';
import { verifyMap } from '@deities/athena/lib/verifyTiles.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { DecoratorsPerSide } from '@deities/athena/map/Configuration.tsx';
import Entity from '@deities/athena/map/Entity.tsx';
import { PlainEntitiesList } from '@deities/athena/map/PlainMap.tsx';
import { decodeDecorators } from '@deities/athena/map/Serialization.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData, { SizeVector } from '@deities/athena/MapData.tsx';
import { objectiveHasVectors } from '@deities/athena/Objectives.tsx';
import ImmutableMap from '@nkzw/immutable-map';

export type ResizeOrigin = 'top' | 'right' | 'bottom' | 'left';

export const resizeEntities = <T extends Entity>(
  entities: ImmutableMap<Vector, T>,
  size: SizeVector,
  offsetX: number,
  offsetY: number,
) =>
  entities
    .mapKeys((vector) =>
      new SpriteVector(vector.x, vector.y).left(offsetX).up(offsetY),
    )
    .filter((_: unknown, vector: Vector) => size.contains(vector))
    .mapKeys((vector) => vec(vector.x, vector.y));

export default function resizeMap(
  map: MapData,
  size: SizeVector,
  origin: Set<ResizeOrigin>,
  fill?: number,
) {
  const offsetX = origin.has('left') ? map.size.width - size.width : 0;
  const offsetY = origin.has('top') ? map.size.height - size.height : 0;
  const fillTile = fill ? getTileInfo(fill) : null;
  const randomMap = generateRandomMap(
    size,
    fillTile && fillTile.type & TileTypes.Area ? [fillTile] : null,
  );
  const tiles = map.reduceEachField((tiles, vector, index) => {
    vector = new SpriteVector(vector.x, vector.y).left(offsetX).up(offsetY);
    if (randomMap.contains(vector)) {
      tiles[randomMap.getTileIndex(vector)] = map.map[index];
    }
    return tiles;
  }, randomMap.map.slice());

  const decorators = map.reduceEachDecorator(
    (decorators, decorator, subVector) => {
      subVector = subVector
        .left(offsetX * DecoratorsPerSide)
        .up(offsetY * DecoratorsPerSide);
      return randomMap.contains(
        new SpriteVector(
          Math.floor((subVector.x - 1) / DecoratorsPerSide) + 1,
          Math.floor((subVector.y - 1) / DecoratorsPerSide) + 1,
        ),
      )
        ? [...decorators, [subVector.x, subVector.y, decorator.id] as const]
        : decorators;
    },
    [] as PlainEntitiesList<Decorator>,
  );

  const objectives = map.config.objectives.map((objective) =>
    objectiveHasVectors(objective)
      ? {
          ...objective,
          vectors: new Set(
            [...objective.vectors]
              .map((vector) =>
                new SpriteVector(vector.x, vector.y).left(offsetX).up(offsetY),
              )
              .filter((vector) => size.contains(vector))
              .map((vector) => vec(vector.x, vector.y)),
          ),
        }
      : objective,
  );

  return verifyMap(
    withModifiers(
      map.copy({
        buildings: resizeEntities(map.buildings, size, offsetX, offsetY),
        config: map.config.copy({ objectives }),
        decorators: decodeDecorators(size, decorators),
        map: tiles,
        size,
        units: resizeEntities(map.units, size, offsetX, offsetY),
      }),
    ),
  );
}
