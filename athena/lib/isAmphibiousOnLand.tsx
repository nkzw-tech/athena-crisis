import type { TileInfo } from '../info/Tile.tsx';
import { isSea } from '../info/Tile.tsx';
import type Entity from '../map/Entity.tsx';
import { EntityType } from '../map/Entity.tsx';

export default function isAmphibiousOnLand(entity: Entity, tileInfo: TileInfo) {
  return entity.info.type === EntityType.Amphibious && !isSea(tileInfo.id);
}
