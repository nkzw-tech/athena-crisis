import type { TileInfo } from '../info/Tile.tsx';
import type Entity from '../map/Entity.tsx';
import { getEntityGroup } from '../map/Entity.tsx';
import isAmphibiousOnLand from './isAmphibiousOnLand.tsx';

export default function isFuelConsumingUnit(
  entity: Entity,
  tileInfo: TileInfo,
): boolean {
  const group = getEntityGroup(entity);
  if (group === 'naval' && isAmphibiousOnLand(entity, tileInfo)) {
    return false;
  }

  return group === 'air' || group === 'naval';
}
