import { Biome } from '../map/Biome.tsx';
import { EntityType } from '../map/Entity.tsx';

const spaceRestrictions = new Set([
  EntityType.Amphibious,
  EntityType.Ship,
  EntityType.Rail,
]);

export default function getBiomeUnitRestrictions(biome: Biome) {
  if (biome === Biome.Spaceship) {
    return spaceRestrictions;
  }

  return null;
}
