import { Airbase, Shelter } from '@deities/athena/info/Building.tsx';
import type { TileInfo } from '@deities/athena/info/Tile.tsx';
import {
  Airfield,
  Campsite,
  Lightning,
  Plain,
  RenderType,
  StormCloud,
  StormCloudLightningConnectors,
  TileTypes,
} from '@deities/athena/info/Tile.tsx';
import type { Biome } from '@deities/athena/map/Biome.tsx';
import type Building from '@deities/athena/map/Building.tsx';
import vec from '@deities/athena/map/vec.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { VisionT } from '@deities/athena/Vision.tsx';
import getBuildingSpritePosition from '../lib/getBuildingSpritePosition.tsx';

export type TileSet = {
  buildings: CanvasImageSource;
  structures: CanvasImageSource;
  tiles: CanvasImageSource;
};

const nullVector = vec(0, 0);

const renderBuildingShadow = (
  context: CanvasRenderingContext2D,
  biome: Biome,
  tileset: TileSet,
  building: Building,
  isVisible: boolean,
  targetX: number,
  targetY: number,
  size: number,
) => {
  const [x, y] = getBuildingSpritePosition(
    building.info,
    building.player,
    biome,
    isVisible,
  );
  context.drawImage(
    building.info.sprite.name === 'Structures'
      ? tileset.structures
      : tileset.buildings,
    x * size,
    (y + 1) * size,
    size,
    size,
    targetX,
    targetY,
    size,
    size,
  );
};

export default function renderTile(
  context: CanvasRenderingContext2D,
  tileset: TileSet,
  map: MapData,
  vision: VisionT,
  frame: number,
  vector: Vector,
  info: TileInfo,
  modifierId: number,
  size: number,
  renderEntities: boolean,
) {
  const half = size / 2;
  const building = map.buildings.get(vector);
  if (building) {
    if (building.info === Airbase) {
      info = Airfield;
      modifierId = 0;
    } else if (building.info === Shelter) {
      info = Campsite;
      modifierId = 0;
    } else if (info.type & TileTypes.ConstructionSite) {
      info = Plain;
      modifierId = 0;
    }
  }

  const targetX = vector.x * size;
  const targetY = vector.y * size;
  const isPlain = info === Plain;
  const image = tileset.tiles;
  const { sprite } = info;
  const offset = sprite.animation?.horizontal
    ? { x: frame, y: 0 }
    : { x: 0, y: frame };

  const x = sprite.position.x;
  const y =
    sprite.position.y +
    ((sprite.alternate && (vector.x + vector.y) % 3) === 0 ? 4 : 0);
  let modifier = sprite.modifiers.get(modifierId) || nullVector;

  if (
    !isPlain &&
    info.style.layer === 0 &&
    vector.x !== 0 &&
    vector.x !== map.size.width + 1 &&
    vector.y !== 0 &&
    vector.y !== map.size.height + 1
  ) {
    context.drawImage(
      image,
      Plain.sprite.position.x * size,
      Plain.sprite.position.y * size,
      size,
      size,
      targetX,
      targetY,
      size,
      size,
    );
  }

  if (
    building &&
    info.type & TileTypes.Pier &&
    Array.isArray(modifier) &&
    modifier[0] === RenderType.Composite
  ) {
    modifier = modifier[1];
  }

  if (Array.isArray(modifier)) {
    if (modifier[0] === RenderType.Quarter) {
      context.drawImage(
        image,
        (x + modifier[1].x + offset.x) * size,
        (y + modifier[1].y + offset.y) * size,
        half,
        half,
        targetX,
        targetY,
        half,
        half,
      );
      context.drawImage(
        image,
        (x + modifier[2].x + offset.x) * size,
        (y + modifier[2].y + offset.y) * size,
        half,
        half,
        targetX + half,
        targetY,
        half,
        half,
      );
      context.drawImage(
        image,
        (x + modifier[3].x + offset.x) * size,
        (y + modifier[3].y + offset.y) * size,
        half,
        half,
        targetX,
        targetY + half,
        half,
        half,
      );
      context.drawImage(
        image,
        (x + modifier[4].x + offset.x) * size,
        (y + modifier[4].y + offset.y) * size,
        half,
        half,
        targetX + half,
        targetY + half,
        half,
        half,
      );
    } else if (modifier[0] == RenderType.Horizontal) {
      context.drawImage(
        image,
        (x + modifier[1].x + offset.x) * size,
        (y + modifier[1].y + offset.y) * size,
        size,
        half,
        targetX,
        targetY,
        size,
        half,
      );

      context.drawImage(
        image,
        (x + modifier[2].x + offset.x) * size,
        (y + modifier[2].y + offset.y) * size,
        size,
        half,
        targetX,
        targetY + half,
        size,
        half,
      );
    } else if (modifier[0] == RenderType.Vertical) {
      context.drawImage(
        image,
        (x + modifier[1].x + offset.x) * size,
        (y + modifier[1].y + offset.y) * size,
        half,
        size,
        targetX,
        targetY,
        half,
        size,
      );

      context.drawImage(
        image,
        (x + modifier[2].x + offset.x) * size,
        (y + modifier[2].y + offset.y) * size,
        half,
        size,
        targetX + half,
        targetY,
        half,
        size,
      );
    } else if (modifier[0] == RenderType.Composite) {
      context.drawImage(
        image,
        (x + modifier[1].x + offset.x) * size,
        (y + modifier[1].y + offset.y) * size,
        size,
        size,
        targetX,
        targetY,
        size,
        size,
      );
      context.drawImage(
        image,
        (x + modifier[2].x + offset.x) * size,
        (y + modifier[2].y + offset.y) * size,
        size,
        size,
        targetX,
        targetY,
        size,
        size,
      );
    }
  } else {
    context.drawImage(
      image,
      (x + modifier.x + offset.x) * size,
      (y + modifier.y + offset.y) * size,
      size,
      size,
      targetX,
      targetY,
      size,
      size,
    );
  }

  if (renderEntities && building) {
    renderBuildingShadow(
      context,
      map.config.biome,
      tileset,
      building,
      vision.isVisible(map, vector),
      targetX,
      targetY,
      size,
    );
  }

  if (info === StormCloud) {
    vector.adjacent().forEach((vector, index) => {
      if (map.getTile(vector, 1) === Lightning.id) {
        context.drawImage(
          image,
          (x +
            StormCloudLightningConnectors[index].x +
            offset.x / StormCloud.sprite.animation!.offset) *
            size,
          (y +
            StormCloudLightningConnectors[index].y +
            offset.y / StormCloud.sprite.animation!.offset) *
            size,
          size,
          size,
          targetX,
          targetY,
          size,
          size,
        );
      }
    });
  }
}
