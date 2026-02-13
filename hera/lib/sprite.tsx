import { hasSpriteURL } from '@deities/art/Sprites.tsx';
import { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';
import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';

export default function sprite(sprite: SpriteVariant, variant?: number, biome?: Biome): string {
  const biomeStyle = biome != null ? getBiomeStyle(biome) : null;
  const spriteSelector = `Sprite-${sprite}${variant != null ? `-${variant}` : ''}`;
  return variant != null && biomeStyle?.waterSwap && hasSpriteURL(sprite, variant, biome)
    ? `${spriteSelector}-${biome}`
    : spriteSelector;
}
