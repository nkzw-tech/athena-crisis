import { generateRandomMap } from '../generator/MapGenerator.tsx';
import { Decorator } from '../info/Decorator.tsx';
import { getTileInfo, TileTypes } from '../info/Tile.tsx';
import { DecoratorsPerSide } from '../map/Configuration.tsx';
import { PlainEntitiesList } from '../map/PlainMap.tsx';
import { decodeDecorators } from '../map/Serialization.tsx';
import SpriteVector from '../map/SpriteVector.tsx';
import vec from '../map/vec.tsx';
import Vector from '../map/Vector.tsx';
import MapData, { SizeVector } from '../MapData.tsx';
import { winConditionHasVectors } from '../WinConditions.tsx';
import { verifyMap } from './verifyTiles.tsx';
import withModifiers from './withModifiers.tsx';

export type ResizeOrigin = 'top' | 'right' | 'bottom' | 'left';

export default function resizeMap(
  mapData: MapData,
  size: SizeVector,
  origin: Set<ResizeOrigin>,
  fill?: number,
) {
  const offsetX = origin.has('left') ? mapData.size.width - size.width : 0;
  const offsetY = origin.has('top') ? mapData.size.height - size.height : 0;
  const fillTile = fill ? getTileInfo(fill) : null;
  const randomMap = generateRandomMap(
    size,
    fillTile && fillTile.type & TileTypes.Area ? [fillTile] : null,
  );
  const map = mapData.reduceEachField((map, vector, index) => {
    vector = new SpriteVector(vector.x, vector.y).left(offsetX).up(offsetY);
    if (randomMap.contains(vector)) {
      map[randomMap.getTileIndex(vector)] = mapData.map[index];
    }
    return map;
  }, randomMap.map.slice());

  const decorators = mapData.reduceEachDecorator(
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
        ? [
            ...decorators,
            [subVector.x, subVector.y, decorator.id] as [
              number,
              number,
              number,
            ],
          ]
        : decorators;
    },
    [] as PlainEntitiesList<Decorator>,
  );

  const winConditions = mapData.config.winConditions.map((condition) => {
    return winConditionHasVectors(condition)
      ? {
          ...condition,
          vectors: new Set(
            [...condition.vectors]
              .map((vector) =>
                new SpriteVector(vector.x, vector.y).left(offsetX).up(offsetY),
              )
              .filter((vector) => size.contains(vector))
              .map((vector) => vec(vector.x, vector.y)),
          ),
        }
      : condition;
  });

  const contains = (_: unknown, vector: Vector): boolean =>
    size.contains(vector);
  return verifyMap(
    withModifiers(
      mapData.copy({
        buildings: mapData.buildings
          .mapKeys((vector) =>
            new SpriteVector(vector.x, vector.y).left(offsetX).up(offsetY),
          )
          .filter(contains)
          .mapKeys((vector) => vec(vector.x, vector.y)),
        config: mapData.config.copy({ winConditions }),
        decorators: decodeDecorators(size, decorators),
        map,
        size,
        units: mapData.units
          .mapKeys((vector) =>
            new SpriteVector(vector.x, vector.y).left(offsetX).up(offsetY),
          )
          .filter(contains)
          .mapKeys((vector) => vec(vector.x, vector.y)),
      }),
    ),
  );
}
