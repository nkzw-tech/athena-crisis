// Keep in sync with `schema.graphql`.
export enum Biome {
  Grassland = 0,
  Desert = 1,
  Snow = 2,
  Swamp = 3,
  Spaceship = 4,
  Volcano = 5,
  Luna = 6,
}

export type BiomeName =
  | 'Grassland'
  | 'Desert'
  | 'Snow'
  | 'Swamp'
  | 'Spaceship'
  | 'Volcano'
  | 'Luna';

export const Biomes = [
  Biome.Grassland,
  Biome.Desert,
  Biome.Snow,
  Biome.Swamp,
  Biome.Spaceship,
  Biome.Volcano,
  Biome.Luna,
] as const;

const BiomeEnum = {
  [Biome.Desert]: 'Desert',
  [Biome.Grassland]: 'Grassland',
  [Biome.Luna]: 'Luna',
  [Biome.Snow]: 'Snow',
  [Biome.Spaceship]: 'Spaceship',
  [Biome.Swamp]: 'Swamp',
  [Biome.Volcano]: 'Volcano',
} as const;

const biomeNameToEnum = {
  Desert: Biome.Desert,
  Grassland: Biome.Grassland,
  Luna: Biome.Luna,
  Snow: Biome.Snow,
  Spaceship: Biome.Spaceship,
  Swamp: Biome.Swamp,
  Volcano: Biome.Volcano,
} as const;

export function getBiomeName(biome: Biome): BiomeName {
  return BiomeEnum[biome];
}

export function toBiome(biome: string | undefined | null): Biome | undefined {
  return biome && biome in biomeNameToEnum ? biomeNameToEnum[biome as BiomeName] : undefined;
}
