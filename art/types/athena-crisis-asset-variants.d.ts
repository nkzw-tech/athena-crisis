declare module 'athena-crisis:asset-variants' {
  import type { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';

  export default new Map<
    SpriteVariant,
    Readonly<{
      source: string;
      staticColors?: Set<HEX>;
      variants: Map<PlainDynamicPlayerID | Biome, Palette>;
    }> | null
  >();
}
