import getFirstOrThrow from '@nkzw/core/getFirstOrThrow.js';
import { BuildingInfo } from '../info/Building.tsx';
import { Plain, ShipyardConstructionSite, TileTypes } from '../info/Tile.tsx';
import { PlayerID } from '../map/Player.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import writeTile from '../mutation/writeTile.tsx';
import canBuild from './canBuild.tsx';

export default function couldSpawnBuilding(
  map: MapData,
  vector: Vector,
  building: BuildingInfo,
  player: PlayerID,
) {
  if (!map.contains(vector) || map.buildings.has(vector)) {
    return false;
  }

  const unit = map.units.get(vector);
  if (unit && !building.isAccessibleBy(unit.info)) {
    return false;
  }

  const { editorPlaceOn, placeOn } = building.configuration;
  const tile = map.getTileInfo(vector);
  if (
    placeOn?.has(ShipyardConstructionSite)
      ? tile.type & TileTypes.Sea
      : tile === Plain
  ) {
    const tileMap = map.map.slice();
    const modifiers = map.modifiers.slice();
    writeTile(
      tileMap,
      modifiers,
      map.getTileIndex(vector),
      getFirstOrThrow(new Set([...(placeOn || []), ...editorPlaceOn])),
    );
    map = map.copy({
      map: tileMap,
    });

    if (unit && map.getTileInfo(vector).getMovementCost(unit.info) === -1) {
      return false;
    }
  }

  return canBuild(map, building, player, vector, true);
}
