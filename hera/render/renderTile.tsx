import { Airbase, Shelter } from '@deities/athena/info/Building.tsx';
import {
  Airfield,
  Campsite,
  Lightning,
  Plain,
  RenderType,
  StormCloud,
  StormCloudLightningConnectors,
  TileInfo,
  TileTypes,
} from '@deities/athena/info/Tile.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import Building from '@deities/athena/map/Building.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import getBuildingSpritePosition from '../lib/getBuildingSpritePosition.tsx';
import { BuildingSpriteLayout } from './EntitySpriteLayout.tsx';

export type TileSet = {
  buildings: CanvasImageSource;
  structures: CanvasImageSource;
  tileFrameSize: number;
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
  tileSize: number,
  buildingSize: number,
) => {
  const [x, y] = getBuildingSpritePosition(building.info, building.player, biome, isVisible);
  const { anchor, atlasCellSize, shadow } = BuildingSpriteLayout;
  const inset = (tileSize - buildingSize) / 2;
  context.drawImage(
    building.info.sprite.name === 'Structures' ? tileset.structures : tileset.buildings,
    x * atlasCellSize + shadow.x,
    y * atlasCellSize + shadow.y,
    shadow.width,
    shadow.height,
    targetX + inset - anchor.x + shadow.x,
    targetY + inset - anchor.y + shadow.y,
    shadow.width,
    shadow.height,
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
  tileSize: number,
  renderEntities: boolean,
  buildingSize: number = BuildingSpriteLayout.entitySize,
) {
  const half = tileSize / 2;
  const { tileFrameSize } = tileset;
  const sourceHalf = tileFrameSize / 2;
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

  const targetX = vector.x * tileSize;
  const targetY = vector.y * tileSize;
  const isPlain = info === Plain;
  const image = tileset.tiles;
  const { sprite } = info;
  const offset = sprite.animation?.horizontal ? { x: frame, y: 0 } : { x: 0, y: frame };

  const x = sprite.position.x;
  const y = sprite.position.y + ((sprite.alternate && (vector.x + vector.y) % 3) === 0 ? 4 : 0);
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
      Plain.sprite.position.x * tileFrameSize,
      Plain.sprite.position.y * tileFrameSize,
      tileFrameSize,
      tileFrameSize,
      targetX,
      targetY,
      tileSize,
      tileSize,
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
        (x + modifier[1].x + offset.x) * tileFrameSize,
        (y + modifier[1].y + offset.y) * tileFrameSize,
        sourceHalf,
        sourceHalf,
        targetX,
        targetY,
        half,
        half,
      );
      context.drawImage(
        image,
        (x + modifier[2].x + offset.x) * tileFrameSize,
        (y + modifier[2].y + offset.y) * tileFrameSize,
        sourceHalf,
        sourceHalf,
        targetX + half,
        targetY,
        half,
        half,
      );
      context.drawImage(
        image,
        (x + modifier[3].x + offset.x) * tileFrameSize,
        (y + modifier[3].y + offset.y) * tileFrameSize,
        sourceHalf,
        sourceHalf,
        targetX,
        targetY + half,
        half,
        half,
      );
      context.drawImage(
        image,
        (x + modifier[4].x + offset.x) * tileFrameSize,
        (y + modifier[4].y + offset.y) * tileFrameSize,
        sourceHalf,
        sourceHalf,
        targetX + half,
        targetY + half,
        half,
        half,
      );
    } else if (modifier[0] === RenderType.Horizontal) {
      context.drawImage(
        image,
        (x + modifier[1].x + offset.x) * tileFrameSize,
        (y + modifier[1].y + offset.y) * tileFrameSize,
        tileFrameSize,
        sourceHalf,
        targetX,
        targetY,
        tileSize,
        half,
      );

      context.drawImage(
        image,
        (x + modifier[2].x + offset.x) * tileFrameSize,
        (y + modifier[2].y + offset.y) * tileFrameSize,
        tileFrameSize,
        sourceHalf,
        targetX,
        targetY + half,
        tileSize,
        half,
      );
    } else if (modifier[0] === RenderType.Vertical) {
      context.drawImage(
        image,
        (x + modifier[1].x + offset.x) * tileFrameSize,
        (y + modifier[1].y + offset.y) * tileFrameSize,
        sourceHalf,
        tileFrameSize,
        targetX,
        targetY,
        half,
        tileSize,
      );

      context.drawImage(
        image,
        (x + modifier[2].x + offset.x) * tileFrameSize,
        (y + modifier[2].y + offset.y) * tileFrameSize,
        sourceHalf,
        tileFrameSize,
        targetX + half,
        targetY,
        half,
        tileSize,
      );
    } else if (modifier[0] === RenderType.Composite) {
      context.drawImage(
        image,
        (x + modifier[1].x + offset.x) * tileFrameSize,
        (y + modifier[1].y + offset.y) * tileFrameSize,
        tileFrameSize,
        tileFrameSize,
        targetX,
        targetY,
        tileSize,
        tileSize,
      );
      context.drawImage(
        image,
        (x + modifier[2].x + offset.x) * tileFrameSize,
        (y + modifier[2].y + offset.y) * tileFrameSize,
        tileFrameSize,
        tileFrameSize,
        targetX,
        targetY,
        tileSize,
        tileSize,
      );
    }
  } else {
    context.drawImage(
      image,
      (x + modifier.x + offset.x) * tileFrameSize,
      (y + modifier.y + offset.y) * tileFrameSize,
      tileFrameSize,
      tileFrameSize,
      targetX,
      targetY,
      tileSize,
      tileSize,
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
      tileSize,
      buildingSize,
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
            tileFrameSize,
          (y +
            StormCloudLightningConnectors[index].y +
            offset.y / StormCloud.sprite.animation!.offset) *
            tileFrameSize,
          tileFrameSize,
          tileFrameSize,
          targetX,
          targetY,
          tileSize,
          tileSize,
        );
      }
    });
  }
}
