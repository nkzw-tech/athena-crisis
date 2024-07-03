import ImmutableMap from '@nkzw/immutable-map';
import { Effects } from '../../apollo/Effects.tsx';
import { generateRandomMap } from '../generator/MapGenerator.tsx';
import { Decorator } from '../info/Decorator.tsx';
import { getTileInfo, TileTypes } from '../info/Tile.tsx';
import { DecoratorsPerSide } from '../map/Configuration.tsx';
import Entity from '../map/Entity.tsx';
import { PlainEntitiesList } from '../map/PlainMap.tsx';
import { decodeDecorators } from '../map/Serialization.tsx';
import SpriteVector from '../map/SpriteVector.tsx';
import vec from '../map/vec.tsx';
import Vector from '../map/Vector.tsx';
import MapData, { SizeVector } from '../MapData.tsx';
import { objectiveHasVectors } from '../Objectives.tsx';
import { verifyMap } from './verifyTiles.tsx';
import withModifiers from './withModifiers.tsx';

export type ResizeOrigin = 'top' | 'right' | 'bottom' | 'left';

const updateEntities = <T extends Entity>(
  entities: ImmutableMap<Vector, T>,
  size: SizeVector,
  offsetX: number,
  offsetY: number,
) =>
  entities
    .mapKeys((vector) =>
      new SpriteVector(vector.x, vector.y).left(offsetX).up(offsetY),
    )
    .filter((_: unknown, vector: Vector): boolean => size.contains(vector))
    .mapKeys((vector) => vec(vector.x, vector.y));

export default function resizeMap(
  map: MapData,
  effects: Effects,
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

  return [
    verifyMap(
      withModifiers(
        map.copy({
          buildings: updateEntities(map.buildings, size, offsetX, offsetY),
          config: map.config.copy({ objectives }),
          decorators: decodeDecorators(size, decorators),
          map: tiles,
          size,
          units: updateEntities(map.units, size, offsetX, offsetY),
        }),
      ),
    ),
    new Map(
      [...effects].map(([trigger, effectList]) => [
        trigger,
        new Set(
          [...effectList].map((effect) => ({
            ...effect,
            actions: [...effect.actions].map((action) =>
              action.type === 'SpawnEffect'
                ? ({
                    ...action,
                    units: updateEntities(action.units, size, offsetX, offsetY),
                  } as const)
                : action,
            ),
          })),
        ),
      ]),
    ),
  ] as const;
}
