import sortBy from '@deities/hephaestus/sortBy.tsx';
import { Modifier } from '../lib/Modifier.tsx';
import { Biome } from '../map/Biome.tsx';
import SpriteVector from '../map/SpriteVector.tsx';
import { isVector } from '../map/Vector.tsx';
import { ID, TileMap } from '../MapData.tsx';
import { MovementType, MovementTypes } from './MovementType.tsx';

export enum RenderType {
  Composite = 0,
  Horizontal = 1,
  Vertical = 2,
  Quarter = 4,
}

const { Composite, Horizontal, Quarter, Vertical } = RenderType;

type CompositeModifierValue = [
  RenderType.Composite,
  SpriteVector,
  SpriteVector,
];

type HorizontalModifierValue = [
  RenderType.Horizontal,
  SpriteVector,
  SpriteVector,
];
type VerticalModifierValue = [RenderType.Vertical, SpriteVector, SpriteVector];

type QuarterModifierValue = [
  RenderType.Quarter,
  SpriteVector,
  SpriteVector,
  SpriteVector,
  SpriteVector,
];

type ModifierValue =
  | SpriteVector
  | CompositeModifierValue
  | HorizontalModifierValue
  | VerticalModifierValue
  | QuarterModifierValue;

export type TileField = number | [number, number];
export type TileLayer = 0 | 1;

export type TileAnimation = Readonly<{
  frames: number;
  horizontal?: true;
  modifiers?: Set<Modifier>;
  offset: number;
  ticks: number;
}>;

const sprite = (x: number, y: number) => new SpriteVector(x, y);

const composite = (
  tile: TileInfo,
  modifier: Modifier,
  sprite: SpriteVector,
): [Modifier, CompositeModifierValue] => {
  const modifierValue = tile.sprite.modifiers.get(modifier);
  if (!modifierValue || Array.isArray(modifierValue)) {
    throw new Error('Oops');
  }
  return [modifier, [Composite, modifierValue, sprite]];
};

const horizontal = (
  l: SpriteVector,
  r: SpriteVector,
): HorizontalModifierValue => [Horizontal, l, r.down(0.5)];
const vertical = (u: SpriteVector, d: SpriteVector): VerticalModifierValue => [
  Vertical,
  u,
  d.right(0.5),
];

const quarter = (
  lu: SpriteVector,
  ru: SpriteVector,
  ld: SpriteVector,
  rd: SpriteVector,
): QuarterModifierValue => [
  Quarter,
  lu,
  ru.right(0.5),
  ld.down(0.5),
  rd.right(0.5).down(0.5),
];

export class TileDecoratorInfo {
  // @ts-expect-error Add an invisible private prop to tell
  // TypeScript that this class does not conform to TileInfo.
  private readonly _TileDecoratorInfo = undefined;
  constructor(
    public readonly position: SpriteVector,
    public readonly animation?: TileAnimation | null,
    private readonly biomes?: ReadonlySet<Biome>,
  ) {}

  public isVisible(biome: Biome) {
    return !this.biomes || this.biomes.has(biome);
  }
}

export class TileInfo {
  public readonly configuration: {
    cover: number;
    movement: ReadonlyMap<MovementType, number>;
    transitionCost?: ReadonlyMap<MovementType, number>;
    vision: number;
  };
  public readonly group: TileType;
  public readonly sprite: {
    alternate: boolean;
    animation?: TileAnimation | null;
    modifiers: ReadonlyMap<Modifier, ModifierValue>;
    noClip?: boolean | Biome;
    position: SpriteVector;
  };
  public readonly type: number;
  public readonly style: {
    connectsWith?: TileInfo;
    crossesWith?: number;
    decorator?: TileDecoratorInfo;
    fallback?: TileInfo;
    hidden: boolean;
    isolated: boolean;
    layer: TileLayer;
  };

  constructor(
    public readonly id: ID,
    private readonly internalName: string,
    private readonly internalDescription: string,
    group: TileType | { group: TileType; type: number },
    configuration: {
      cover: number;
      movement: ReadonlyMap<MovementType, number>;
      transitionCost?: ReadonlyMap<MovementType, number>;
      vision?: number;
    },
    sprite:
      | {
          alternate?: boolean;
          animation?: TileAnimation | null;
          modifiers?: ReadonlyMap<Modifier, ModifierValue>;
          noClip?: boolean | Biome;
          position: SpriteVector;
        }
      | SpriteVector,
    style?: {
      connectsWith?: TileInfo;
      crossesWith?: number;
      decorator?: TileDecoratorInfo;
      fallback?: TileInfo;
      hidden?: boolean;
      isolated?: boolean;
      layer?: TileLayer;
    },
  ) {
    this.group = typeof group === 'number' ? group : group.group;
    this.type = this.group | (typeof group === 'number' ? 0 : group.type);
    this.configuration = {
      vision: 1,
      ...configuration,
    };
    this.sprite = {
      alternate: false,
      modifiers: new Map(),
      ...(isVector(sprite) ? { position: sprite } : sprite),
    };
    this.style = {
      ...style,
      hidden: style?.hidden || false,
      isolated: style?.isolated || false,
      layer: style?.layer || 0,
    };
  }

  get name() {
    Object.defineProperty(this, 'name', { value: this.internalName });
    return this.internalName;
  }

  get description() {
    Object.defineProperty(this, 'description', {
      value: this.internalDescription,
    });
    return this.internalDescription;
  }

  getMovementCost({ movementType }: { movementType: MovementType }): number {
    return this.configuration.movement.get(movementType) || -1;
  }

  getTransitionCost({ movementType }: { movementType: MovementType }): number {
    return this.configuration.transitionCost?.get(movementType) || 0;
  }

  isInaccessible() {
    return this.type & TileTypes.Inaccessible;
  }
}

export const SeaAnimation = {
  frames: 4,
  offset: 3,
  ticks: 6,
} as const;

const HorizontalSeaAnimation = {
  ...SeaAnimation,
  horizontal: true,
  offset: 1,
} as const;

/* eslint-disable sort-keys-fix/sort-keys-fix */
export const TileTypes = {
  Plain: 2,
  Forest: 4,
  ForestVariant2: 8,
  ForestVariant3: 16,
  ForestVariant4: 32,
  Mountain: 64,
  Street: 128,
  Trench: 256,
  River: 512,
  ConstructionSite: 1024,
  Pier: 2048,
  Airfield: 4096,
  Sea: 8192,
  DeepSea: 16_384,
  Bridge: 32_768,
  ConnectWithEdge: 65_536,
  RailTrack: 131_072,
  AreaDecorator: 262_144,
  Campsite: 524_288,
  StormCloud: 1_048_576,
  AreaMatchesAll: 2_097_152,
  Pipe: 4_194_304,
  Teleporter: 8_388_608,
  Joinable: 16_777_216,
  Area: 33_554_432,
  Inaccessible: 67_108_864,
} as const;
/* eslint-enable sort-keys-fix/sort-keys-fix */

type TileTypeT = typeof TileTypes;
export type TileType = TileTypeT[keyof TileTypeT];

const PlainMovementCosts = new Map([
  [MovementTypes.Air, 1],
  [MovementTypes.AirInfantry, 1],
  [MovementTypes.Amphibious, 2],
  [MovementTypes.Soldier, 1],
  [MovementTypes.HeavySoldier, 1],
  [MovementTypes.LowAltitude, 1],
  [MovementTypes.Rail, -1],
  [MovementTypes.Ship, -1],
  [MovementTypes.Tires, 1],
  [MovementTypes.Tread, 1],
]);

const InaccessibleMovementCosts = new Map([
  [MovementTypes.Air, -1],
  [MovementTypes.AirInfantry, -1],
  [MovementTypes.Amphibious, -1],
  [MovementTypes.Soldier, -1],
  [MovementTypes.HeavySoldier, -1],
  [MovementTypes.LowAltitude, -1],
  [MovementTypes.Rail, -1],
  [MovementTypes.Ship, -1],
  [MovementTypes.Tires, -1],
  [MovementTypes.Tread, -1],
]);

const JoinableModifiers = new Map<Modifier, ModifierValue>([
  [Modifier.Vertical, sprite(1, 0)],
  [Modifier.TopLeftCorner, sprite(-3, 0)],
  [Modifier.TRight, sprite(-3, 1)],
  [Modifier.BottomLeftCorner, sprite(-3, 2)],
  [Modifier.TBottom, sprite(-2, 0)],
  [Modifier.JoinableCenter, sprite(-2, 1)],
  [Modifier.TTop, sprite(-2, 2)],
  [Modifier.TopRightCorner, sprite(-1, 0)],
  [Modifier.TLeft, sprite(-1, 1)],
  [Modifier.Single, vertical(sprite(0, 2), sprite(0, 1))],
  [Modifier.BottomRightCorner, sprite(-1, 2)],

  [Modifier.TailUp, sprite(1, 2)],
  [Modifier.TailDown, sprite(1, 1)],
  [Modifier.TailLeft, sprite(0, 2)],
  [Modifier.TailRight, sprite(0, 1)],
]);

const RiverModifiers = (() => {
  const lt = sprite(-1, 0);
  const rt = sprite(1, 0);
  const lb = sprite(-1, 2);
  const rb = sprite(1, 2);
  return new Map<Modifier, ModifierValue>([
    [Modifier.Single, quarter(lt, rt, lb, rb)],
    [Modifier.Vertical, sprite(-1, 1)],

    [Modifier.BottomLeftCorner, lb],
    [Modifier.BottomRightCorner, rb],
    [Modifier.JoinableCenter, sprite(2, 2)],
    [Modifier.TBottom, sprite(3, 0)],
    [Modifier.TLeft, sprite(3, 1)],
    [Modifier.TopLeftCorner, lt],
    [Modifier.TopRightCorner, rt],
    [Modifier.TRight, sprite(2, 0)],
    [Modifier.TTop, sprite(2, 1)],

    [Modifier.TailUp, vertical(lt, rt)],
    [Modifier.TailDown, vertical(lb, rb)],
    [Modifier.TailLeft, horizontal(lt, lb)],
    [Modifier.TailRight, horizontal(rt, rb)],

    [Modifier.ConnectingTailDown, sprite(-1, 1)],
    [Modifier.ConnectingTailLeft, sprite(0, 0)],
    [Modifier.ConnectingTailRight, sprite(0, 0)],
    [Modifier.ConnectingTailUp, sprite(-1, 1)],
  ]);
})();

const AreaModifiers = (() => {
  /*
   * b = bottom
   * t = top
   * l = left
   * r = right
   * e = edge
   * w = wall
   */
  const b = sprite(0, 1);
  const lb = sprite(-1, 1);
  const lt = sprite(-1, -1);
  const rb = sprite(1, 1);
  const rt = sprite(1, -1);
  const t = sprite(0, -1);
  const l = sprite(-1, 0);
  const r = sprite(1, 0);
  const bre = sprite(2, -1);
  const tre = sprite(2, 0);
  const ble = sprite(3, -1);
  const tle = sprite(3, 0);
  const lw = sprite(-1, 0);
  const tw = sprite(0, -1);
  const bw = sprite(0, 1);
  const rw = sprite(1, 0);
  return new Map<Modifier, ModifierValue>([
    [Modifier.Single, quarter(lt, rt, lb, rb)],
    [Modifier.Horizontal, horizontal(t, b)],
    [Modifier.Vertical, vertical(l, r)],
    [Modifier.TopLeftCorner, quarter(lt, lt, lt, bre)],
    [Modifier.TRight, quarter(lw, tre, lw, bre)],
    [Modifier.BottomLeftCorner, quarter(lb, tre, lb, lb)],
    [Modifier.TBottom, quarter(tw, tw, ble, bre)],
    [Modifier.JoinableCenter, quarter(tle, tre, ble, bre)],
    [Modifier.TTop, quarter(tle, tre, bw, bw)],
    [Modifier.TopRightCorner, quarter(rt, rt, ble, rt)],
    [Modifier.TLeft, quarter(tle, rw, ble, rw)],
    [Modifier.BottomRightCorner, quarter(tle, rb, rb, rb)],

    [Modifier.TailUp, vertical(lt, rt)],
    [Modifier.TailDown, vertical(lb, rb)],
    [Modifier.TailLeft, horizontal(lt, lb)],
    [Modifier.TailRight, horizontal(rt, rb)],

    [Modifier.Center, sprite(0, 0)],
    [Modifier.TopLeftAreaCorner, lt],
    [Modifier.TopRightAreaCorner, rt],
    [Modifier.BottomLeftAreaCorner, lb],
    [Modifier.BottomRightAreaCorner, rb],

    [Modifier.LeftWall, lw],
    [Modifier.TopWall, tw],
    [Modifier.BottomWall, bw],
    [Modifier.RightWall, rw],

    [Modifier.BottomRightEdge, bre],
    [Modifier.TopRightEdge, tre],
    [Modifier.BottomLeftEdge, ble],
    [Modifier.TopLeftEdge, tle],

    [Modifier.TopRightBottomLeftEdge, horizontal(tre, ble)],
    [Modifier.TopLeftBottomRightEdge, horizontal(tle, bre)],
    [Modifier.BottomLeftAndRightEdge, vertical(ble, bre)],
    [Modifier.TopLeftAndRightEdge, vertical(tle, tre)],
    [Modifier.TopRightBottomRightEdge, horizontal(tre, bre)],
    [Modifier.TopLeftBottomLeftEdge, horizontal(tle, ble)],

    [Modifier.TopRightIsArea, quarter(tle, tle, ble, bre)],
    [Modifier.TopLeftIsArea, quarter(tre, tre, ble, bre)],
    [Modifier.BottomRightIsArea, quarter(tle, tre, ble, ble)],
    [Modifier.BottomLeftIsArea, quarter(tle, tre, bre, bre)],

    [Modifier.RightWallBottomLeftEdge, vertical(ble, rw)],
    [Modifier.LeftWallBottomRightEdge, vertical(lw, bre)],
    [Modifier.BottomWallRightTopEdge, horizontal(tre, bw)],
    [Modifier.TopWallBottomLeftEdge, horizontal(tw, ble)],
    [Modifier.BottomWallLeftTopEdge, horizontal(tle, bw)],
    [Modifier.LeftWallTopRightEdge, vertical(lw, tre)],
    [Modifier.RightWallTopLeftEdge, vertical(tle, rw)],
    [Modifier.TopWallRightBottomEdge, horizontal(tw, bre)],
  ]);
})();

export const Plain = new TileInfo(
  1,
  'Plain',
  `A flat terrain with minimal cover, allowing most units to move freely.`,
  TileTypes.Plain,
  { cover: 5, movement: PlainMovementCosts },
  {
    modifiers: new Map([
      [Modifier.Variant2, sprite(1, 0)],
      [Modifier.Variant3, sprite(2, 0)],
    ]),
    position: sprite(0, 0),
  },
  { isolated: true },
);

export const Forest = new TileInfo(
  2,
  'Forest',
  `Dense woodland providing moderate cover but slowing down light vehicles and tanks. When it is foggy, units hiding in forests are only visible to adjacent units.`,
  {
    group: TileTypes.Forest,
    type: TileTypes.Joinable,
  },
  {
    cover: 20,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, 2],
      [MovementTypes.Soldier, 1],
      [MovementTypes.HeavySoldier, 1],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, 2],
      [MovementTypes.Tread, 2],
    ]),
  },
  {
    modifiers: new Map([
      ...JoinableModifiers,
      [Modifier.Single, sprite(-3, -1)],
    ]),
    position: sprite(3, 19),
  },
  {
    hidden: true,
    isolated: true,
  },
);

export const Forest2 = new TileInfo(
  12,
  'Forest',
  `Dense woodland providing moderate cover but slowing down light vehicles and tanks. When it is foggy, units hiding in forests are only visible to adjacent units.`,
  {
    group: TileTypes.ForestVariant2,
    type: TileTypes.Joinable,
  },
  Forest.configuration,
  {
    ...Forest.sprite,
    position: Forest.sprite.position.down(4),
  },
  Forest.style,
);

export const Forest3 = new TileInfo(
  23,
  'Forest',
  `Dense woodland providing moderate cover but slowing down light vehicles and tanks. When it is foggy, units hiding in forests are only visible to adjacent units.`,
  TileTypes.ForestVariant3,
  Forest.configuration,
  {
    ...Forest.sprite,
    modifiers: new Map([
      [Modifier.Variant2, sprite(1, 0)],
      [Modifier.Variant3, sprite(2, 0)],
      [Modifier.Variant4, sprite(3, 0)],
      [Modifier.Variant5, sprite(4, 0)],
      [Modifier.Variant6, sprite(4, 4)],
      [Modifier.Variant7, sprite(4, 5)],
    ]),
    position: sprite(0, 22),
  },
  Forest.style,
);

export const Mountain = new TileInfo(
  3,
  'Mountain',
  `Rugged terrain offering high cover for infantry units, but impassable for tread or tire based vehicles.`,
  {
    group: TileTypes.Mountain,
    type: TileTypes.Joinable,
  },
  {
    cover: 30,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 2],
      [MovementTypes.Amphibious, -1],
      [MovementTypes.Soldier, 2],
      [MovementTypes.HeavySoldier, 3],
      [MovementTypes.LowAltitude, 2],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
    ]),
    vision: 2,
  },
  {
    alternate: true,
    modifiers: new Map([
      ...JoinableModifiers,
      [Modifier.Single, sprite(-3, -1)],
    ]),
    position: sprite(3, 7),
  },
  { isolated: true },
);

export const Street = new TileInfo(
  4,
  'Street',
  `Paved roads allowing swift movement for most units but offering no cover.`,
  {
    group: TileTypes.Street,
    type: TileTypes.Joinable,
  },
  {
    cover: 0,
    movement: PlainMovementCosts,
  },
  {
    modifiers: JoinableModifiers,
    position: sprite(3, 3),
  },
);

export const River = new TileInfo(
  5,
  'River',
  `The fast flowing water slows down movement for most infantry units, and is inaccessible to light vehicles and tanks.`,
  {
    group: TileTypes.River,
    type: TileTypes.Joinable | TileTypes.ConnectWithEdge,
  },
  {
    cover: 0,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, 2],
      [MovementTypes.Soldier, 2],
      [MovementTypes.HeavySoldier, 2],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
    ]),
  },
  {
    animation: {
      frames: 24,
      offset: 3,
      ticks: 1,
    },
    modifiers: RiverModifiers,
    position: sprite(1, 73),
  },
  { isolated: true },
);

export const Sea = new TileInfo(
  6,
  'Sea',
  `Expansive water bodies only navigable by ships and aircraft.`,
  { group: TileTypes.Sea, type: TileTypes.Joinable | TileTypes.Area },
  {
    cover: 10,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, 1],
      [MovementTypes.Soldier, -1],
      [MovementTypes.HeavySoldier, -1],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, 1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
    ]),
    transitionCost: new Map([[MovementTypes.Amphibious, 1]]),
  },
  {
    animation: SeaAnimation,
    modifiers: new Map<Modifier, ModifierValue>([
      ...AreaModifiers,

      [Modifier.RiverFlowsFromTop, sprite(-2, 38)],
      [Modifier.RiverFlowsFromBottom, sprite(-2, 40)],
      [Modifier.RiverFlowsFromLeft, sprite(-3, 39)],
      [Modifier.RiverFlowsFromRight, sprite(-1, 39)],
    ]),
    position: sprite(8, 35),
  },
  { isolated: true },
);

export const DeepSea = new TileInfo(
  21,
  'Deep Sea',
  `Treacherous waters navigable only by advanced ships and aircraft; low altitude and amphibious units risk getting lost at sea.`,
  {
    group: TileTypes.DeepSea,
    type: TileTypes.Joinable | TileTypes.Area | TileTypes.Sea,
  },
  {
    cover: 10,
    movement: new Map([
      ...Sea.configuration.movement,
      [MovementTypes.AirInfantry, -1],
      [MovementTypes.Amphibious, -1],
      [MovementTypes.LowAltitude, -1],
    ]),
  },
  {
    animation: SeaAnimation,
    modifiers: AreaModifiers,
    position: sprite(8, 47),
  },
  { fallback: Sea, isolated: true },
);

export const WaterfallModifiers = new Set([
  Modifier.RiverFlowsFromTop,
  Modifier.RiverFlowsFromBottom,
  Modifier.RiverFlowsFromLeft,
  Modifier.RiverFlowsFromRight,
]);
export const WaterfallAnimation = {
  ...River.sprite.animation!,
  offset: 3,
} as const;

export const Ruins = new TileInfo(
  7,
  'Ruins',
  `Crumbled structures providing some cover. They are an active area of research where scientists learn more about the history of the current conflict.`,
  TileTypes.Plain,
  { cover: 20, movement: PlainMovementCosts },
  {
    noClip: Biome.Volcano,
    position: sprite(2, 2),
  },
  {
    decorator: new TileDecoratorInfo(
      sprite(9, 0),
      null,
      new Set([Biome.Volcano]),
    ),
    isolated: true,
  },
);

export const ConstructionSite = new TileInfo(
  8,
  'Construction Site',
  `An area designated for development, offering moderate cover and serving as a potential location for Factories, Barracks, and other buildings.`,
  TileTypes.ConstructionSite,
  { cover: 15, movement: PlainMovementCosts },
  {
    modifiers: new Map([
      [Modifier.Variant2, sprite(1, 0)],
      [Modifier.Variant3, sprite(2, 0)],
      [Modifier.Variant4, sprite(3, 0)],
    ]),
    noClip: true,
    position: sprite(0, 1),
  },
  { decorator: new TileDecoratorInfo(sprite(0, 0)), isolated: true },
);

export const Reef = new TileInfo(
  9,
  'Reef',
  `Shallow sea areas providing some cover to naval units. When it is foggy, units hiding in reefs are only visible to adjacent units.`,
  TileTypes.Sea,
  {
    cover: 25,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, 2],
      [MovementTypes.Soldier, -1],
      [MovementTypes.HeavySoldier, -1],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, 2],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
    ]),
  },
  {
    animation: HorizontalSeaAnimation,
    modifiers: new Map([
      [Modifier.Variant2, sprite(0, 1)],
      [Modifier.Variant3, sprite(0, 2)],
      [Modifier.Variant4, sprite(0, 3)],
    ]),
    position: sprite(5, 18),
  },
  { fallback: Sea, hidden: true, isolated: true, layer: 1 },
);

export const Beach = new TileInfo(
  10,
  'Beach',
  `Coastal areas with low cover allowing sea units to load and unload ground units.`,
  {
    group: TileTypes.Sea,
    type: TileTypes.Area | TileTypes.AreaDecorator | TileTypes.Joinable,
  },
  {
    cover: 5,
    movement: new Map([
      ...PlainMovementCosts,
      [MovementTypes.Amphibious, 1],
      [MovementTypes.Ship, 1],
    ]),
    transitionCost: new Map([[MovementTypes.Amphibious, 1]]),
  },
  {
    animation: { ...SeaAnimation, offset: 6 },
    modifiers: new Map<Modifier, ModifierValue>([
      [Modifier.Single, sprite(-3, -1)],

      [Modifier.TailUp, sprite(3, -1)],
      [Modifier.TailDown, sprite(2, 0)],
      [Modifier.TailLeft, sprite(3, 0)],
      [Modifier.TailRight, sprite(2, -1)],

      [Modifier.LeftWall, sprite(-1, 1)],
      [Modifier.TopWall, sprite(0, 0)],
      [Modifier.BottomWall, sprite(0, 2)],
      [Modifier.RightWall, sprite(1, 1)],
      [Modifier.LeftWallAreaDecorator, sprite(-2, 2)],
      [Modifier.LeftWallTopAreaDecorator, sprite(-2, 1)],
      [Modifier.LeftWallBottomAreaDecorator, sprite(-2, 0)],
      [Modifier.TopWallAreaDecorator, sprite(-1, 4)],
      [Modifier.TopWallLeftAreaDecorator, sprite(-2, 4)],
      [Modifier.TopWallRightAreaDecorator, sprite(-3, 4)],
      [Modifier.BottomWallAreaDecorator, sprite(-1, 3)],
      [Modifier.BottomWallLeftAreaDecorator, sprite(-2, 3)],
      [Modifier.BottomWallRightAreaDecorator, sprite(-3, 3)],
      [Modifier.RightWallAreaDecorator, sprite(-3, 2)],
      [Modifier.RightWallTopAreaDecorator, sprite(-3, 1)],
      [Modifier.RightWallBottomAreaDecorator, sprite(-3, 0)],

      [Modifier.BottomRightAreaCorner, sprite(1, 2)],
      [Modifier.TopRightAreaCorner, sprite(1, 0)],
      [Modifier.BottomLeftAreaCorner, sprite(-1, 2)],
      [Modifier.TopLeftAreaCorner, sprite(-1, 0)],

      [Modifier.TopLeftAreaDecorator, sprite(-2, -1)],
      [Modifier.TopRightAreaDecorator, sprite(1, -1)],
      [Modifier.BottomLeftAreaDecorator, sprite(-1, -1)],
      [Modifier.BottomRightAreaDecorator, sprite(0, -1)],

      [Modifier.TopLeftBottomAreaDecorator, sprite(3, 3)],
      [Modifier.TopLeftRightAreaDecorator, sprite(0, 4)],
      [Modifier.TopRightBottomAreaDecorator, sprite(2, 3)],
      [Modifier.TopRightLeftAreaDecorator, sprite(1, 4)],

      [Modifier.BottomLeftTopAreaDecorator, sprite(3, 4)],
      [Modifier.BottomLeftRightAreaDecorator, sprite(0, 3)],
      [Modifier.BottomRightTopAreaDecorator, sprite(2, 4)],
      [Modifier.BottomRightLeftAreaDecorator, sprite(1, 3)],
    ]),
    position: sprite(3, 50),
  },
  { fallback: Sea, isolated: true },
);

export const Campsite = new TileInfo(
  11,
  'Campsite',
  `Campsites can be used to build a Shelter which can heal soldiers.`,
  TileTypes.Campsite,
  { cover: 15, movement: PlainMovementCosts },
  {
    animation: {
      frames: 4,
      horizontal: true,
      offset: 1,
      ticks: 2,
    },
    position: sprite(0, 28),
  },
  { isolated: true },
);

export const StormCloud = new TileInfo(
  13,
  'Storm Cloud',
  `Unknown`,
  {
    group: TileTypes.StormCloud,
    type: TileTypes.Joinable | TileTypes.Inaccessible,
  },
  {
    cover: Number.POSITIVE_INFINITY,
    movement: InaccessibleMovementCosts,
    vision: -1,
  },
  {
    animation: {
      frames: 4,
      offset: 3,
      ticks: 6,
    },
    modifiers: new Map<Modifier, ModifierValue>([
      [Modifier.Single, sprite(2, 1)],
      [Modifier.Horizontal, sprite(0, -1)],
      [Modifier.Vertical, sprite(-1, 0)],
      [Modifier.TopLeftCorner, sprite(-1, -1)],
      [Modifier.BottomLeftCorner, sprite(-1, 1)],
      [Modifier.TopRightCorner, sprite(1, -1)],
      [Modifier.BottomRightCorner, sprite(1, 1)],

      [Modifier.TailUp, sprite(0, 0)],
      [Modifier.TailDown, sprite(0, 1)],
      [Modifier.TailLeft, sprite(1, 0)],
      [Modifier.TailRight, sprite(2, 0)],
    ]),
    position: sprite(6, 7),
  },
  { isolated: true, layer: 1 },
);

// The order must match `Vector.adjacent()`.
export const StormCloudLightningConnectors = [
  sprite(5, 1),
  sprite(3, -7),
  sprite(3, 1),
  sprite(5, -7),
] as const;

export const Pier = new TileInfo(
  14,
  'Pier',
  `Structures extending from the land into the water, allowing ground units to cross over water.`,
  { group: TileTypes.Pier, type: TileTypes.Joinable },
  { cover: 10, movement: PlainMovementCosts },
  {
    animation: { ...SeaAnimation, offset: 5 },
    modifiers: new Map([
      [Modifier.Single, sprite(0, 0)],
      [Modifier.SingleConnectingTailDown, sprite(6, 1)],
      [Modifier.SingleConnectingTailLeft, sprite(5, 3)],
      [Modifier.SingleConnectingTailRight, sprite(6, 3)],
      [Modifier.SingleConnectingTailUp, sprite(6, 0)],
      [Modifier.Horizontal, sprite(3, 0)],
      [Modifier.Vertical, sprite(0, 3)],

      [Modifier.BottomLeftCorner, sprite(1, 3)],
      [Modifier.BottomRightCorner, sprite(3, 3)],
      [Modifier.JoinableCenter, sprite(2, 2)],
      [Modifier.TBottom, sprite(2, 1)],
      [Modifier.TLeft, sprite(3, 2)],
      [Modifier.TopLeftCorner, sprite(1, 1)],
      [Modifier.TopRightCorner, sprite(3, 1)],
      [Modifier.TRight, sprite(1, 2)],
      [Modifier.TTop, sprite(2, 3)],

      [Modifier.TailDown, sprite(0, 4)],
      [Modifier.TailLeft, sprite(2, 0)],
      [Modifier.TailRight, sprite(4, 0)],
      [Modifier.TailUp, sprite(0, 2)],

      [Modifier.ConnectingTailDown, sprite(5, 1)],
      [Modifier.ConnectingTailLeft, sprite(5, 4)],
      [Modifier.ConnectingTailRight, sprite(6, 4)],
      [Modifier.ConnectingTailUp, sprite(5, 0)],
    ]),
    position: sprite(0, 29),
  },
  { fallback: Sea, isolated: true, layer: 1 },
);

export const ShipyardConstructionSiteDecorator = new TileDecoratorInfo(
  sprite(7, 0),
  { ...SeaAnimation, offset: 2 },
);

export const ShipyardConstructionSite = new TileInfo(
  15,
  'Shipyard Construction Site',
  `A strategic location adjacent to water, suitable for constructing a Shipyard to build naval units.`,
  { group: TileTypes.Pier, type: TileTypes.Joinable },
  {
    ...Pier.configuration,
    cover: 20,
  },
  {
    ...Pier.sprite,
    modifiers: new Map(
      [...Pier.sprite.modifiers].map(([modifier]) =>
        composite(Pier, modifier, sprite(4, 2)),
      ),
    ),
  },
  {
    ...Pier.style,
    decorator: ShipyardConstructionSiteDecorator,
    fallback: Pier,
  },
);

export const Bridge = new TileInfo(
  16,
  'Bridge',
  `A structure spanning over water or low ground, allowing units to cross. Ships can create a blockade for ground units.`,
  {
    group: TileTypes.Street,
    type: TileTypes.Bridge | TileTypes.Joinable | TileTypes.ConnectWithEdge,
  },
  {
    cover: 0,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, 1],
      [MovementTypes.Soldier, 1],
      [MovementTypes.HeavySoldier, 1],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, 1],
      [MovementTypes.Tires, 1],
      [MovementTypes.Tread, 1],
    ]),
  },
  {
    modifiers: new Map<Modifier, ModifierValue>([
      [Modifier.Horizontal, sprite(2, 0)],
      [Modifier.Vertical, sprite(3, -2)],
      [Modifier.VerticalSingle, sprite(3, -4)],
      [Modifier.Single, sprite(0, 0)],

      [Modifier.ConnectingTailDown, sprite(3, -1)],
      [Modifier.ConnectingTailLeft, sprite(1, 0)],
      [Modifier.ConnectingTailRight, sprite(3, 0)],
      [Modifier.ConnectingTailUp, sprite(3, -3)],

      [Modifier.TailDown, sprite(3, -1)],
      [Modifier.TailLeft, sprite(1, 0)],
      [Modifier.TailRight, sprite(3, 0)],
      [Modifier.TailUp, sprite(3, -3)],

      // Horizontal river and trench bridge could have different variants.
      [Modifier.HorizontalCrossing, sprite(0, 0)],
      [Modifier.VerticalCrossing, sprite(3, -4)],
      [Modifier.Variant2, sprite(0, 0)],
    ]),
    position: sprite(5, 5),
  },
  { connectsWith: Street, layer: 1 },
);

export const RailTrack = new TileInfo(
  17,
  'Rail Track',
  `Rail tracks allow trains to travel quickly across the terrain to supply units at the frontline or transport them across large distances, ensuring efficient logistics and rapid deployment in the heat of battle.`,
  {
    group: TileTypes.RailTrack,
    type: TileTypes.Joinable,
  },
  {
    cover: 15,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, 2],
      [MovementTypes.Soldier, 2],
      [MovementTypes.HeavySoldier, 1],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, 1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, 1],
      [MovementTypes.Tread, 2],
    ]),
  },
  {
    modifiers: new Map<Modifier, ModifierValue>([
      ...JoinableModifiers,

      [Modifier.Single, sprite(1, -1)],
      [Modifier.HorizontalCrossing, sprite(-5, 0)],
      [Modifier.VerticalCrossing, sprite(-4, 0)],
    ]),
    position: sprite(10, 28),
  },
  { crossesWith: TileTypes.Street },
);

export const RailBridge = new TileInfo(
  18,
  'Rail Bridge',
  `A bridge structure that extends train tracks over water or low ground, allowing rail units to traverse otherwise impassable areas.`,
  { group: TileTypes.RailTrack, type: TileTypes.Bridge | TileTypes.Joinable },
  {
    cover: 15,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, 1],
      [MovementTypes.Soldier, 2],
      [MovementTypes.HeavySoldier, 1],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, 1],
      [MovementTypes.Ship, 1],
      [MovementTypes.Tires, 2],
      [MovementTypes.Tread, 2],
    ]),
  },
  {
    animation: {
      ...SeaAnimation,
      modifiers: new Set([
        Modifier.ConnectingTailLeft,
        Modifier.ConnectingTailRight,
        Modifier.Horizontal,
        Modifier.TailLeft,
        Modifier.TailRight,
      ]),
      offset: 1,
    },
    modifiers: new Map<Modifier, ModifierValue>([
      [Modifier.Horizontal, sprite(1, 1)],
      [Modifier.Vertical, sprite(2, 0)],
      [Modifier.VerticalSingle, sprite(1, 0)],
      [Modifier.Single, sprite(0, 0)],

      [Modifier.ConnectingTailDown, horizontal(sprite(2, 0), sprite(1, 0))],
      [Modifier.ConnectingTailLeft, sprite(0, 1)],
      [Modifier.ConnectingTailRight, sprite(2, 1)],
      [Modifier.ConnectingTailUp, horizontal(sprite(1, 0), sprite(2, 0))],

      [Modifier.TailDown, horizontal(sprite(2, 0), sprite(1, 0))],
      [Modifier.TailLeft, sprite(0, 1)],
      [Modifier.TailRight, sprite(2, 1)],
      [Modifier.TailUp, horizontal(sprite(1, 0), sprite(2, 0))],

      // Horizontal river and trench bridge could have different variants.
      [Modifier.HorizontalCrossing, sprite(0, 0)],
      [Modifier.VerticalCrossing, sprite(1, 0)],
      [Modifier.Variant2, sprite(0, 0)],
    ]),
    position: sprite(5, 0),
  },
  { connectsWith: RailTrack, layer: 1 },
);

export const Trench = new TileInfo(
  19,
  'Trench',
  `Dug-out ground providing high cover and twice the movement speed for foot soldiers. Cannot be accessed by light vehicles and tanks. Foot soldiers use half of a movement point when entering or leaving a Trench.`,
  {
    group: TileTypes.Trench,
    type: TileTypes.Joinable | TileTypes.Area | TileTypes.AreaMatchesAll,
  },
  {
    cover: 40,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, -1],
      [MovementTypes.Soldier, 0.5],
      [MovementTypes.HeavySoldier, 0.5],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
    ]),
    transitionCost: new Map([
      [MovementTypes.Soldier, 0.5],
      [MovementTypes.HeavySoldier, 0.5],
    ]),
    vision: 2,
  },
  {
    modifiers: new Map([...AreaModifiers, [Modifier.Single, sprite(-1, -2)]]),
    position: sprite(1, 16),
  },
  { isolated: true },
);

export const Airfield = new TileInfo(
  20,
  'Airfield',
  `A designated area providing some cover, suitable for constructing an Airbase to build air units.`,
  TileTypes.Airfield,
  { cover: 20, movement: PlainMovementCosts },
  sprite(4, 1),
  {
    decorator: new TileDecoratorInfo(sprite(8, 0), {
      ...SeaAnimation,
      offset: 1,
    }),
    isolated: true,
  },
);

export const Lightning = new TileInfo(
  24,
  'Lightning Barrier',
  `Unknown`,
  TileTypes.Inaccessible,
  {
    cover: Number.POSITIVE_INFINITY,
    movement: InaccessibleMovementCosts,
    vision: -1,
  },
  {
    animation: {
      frames: 4,
      offset: 1,
      ticks: 6,
    },
    modifiers: new Map<Modifier, ModifierValue>([
      [Modifier.Horizontal, sprite(0, 0)],
      [Modifier.Vertical, sprite(0, 6)],
    ]),
    position: sprite(10, 0),
  },
  { isolated: true, layer: 1 },
);

export const PoisonSwamp = new TileInfo(
  25,
  'Poison Swamp',
  `Unknown`,
  TileTypes.Sea,
  {
    cover: 0,
    movement: Reef.configuration.movement,
  },
  {
    animation: HorizontalSeaAnimation,
    position: sprite(5, 26),
  },
  { fallback: Sea, hidden: true, isolated: true, layer: 1 },
);

export const Computer = new TileInfo(
  26,
  'Computer',
  `Unknown`,
  TileTypes.Inaccessible,
  {
    cover: 0,
    movement: InaccessibleMovementCosts,
  },
  {
    animation: { ...SeaAnimation, offset: 1 },
    modifiers: new Map([[Modifier.Variant2, sprite(1, 0)]]),
    position: sprite(0, 31),
  },
  { isolated: true },
);

export const Box = new TileInfo(
  27,
  'Box',
  `Unknown`,
  TileTypes.Forest,
  {
    cover: 20,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, 2],
      [MovementTypes.Soldier, 1],
      [MovementTypes.HeavySoldier, 1],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, 2],
      [MovementTypes.Tread, 2],
    ]),
  },
  {
    modifiers: new Map([
      [Modifier.Variant2, sprite(0, 1)],
      [Modifier.Variant3, sprite(1, 1)],
      [Modifier.Variant4, sprite(2, 1)],
      [Modifier.Variant5, sprite(3, 1)],
      [Modifier.Variant6, sprite(4, 1)],
    ]),
    position: sprite(0, 17),
  },
  {
    hidden: true,
    isolated: true,
  },
);

export const Box2 = new TileInfo(
  22,
  'Box',
  `Unknown`,
  Box.group,
  Box.configuration,
  {
    ...Box.sprite,
    position: sprite(0, 21),
  },
  Box.style,
);

export const Platform = new TileInfo(
  28,
  'Platform',
  `Unknown`,
  TileTypes.Mountain,
  {
    cover: 30,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, -1],
      [MovementTypes.Soldier, 2],
      [MovementTypes.HeavySoldier, 1],
      [MovementTypes.LowAltitude, 1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
    ]),
    vision: 2,
  },
  {
    position: sprite(0, 6),
  },
  { isolated: true },
);

export const Space = new TileInfo(
  29,
  'Space',
  `Unknown`,
  { group: TileTypes.Sea, type: TileTypes.Joinable | TileTypes.Area },
  {
    cover: 10,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, -1],
      [MovementTypes.Soldier, -1],
      [MovementTypes.HeavySoldier, -1],
      [MovementTypes.LowAltitude, -1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
    ]),
  },
  {
    modifiers: AreaModifiers,
    position: Sea.sprite.position,
  },
  { isolated: true },
);

export const Path = new TileInfo(
  30,
  'Path',
  `Unknown`,
  {
    group: TileTypes.Street,
    type: TileTypes.Joinable,
  },
  {
    cover: 0,
    movement: PlainMovementCosts,
  },
  {
    modifiers: JoinableModifiers,
    position: sprite(3, 3),
  },
);

export const Wall = new TileInfo(
  31,
  'Wall',
  `Unknown`,
  TileTypes.Inaccessible,
  {
    cover: 0,
    movement: InaccessibleMovementCosts,
  },
  {
    modifiers: new Map([
      [Modifier.Variant2, sprite(1, 0)],
      [Modifier.Variant3, sprite(2, 0)],
      [Modifier.Variant4, sprite(3, 0)],
      [Modifier.Variant5, sprite(4, 0)],
      [Modifier.Variant6, sprite(5, 0)],
      [Modifier.Variant7, sprite(6, 0)],
    ]),
    position: sprite(0, 30),
  },
  { isolated: true },
);

export const Window = new TileInfo(
  32,
  'Window',
  `Unknown`,
  TileTypes.Inaccessible,
  {
    cover: 0,
    movement: InaccessibleMovementCosts,
  },
  {
    modifiers: new Map([
      [Modifier.Variant2, sprite(1, 0)],
      [Modifier.Variant3, sprite(2, 0)],
    ]),
    position: sprite(7, 30),
  },
  { isolated: true },
);

export const SpaceBridge = new TileInfo(
  33,
  'Bridge',
  `Unknown`,
  {
    group: Bridge.group,
    type: TileTypes.Bridge | TileTypes.Joinable | TileTypes.ConnectWithEdge,
  },
  Bridge.configuration,
  Bridge.sprite,
  { connectsWith: Path, layer: 1 },
);

export const Pipe = new TileInfo(
  34,
  'Pipe',
  `Unknown`,
  {
    group: TileTypes.Pipe,
    type: TileTypes.Joinable | TileTypes.Inaccessible,
  },
  {
    cover: 0,
    movement: InaccessibleMovementCosts,
  },
  {
    modifiers: new Map<Modifier, ModifierValue>([
      [Modifier.Single, sprite(0, 0)],
      [Modifier.Horizontal, sprite(-2, -2)],
      [Modifier.Vertical, sprite(-1, -2)],
      [Modifier.TopLeftCorner, sprite(-5, -2)],
      [Modifier.BottomLeftCorner, sprite(-5, 0)],
      [Modifier.TopRightCorner, sprite(-3, -2)],
      [Modifier.BottomRightCorner, sprite(-3, 0)],
      [Modifier.TailUp, sprite(-1, 0)],
      [Modifier.TailDown, sprite(-1, -1)],
      [Modifier.TailLeft, sprite(-2, 0)],
      [Modifier.TailRight, sprite(-2, -1)],
    ]),
    position: sprite(5, 29),
  },
);

export const Teleporter = new TileInfo(
  35,
  'Teleporter',
  `Unknown`,
  TileTypes.Teleporter,
  Forest.configuration,
  {
    animation: {
      frames: 2,
      offset: 1,
      ticks: 12,
    },
    position: sprite(0, 25),
  },
);

export const Island = new TileInfo(
  36,
  'Island',
  `Unknown`,
  TileTypes.Sea,
  {
    cover: 25,
    movement: Beach.configuration.movement,
  },
  {
    animation: HorizontalSeaAnimation,
    modifiers: new Map([
      [Modifier.Variant2, sprite(0, 2)],
      [Modifier.Variant3, sprite(0, 4)],
    ]),
    position: sprite(5, 23),
  },
  {
    decorator: new TileDecoratorInfo(sprite(4, 0)),
    fallback: Sea,
    hidden: true,
    isolated: true,
    layer: 1,
  },
);

export const Iceberg = new TileInfo(
  37,
  'Iceberg',
  `Unknown`,
  TileTypes.Sea,
  {
    cover: 30,
    movement: new Map([
      [MovementTypes.Air, 1],
      [MovementTypes.AirInfantry, 1],
      [MovementTypes.Amphibious, -1],
      [MovementTypes.Soldier, -1],
      [MovementTypes.HeavySoldier, -1],
      [MovementTypes.LowAltitude, -1],
      [MovementTypes.Rail, -1],
      [MovementTypes.Ship, -1],
      [MovementTypes.Tires, -1],
      [MovementTypes.Tread, -1],
    ]),
  },
  {
    animation: HorizontalSeaAnimation,
    modifiers: new Map([[Modifier.Variant2, sprite(0, 1)]]),
    position: sprite(5, 22),
  },
  { fallback: Sea, isolated: true, layer: 1 },
);

export const Weeds = new TileInfo(
  38,
  'Weeds',
  `Unknown`,
  TileTypes.Sea,
  {
    cover: 0,
    movement: Reef.configuration.movement,
  },
  {
    animation: HorizontalSeaAnimation,
    modifiers: new Map([
      [Modifier.Variant2, sprite(0, 1)],
      [Modifier.Variant3, sprite(0, 2)],
      [Modifier.Variant4, sprite(0, 3)],
    ]),
    position: sprite(5, 22),
  },
  { fallback: Sea, hidden: true, isolated: true, layer: 1 },
);

export const FloatingEdge = new TileInfo(
  100_000,
  'Floating Edge',
  `Unknown`,
  TileTypes.Plain,
  {
    cover: 0,
    movement: InaccessibleMovementCosts,
    vision: -1,
  },
  {
    modifiers: new Map([
      ...AreaModifiers,

      [Modifier.RiverFlowsFromTop, sprite(1, 41)],
      [Modifier.RiverFlowsFromBottom, sprite(1, 43)],
      [Modifier.RiverFlowsFromLeft, sprite(0, 42)],
      [Modifier.RiverFlowsFromRight, sprite(2, 42)],

      // Sea borders
      [Modifier.BottomWallAreaDecorator, sprite(2, -20)],
      [Modifier.LeftWallAreaDecorator, sprite(2, -16)],
      [Modifier.RightWallAreaDecorator, sprite(1, -16)],
      [Modifier.TopWallAreaDecorator, sprite(1, -20)],

      // Sea edges
      [Modifier.BottomLeftAreaDecorator, sprite(2, -12)],
      [Modifier.BottomRightAreaDecorator, sprite(1, -12)],
      [Modifier.TopLeftAreaDecorator, sprite(2, -11)],
      [Modifier.TopRightAreaDecorator, sprite(1, -11)],
    ]),
    position: sprite(8, 32),
  },
);

export const FloatingWaterEdge = new TileInfo(
  100_001,
  'Floating Water Edge',
  `Unknown`,
  TileTypes.Plain,
  FloatingEdge.configuration,
  {
    animation: { ...SeaAnimation, offset: 2 },
    modifiers: new Map([
      [Modifier.BottomLeftEdge, sprite(1, 0)],
      [Modifier.BottomRightEdge, sprite(0, 0)],
      [Modifier.TopLeftEdge, sprite(1, 1)],
      [Modifier.TopRightEdge, sprite(0, 1)],

      [Modifier.BottomLeftAreaDecorator, sprite(3, 0)],
      [Modifier.BottomRightAreaDecorator, sprite(2, 0)],
      [Modifier.TopLeftAreaDecorator, sprite(3, 1)],
      [Modifier.TopRightAreaDecorator, sprite(2, 1)],
    ]),
    position: sprite(7, 58),
  },
);

export const getFloatingEdgeAnimation = (modifier: Modifier, biome: Biome) => {
  if (biome === Biome.Spaceship) {
    return null;
  }

  if (WaterfallModifiers.has(modifier)) {
    return WaterfallAnimation;
  }

  if (
    modifier === Modifier.TopWallAreaDecorator ||
    modifier === Modifier.BottomWallAreaDecorator ||
    modifier === Modifier.LeftWallAreaDecorator ||
    modifier === Modifier.RightWallAreaDecorator
  ) {
    return { ...SeaAnimation, offset: 1 };
  }

  if (
    modifier === Modifier.TopLeftAreaDecorator ||
    modifier === Modifier.TopRightAreaDecorator ||
    modifier === Modifier.BottomLeftAreaDecorator ||
    modifier === Modifier.BottomRightAreaDecorator
  ) {
    return { ...SeaAnimation, offset: 2 };
  }

  return null;
};

export type MaybeTileID = number | null | false;

export const isSea = (tile: MaybeTileID) =>
  !!(tile && isSeaTile(getTileInfo(tile)));

export const isSeaTile = (tile: TileInfo) => !!(tile.type & TileTypes.Sea);

// The order of tiles must not be changed.
const Tiles = [
  Plain,
  Forest,
  Mountain,
  Street,
  River,
  Sea,
  Ruins,
  ConstructionSite,
  Reef,
  Beach,
  Campsite,
  Forest2,
  StormCloud,
  Pier,
  ShipyardConstructionSite,
  Bridge,
  RailTrack,
  RailBridge,
  Trench,
  Airfield,
  DeepSea,
  Box2,
  Forest3,
  Lightning,
  PoisonSwamp,
  Computer,
  Box,
  Platform,
  Space,
  Path,
  Wall,
  Window,
  SpaceBridge,
  Pipe,
  Teleporter,
  Island,
  Iceberg,
  Weeds,
];

const tiles = sortBy(Tiles.slice(), ({ group }) => group);

export const PlainTileGroup = new Set(
  tiles.filter(
    ({ id }) => !isSea(id) && id !== StormCloud.id && id !== Lightning.id,
  ),
);
export const SeaTileGroup = new Set(tiles.filter(({ id }) => isSea(id)));

export const SwampBiome = new Set([Forest3, PoisonSwamp, Weeds]);
export const SpaceShipBiome = new Set([
  Box,
  Box2,
  Computer,
  Path,
  Platform,
  Space,
  Wall,
  Window,
  SpaceBridge,
  Pipe,
  Teleporter,
]);

export const CrossOverTiles = new Map([
  [Street, Bridge],
  [RailTrack, RailBridge],
  [Trench, Bridge],
  [Path, SpaceBridge],
]);

export function getTile(id: TileField, layer?: TileLayer): number | null {
  const isNumber = typeof id === 'number';
  if (layer != null) {
    return isNumber ? (layer === 0 ? id : null) : id[layer];
  }
  return isNumber ? id : id[1] || id[0];
}

export function getTileInfo(item: TileField, layer?: TileLayer): TileInfo {
  const tile = getTile(item, layer);
  const info = tile && Tiles[tile - 1];
  if (!info) {
    throw new Error(
      'Tile `' + item + '` on layer `' + layer + '` does not exist.',
    );
  }
  return info;
}

export function getAllTiles(): ReadonlyArray<TileInfo> {
  return tiles;
}

export function findTile(fn: (tile: TileInfo) => unknown): TileInfo | null {
  return Tiles.find(fn) || null;
}

export function mapTiles<T>(fn: (tile: TileInfo) => T): Array<T> {
  return tiles.map(fn);
}

export function reduceTiles<T>(
  fn: (accumulator: T, tile: TileInfo) => T,
  initial: T,
): T {
  return tiles.reduce(fn, initial);
}

export function tilesToTileMap(tiles: ReadonlyArray<TileInfo>): TileMap {
  return tiles.map(({ id, style: { fallback, layer }, type }) => {
    while (fallback?.style.layer === 1) {
      fallback = fallback.style.fallback;
    }
    if (!fallback && type & TileTypes.Bridge) {
      fallback = River;
    }
    return layer === 1 ? [(fallback || Plain).id, id] : id;
  });
}
