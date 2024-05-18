import sortBy from '@deities/hephaestus/sortBy.tsx';
import { Biome } from '../map/Biome.tsx';
import SpriteVector from '../map/SpriteVector.tsx';
import type { ID } from '../MapData.tsx';
import type { TileAnimation, TileInfo } from './Tile.tsx';
import { PlainTileGroup, SeaTileGroup } from './Tile.tsx';

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
  PowerTransformer,
  Gravestone,
  Bones,
  Vegetation,
  Shovel,
  Mask,
  Bucket,
  Ladder,
  Plank,
  Shipwreck,
  Sandbag,
}

export type Decorator = number;

export class DecoratorInfo {
  constructor(
    private readonly internalName: string,
    public readonly group: DecoratorGroup,
    public readonly position: SpriteVector,
    public readonly placeOn: Set<TileInfo>,
    public readonly animation: TileAnimation | null = null,
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

const seaAnimation = {
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
  seaAnimation,
);

const Plank = new DecoratorInfo(
  'Plank',
  DecoratorGroup.Plank,
  sprite(0, 2),
  SeaTileGroup,
  seaAnimation,
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
  seaAnimation,
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
  seaAnimation,
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
  seaAnimation,
);

const Sandbag = new DecoratorInfo(
  'Sandbag',
  DecoratorGroup.Sandbag,
  sprite(18, 0),
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
