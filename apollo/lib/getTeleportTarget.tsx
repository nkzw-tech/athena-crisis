import { TileTypes } from '@deities/athena/info/Tile.tsx';
import { Ability } from '@deities/athena/info/Unit.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import clockwiseSort from './clockwiseSort.tsx';

export default function getTeleportTarget(
  map: MapData,
  unit: Unit,
  to: Vector,
) {
  const tileInfo = map.getTileInfo(to);
  if (!(tileInfo.type & TileTypes.Teleporter)) {
    return null;
  }

  const list = clockwiseSort(
    map.reduceEachTile<Array<Vector>>((vectors, vector, tile) => {
      if (tile === tileInfo) {
        vectors.push(vector);
      }
      return vectors;
    }, []),
  ).toReversed();

  const index = list.findIndex((vector) => vector.equals(to));
  const nextTile =
    index === -1 ? null : index === list.length - 1 ? list[0] : list[index + 1];

  if (
    nextTile &&
    (!map.buildings.has(nextTile) ||
      unit.info.hasAbility(Ability.AccessBuildings))
  ) {
    return nextTile;
  }

  return null;
}
