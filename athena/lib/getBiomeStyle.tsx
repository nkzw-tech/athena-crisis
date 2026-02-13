import {
  Barrel,
  Beach,
  Box,
  Bridge,
  ConstructionSite,
  Forest,
  Forest2,
  Forest3,
  Iceberg,
  Island,
  Lightning,
  Mountain,
  Path,
  Plain,
  PlainTileGroup,
  Platform,
  River,
  Sea,
  SeaTileGroup,
  Space,
  SpaceBridge,
  SpaceShipBiome,
  StormCloud,
  Street,
  SwampBiome,
  TileInfo,
  Weeds,
} from '../info/Tile.tsx';
import { Biome } from '../map/Biome.tsx';

type HEX = `#${string}`;

export type Palette = Map<HEX, HEX>;

type BiomeStyle = {
  palette?: Palette | null;
  tileConversions?: Map<TileInfo, TileInfo>;
  tileRestrictions?: Set<TileInfo>;
  waterSwap?: Palette;
};

const SpaceShipTileRestrictions = new Set([
  ...PlainTileGroup,
  ...SeaTileGroup,
  StormCloud,
  Lightning,
]);
SpaceShipTileRestrictions.delete(Plain);
SpaceShipTileRestrictions.delete(ConstructionSite);
for (const info of SpaceShipBiome) {
  SpaceShipTileRestrictions.delete(info);
}

const VolcanoTileRestrictions = new Set([...SwampBiome, ...SpaceShipBiome, Island, Iceberg]);
VolcanoTileRestrictions.delete(Weeds);

const LunaTileRestrictions = new Set([...SwampBiome, ...SpaceShipBiome, Island, Iceberg, Forest2]);
LunaTileRestrictions.delete(Forest3);

const tileConversions = new Map([
  [Weeds, Island],
  [Iceberg, Island],
]);
const tileRestrictions = new Set([...SwampBiome, ...SpaceShipBiome, Iceberg]);

const style = {
  [Biome.Desert]: {
    palette: new Map<HEX, HEX>([
      ['#27810d', '#e09455'],
      ['#4f9e1b', '#fbc774'],
      ['#743d26', '#8c490e'],
      ['#4c1610', '#551912'],
    ]),
    tileConversions,
    tileRestrictions,
    waterSwap: new Map<HEX, HEX>([
      ['#13a6e2', '#0ec4e7'],
      ['#1ab7eb', '#15d6f0'],
      ['#62d4f1', '#5ee9f4'],
      ['#85e2f5', '#89f4f7'],
      ['#8ce5f5', '#89f4f7'],
      ['#d8fffd', '#d8fff8'],
    ]),
  },
  [Biome.Grassland]: {
    palette: null,
    tileConversions,
    tileRestrictions,
  },
  [Biome.Luna]: {
    palette: new Map<HEX, HEX>([
      ['#27810d', '#2c4c52'],
      ['#4f9e1b', '#385e5d'],
      ['#854c30', '#28454c'],
      ['#743d26', '#2a434d'],
      ['#4c1610', '#0d191c'],
    ]),
    tileConversions: new Map([...tileConversions, [Forest2, Forest3]]),
    tileRestrictions: LunaTileRestrictions,
    waterSwap: new Map<HEX, HEX>([
      ['#13a6e2', '#a90b50'],
      ['#1ab7eb', '#bc1261'],
      ['#62d4f1', '#e8499b'],
      ['#85e2f5', '#f593c6'],
      ['#8ce5f5', '#f593c6'],
      ['#d8fffd', '#ffbeff'],
    ]),
  },
  [Biome.Snow]: {
    palette: new Map<HEX, HEX>([
      ['#27810d', '#bccee7'],
      ['#4f9e1b', '#ebebeb'],
    ]),
    tileConversions: new Map([
      [Island, Iceberg],
      [Weeds, Iceberg],
    ]),
    tileRestrictions: new Set([Island, Weeds, ...SwampBiome, ...SpaceShipBiome]),
    waterSwap: new Map<HEX, HEX>([
      ['#13a6e2', '#088bed'],
      ['#1ab7eb', '#0f9ef6'],
      ['#62d4f1', '#5ac2f8'],
      ['#85e2f5', '#86d8fa'],
      ['#8ce5f5', '#86d8fa'],
      ['#d8fffd', '#d8fcff'],
    ]),
  },

  [Biome.Spaceship]: {
    palette: new Map<HEX, HEX>([
      ['#27810d', '#4f5677'],
      ['#4f9e1b', '#6d7488'],
    ]),
    tileConversions: new Map([
      [Forest, Box],
      [Forest2, Barrel],
      [Bridge, SpaceBridge],
      [Mountain, Platform],
      [Sea, Space],
      [River, Space],
      [Beach, Space],
      [Street, Path],
    ]),
    tileRestrictions: SpaceShipTileRestrictions,
  },
  [Biome.Swamp]: {
    palette: new Map<HEX, HEX>([
      ['#27810d', '#27810e'],
      ['#4f9e1b', '#3b932f'],
    ]),
    tileConversions: new Map([
      [Forest2, Forest3],
      [Iceberg, Weeds],
      [Island, Weeds],
    ]),
    tileRestrictions: new Set([...SpaceShipBiome, Forest2, Island, Iceberg]),
    waterSwap: new Map<HEX, HEX>([
      ['#13a6e2', '#899f06'],
      ['#1ab7eb', '#9fb108'],
      ['#62d4f1', '#d3dc31'],
      ['#85e2f5', '#ecf471'],
      ['#8ce5f5', '#ecf471'],
      ['#d8fffd', '#fffdca'],
    ]),
  },
  [Biome.Volcano]: {
    palette: new Map<HEX, HEX>([
      ['#27810d', '#544440'],
      ['#4f9e1b', '#6b5b54'],
      ['#854c30', '#544440'],
      ['#743d26', '#553a36'],
      ['#4c1610', '#2f1c1a'],
    ]),
    tileConversions: new Map([
      [Iceberg, Weeds],
      [Island, Weeds],
    ]),
    tileRestrictions: VolcanoTileRestrictions,
    waterSwap: new Map<HEX, HEX>([
      ['#13a6e2', '#a1190b'],
      ['#1ab7eb', '#b61b12'],
      ['#62d4f1', '#e84949'],
      ['#85e2f5', '#fbc58c'],
      ['#8ce5f5', '#fbc58c'],
      ['#d8fffd', '#ffd5be'],
    ]),
  },
};

export default function getBiomeStyle(biome: Biome): BiomeStyle {
  return style[biome];
}
