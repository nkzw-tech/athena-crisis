import { isSea, TileInfo } from '../info/Tile.tsx';
import Entity, { EntityType } from '../map/Entity.tsx';

export default function isAmphibiousOnLand(entity: Entity, tileInfo: TileInfo) {
  return entity.info.type === EntityType.Amphibious && !isSea(tileInfo.id);
}
