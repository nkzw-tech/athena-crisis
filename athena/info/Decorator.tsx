import sortBy from '@nkzw/core/sortBy.js';
import { Biome } from '../map/Biome.tsx';
import SpriteVector from '../map/SpriteVector.tsx';
import { ID } from '../MapData.tsx';
import {
  PlainTileGroup,
  SeaTileGroup,
  TileAnimation,
  TileInfo,
  Trench,
} from './Tile.tsx';

const sprite = (x: number, y: number) => new SpriteVector(x, y);

enum DecoratorGroup {
  Bush,
  TreeTrunk,
  Log,
  Barrel,
  Box,
  Barrier,
  StreetSign,
  Rock,
  Mushroom,
  PotHole,
  ElectricityPole,
  Gate,
  Statue,
  Arch,
  Flower,
  Lantern,
  StoneLantern,
  Mailbox,
  FireHydrant,
  Snowman,
  Sign,
  PowerTransformer,
  Gravestone,
  Bones,
  Vegetation,
  Shovel,
  Mask,
  Bucket,
  Trench,
  Fence,
  Pipe,
  Ladder,
  Plank,
  Pumpkin,
  Coffin,
  SpiderWeb,
  Candle,
  Cauldron,
  DestroyedUnit,
  Shipwreck,
  Buoy,
}

export type Decorator = number;

export class DecoratorInfo {
  constructor(
    private readonly internalName: string,
    public readonly group: DecoratorGroup,
    public readonly position: SpriteVector,
    public readonly placeOn: Set<TileInfo>,
    public readonly animation: (TileAnimation & { clear?: true }) | null = null,
    public readonly biomeStyle?: Map<Biome, SpriteVector>,
    public readonly id: ID = 0,
  ) {}

  get name() {
    Object.defineProperty(this, 'name', { value: this.internalName });
    return this.internalName;
  }

  copy({
    animation,
    biomeStyle,
    group,
    id,
    name,
    placeOn,
    position,
  }: {
    animation?: TileAnimation | null;
    biomeStyle?: Map<Biome, SpriteVector>;
    group?: DecoratorGroup;
    id?: ID;
    name?: string;
    placeOn?: Set<TileInfo>;
    position?: SpriteVector;
  }): DecoratorInfo {
    return new DecoratorInfo(
      name ?? this.internalName,
      group ?? this.group,
      position ?? this.position,
      placeOn ?? this.placeOn,
      animation ?? this.animation,
      biomeStyle ?? this.biomeStyle,
      id ?? this.id,
    );
  }

  right(n = 1) {
    return this.copy({ position: this.position.right(n) });
  }

  down(n = 1) {
    return this.copy({ position: this.position.down(n) });
  }

  up(n = 1) {
    return this.copy({ position: this.position.up(n) });
  }
}

const TrenchTileGroup = new Set([Trench]);

const animation = {
  frames: 4,
  offset: 1,
  ticks: 6,
};

const _Bush = new DecoratorInfo(
  'Bush',
  DecoratorGroup.Bush,
  sprite(0, 0),
  PlainTileGroup,
);

const TreeTrunk = new DecoratorInfo(
  'Tree Trunk',
  DecoratorGroup.TreeTrunk,
  sprite(4, 0),
  PlainTileGroup,
  null,
  new Map([[Biome.Volcano, sprite(0, 9)]]),
);

const Log = new DecoratorInfo(
  'Log',
  DecoratorGroup.Log,
  sprite(8, 0),
  PlainTileGroup,
  null,
  new Map([[Biome.Volcano, sprite(0, 9)]]),
);

const Barrel = new DecoratorInfo(
  'Barrel',
  DecoratorGroup.Barrel,
  sprite(12, 0),
  PlainTileGroup,
);

const Box = new DecoratorInfo(
  'Box',
  DecoratorGroup.Box,
  sprite(13, 0),
  PlainTileGroup,
);

const Barrier = new DecoratorInfo(
  'Barrier',
  DecoratorGroup.Barrier,
  sprite(15, 0),
  PlainTileGroup,
);

const Ladder = new DecoratorInfo(
  'Ladder',
  DecoratorGroup.Ladder,
  sprite(0, 1),
  SeaTileGroup,
  animation,
);

const Plank = new DecoratorInfo(
  'Plank',
  DecoratorGroup.Plank,
  sprite(0, 2),
  SeaTileGroup,
  animation,
);

const StreetSign = new DecoratorInfo(
  'Street Sign',
  DecoratorGroup.StreetSign,
  sprite(4, 1),
  PlainTileGroup,
);

const StreetSigns = [
  StreetSign,
  StreetSign.right(),
  StreetSign.right(2),
  StreetSign.right(3),
  StreetSign.right(4),
  StreetSign.right(5),
  StreetSign.right(6),
  StreetSign.right(7),
];

const Rock = new DecoratorInfo(
  'Rock',
  DecoratorGroup.Rock,
  sprite(12, 9),
  PlainTileGroup,
);

const Mushroom = new DecoratorInfo(
  'Mushroom',
  DecoratorGroup.Mushroom,
  sprite(12, 1),
  PlainTileGroup,
);

const Mushrooms = [
  Mushroom,
  Mushroom.right(),
  Mushroom.right(2),
  Mushroom.right(3),
];

const Pylon = new DecoratorInfo(
  'Pylon',
  DecoratorGroup.Barrier,
  sprite(16, 2),
  PlainTileGroup,
);

const Pothole = new DecoratorInfo(
  'Pothole',
  DecoratorGroup.PotHole,
  sprite(0, 6),
  PlainTileGroup,
  animation,
);

const ElectricityPole = new DecoratorInfo(
  'Electricity Pole',
  DecoratorGroup.ElectricityPole,
  sprite(4, 5),
  PlainTileGroup,
);

const Gate = new DecoratorInfo(
  'Gate',
  DecoratorGroup.Gate,
  sprite(4, 6),
  PlainTileGroup,
);

const StreetLamp = new DecoratorInfo(
  'Street Lamp',
  DecoratorGroup.StreetSign,
  sprite(4, 7),
  PlainTileGroup,
  animation,
);

const Statue = new DecoratorInfo(
  'Statue',
  DecoratorGroup.Statue,
  sprite(6, 6),
  PlainTileGroup,
);

const Arch = new DecoratorInfo(
  'Arch',
  DecoratorGroup.Arch,
  sprite(10, 5),
  PlainTileGroup,
);

const Flower = new DecoratorInfo(
  'Flower',
  DecoratorGroup.Flower,
  sprite(11, 5),
  PlainTileGroup,
);

const Flowers = [Flower, Flower.right(), Flower.right(2), Flower.right(3)];

const Lantern = new DecoratorInfo(
  'Lantern',
  DecoratorGroup.Lantern,
  sprite(8, 8),
  PlainTileGroup,
);

const PowerTransformer = new DecoratorInfo(
  'Power Transformer',
  DecoratorGroup.PowerTransformer,
  sprite(8, 7),
  PlainTileGroup,
);

const Gravestone = new DecoratorInfo(
  'Gravestone',
  DecoratorGroup.Gravestone,
  sprite(17, 2),
  PlainTileGroup,
);

const Bones = new DecoratorInfo(
  'Bones',
  DecoratorGroup.Bones,
  sprite(15, 6),
  PlainTileGroup,
);

const Vegetation = new DecoratorInfo(
  'Vegetation',
  DecoratorGroup.Vegetation,
  sprite(10, 8),
  PlainTileGroup,
);

const Shovel = new DecoratorInfo(
  'Shovel',
  DecoratorGroup.Shovel,
  sprite(0, 9),
  PlainTileGroup,
);

const Mask = new DecoratorInfo(
  'Mask',
  DecoratorGroup.Mask,
  sprite(17, 8),
  PlainTileGroup,
);

const Bucket = new DecoratorInfo(
  'Bucket',
  DecoratorGroup.Bucket,
  sprite(16, 8),
  PlainTileGroup,
);

const Shipwreck = new DecoratorInfo(
  'Shipwreck',
  DecoratorGroup.Shipwreck,
  sprite(0, 10),
  SeaTileGroup,
  animation,
);

const Sandbag = new DecoratorInfo(
  'Sandbag',
  DecoratorGroup.Trench,
  sprite(18, 0),
  PlainTileGroup,
);

const TrenchGate = new DecoratorInfo(
  'Trench Gate',
  DecoratorGroup.Trench,
  sprite(18, 3),
  TrenchTileGroup,
);

const TrenchPlank = new DecoratorInfo(
  'Trench Plank',
  DecoratorGroup.Trench,
  sprite(18, 4),
  TrenchTileGroup,
);

const StoneLantern = new DecoratorInfo(
  'Stone Lantern',
  DecoratorGroup.StoneLantern,
  sprite(19, 0),
  PlainTileGroup,
);

const Mailbox = new DecoratorInfo(
  'Mailbox',
  DecoratorGroup.Mailbox,
  sprite(21, 0),
  PlainTileGroup,
);

const FireHydrant = new DecoratorInfo(
  'Fire Hydrant',
  DecoratorGroup.FireHydrant,
  sprite(19, 1),
  PlainTileGroup,
);

const Snowman = new DecoratorInfo(
  'Snowman',
  DecoratorGroup.Snowman,
  sprite(22, 1),
  PlainTileGroup,
);

const Sign = new DecoratorInfo(
  'Sign',
  DecoratorGroup.Sign,
  sprite(24, 1),
  PlainTileGroup,
);

const Buoy = new DecoratorInfo(
  'Buoy',
  DecoratorGroup.Buoy,
  sprite(20, 10),
  SeaTileGroup,
  animation,
);

const Fence = new DecoratorInfo(
  'Fence',
  DecoratorGroup.Fence,
  sprite(19, 2),
  PlainTileGroup,
);

const Pipe = new DecoratorInfo(
  'Pipe',
  DecoratorGroup.Pipe,
  sprite(23, 2),
  PlainTileGroup,
);

const Pumpkin = new DecoratorInfo(
  'Pumpkin',
  DecoratorGroup.Pumpkin,
  sprite(21, 3),
  PlainTileGroup,
);

const Coffin = new DecoratorInfo(
  'Coffin',
  DecoratorGroup.Coffin,
  sprite(20, 1),
  PlainTileGroup,
);

const AnimatedCoffin = new DecoratorInfo(
  'Coffin',
  DecoratorGroup.Coffin,
  sprite(21, 4),
  PlainTileGroup,
  animation,
);

const SpiderWeb = new DecoratorInfo(
  'Spider Web',
  DecoratorGroup.SpiderWeb,
  sprite(21, 5),
  PlainTileGroup,
);

const Candle = new DecoratorInfo(
  'Candle',
  DecoratorGroup.Candle,
  sprite(22, 6),
  PlainTileGroup,
  { ...animation, clear: true },
);

const Cauldron = new DecoratorInfo(
  'Cauldron',
  DecoratorGroup.Cauldron,
  sprite(0, 11),
  PlainTileGroup,
  { ...animation, clear: true, frames: 11 },
);

const DestroyedUnit = new DecoratorInfo(
  'Destroyed Unit',
  DecoratorGroup.DestroyedUnit,
  sprite(0, 12),
  PlainTileGroup,
);

// The order of decorators must not be changed.
const Decorators = [
  _Bush,
  _Bush.right(),
  _Bush.right(2),
  _Bush.right(3),
  TreeTrunk,
  TreeTrunk.right(),
  TreeTrunk.right(2),
  TreeTrunk.right(3),
  Log,
  Log.right(),
  Log.right(2),
  Log.right(3),
  Barrel,
  Box,
  Box.right(),
  Barrier,
  Barrier.right(),
  Barrier.right(2),
  Ladder,
  Plank,
  Plank.down(),
  Plank.down(2),
  Plank.down(3),
  ...StreetSigns,
  ...StreetSigns.map((decorator) => decorator.down()),
  ...StreetSigns.map((decorator) => decorator.down(2)),
  ...StreetSigns.map((decorator) => decorator.down(3)),
  Rock,
  Rock.right(),
  Rock.right(2),
  Rock.right(3),
  Rock.right(4),
  ...Mushrooms,
  ...Mushrooms.map((decorator) => decorator.down()),
  ...Mushrooms.map((decorator) => decorator.down(2)),
  Pylon,
  Pothole,
  Pothole.down(),
  Pothole.down(2),
  ElectricityPole,
  ElectricityPole.right(),
  ElectricityPole.right(2),
  ElectricityPole.right(3),
  ElectricityPole.right(4),
  ElectricityPole.right(5),
  Gate,
  Gate.right(),
  StreetLamp,
  StreetLamp.down(),
  Statue,
  Statue.right(),
  Statue.right(2),
  Statue.right(3),
  Statue.right(4),
  Arch,
  ...Flowers,
  ...Flowers.map((decorator) => decorator.down()),
  ...Flowers.map((decorator) => decorator.down(2)),
  Lantern,
  Lantern.right(),
  PowerTransformer,
  PowerTransformer.right(),
  PowerTransformer.right(2),
  Barrel.right(4).down(3),
  Barrel.right(4).down(4),
  Barrel.right(4).down(5),
  Barrel.right(4).down(6),
  Gravestone,
  Gravestone.down(),
  Gravestone.down(2),
  Gravestone.down(3),
  Gravestone.down(4),
  Bones,
  Bones.down(),
  Bones.down().right(),
  Bones.down().right(2),
  Vegetation,
  Vegetation.right(),
  Vegetation.right(2),
  Vegetation.right(3),
  Vegetation.right(4),
  Vegetation.right(5),
  Shovel,
  Shovel.right(),
  Shovel.right(2),
  Shovel.right(3),
  Mask,
  Bucket,
  ...Mushrooms.map((decorator) => decorator.down(3)),
  Statue.right(10).up(5),
  Shipwreck,
  Shipwreck.right(4),
  Shipwreck.right(8),
  Shipwreck.right(12),
  Shipwreck.right(16),
  Sandbag,
  Sandbag.down(1),
  Sandbag.down(2),
  TrenchGate,
  TrenchPlank,
  TrenchPlank.down(1),
  TrenchPlank.down(2),
  TrenchPlank.down(3),
  StoneLantern,
  StoneLantern.right(),
  Mailbox,
  Mailbox.right(1),
  Mailbox.right(2),
  Mailbox.right(3),
  Lantern.copy({
    position: new SpriteVector(25, 0),
  }),
  Lantern.copy({
    position: new SpriteVector(26, 0),
  }),
  FireHydrant,
  Snowman,
  Snowman.right(),
  Sign,
  Sign.right(),
  Buoy,
  Fence,
  Fence.right(1),
  Fence.right(2),
  Fence.right(3),
  Fence.down(1),
  Fence.down(1).right(1),
  Fence.down(2),
  Fence.down(2).right(1),
  Fence.down(3),
  Fence.down(3).right(1),
  Fence.down(4),
  Fence.down(4).right(1),
  Fence.down(4).right(2),
  Fence.down(5),
  Fence.down(5).right(1),
  Fence.down(6),
  Fence.down(6).right(1),
  Fence.down(7),
  Fence.down(7).right(1),
  Pipe,
  Pipe.right(1),
  Pipe.right(2),
  Pumpkin,
  Pumpkin.right(1),
  Pumpkin.right(2),
  Pumpkin.right(3),
  Pumpkin.right(4),
  Coffin,
  Coffin.right(1),
  AnimatedCoffin,
  SpiderWeb,
  SpiderWeb.right(1),
  SpiderWeb.right(2),
  Candle,
  Candle.down(1),
  Candle.down(2),
  Candle.down(3),
  Cauldron,
  Shipwreck.down(1).right(12),
  Shipwreck.down(1).right(16),
  ...Array(19)
    .fill(0)
    .map((_, index) => DestroyedUnit.right(index)),
].map((decorator, index) => decorator.copy({ id: index + 1 }));

export const Bush = Decorators[0];

export function getDecorator(index: Decorator): DecoratorInfo | null {
  return Decorators[index - 1] || null;
}

// Defensive copy: Prevent mutations of the internal array.
const decorators = sortBy(Decorators.slice(), ({ group }) => group);
export function getAllDecorators(): ReadonlyArray<DecoratorInfo> {
  return decorators;
}

export function mapDecorators<T>(
  fn: (decorator: DecoratorInfo) => T,
): Array<T> {
  return Decorators.map((decorator) => decorator && fn(decorator));
}
