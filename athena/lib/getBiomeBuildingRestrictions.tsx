import {
  filterBuildings,
  HorizontalBarrier,
  HQ,
  Medbay,
  SpawnPlatform,
  VerticalBarrier,
} from '../info/Building.tsx';
import { Biome } from '../map/Biome.tsx';

const spaceRestrictions = new Set(
  filterBuildings(
    (building) =>
      building !== HQ &&
      building !== VerticalBarrier &&
      building !== HorizontalBarrier &&
      building !== Medbay &&
      building !== SpawnPlatform,
  ),
);

const defaultRestrictions = new Set([Medbay, SpawnPlatform]);

export default function getBiomeBuildingRestrictions(biome: Biome) {
  if (biome === Biome.Spaceship) {
    return spaceRestrictions;
  }

  return defaultRestrictions;
}
