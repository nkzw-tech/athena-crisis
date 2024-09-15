import { TileInfo, TileTypes } from '../info/Tile.tsx';
import { UnitInfo } from '../info/Unit.tsx';
import { EntityType } from '../map/Entity.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';

export default function canAccessBridge(
  map: MapData,
  unit: UnitInfo,
  to: Vector,
  tile: TileInfo,
) {
  return (
    !(tile.type & TileTypes.Bridge) ||
    unit.type !== EntityType.Ship ||
    map.maybeGetTileInfo(to, 0)?.getMovementCost(unit) !== -1
  );
}
