import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { AIBehavior } from '../map/AIBehavior.tsx';
import { Biome } from '../map/Biome.tsx';
import Building from '../map/Building.tsx';
import { MaxHealth } from '../map/Configuration.tsx';
import { EntityType } from '../map/Entity.tsx';
import Player, { PlayerID } from '../map/Player.tsx';
import SpriteVector from '../map/SpriteVector.tsx';
import type { ID } from '../MapData.tsx';
import { BarID } from './BuildingIDs.tsx';
import { hasUnlockedBuilding, Skill } from './Skill.tsx';
import { SpriteVariant } from './SpriteVariants.tsx';
import {
  Airfield,
  Bridge,
  Campsite,
  ConstructionSite,
  Path,
  Pier,
  Plain,
  RailBridge,
  RailTrack,
  ShipyardConstructionSite,
  SpaceBridge,
  Street,
  TileInfo,
} from './Tile.tsx';
import { Ability, filterUnits, SpecialUnits, UnitInfo } from './Unit.tsx';

let _buildingClass: typeof Building;

export const MinFunds = 100;
export const MaxSkills = 4;

export enum Behavior {
  Heal,
  Radar,
  SellSkills,
}

class BuildingBehaviors {
  private readonly heal: boolean;
  private readonly radar: boolean;
  private readonly sellSkills: boolean;

  constructor({
    heal,
    radar,
    sellSkills,
  }: {
    heal?: boolean;
    radar?: boolean;
    sellSkills?: boolean;
  } = {}) {
    this.heal = heal ?? false;
    this.radar = radar ?? false;
    this.sellSkills = sellSkills ?? false;
  }

  has(ability: Behavior): boolean {
    switch (ability) {
      case Behavior.Heal:
        return this.heal;
      case Behavior.Radar:
        return this.radar;
      case Behavior.SellSkills:
        return this.sellSkills;
      default: {
        ability satisfies never;
        throw new UnknownTypeError('BuildingBehaviors.has', ability);
      }
    }
  }
}

export type BuildingHeight = 'small' | 'medium' | 'tall';

const defaultBehavior = new BuildingBehaviors();

export class BuildingInfo {
  private readonly buildableUnits: ReadonlySet<UnitInfo>;
  public readonly configuration: {
    attackStatusEffect: number;
    behaviors: BuildingBehaviors;
    canBeCreated: boolean;
    cost: number;
    editorPlaceOn: ReadonlySet<TileInfo>;
    funds: number;
    healTypes?: ReadonlySet<EntityType>;
    isAccessible: boolean;
    limit: number;
    placeOn?: ReadonlySet<TileInfo>;
    requiresUnlock: boolean;
    restrictedUnits?: ReadonlySet<UnitInfo>;
    sort: number;
    unitTypes?: ReadonlySet<EntityType>;
    units?: ReadonlySet<UnitInfo>;
  };
  public readonly defense: number;
  public readonly sprite: {
    biomeStyle?: Map<Biome, SpriteVector>;
    name: SpriteVariant | 'Structures';
    position: SpriteVector;
    size: BuildingHeight;
  };
  public readonly type: EntityType;

  constructor(
    public readonly id: ID,
    private readonly internalName: string,
    private readonly internalDescription: string,
    configuration: {
      attackStatusEffect?: number;
      behaviors?: BuildingBehaviors;
      canBeCreated?: boolean;
      cost?: number;
      defense: number;
      editorPlaceOn?: ReadonlySet<TileInfo>;
      funds?: number;
      healTypes?: ReadonlySet<EntityType>;
      isAccessible?: boolean;
      limit?: number;
      placeOn?: ReadonlySet<TileInfo>;
      requiresUnlock?: boolean;
      restrictedUnits?: ReadonlySet<UnitInfo>;
      sort: number;
      type?: number;
      unitTypes?: ReadonlySet<EntityType>;
      units?: ReadonlySet<UnitInfo>;
    },
    sprite: {
      biomeStyle?: Map<Biome, SpriteVector>;
      name: SpriteVariant | 'Structures';
      position: SpriteVector;
      size?: BuildingHeight;
    },
  ) {
    const { defense, type, ...rest } = configuration;
    this.defense = defense || 0;
    this.type = type || EntityType.Building;
    this.configuration = {
      attackStatusEffect: 0,
      behaviors: defaultBehavior,
      canBeCreated: true,
      cost: 0,
      editorPlaceOn: new Set(),
      funds: 0,
      isAccessible: true,
      limit: 0,
      requiresUnlock: false,
      ...rest,
    };
    this.sprite = {
      size: 'tall',
      ...sprite,
    };
    const { unitTypes, units } = this.configuration;
    this.buildableUnits = new Set(
      [
        ...(unitTypes ? filterUnits(({ type }) => unitTypes.has(type)) : []),
        ...(units || []),
      ].filter((unitInfo) => !configuration.restrictedUnits?.has(unitInfo)),
    );
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

  canBeCreatedOn(tileInfo: TileInfo) {
    return !!this.configuration.placeOn?.has(tileInfo);
  }

  editorCanBeCreatedOn(tileInfo: TileInfo) {
    return this.configuration.editorPlaceOn.has(tileInfo);
  }

  canHeal(unitInfo: UnitInfo) {
    return (
      this.configuration.behaviors.has(Behavior.Heal) &&
      this.configuration.healTypes?.has(unitInfo.type)
    );
  }

  getAllBuildableUnits(): Iterable<UnitInfo> {
    return this.buildableUnits;
  }

  canBuildUnits() {
    return this.buildableUnits.size > 0;
  }

  hasBehavior(behavior: Behavior) {
    return this.configuration.behaviors.has(behavior);
  }

  isStructure() {
    return this.type === EntityType.Structure;
  }

  isAccessibleBy(unitInfo: UnitInfo) {
    return (
      this.configuration.isAccessible &&
      unitInfo.hasAbility(Ability.AccessBuildings)
    );
  }

  isHQ() {
    return this.id === HQ.id;
  }

  create(
    player: Player | PlayerID,
    config?: { behaviors?: Set<AIBehavior>; label?: PlayerID | null },
  ) {
    return new _buildingClass(
      this.id,
      MaxHealth,
      typeof player === 'number' ? player : player.id,
      null,
      config?.label != null ? config.label : null,
      config?.behaviors != null ? config.behaviors : null,
    );
  }

  static setConstructor(buildingClass: typeof Building) {
    _buildingClass = buildingClass;
  }
}

export const HQ = new BuildingInfo(
  1,
  'HQ',
  'The HQ is the most important building. If it is captured, the player loses the game.',
  {
    canBeCreated: false,
    defense: 40,
    editorPlaceOn: new Set([Plain, ConstructionSite]),
    limit: 1,
    restrictedUnits: SpecialUnits,
    sort: 1,
    type: EntityType.Invincible,
    unitTypes: new Set([EntityType.Infantry]),
  },
  {
    biomeStyle: new Map([[Biome.Spaceship, new SpriteVector(0, 2)]]),
    name: 'Buildings',
    position: new SpriteVector(0, 0),
  },
);

export const House = new BuildingInfo(
  2,
  'House',
  `Houses generate funds for the occupier. Capturing or building more houses will increase income that can be used to hire units at each turn.`,
  {
    cost: 100,
    defense: 10,
    funds: MinFunds,
    placeOn: new Set([ConstructionSite]),
    sort: 2,
  },
  { name: 'Buildings', position: new SpriteVector(5, 0), size: 'medium' },
);

export const Factory = new BuildingInfo(
  3,
  'Factory',
  `Factories serve as production hubs on the battlefield, enabling the assembly and deployment of ground units such as light vehicles, tanks, and artillery.`,
  {
    cost: 250,
    defense: 10,
    placeOn: new Set([ConstructionSite]),
    restrictedUnits: SpecialUnits,
    sort: 3,
    unitTypes: new Set([
      EntityType.Ground,
      EntityType.Artillery,
      EntityType.Rail,
    ]),
  },
  { name: 'Buildings', position: new SpriteVector(6, 0) },
);

const AirUnitTypes = new Set([
  EntityType.LowAltitude,
  EntityType.Airplane,
  EntityType.AirInfantry,
]);

export const Airbase = new BuildingInfo(
  4,
  'Airbase',
  `This building is used to build air units like helicopters and airplanes. They automatically repair damaged air units at this location at the beginning of each turn.`,
  {
    behaviors: new BuildingBehaviors({ heal: true }),
    cost: 200,
    defense: 20,
    healTypes: AirUnitTypes,
    placeOn: new Set([Airfield]),
    restrictedUnits: SpecialUnits,
    sort: 3,
    unitTypes: AirUnitTypes,
  },
  { name: 'Buildings', position: new SpriteVector(8, 0) },
);

export const Shipyard = new BuildingInfo(
  5,
  'Shipyard',
  `Shipyards are built on piers and are used to build ships and amphibious units.`,
  {
    cost: 300,
    defense: 20,
    placeOn: new Set([ShipyardConstructionSite]),
    restrictedUnits: SpecialUnits,
    sort: 5,
    unitTypes: new Set([EntityType.Ship, EntityType.Amphibious]),
  },
  { name: 'Buildings', position: new SpriteVector(9, 0) },
);

const barrierTiles = new Set([
  Plain,
  Street,
  Bridge,
  RailTrack,
  RailBridge,
  Path,
  Pier,
  SpaceBridge,
]);
export const VerticalBarrier = new BuildingInfo(
  6,
  'Barrier',
  `This structure is an impassable obstacle on the battlefield that needs to be destroyed in order to clear the path for advancing units and securing strategic positions.`,
  {
    canBeCreated: false,
    defense: 60,
    editorPlaceOn: barrierTiles,
    isAccessible: false,
    sort: 10,
    type: EntityType.Structure,
  },
  {
    biomeStyle: new Map([[Biome.Spaceship, new SpriteVector(0, 2)]]),
    name: 'Structures',
    position: new SpriteVector(0, 0),
    size: 'small',
  },
);

export const HorizontalBarrier = new BuildingInfo(
  7,
  'Barrier',
  `This structure is an impassable obstacle on the battlefield that needs to be destroyed in order to clear the path for advancing units and securing strategic positions.`,
  {
    canBeCreated: false,
    defense: 60,
    editorPlaceOn: barrierTiles,
    isAccessible: false,
    sort: 10,
    type: EntityType.Structure,
  },
  {
    biomeStyle: new Map([[Biome.Spaceship, new SpriteVector(0, 2)]]),
    name: 'Structures',
    position: new SpriteVector(1, 0),
    size: 'small',
  },
);

export const CrashedAirplane = new BuildingInfo(
  8,
  'Crashed Airplane',
  `This structure is an impassable obstacle on the battlefield that needs to be destroyed in order to clear the path for advancing units and securing strategic positions.`,
  {
    canBeCreated: false,
    defense: 80,
    editorPlaceOn: new Set([Plain, Street]),
    isAccessible: false,
    sort: 10,
    type: EntityType.Structure,
  },
  { name: 'Structures', position: new SpriteVector(2, 0), size: 'small' },
);

export const DestroyedHouse = new BuildingInfo(
  14,
  'Destroyed House',
  `This structure is an impassable obstacle on the battlefield that needs to be destroyed in order to clear the path for advancing units and securing strategic positions.`,
  {
    canBeCreated: false,
    defense: 70,
    editorPlaceOn: new Set([Plain, ConstructionSite]),
    isAccessible: false,
    sort: 10,
    type: EntityType.Structure,
  },
  { name: 'Structures', position: new SpriteVector(3, 0), size: 'medium' },
);

export const ResearchLab = new BuildingInfo(
  9,
  'Research Lab',
  `This building increases the attack strength of the owner's units by 10%. At some locations you may be able to acquire skills for the duration of a game.`,
  {
    attackStatusEffect: 0.1,
    behaviors: new BuildingBehaviors({ sellSkills: true }),
    canBeCreated: false,
    cost: 300,
    defense: 60,
    placeOn: new Set([ConstructionSite]),
    sort: 4,
  },
  { name: 'Buildings', position: new SpriteVector(10, 0) },
);

export const RadarStation = new BuildingInfo(
  10,
  'Radar Station',
  `Radar Stations are used to determine navigational patterns through lightning strikes.`,
  {
    behaviors: new BuildingBehaviors({ radar: true }),
    cost: 500,
    defense: 30,
    placeOn: new Set([ConstructionSite]),
    sort: 4,
  },
  { name: 'Buildings', position: new SpriteVector(11, 0) },
);

export const PowerStation = new BuildingInfo(
  11,
  'Power Station',
  `Unknown`,
  {
    canBeCreated: false,
    cost: Number.POSITIVE_INFINITY,
    defense: 30,
    placeOn: new Set([ConstructionSite]),
    sort: 4,
  },
  { name: 'Buildings', position: new SpriteVector(12, 0) },
);

export const Barracks = new BuildingInfo(
  12,
  'Barracks',
  `Barracks function as training centers, facilitating the recruitment and deployment of various types of infantry units.`,
  {
    cost: 150,
    defense: 20,
    placeOn: new Set([ConstructionSite]),
    restrictedUnits: SpecialUnits,
    sort: 2,
    unitTypes: new Set([EntityType.Infantry]),
  },
  {
    name: 'Buildings',
    position: new SpriteVector(7, 0),
    size: 'medium',
  },
);

export const Shelter = new BuildingInfo(
  13,
  'Shelter',
  `Shelters automatically heal infantry units at this location at the beginning of each turn.`,
  {
    behaviors: new BuildingBehaviors({ heal: true }),
    cost: 200,
    defense: 40,
    funds: MinFunds / 2,
    healTypes: new Set([EntityType.Infantry, EntityType.AirInfantry]),
    placeOn: new Set([Campsite]),
    sort: 4,
  },
  { name: 'Buildings', position: new SpriteVector(14, 0), size: 'small' },
);

export const Bar = new BuildingInfo(
  BarID,
  'Bar',
  `A bar, on the battlefield? Why?`,
  {
    cost: Number.POSITIVE_INFINITY,
    defense: 40,
    funds: MinFunds * 3,
    placeOn: new Set([ConstructionSite]),
    requiresUnlock: true,
    sort: 3,
    units: SpecialUnits,
  },
  { name: 'Buildings', position: new SpriteVector(17, 0) },
);

export const OilRig = new BuildingInfo(
  16,
  'Oil Rig',
  `Oil Rigs in the sea are used to extract oil from the ground. They generate twice the funds compared to a House.`,
  {
    cost: 200,
    defense: 20,
    funds: MinFunds * 2,
    placeOn: new Set([ShipyardConstructionSite]),
    sort: 5,
  },
  { name: 'Buildings', position: new SpriteVector(20, 0) },
);

export const RepairShop = new BuildingInfo(
  17,
  'Repair Shop',
  `This building automatically repairs damaged ground units and amphibious units at this location at the beginning of each turn.`,
  {
    behaviors: new BuildingBehaviors({ heal: true }),
    cost: 300,
    defense: 30,
    funds: MinFunds * 1.5,
    healTypes: new Set([
      EntityType.Ground,
      EntityType.Artillery,
      EntityType.Amphibious,
    ]),
    placeOn: new Set([ConstructionSite]),
    sort: 4,
  },
  { name: 'Buildings', position: new SpriteVector(18, 0) },
);

// The order of buildings must not be changed.
const Buildings = [
  HQ,
  House,
  Factory,
  Airbase,
  Shipyard,
  VerticalBarrier,
  HorizontalBarrier,
  CrashedAirplane,
  ResearchLab,
  RadarStation,
  PowerStation,
  Barracks,
  Shelter,
  DestroyedHouse,
  Bar,
  OilRig,
  RepairShop,
];

export function getBuildingInfo(id: number): BuildingInfo | null {
  return Buildings[id - 1] || null;
}

const buildings = Buildings.slice().sort((infoA, infoB) => {
  const sortA = infoA.configuration.sort;
  const sortB = infoB.configuration.sort;
  return sortA === sortB
    ? infoA.id > infoB.id
      ? 1
      : -1
    : sortA > sortB
      ? 1
      : -1;
});

export function getAllBuildings(): ReadonlyArray<BuildingInfo> {
  return buildings;
}

export function filterBuildings(
  fn: (buildingInfo: BuildingInfo) => boolean,
): Array<BuildingInfo> {
  return buildings.filter(fn);
}

export function mapBuildings<T>(
  fn: (buildingInfo: BuildingInfo) => T,
): Array<T> {
  return buildings.map(fn);
}

export function mapBuildingsWithContentRestriction<T>(
  fn: (buildingInfo: BuildingInfo, index: number) => T,
  skills: ReadonlySet<Skill>,
): Array<T> {
  return buildings
    .filter(
      (building) =>
        building.configuration.cost < Number.POSITIVE_INFINITY ||
        hasUnlockedBuilding(building, skills),
    )
    .map(fn);
}

export const BuildableTiles = new Set(
  filterBuildings(
    ({ configuration: { canBeCreated } }) => canBeCreated,
  ).flatMap(({ configuration: { placeOn } }) => (placeOn ? [...placeOn] : [])),
);
