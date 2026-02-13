import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import { Biome, Biomes } from '@deities/athena/map/Biome.tsx';
import { HEX } from '@nkzw/palette-swap';

export default new Map<Biome, Map<HEX, HEX>>(
  Biomes.map((biome) => {
    const style = getBiomeStyle(biome);
    return [biome, new Map([...(style.palette || []), ...(style.waterSwap || [])])] as const;
  }).filter((entry) => !!entry[1]),
);
