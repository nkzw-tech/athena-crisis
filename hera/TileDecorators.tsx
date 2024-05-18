import { getTileInfo, StormCloud } from '@deities/athena/info/Tile.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { VisionT } from '@deities/athena/Vision.tsx';
import type { RadiusInfo } from './Radius.tsx';
import TileDecorator from './TileDecorator.tsx';
import type { GetLayerFunction } from './Types.tsx';

export default function TileDecorators({
  getLayer,
  map,
  radius,
  tileSize,
  vector,
  vision,
}: {
  getLayer: GetLayerFunction;
  isVisible: boolean;
  map: MapData;
  radius?: RadiusInfo | null;
  tileSize: number;
  vector: Vector;
  vision: VisionT;
}) {
  const {
    config: { biome },
  } = map;
  const up = vector.up();
  const layer0Tile = map.getTileInfo(vector, 0);
  const layer1TileID = map.getTile(vector, 1);
  const layer1Tile = (layer1TileID && getTileInfo(layer1TileID)) || null;

  const list = [];
  const showDecorators =
    !map.buildings.has(vector) &&
    (!layer1Tile ||
      layer1Tile !== StormCloud ||
      map.getTile(up, 1) !== StormCloud.id);
  if (showDecorators) {
    const isVisibleAbove = vision.isVisible(map, up);
    const hasUnitAbove = isVisibleAbove && map.units.has(up);
    const dim =
      hasUnitAbove && radius?.fields.has(vector) && radius.fields.has(up);
    if (layer0Tile?.style.decorator?.isVisible(biome)) {
      list.push(
        <TileDecorator
          absolute
          dim={dim}
          fade={isVisibleAbove && hasUnitAbove}
          key={`d0-${vector}`}
          modifier={map.getModifier(vector, 0)}
          position={up}
          size={tileSize}
          tile={layer0Tile}
          zIndex={getLayer(up.y, hasUnitAbove ? 'top' : 'decorator')}
        />,
      );
    }
    if (layer1Tile?.style.decorator?.isVisible(biome)) {
      list.push(
        <TileDecorator
          absolute
          dim={dim}
          fade={isVisibleAbove && hasUnitAbove}
          key={`d1-${vector}`}
          modifier={map.getModifier(vector, 1)}
          position={up}
          size={tileSize}
          tile={layer1Tile}
          zIndex={getLayer(up.y, hasUnitAbove ? 'top' : 'decorator')}
        />,
      );
    }
  }
  return list;
}
