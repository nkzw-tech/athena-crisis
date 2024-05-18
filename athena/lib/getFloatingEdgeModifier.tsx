import type { MaybeTileID } from '../info/Tile.tsx';
import { DeepSea, isSea, River } from '../info/Tile.tsx';
import vec from '../map/vec.tsx';
import type Vector from '../map/Vector.tsx';
import type { ModifierField } from '../MapData.tsx';
import type MapData from '../MapData.tsx';
import { Modifier } from './Modifier.tsx';

const isSingleSea = (tile: MaybeTileID, modifier: number | null) =>
  tile !== DeepSea.id && modifier === Modifier.Single;

const shouldPlaceSeaDecorator = (tile: MaybeTileID, modifier: number | null) =>
  isSea(tile) && !isSingleSea(tile, modifier);

export default function getFloatingEdgeModifier(
  map: MapData,
  vector: Vector,
): ModifierField | null {
  let modifier: ModifierField | null = null;
  if (vector.y === 0) {
    const adjacent = vector.down();
    const left = vector.x === 1 || isSea(map.getTile(adjacent.left(), 0));
    const right =
      vector.x === map.size.width || isSea(map.getTile(adjacent.right(), 0));
    const tile = map.getTile(adjacent, 0);
    const adjacentModifier = tile && map.getModifier(adjacent, 0);
    if (shouldPlaceSeaDecorator(tile, adjacentModifier)) {
      modifier =
        left && right
          ? Modifier.BottomWallAreaDecorator
          : left
            ? [Modifier.BottomWallAreaDecorator, Modifier.BottomRightEdge]
            : right
              ? [Modifier.BottomWallAreaDecorator, Modifier.BottomLeftEdge]
              : Modifier.BottomWall;
    } else if (vector.x === 0) {
      const adjacent = vec(1, 1);
      const tile = map.getTile(adjacent, 0);
      modifier = shouldPlaceSeaDecorator(tile, map.getModifier(adjacent, 0))
        ? Modifier.BottomRightAreaDecorator
        : Modifier.BottomRightEdge;
    } else if (vector.x === map.size.width + 1) {
      const adjacent = vec(map.size.width, 1);
      const tile = map.getTile(adjacent, 0);
      modifier = shouldPlaceSeaDecorator(tile, map.getModifier(adjacent, 0))
        ? Modifier.BottomLeftAreaDecorator
        : Modifier.BottomLeftEdge;
    } else {
      modifier =
        tile === River.id && adjacentModifier === Modifier.Vertical
          ? Modifier.RiverFlowsFromBottom
          : Modifier.BottomWall;
    }
  } else if (vector.y === map.size.height + 1) {
    const adjacent = vector.up();
    const left = vector.x === 1 || isSea(map.getTile(adjacent.left(), 0));
    const right =
      vector.x === map.size.width || isSea(map.getTile(adjacent.right(), 0));
    const tile = map.getTile(adjacent, 0);
    const adjacentModifier = tile && map.getModifier(adjacent, 0);
    if (shouldPlaceSeaDecorator(tile, adjacentModifier)) {
      modifier =
        left && right
          ? Modifier.TopWallAreaDecorator
          : left
            ? [Modifier.TopWallAreaDecorator, Modifier.TopRightEdge]
            : right
              ? [Modifier.TopWallAreaDecorator, Modifier.TopLeftEdge]
              : Modifier.TopWall;
    } else if (vector.x === 0) {
      const adjacent = vec(1, map.size.height);
      const tile = map.getTile(adjacent, 0);
      modifier = shouldPlaceSeaDecorator(tile, map.getModifier(adjacent, 0))
        ? Modifier.TopRightAreaDecorator
        : Modifier.TopRightEdge;
    } else if (vector.x === map.size.width + 1) {
      const adjacent = vec(map.size.width, map.size.height);
      const tile = map.getTile(adjacent, 0);
      modifier = shouldPlaceSeaDecorator(tile, map.getModifier(adjacent, 0))
        ? Modifier.TopLeftAreaDecorator
        : Modifier.TopLeftEdge;
    } else {
      modifier =
        tile === River.id && adjacentModifier === Modifier.Vertical
          ? Modifier.RiverFlowsFromTop
          : Modifier.TopWall;
    }
  } else if (vector.x === 0) {
    const adjacent = vector.right();
    const up = vector.y === 1 || isSea(map.getTile(adjacent.up(), 0));
    const down =
      vector.y === map.size.height || isSea(map.getTile(adjacent.down(), 0));
    const tile = map.getTile(adjacent, 0);
    const adjacentModifier = tile && map.getModifier(adjacent, 0);
    if (shouldPlaceSeaDecorator(tile, adjacentModifier)) {
      modifier =
        up && down
          ? Modifier.RightWallAreaDecorator
          : up
            ? [
                Modifier.RightWallAreaDecorator,
                Modifier.BottomRightAreaDecorator,
              ]
            : down
              ? [
                  Modifier.RightWallAreaDecorator,
                  Modifier.TopRightAreaDecorator,
                ]
              : Modifier.RightWall;
    } else {
      modifier =
        tile === River.id && adjacentModifier === Modifier.None
          ? Modifier.RiverFlowsFromRight
          : Modifier.RightWall;
    }
  } else if (vector.x === map.size.width + 1) {
    const adjacent = vector.left();
    const up = vector.y === 1 || isSea(map.getTile(adjacent.up(), 0));
    const down =
      vector.y === map.size.height || isSea(map.getTile(adjacent.down(), 0));
    const tile = map.getTile(adjacent, 0);
    const adjacentModifier = tile && map.getModifier(adjacent, 0);
    if (shouldPlaceSeaDecorator(tile, adjacentModifier)) {
      modifier =
        up && down
          ? Modifier.LeftWallAreaDecorator
          : up
            ? [Modifier.LeftWallAreaDecorator, Modifier.BottomLeftAreaDecorator]
            : down
              ? [Modifier.LeftWallAreaDecorator, Modifier.TopLeftAreaDecorator]
              : Modifier.LeftWall;
    } else {
      modifier =
        tile === River.id && adjacentModifier === Modifier.None
          ? Modifier.RiverFlowsFromLeft
          : Modifier.LeftWall;
    }
  }
  return modifier;
}
