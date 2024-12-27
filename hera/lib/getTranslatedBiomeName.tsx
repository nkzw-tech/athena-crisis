import { Biome } from '@deities/athena/map/Biome.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { fbt } from 'fbtee';

export default function getTranslatedBiomeName(biome: Biome) {
  switch (biome) {
    case Biome.Grassland:
      return String(fbt('Grassland', 'Biome name'));
    case Biome.Desert:
      return String(fbt('Desert', 'Biome name'));
    case Biome.Snow:
      return String(fbt('Snow', 'Biome name'));
    case Biome.Swamp:
      return String(fbt('Swamp', 'Biome name'));
    case Biome.Spaceship:
      return String(fbt('Spaceship', 'Biome name'));
    case Biome.Volcano:
      return String(fbt('Volcano', 'Biome name'));
    case Biome.Luna:
      return String(fbt('Luna', 'Biome name'));
    default: {
      biome satisfies never;
      throw new UnknownTypeError('getTranslatedBiomeName', biome);
    }
  }
}
