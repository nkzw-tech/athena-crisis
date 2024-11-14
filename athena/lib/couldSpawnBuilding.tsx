import getFirstOrThrow from '@deities/hephaestus/getFirstOrThrow.tsx';
import { BuildingInfo } from '../info/Building.tsx';
import { Plain } from '../info/Tile.tsx';
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
  if (map.getTileInfo(vector) === Plain) {
    const { editorPlaceOn, placeOn } = building.configuration;
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
  }

  return (
    !map.buildings.has(vector) && canBuild(map, building, player, vector, true)
  );
}
