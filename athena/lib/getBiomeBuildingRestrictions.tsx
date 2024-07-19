import {
  filterBuildings,
  HorizontalBarrier,
  HQ,
  VerticalBarrier,
} from '../info/Building.tsx';
import { Biome } from '../map/Biome.tsx';

const spaceRestrictions = new Set(
  filterBuildings(
    (building) =>
      building !== HQ &&
      building !== VerticalBarrier &&
      building !== HorizontalBarrier,
  ),
);

export default function getBiomeBuildingRestrictions(biome: Biome) {
  if (biome === Biome.Spaceship) {
    return spaceRestrictions;
  }

  return null;
}
