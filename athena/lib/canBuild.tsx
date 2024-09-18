import ImmutableMap from '@nkzw/immutable-map';
import { BuildingInfo, RadarStation } from '../info/Building.tsx';
import { getTileInfo, Lightning } from '../info/Tile.tsx';
import Vector from '../map/Vector.tsx';
import MapData, { PlayerOrPlayerID } from '../MapData.tsx';
import canPlaceLightning from './canPlaceLightning.tsx';
import getBiomeBuildingRestrictions from './getBiomeBuildingRestrictions.tsx';
import indexToVector from './indexToSpriteVector.tsx';

const canBuildRadarStation = (map: MapData) => {
  const emptyMap = map.copy({
    buildings: ImmutableMap(),
    units: ImmutableMap(),
  });

  for (let i = 0; i < map.map.length; i++) {
    const tile = getTileInfo(map.map[i]);
    if (
      tile === Lightning ||
      canPlaceLightning(emptyMap, indexToVector(i, map.size.width))
    ) {
      return true;
    }
  }
  return false;
};

export default function canBuild(
  map: MapData,
  info: BuildingInfo,
  player: PlayerOrPlayerID,
  to: Vector,
  isEditor = false,
): boolean {
  const tile = map.getTileInfo(to);

  if (!isEditor && info === RadarStation && !canBuildRadarStation(map)) {
    return false;
  }

  return !!(
    tile &&
    (isEditor || info.configuration.canBeCreated) &&
    (info.canBeCreatedOn(tile) ||
      (isEditor && info.editorCanBeCreatedOn(tile))) &&
    !map.config.blocklistedBuildings.has(info.id) &&
    (info.configuration.limit === 0 ||
      map.buildings.filter(
        (building) =>
          building.id == info.id && map.matchesPlayer(building, player),
      ).size < info.configuration.limit) &&
    !getBiomeBuildingRestrictions(map.config.biome).has(info)
  );
}
