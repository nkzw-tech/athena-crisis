import { BuildingInfo } from '../info/Building.tsx';
import Vector from '../map/Vector.tsx';
import MapData, { PlayerOrPlayerID } from '../MapData.tsx';
import getBiomeBuildingRestrictions from './getBiomeBuildingRestrictions.tsx';

export default function canBuild(
  map: MapData,
  info: BuildingInfo,
  player: PlayerOrPlayerID,
  to: Vector,
  isEditor = false,
): boolean {
  const tile = map.getTileInfo(to);
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
