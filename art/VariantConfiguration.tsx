import { SpriteVariant } from '@deities/athena/info/SpriteVariants.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  PlainDynamicPlayerID,
  PlayerIDs,
} from '@deities/athena/map/Player.tsx';
import { HEX } from '@nkzw/palette-swap';
import BiomeVariants from './BiomeVariants.tsx';

const variantNames = new Set(PlayerIDs);
const biomeVariantNames = new Set(BiomeVariants.keys());

export type Palette = number | Map<HEX, HEX>;

export type SpriteVariantConfiguration = Readonly<{
  asImage?: true;
  ignoreMissing?: true;
  variantNames: ReadonlySet<PlainDynamicPlayerID | Biome>;
  waterSwap?: true;
}>;

export default new Map<SpriteVariant, SpriteVariantConfiguration>([
  [
    'Buildings',
    {
      variantNames,
    },
  ],
  [
    'Building-Create',
    {
      variantNames,
    },
  ],
  [
    'NavalExplosion',
    {
      variantNames: biomeVariantNames,
    },
  ],
  [
    'Label',
    {
      variantNames,
    },
  ],
  [
    'Rescue',
    {
      variantNames,
    },
  ],
  [
    'Spawn',
    {
      variantNames,
    },
  ],
  [
    'Units-AcidBomber',
    {
      variantNames,
    },
  ],
  [
    'Portraits',
    {
      asImage: true,
      variantNames: new Set<PlainDynamicPlayerID>([
        ...variantNames,
        -1,
        -2,
        -3,
      ]),
    },
  ],
  [
    'Units-AntiAir',
    {
      variantNames,
    },
  ],
  [
    'Units-HeavyArtillery',
    {
      variantNames,
    },
  ],
  [
    'Units-Dragon',
    {
      variantNames,
    },
  ],
  [
    'Units-Bomber',
    {
      variantNames,
    },
  ],
  [
    'Units-BattleShip',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-Octopus',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'AttackOctopus',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-Drone',
    {
      variantNames,
    },
  ],
  [
    'Units-FighterJet',
    {
      variantNames,
    },
  ],
  [
    'Units-Helicopter',
    {
      variantNames,
    },
  ],
  [
    'Units-Pioneer',
    {
      variantNames,
    },
  ],
  [
    'Units-Infantry',
    {
      variantNames,
    },
  ],
  [
    'Units-RocketLauncher',
    {
      variantNames,
    },
  ],
  [
    'Units-BazookaBear',
    {
      variantNames,
    },
  ],
  [
    'Units-Alien',
    {
      variantNames,
    },
  ],
  [
    'Units-Zombie',
    {
      variantNames,
    },
  ],
  [
    'Units-Ogre',
    {
      variantNames,
    },
  ],
  [
    'Units-Brute',
    {
      variantNames,
    },
  ],
  [
    'Units-Commander',
    {
      variantNames,
    },
  ],
  [
    'Units-Dinosaur',
    {
      variantNames,
    },
  ],
  [
    'Units-Bear',
    {
      variantNames,
    },
  ],
  [
    'Units-Flamethrower',
    {
      variantNames,
    },
  ],

  [
    'Units-AIU',
    {
      variantNames,
    },
  ],
  [
    'Units-APU',
    {
      variantNames,
    },
  ],
  [
    'Units-SuperAPU',
    {
      variantNames,
    },
  ],
  [
    'Units-Saboteur',
    {
      variantNames,
    },
  ],
  [
    'Units-Jetpack',
    {
      variantNames,
    },
  ],
  [
    'Units-Sniper',
    {
      variantNames,
    },
  ],
  [
    'Units-Jeep',
    {
      variantNames,
    },
  ],
  [
    'Units-Truck',
    {
      variantNames,
    },
  ],
  [
    'Units-Lander',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-Amphibious',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-Frigate',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-Destroyer',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-Hovercraft',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-SmallHovercraft',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-SupportShip',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  [
    'Units-Corvette',
    {
      variantNames,
      waterSwap: true,
    },
  ],
  ['Units-Mammoth', { variantNames }],
  ['Units-TransportTrain', { variantNames }],
  ['Units-SupplyTrain', { variantNames }],
  [
    'Units-MobileArtillery',
    {
      variantNames,
    },
  ],
  [
    'Units-Cannon',
    {
      variantNames,
    },
  ],
  [
    'Units-Medic',
    {
      variantNames,
    },
  ],
  [
    'Units-ReconDrone',
    {
      variantNames,
    },
  ],
  [
    'Units-Humvee',
    {
      variantNames,
    },
  ],
  [
    'Units-HumveeAvenger',
    {
      variantNames,
    },
  ],
  [
    'Units-ArtilleryHumvee',
    {
      variantNames,
    },
  ],
  [
    'Units-SeaPatrol',
    {
      variantNames,
    },
  ],
  [
    'Units-XFighter',
    {
      variantNames,
    },
  ],
  [
    'Units-SmallTank',
    {
      variantNames,
    },
  ],
  [
    'Units-HeavyTank',
    {
      variantNames,
    },
  ],
  [
    'Units-SuperTank',
    {
      variantNames,
    },
  ],
  [
    'Units-TransportHelicopter',
    {
      variantNames,
    },
  ],
  [
    'BuildingsShadow',
    {
      asImage: true,
      ignoreMissing: true,
      variantNames: biomeVariantNames,
    },
  ],
  [
    'StructuresShadow',
    {
      asImage: true,
      ignoreMissing: true,
      variantNames: biomeVariantNames,
    },
  ],
  [
    'Decorators',
    {
      asImage: true,
      ignoreMissing: true,
      variantNames: biomeVariantNames,
    },
  ],
] as const);
