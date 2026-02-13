import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import type Unit from '../map/Unit.tsx';
import type MapData from '../MapData.tsx';
import type { UnitInfo } from './Unit.tsx';
import getAirUnitsToRecover from '../lib/getAirUnitsToRecover.tsx';
import { Charge } from '../map/Configuration.tsx';
import Entity, { EntityType, isUnit, isUnitInfo } from '../map/Entity.tsx';
import Player from '../map/Player.tsx';
import Vector from '../map/Vector.tsx';
import { BuildingInfo } from './Building.tsx';
import BuildingID from './BuildingID.tsx';
import { MovementType, MovementTypes } from './MovementType.tsx';
import { TileInfo, TileType, TileTypes } from './Tile.tsx';
import UnitID from './UnitID.tsx';

export enum Skill {
  AttackIncreaseMinor = 1,
  DefenseIncreaseMinor = 2,
  AttackIncreaseMajorDefenseDecreaseMajor = 3,
  BuyUnitCannon = 4,
  DecreaseUnitCostAttackAndDefenseDecreaseMinor = 5,
  UnitAbilitySniperImmediateAction = 6,
  MovementIncreaseGroundUnitDefenseDecrease = 7,
  UnitBattleShipMoveAndAct = 8,
  BuyUnitBrute = 9,
  BuyUnitSuperAPU = 10,
  BuyUnitZombieDefenseDecreaseMajor = 11,
  BuyUnitBazookaBear = 12,
  AttackAndDefenseIncreaseHard = 13,
  HealVehiclesAttackDecrease = 14,
  ArtilleryRangeIncrease = 15,
  HealInfantryMedicPower = 16,
  NoUnitRestrictions = 17,
  CounterAttackPower = 18,
  AttackAndDefenseDecreaseEasy = 19,
  UnitInfantryForestAttackAndDefenseIncrease = 20,
  UnitRailDefenseIncreasePowerAttackIncrease = 21,
  BuyUnitAIU = 22,
  BuyUnitCommander = 23,
  RecoverAirUnits = 24,
  BuyUnitAlien = 25,
  BuyUnitOctopus = 26,
  BuyUnitSuperTank = 27,
  BuyUnitAcidBomber = 28,
  BuyUnitDinosaur = 29,
  Sabotage = 30,
  SpawnUnitInfernoJetpack = 31,
  UnlockZombie = 32,
  UnlockPowerStation = 33,
  BuyUnitDragon = 34,
  BuyUnitOgre = 35,
  BuyUnitBear = 36,
  VampireHeal = 37,
  Shield = 38,
  Charge = 39,
  DragonSaboteur = 40,
  HighTide = 41,
  Jeep = 42,
  ShipIncreaseAttackAndRange = 43,
  XFighterAttackIncrase = 44,
  CostRecovery = 45,
  UnlockScientist = 46,
  BuyUnitHumveeAvenger = 47,
  BuyUnitDroneBomber = 48,
}

export const Skills = new Set<Skill>([
  Skill.AttackIncreaseMinor,
  Skill.DefenseIncreaseMinor,
  Skill.BuyUnitBrute,
  Skill.BuyUnitSuperAPU,
  Skill.BuyUnitCommander,
  Skill.BuyUnitCannon,
  Skill.BuyUnitSuperTank,
  Skill.BuyUnitAcidBomber,
  Skill.BuyUnitBazookaBear,
  Skill.BuyUnitOctopus,
  Skill.BuyUnitAlien,
  Skill.BuyUnitDinosaur,
  Skill.BuyUnitDragon,
  Skill.BuyUnitOgre,
  Skill.BuyUnitBear,
  Skill.BuyUnitAIU,
  Skill.UnlockZombie,
  Skill.UnlockPowerStation,
  Skill.UnlockScientist,
  Skill.BuyUnitHumveeAvenger,
  Skill.BuyUnitDroneBomber,
  Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor,
  Skill.MovementIncreaseGroundUnitDefenseDecrease,
  Skill.AttackIncreaseMajorDefenseDecreaseMajor,
  Skill.HealVehiclesAttackDecrease,
  Skill.ArtilleryRangeIncrease,
  Skill.HealInfantryMedicPower,
  Skill.Sabotage,
  Skill.VampireHeal,
  Skill.CounterAttackPower,
  Skill.UnitBattleShipMoveAndAct,
  Skill.UnitAbilitySniperImmediateAction,
  Skill.UnitInfantryForestAttackAndDefenseIncrease,
  Skill.UnitRailDefenseIncreasePowerAttackIncrease,
  Skill.ShipIncreaseAttackAndRange,
  Skill.XFighterAttackIncrase,
  Skill.DragonSaboteur,
  Skill.CostRecovery,
  Skill.Jeep,
  Skill.RecoverAirUnits,
  Skill.Shield,
  Skill.Charge,
  Skill.HighTide,
  Skill.SpawnUnitInfernoJetpack,
  Skill.AttackAndDefenseDecreaseEasy,
  Skill.AttackAndDefenseIncreaseHard,
  Skill.NoUnitRestrictions,
  Skill.BuyUnitZombieDefenseDecreaseMajor,
]);

export enum SkillGroup {
  Attack = 1,
  Defense = 2,
  Unlock = 3,
  Special = 4,
  Invasion = 5,
  AI = 6,
}

export type CrystalPowerActivationType = 'all' | 'no-command' | 'phantom-only';

const activateOnInvasion = 'all';
const requiresCrystal = true;
const requiresTarget = true;

const skillConfig: Record<
  Skill,
  Readonly<{
    activateOnInvasion?: CrystalPowerActivationType;
    campaignOnly?: true;
    charges?: number;
    cost: number | null;
    group: SkillGroup;
    requiresCrystal?: true;
    requiresTarget?: true;
  }>
> = {
  [Skill.ArtilleryRangeIncrease]: {
    charges: 3,
    cost: 1500,
    group: SkillGroup.Defense,
  },
  [Skill.AttackAndDefenseDecreaseEasy]: { cost: null, group: SkillGroup.AI },
  [Skill.AttackAndDefenseIncreaseHard]: { cost: null, group: SkillGroup.AI },
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor]: {
    charges: 6,
    cost: 800,
    group: SkillGroup.Attack,
  },
  [Skill.AttackIncreaseMinor]: {
    charges: 3,
    cost: 300,
    group: SkillGroup.Attack,
  },
  [Skill.BuyUnitAcidBomber]: {
    charges: 3,
    cost: 1500,
    group: SkillGroup.Unlock,
  },
  [Skill.BuyUnitAIU]: { cost: 1500, group: SkillGroup.Unlock },
  [Skill.BuyUnitAlien]: {
    activateOnInvasion,
    charges: 4,
    cost: 1500,
    group: SkillGroup.Unlock,
  },
  [Skill.BuyUnitBazookaBear]: {
    charges: 6,
    cost: 2000,
    group: SkillGroup.Unlock,
  },
  [Skill.BuyUnitBear]: {
    activateOnInvasion,
    charges: 3,
    cost: 1500,
    group: SkillGroup.Unlock,
  },
  [Skill.BuyUnitBrute]: { charges: 5, cost: 1000, group: SkillGroup.Unlock },
  [Skill.BuyUnitCannon]: { charges: 4, cost: 1000, group: SkillGroup.Unlock },
  [Skill.BuyUnitCommander]: {
    activateOnInvasion,
    charges: 4,
    cost: 1500,
    group: SkillGroup.Unlock,
  },
  [Skill.BuyUnitDinosaur]: {
    charges: 5,
    cost: 1500,
    group: SkillGroup.Unlock,
    requiresTarget,
  },
  [Skill.BuyUnitDragon]: { charges: 5, cost: 1500, group: SkillGroup.Unlock },
  [Skill.BuyUnitDroneBomber]: {
    charges: 8,
    cost: 1200,
    group: SkillGroup.Unlock,
  },
  [Skill.BuyUnitHumveeAvenger]: {
    charges: 3,
    cost: 1500,
    group: SkillGroup.Unlock,
  },
  [Skill.BuyUnitOctopus]: { charges: 5, cost: 1500, group: SkillGroup.Unlock },
  [Skill.BuyUnitOgre]: { charges: 3, cost: 1500, group: SkillGroup.Unlock },
  [Skill.BuyUnitSuperAPU]: { charges: 3, cost: 3000, group: SkillGroup.Unlock },
  [Skill.BuyUnitSuperTank]: {
    charges: 4,
    cost: 1500,
    group: SkillGroup.Unlock,
  },
  [Skill.BuyUnitZombieDefenseDecreaseMajor]: {
    cost: 1500,
    group: SkillGroup.AI,
  },
  [Skill.Charge]: {
    activateOnInvasion,
    charges: 6,
    cost: 1500,
    group: SkillGroup.Invasion,
    requiresCrystal,
  },
  [Skill.CostRecovery]: {
    activateOnInvasion,
    charges: 3,
    cost: 800,
    group: SkillGroup.Special,
  },
  [Skill.CounterAttackPower]: {
    activateOnInvasion,
    charges: 3,
    cost: 1500,
    group: SkillGroup.Special,
  },
  [Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor]: {
    charges: 3,
    cost: 600,
    group: SkillGroup.Special,
  },
  [Skill.DefenseIncreaseMinor]: {
    activateOnInvasion,
    charges: 2,
    cost: 300,
    group: SkillGroup.Defense,
  },
  [Skill.DragonSaboteur]: {
    activateOnInvasion,
    charges: 3,
    cost: 1000,
    group: SkillGroup.Special,
  },
  [Skill.HealInfantryMedicPower]: {
    charges: 4,
    cost: 1000,
    group: SkillGroup.Attack,
  },
  [Skill.HealVehiclesAttackDecrease]: {
    charges: 3,
    cost: 1000,
    group: SkillGroup.Special,
  },
  [Skill.HighTide]: {
    charges: 3,
    cost: 200,
    group: SkillGroup.Invasion,
    requiresCrystal,
  },
  [Skill.Jeep]: { charges: 2, cost: 800, group: SkillGroup.Special },
  [Skill.MovementIncreaseGroundUnitDefenseDecrease]: {
    charges: 2,
    cost: 2500,
    group: SkillGroup.Defense,
  },
  [Skill.NoUnitRestrictions]: { cost: null, group: SkillGroup.AI },
  [Skill.RecoverAirUnits]: {
    charges: 5,
    cost: 3000,
    group: SkillGroup.Special,
  },
  [Skill.Sabotage]: {
    activateOnInvasion: 'all',
    charges: 5,
    cost: 1500,
    group: SkillGroup.Attack,
  },
  [Skill.Shield]: {
    activateOnInvasion: 'no-command',
    charges: 8,
    cost: 1500,
    group: SkillGroup.Invasion,
  },
  [Skill.ShipIncreaseAttackAndRange]: {
    charges: 3,
    cost: 1000,
    group: SkillGroup.Attack,
  },
  [Skill.SpawnUnitInfernoJetpack]: {
    activateOnInvasion,
    charges: 5,
    cost: null,
    group: SkillGroup.Invasion,
    requiresCrystal,
  },
  [Skill.UnitAbilitySniperImmediateAction]: {
    campaignOnly: true,
    charges: 3,
    cost: 2000,
    group: SkillGroup.Special,
  },
  [Skill.UnitBattleShipMoveAndAct]: {
    charges: 5,
    cost: 2000,
    group: SkillGroup.Special,
  },
  [Skill.UnitInfantryForestAttackAndDefenseIncrease]: {
    charges: 3,
    cost: 2000,
    group: SkillGroup.Attack,
  },
  [Skill.UnitRailDefenseIncreasePowerAttackIncrease]: {
    charges: 4,
    cost: 1500,
    group: SkillGroup.Defense,
  },
  [Skill.UnlockPowerStation]: {
    activateOnInvasion,
    charges: 4,
    cost: 600,
    group: SkillGroup.Unlock,
  },
  [Skill.UnlockScientist]: {
    charges: 3,
    cost: 1500,
    group: SkillGroup.Unlock,
  },
  [Skill.UnlockZombie]: {
    activateOnInvasion: 'phantom-only',
    charges: 10,
    cost: 1500,
    group: SkillGroup.Special,
  },
  [Skill.VampireHeal]: { charges: 5, cost: 1000, group: SkillGroup.Special },
  [Skill.XFighterAttackIncrase]: {
    charges: 4,
    cost: 1200,
    group: SkillGroup.Special,
  },
};

export const CampaignOnlySkills = new Set(
  [...Skills].filter((skill) => skillConfig[skill].campaignOnly),
);

export const UnobtainableSkills: ReadonlySet<Skill> = new Set([
  ...[...Skills].filter((skill) => skillConfig[skill].cost === null),
  Skill.BuyUnitZombieDefenseDecreaseMajor,
  Skill.RecoverAirUnits,
  Skill.BuyUnitAIU,
]);

export const PoisonSkillPowerDamageMultiplier = 0.3;
export const PowerStationSkillMultiplier = 0.05;
export const LowHealthZombieSkillConversion = 10;
export const VampireSkillHeal = 10;
export const ChargeSkillCharges = 2;
export const ChargeSkillChargeMultiplier = 0.1;

type ID = number;
type Modifier = number;
type UnitSkillMap = ReadonlyMap<Skill, SkillUnitModifierMap>;
type SkillMap = ReadonlyMap<Skill, Modifier>;
type MovementSkillMap = ReadonlyMap<Skill, MovementMap>;
type TileMovementSkillMap = ReadonlyMap<Skill, TileMovementMap>;
type RangeSkillMap = ReadonlyMap<Skill, [number, number]>;
type RangeMap = ReadonlyMap<ID, RangeSkillMap>;

export type SkillUnitModifierMap = ReadonlyMap<ID, Modifier>;
export type MovementMap = ReadonlyMap<MovementType, Modifier>;
export type TileMovementMap = ReadonlyMap<TileType, MovementMap>;
export type SkillActivationType = 'regular' | 'power';
export type ActiveUnitTypes = ReadonlySet<MovementType | ID | Vector> | 'all';

type SkillStatusType =
  | 'attack'
  | 'defense'
  | 'attack-power'
  | 'defense-power'
  | 'unit-cost'
  | 'unit-cost-power';

const attackStatusEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMinor, 0.05],
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, 0.15],
  [Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor, -0.07],
  [Skill.AttackAndDefenseIncreaseHard, 0.1],
  [Skill.HealVehiclesAttackDecrease, -0.15],
  [Skill.AttackAndDefenseDecreaseEasy, -0.1],
]);

const attackUnitStatusEffects = new Map<Skill, SkillUnitModifierMap>([
  [
    Skill.ArtilleryRangeIncrease,
    new Map([
      [UnitID.Artillery, 0.1],
      [UnitID.HeavyArtillery, 0.1],
      [UnitID.Cannon, 0.1],
    ]),
  ],
  [Skill.Sabotage, new Map([[UnitID.Saboteur, 0.5]])],
  [Skill.VampireHeal, new Map([[UnitID.Medic, 0.5]])],
  [Skill.DragonSaboteur, new Map([[UnitID.Dragon, 0.1]])],
  [Skill.HealInfantryMedicPower, new Map([[UnitID.Medic, 0.5]])],
  [Skill.XFighterAttackIncrase, new Map([[UnitID.XFighter, 0.2]])],
  [Skill.BuyUnitDroneBomber, new Map([[UnitID.Bomber, 0.1]])],
]);

const attackPowerStatusEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMinor, 0.2],
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, 0.35],
  [Skill.HealVehiclesAttackDecrease, 0.3],
  [Skill.RecoverAirUnits, -0.3],
]);

const attackUnitPowerStatusEffects: UnitSkillMap = new Map([
  [Skill.BuyUnitBazookaBear, new Map<ID, number>([[UnitID.BazookaBear, 0.5]])],
  [
    Skill.ArtilleryRangeIncrease,
    new Map([
      [UnitID.Artillery, 0.2],
      [UnitID.HeavyArtillery, 0.2],
      [UnitID.Cannon, 0.2],
    ]),
  ],
  [Skill.HealInfantryMedicPower, new Map([[UnitID.Medic, 2]])],
  [Skill.XFighterAttackIncrase, new Map([[UnitID.XFighter, 0.5]])],
  [
    Skill.BuyUnitHumveeAvenger,
    new Map([
      [UnitID.HumveeAvenger, 0.5],
      [UnitID.XFighter, 0.3],
      [UnitID.FighterJet, 0.3],
    ]),
  ],
]);

const attackMovementTypeStatusEffects: MovementSkillMap = new Map([
  [Skill.HighTide, new Map([[MovementTypes.Ship, 0.2]])],
  [
    Skill.ShipIncreaseAttackAndRange,
    new Map([
      [MovementTypes.Ship, 0.15],
      [MovementTypes.Amphibious, 0.15],
      [MovementTypes.Air, -0.15],
      [MovementTypes.LowAltitude, -0.15],
    ]),
  ],
  [
    Skill.XFighterAttackIncrase,
    new Map([
      [MovementTypes.Air, 0.1],
      [MovementTypes.LowAltitude, 0.1],
      [MovementTypes.Amphibious, -0.15],
      [MovementTypes.Ship, -0.15],
    ]),
  ],
  [
    Skill.BuyUnitHumveeAvenger,
    new Map([
      [MovementTypes.Air, 0.1],
      [MovementTypes.LowAltitude, 0.1],
      [MovementTypes.AirInfantry, 0.1],
    ]),
  ],
]);

const attackMovementTypePowerStatusEffects: MovementSkillMap = new Map([
  [Skill.UnitBattleShipMoveAndAct, new Map([[MovementTypes.Ship, 0.5]])],
  [Skill.BuyUnitBrute, new Map([[MovementTypes.Soldier, 0.5]])],
  [Skill.BuyUnitSuperAPU, new Map([[MovementTypes.HeavySoldier, 0.5]])],
  [
    Skill.HealInfantryMedicPower,
    new Map([
      [MovementTypes.AirInfantry, 0.2],
      [MovementTypes.Soldier, 0.2],
    ]),
  ],
  [
    Skill.VampireHeal,
    new Map([
      [MovementTypes.Soldier, 0.3],
      [MovementTypes.AirInfantry, 0.3],
    ]),
  ],
  [Skill.BuyUnitDroneBomber, new Map([[MovementTypes.Air, 0.2]])],
]);

// Referential equality might improve the skill description.
const forestTileAttack = new Map([
  [MovementTypes.Soldier, 0.3],
  [MovementTypes.HeavySoldier, 0.3],
]);
const soldierTileAttack = new Map([[MovementTypes.Soldier, 0.15]]);
const treadTileAttack = new Map([[MovementTypes.Tread, 0.3]]);
const attackTileStatusEffects = new Map<Skill, TileMovementMap>([
  [
    Skill.UnitInfantryForestAttackAndDefenseIncrease,
    new Map([
      [TileTypes.Forest, forestTileAttack],
      [TileTypes.ForestVariant2, forestTileAttack],
      [TileTypes.ForestVariant3, forestTileAttack],
      [TileTypes.ForestVariant4, forestTileAttack],
    ]),
  ],
  [
    Skill.BuyUnitBear,
    new Map([
      [TileTypes.Forest, soldierTileAttack],
      [TileTypes.ForestVariant2, soldierTileAttack],
      [TileTypes.ForestVariant3, soldierTileAttack],
      [TileTypes.ForestVariant4, soldierTileAttack],
      [TileTypes.Mountain, soldierTileAttack],
    ]),
  ],
  [Skill.UnlockScientist, new Map([[TileTypes.Ruins, soldierTileAttack]])],
]);

const attackTilePowerStatusEffects = new Map<Skill, TileMovementMap>([
  [
    Skill.UnitRailDefenseIncreasePowerAttackIncrease,
    new Map([
      [
        TileTypes.RailTrack,
        new Map([
          [MovementTypes.Soldier, 0.3],
          [MovementTypes.HeavySoldier, 0.3],
          [MovementTypes.Rail, 0.1],
        ]),
      ],
    ]),
  ],
  [
    Skill.BuyUnitOgre,
    new Map([
      [TileTypes.Forest, soldierTileAttack],
      [TileTypes.ForestVariant2, soldierTileAttack],
      [TileTypes.ForestVariant3, soldierTileAttack],
      [TileTypes.ForestVariant4, soldierTileAttack],
      [TileTypes.Mountain, soldierTileAttack],
    ]),
  ],
  [Skill.BuyUnitSuperTank, new Map([[TileTypes.Street, treadTileAttack]])],
]);

const attackLeaderPowerStatusEffects: SkillMap = new Map([
  [Skill.BuyUnitCommander, 1],
]);

const defenseStatusEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, -0.2],
  [Skill.DefenseIncreaseMinor, 0.05],
  [Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor, -0.07],
  [Skill.BuyUnitZombieDefenseDecreaseMajor, -0.5],
  [Skill.AttackAndDefenseIncreaseHard, 0.1],
  [Skill.AttackAndDefenseDecreaseEasy, -0.1],
  [Skill.UnlockZombie, -0.5],
]);

const defenseUnitStatusEffects = new Map<Skill, SkillUnitModifierMap>([
  [Skill.Sabotage, new Map([[UnitID.Saboteur, 1]])],
  [
    Skill.ArtilleryRangeIncrease,
    new Map([
      [UnitID.Artillery, 0.4],
      [UnitID.HeavyArtillery, 0.4],
      [UnitID.Cannon, 0.4],
    ]),
  ],
]);

const defensePowerStatusEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, -0.5],
  [Skill.DefenseIncreaseMinor, 0.5],
]);

const unitCostEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, 0.15],
  [Skill.HealVehiclesAttackDecrease, -0.2],
  [Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor, -0.1],
  [Skill.CostRecovery, 0.1],
]);

const unitCostPowerEffects: SkillMap = new Map([
  [Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor, -0.3],
]);

const defenseMovementTypeStatusEffects: MovementSkillMap = new Map([
  [
    Skill.MovementIncreaseGroundUnitDefenseDecrease,
    new Map([
      [MovementTypes.Tires, -0.15],
      [MovementTypes.Tread, -0.15],
    ]),
  ],
  [
    Skill.UnitRailDefenseIncreasePowerAttackIncrease,
    new Map([[MovementTypes.Rail, 0.2]]),
  ],
  [Skill.BuyUnitDroneBomber, new Map([[MovementTypes.Air, 0.1]])],
]);

const forestDefense = new Map([
  [MovementTypes.Soldier, 0.1],
  [MovementTypes.HeavySoldier, 0.1],
]);
const defenseTileStatusEffects = new Map<Skill, TileMovementMap>([
  [
    Skill.UnitInfantryForestAttackAndDefenseIncrease,
    new Map([
      [TileTypes.Forest, forestDefense],
      [TileTypes.ForestVariant2, forestDefense],
      [TileTypes.ForestVariant3, forestDefense],
      [TileTypes.ForestVariant4, forestDefense],
    ]),
  ],
]);

const skillRangeEffects: RangeMap = new Map([]);

const skillRangePowerEffects = new Map<number, RangeSkillMap>([
  [UnitID.Sniper, new Map([[Skill.UnitAbilitySniperImmediateAction, [2, 5]]])],
  [UnitID.BazookaBear, new Map([[Skill.BuyUnitBazookaBear, [1, 3]]])],
  [UnitID.Cannon, new Map([[Skill.ArtilleryRangeIncrease, [2, 8]]])],
  [UnitID.HeavyArtillery, new Map([[Skill.ArtilleryRangeIncrease, [3, 7]]])],
  [UnitID.Artillery, new Map([[Skill.ArtilleryRangeIncrease, [2, 6]]])],
  [UnitID.XFighter, new Map([[Skill.XFighterAttackIncrase, [1, 3]]])],
  [UnitID.Scientist, new Map([[Skill.UnlockScientist, [2, 3]]])],
  [UnitID.HumveeAvenger, new Map([[Skill.BuyUnitHumveeAvenger, [1, 4]]])],
  [UnitID.DroneBomber, new Map([[Skill.BuyUnitDroneBomber, [3, 7]]])],
]);

const skillMovementTypeRadiusEffects = new Map<
  MovementType,
  Map<Skill, number>
>([
  [
    MovementTypes.Tires,
    new Map([[Skill.MovementIncreaseGroundUnitDefenseDecrease, 1]]),
  ],
  [
    MovementTypes.Tread,
    new Map([[Skill.MovementIncreaseGroundUnitDefenseDecrease, 1]]),
  ],
  [MovementTypes.HeavySoldier, new Map([[Skill.BuyUnitSuperAPU, 1]])],
  [MovementTypes.AirInfantry, new Map([[Skill.DragonSaboteur, 1]])],
  [MovementTypes.Amphibious, new Map([[Skill.ShipIncreaseAttackAndRange, 1]])],
]);

const skillMovementTypeRadiusPowerEffects = new Map<
  MovementType,
  Map<Skill, number>
>([
  [
    MovementTypes.Tires,
    new Map([
      [Skill.MovementIncreaseGroundUnitDefenseDecrease, 1],
      [Skill.Jeep, 1],
    ]),
  ],
  [
    MovementTypes.Tread,
    new Map([
      [Skill.MovementIncreaseGroundUnitDefenseDecrease, 1],
      [Skill.BuyUnitSuperTank, 2],
    ]),
  ],
  [
    MovementTypes.Soldier,
    new Map([
      [Skill.AttackIncreaseMinor, 1],
      [Skill.BuyUnitOgre, 1],
      [Skill.VampireHeal, 2],
    ]),
  ],
  [MovementTypes.AirInfantry, new Map([[Skill.VampireHeal, 2]])],
  [MovementTypes.Ship, new Map([[Skill.ShipIncreaseAttackAndRange, 2]])],
  [MovementTypes.Amphibious, new Map([[Skill.ShipIncreaseAttackAndRange, 2]])],
  [MovementTypes.Air, new Map([[Skill.BuyUnitDroneBomber, 1]])],
]);

const unitCosts = new Map<ID, Map<Skill, number>>([
  [UnitID.Cannon, new Map([[Skill.BuyUnitCannon, 450]])],
  [UnitID.BazookaBear, new Map([[Skill.BuyUnitBazookaBear, 800]])],
  [UnitID.Brute, new Map([[Skill.BuyUnitBrute, 600]])],
  [UnitID.Zombie, new Map([[Skill.BuyUnitZombieDefenseDecreaseMajor, 250]])],
  [UnitID.AIU, new Map([[Skill.BuyUnitAIU, 500]])],
  [UnitID.Commander, new Map([[Skill.BuyUnitCommander, 225]])],
  [UnitID.Alien, new Map([[Skill.BuyUnitAlien, 400]])],
  [UnitID.Octopus, new Map([[Skill.BuyUnitOctopus, 600]])],
  [UnitID.SuperTank, new Map([[Skill.BuyUnitSuperTank, 900]])],
  [UnitID.AcidBomber, new Map([[Skill.BuyUnitAcidBomber, 750]])],
  [UnitID.Dinosaur, new Map([[Skill.BuyUnitDinosaur, 600]])],
  [UnitID.SuperAPU, new Map([[Skill.BuyUnitSuperAPU, 650]])],
  [UnitID.Dragon, new Map([[Skill.BuyUnitDragon, 500]])],
  [UnitID.Ogre, new Map([[Skill.BuyUnitOgre, 350]])],
  [UnitID.Bear, new Map([[Skill.BuyUnitBear, 300]])],
  [UnitID.Scientist, new Map([[Skill.UnlockScientist, 375]])],
  [UnitID.HumveeAvenger, new Map([[Skill.BuyUnitHumveeAvenger, 275]])],
  [UnitID.DroneBomber, new Map([[Skill.BuyUnitDroneBomber, 1200]])],
]);

const buildingCosts = new Map<ID, Map<Skill, number>>([
  [
    BuildingID.Bar,
    new Map([
      [Skill.BuyUnitBazookaBear, 600],
      [Skill.BuyUnitBear, 600],
      [Skill.BuyUnitDinosaur, 600],
      [Skill.BuyUnitDragon, 600],
      [Skill.BuyUnitOctopus, 600],
      [Skill.BuyUnitOgre, 600],
      [Skill.SpawnUnitInfernoJetpack, 600],
    ]),
  ],
]);

const blockedUnits = new Map<Skill, ReadonlySet<ID>>([
  [
    Skill.BuyUnitZombieDefenseDecreaseMajor,
    new Set([UnitID.Pioneer, UnitID.Infantry]),
  ],
  [Skill.BuyUnitAIU, new Set([UnitID.Infantry])],
]);

const healPower = new Map<Skill, ActiveUnitTypes>([
  [
    Skill.HealVehiclesAttackDecrease,
    new Set([MovementTypes.Tires, MovementTypes.Tread, MovementTypes.Rail]),
  ],
  [
    Skill.HealInfantryMedicPower,
    new Set([MovementTypes.AirInfantry, MovementTypes.Soldier]),
  ],
  [Skill.BuyUnitSuperTank, new Set([MovementTypes.Tread])],
]);

export function getSkillConfig(skill: Skill) {
  const config = skillConfig[skill];
  if (!config) {
    throw new UnknownTypeError('getSkillConfig', String(skill));
  }
  return config;
}

const getUnitStatusEffect = (
  unitStatusEffects: UnitSkillMap | null,
  leaderStatusEffects: SkillMap | null,
  skill: Skill,
  entity: Entity,
) =>
  unitStatusEffects && isUnit(entity)
    ? (unitStatusEffects.get(skill)?.get(entity.id) || 0) +
        ((entity.isLeader() && leaderStatusEffects?.get(skill)) || 0) || 0
    : 0;

const getMovementStatusEffect = (
  movementStatusEffects: MovementSkillMap | null,
  skill: Skill,
  entity: Readonly<{ type: EntityType }> | UnitInfo,
) =>
  movementStatusEffects && isUnitInfo(entity)
    ? (movementStatusEffects.get(skill)?.get(entity.movementType) ?? 0)
    : 0;

const getTileStatusEffect = (
  tileStatusEffects: TileMovementSkillMap | null,
  skill: Skill,
  entity: Readonly<{ type: EntityType }> | UnitInfo,
  tile: TileInfo | null,
) =>
  tile && tileStatusEffects && isUnitInfo(entity)
    ? (tileStatusEffects
        .get(skill)
        ?.get(tile.group)
        ?.get(entity.movementType) ?? 0)
    : 0;

const someOneSkill = (
  statusEffects: SkillMap,
  unitStatusEffects: UnitSkillMap | null,
  movementStatusEffects: MovementSkillMap | null,
  tileStatusEffects: TileMovementSkillMap | null,
  leaderStatusEffects: SkillMap | null,
  entity: Entity | null,
  tile: TileInfo | null,
  skill: Skill | undefined,
) =>
  skill
    ? (statusEffects.get(skill) ?? 0) +
      (entity
        ? getUnitStatusEffect(
            unitStatusEffects,
            leaderStatusEffects,
            skill,
            entity,
          ) +
          getMovementStatusEffect(movementStatusEffects, skill, entity.info) +
          getTileStatusEffect(tileStatusEffects, skill, entity.info, tile)
        : 0)
    : 0;

const sum = (
  statusEffects: SkillMap,
  unitStatusEffects: UnitSkillMap | null,
  movementStatusEffects: MovementSkillMap | null,
  tileStatusEffects: TileMovementSkillMap | null,
  leaderStatusEffects: SkillMap | null,
  entity: Entity | null,
  tile: TileInfo | null,
  skills: ReadonlySet<Skill>,
) => {
  if (!skills.size) {
    return 0;
  }

  const sumOne = someOneSkill.bind(
    null,
    statusEffects,
    unitStatusEffects,
    movementStatusEffects,
    tileStatusEffects,
    leaderStatusEffects,
    entity,
    tile,
  );

  if (skills.size === 1) {
    return sumOne(skills.values().next().value);
  }

  if (skills.size === 2) {
    const [skillA, skillB] = skills;
    return sumOne(skillA) + sumOne(skillB);
  }

  let statusEffect = 0;
  for (const skill of skills) {
    statusEffect += sumOne(skill);
  }
  return statusEffect;
};

const sumAll = (
  statusEffects: SkillMap,
  unitStatusEffects: UnitSkillMap | null,
  movementStatusEffects: MovementSkillMap | null,
  activeStatusEffects: SkillMap,
  activeUnitStatusEffects: UnitSkillMap | null,
  activeMovementStatusEffects: MovementSkillMap | null,
  tileStatusEffects: TileMovementSkillMap | null,
  activeTileStatusEffects: TileMovementSkillMap | null,
  leaderStatusEffects: SkillMap | null,
  activeLeaderStatusEffects: SkillMap | null,
  entity: Entity | null,
  tile: TileInfo | null,
  skills: ReadonlySet<Skill>,
  activeSkills: ReadonlySet<Skill>,
) =>
  sum(
    statusEffects,
    unitStatusEffects,
    movementStatusEffects,
    tileStatusEffects,
    leaderStatusEffects,
    entity,
    tile,
    skills,
  ) +
  sum(
    activeStatusEffects,
    activeUnitStatusEffects,
    activeMovementStatusEffects,
    activeTileStatusEffects,
    activeLeaderStatusEffects,
    entity,
    tile,
    activeSkills,
  );

export const getSkillAttackStatusEffects = (
  entity: Entity | null,
  tile: TileInfo | null,
  { activeSkills, charge, skills }: Player,
) => {
  let effect = sumAll(
    attackStatusEffects,
    attackUnitStatusEffects,
    attackMovementTypeStatusEffects,
    attackPowerStatusEffects,
    attackUnitPowerStatusEffects,
    attackMovementTypePowerStatusEffects,
    attackTileStatusEffects,
    attackTilePowerStatusEffects,
    null,
    attackLeaderPowerStatusEffects,
    entity,
    tile,
    skills,
    activeSkills,
  );

  if (activeSkills.size && activeSkills.has(Skill.Charge)) {
    effect += ChargeSkillChargeMultiplier * Math.floor(charge / Charge);
  }

  return effect;
};

export const getSkillDefenseStatusEffects = sumAll.bind(
  null,
  defenseStatusEffects,
  defenseUnitStatusEffects,
  defenseMovementTypeStatusEffects,
  defensePowerStatusEffects,
  null,
  null,
  defenseTileStatusEffects,
  null,
  null,
  null,
);

export const getSkillUnitCostEffects = sumAll.bind(
  null,
  unitCostEffects,
  null,
  null,
  unitCostPowerEffects,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
);

export function getBlockedUnits(skill: Skill) {
  return blockedUnits.get(skill);
}

const unitIsBlocked = (unit: UnitInfo, skill: Skill) =>
  blockedUnits.get(skill)?.has(unit.id);

export function getBuildingCost(
  building: BuildingInfo,
  cost: number,
  skills: ReadonlySet<Skill>,
  activeSkills: ReadonlySet<Skill>,
) {
  if (
    building.id === BuildingID.PowerStation &&
    activeSkills.has(Skill.UnlockPowerStation)
  ) {
    return 500;
  }

  if (
    building.id === BuildingID.ResearchLab &&
    activeSkills.has(Skill.UnlockScientist)
  ) {
    return 600;
  }

  if (skills.size === 0) {
    return cost;
  }

  const costs = buildingCosts.get(building.id);
  let min = cost;
  if (skills.size === 1) {
    const skill: Skill = skills.values().next().value!;
    return costs?.get(skill) || min;
  }

  for (const skill of skills) {
    const cost = costs?.get(skill);
    if (cost && (!min || cost < min)) {
      min = cost;
    }
  }

  return min;
}

const ceil = (value: number) => Math.ceil(Math.round(value * 1e4) / 1e4);

export function getUnitCost(
  unit: UnitInfo,
  cost: number,
  skills: ReadonlySet<Skill>,
  activeSkills: ReadonlySet<Skill>,
) {
  if (skills.size === 0) {
    return cost;
  }

  const modifier = 1 + getSkillUnitCostEffects(skills, activeSkills);
  const costs = unitCosts.get(unit.id);
  let min = cost;
  if (skills.size === 1) {
    const skill: Skill = skills.values().next().value!;
    return unitIsBlocked(unit, skill)
      ? Number.POSITIVE_INFINITY
      : ceil((costs?.get(skill) || min) * modifier);
  }

  for (const skill of skills) {
    if (unitIsBlocked(unit, skill)) {
      return Number.POSITIVE_INFINITY;
    }

    const cost = costs?.get(skill);
    if (cost && (!min || cost < min)) {
      min = cost;
    }
  }

  return ceil(min * modifier);
}

export function hasUnlockedBuilding(
  building: BuildingInfo,
  skills: ReadonlySet<Skill>,
) {
  if (building.id === BuildingID.ResearchLab) {
    return true;
  }

  if (skills.size === 0) {
    return false;
  }

  if (building.id === BuildingID.PowerStation) {
    return skills.has(Skill.UnlockPowerStation);
  }

  const unlocks = buildingCosts.get(building.id);
  if (unlocks) {
    for (const [skill] of unlocks) {
      if (skills.has(skill)) {
        return true;
      }
    }
  }

  return false;
}

export function getUnlockedUnitIDs(skills: ReadonlySet<Skill>) {
  const unlockedUnits = new Set<ID>();
  for (const skill of skills) {
    for (const [unit, skills] of unitCosts) {
      if (new Set(skills.keys()).has(skill)) {
        unlockedUnits.add(unit);
      }
    }
  }
  return unlockedUnits;
}

export function hasUnlockedUnit(unit: UnitInfo, skills: ReadonlySet<Skill>) {
  if (skills.size === 0) {
    return false;
  }

  if (unit.id === UnitID.Zombie && skills.has(Skill.UnlockZombie)) {
    return true;
  }

  const unlocks = unitCosts.get(unit.id);
  if (unlocks) {
    for (const [skill] of unlocks) {
      if (skills.has(skill)) {
        return true;
      }
    }
  }

  return false;
}

const getSkillUnitRadius = (
  unit: UnitInfo,
  skillRadiusEffects: ReadonlyMap<MovementType, ReadonlyMap<Skill, number>>,
  skills: ReadonlySet<Skill>,
) => {
  let radius = 0;
  if (skills.size === 0) {
    return radius;
  }

  const movement = skillRadiusEffects.get(unit.movementType);
  if (movement) {
    if (skills.size === 1) {
      return radius + (movement.get(skills.values().next().value!) || 0);
    }

    for (const skill of skills) {
      radius = radius + (movement.get(skill) || 0);
    }
  }

  return radius;
};

export function getUnitRadius(
  unit: UnitInfo,
  radius: number,
  skills: ReadonlySet<Skill>,
  activeSkills: ReadonlySet<Skill>,
) {
  return (
    radius +
    getSkillUnitRadius(unit, skillMovementTypeRadiusEffects, skills) +
    getSkillUnitRadius(unit, skillMovementTypeRadiusPowerEffects, activeSkills)
  );
}

const getSkillUnitRange = (
  unit: UnitInfo,
  effects: RangeMap,
  skills: ReadonlySet<Skill>,
) => {
  if (skills.size === 0) {
    return null;
  }

  const rangeMap = effects.get(unit.id);
  if (rangeMap) {
    if (skills.size === 1) {
      return rangeMap.get(skills.values().next().value!);
    }

    for (const skill of skills) {
      const newRange = rangeMap.get(skill);
      if (newRange) {
        return newRange;
      }
    }
  }

  return null;
};

export function getUnitRange(
  unit: UnitInfo,
  range: [number, number],
  skills: ReadonlySet<Skill>,
  activeSkills: ReadonlySet<Skill>,
): [number, number] {
  return (
    getSkillUnitRange(unit, skillRangePowerEffects, activeSkills) ||
    getSkillUnitRange(unit, skillRangeEffects, skills) ||
    range
  );
}

export function getSkillEffect(skillType: SkillStatusType, skill: Skill) {
  switch (skillType) {
    case 'attack':
      return attackStatusEffects.get(skill) ?? 0;
    case 'attack-power':
      return attackPowerStatusEffects.get(skill) ?? 0;
    case 'defense':
      return defenseStatusEffects.get(skill) ?? 0;
    case 'defense-power':
      return defensePowerStatusEffects.get(skill) ?? 0;
    case 'unit-cost':
      return unitCostEffects.get(skill) ?? 0;
    case 'unit-cost-power':
      return unitCostPowerEffects.get(skill) ?? 0;
    default: {
      skillType satisfies never;
      throw new UnknownTypeError('getSkillEffect', skillType);
    }
  }
}

export function getSkillDefenseMovementTypeStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return (
    (type === 'regular' && defenseMovementTypeStatusEffects.get(skill)) || null
  );
}

export function getSkillTileDefenseStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return (type === 'regular' && defenseTileStatusEffects.get(skill)) || null;
}

export function getSkillAttackUnitStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return type === 'regular'
    ? attackUnitStatusEffects.get(skill)
    : attackUnitPowerStatusEffects.get(skill) || null;
}

export function getSkillDefenseUnitStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return (type === 'regular' && defenseUnitStatusEffects.get(skill)) || null;
}

export function getSkillAttackLeaderUnitStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return type === 'regular'
    ? null
    : attackLeaderPowerStatusEffects.get(skill) || null;
}

export function getSkillAttackMovementTypeStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return type === 'regular'
    ? attackMovementTypeStatusEffects.get(skill)
    : attackMovementTypePowerStatusEffects.get(skill) || null;
}

export function getSkillTileAttackStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return (
    (type === 'regular'
      ? attackTileStatusEffects.get(skill)
      : attackTilePowerStatusEffects.get(skill)) || null
  );
}

export function getSkillUnitCosts(skill: Skill, type: SkillActivationType) {
  const skillUnitCosts = new Map<ID, number>();
  if (type === 'regular') {
    for (const [unitID, costs] of unitCosts) {
      const cost = costs.get(skill);
      if (cost) {
        skillUnitCosts.set(unitID, cost);
      }
    }
  }
  return skillUnitCosts;
}

export function getSkillUnitMovement(skill: Skill, type: SkillActivationType) {
  const movementTypes = new Map<MovementType, number>();
  const effects =
    type === 'regular'
      ? skillMovementTypeRadiusEffects
      : skillMovementTypeRadiusPowerEffects;
  for (const [unit, movement] of effects) {
    const radius = movement.get(skill);
    if (radius) {
      movementTypes.set(unit, (movementTypes.get(unit) || 0) + radius);
    }
  }
  return movementTypes;
}

export function getUnitRangeForSkill(skill: Skill, type: SkillActivationType) {
  const unitTypes = new Map<ID, [number, number]>();
  const effects =
    type === 'regular' ? skillRangeEffects : skillRangePowerEffects;
  for (const [unit, rangeMap] of effects) {
    const range = rangeMap.get(skill);
    if (range) {
      unitTypes.set(unit, range);
    }
  }
  return unitTypes;
}

const getSkillActiveUnitTypes = (
  map: MapData,
  player: Player,
  skill: Skill,
): ReadonlyArray<MovementType | ID | Vector> | 'all' => {
  const attackEffect = attackPowerStatusEffects.get(skill);
  const defenseEffect = defensePowerStatusEffects.get(skill);
  if (
    skill === Skill.CounterAttackPower ||
    skill === Skill.Shield ||
    (attackEffect != null && attackEffect > 0) ||
    (defenseEffect != null && defenseEffect > 0)
  ) {
    return 'all';
  }

  if (skill === Skill.RecoverAirUnits) {
    return [...getAirUnitsToRecover(map, player).keys()];
  }

  const list = [];

  if (skill === Skill.BuyUnitCannon) {
    for (const [vector, unit] of map.units) {
      if (
        unit.isUnfolded() &&
        unit.isCompleted() &&
        map.matchesPlayer(unit, player)
      ) {
        list.push(vector);
      }
    }
  }

  for (const [vector, unit] of map.units) {
    if (
      map.matchesPlayer(unit, player) &&
      skillRangePowerEffects.get(unit.id)?.get(skill)
    ) {
      list.push(vector);
    }
  }

  if (skill === Skill.Sabotage) {
    for (const [vector, unit] of map.units) {
      if (unit.id === UnitID.Saboteur && map.matchesPlayer(unit, player)) {
        list.push(vector);
      }
    }
    return list;
  }

  if (skill === Skill.DragonSaboteur) {
    for (const [vector, unit] of map.units) {
      if (
        unit.id === UnitID.Saboteur &&
        unit.isLeader() &&
        map.matchesPlayer(unit, player)
      ) {
        list.push(vector);
      }
    }
    return list;
  }

  if (skill === Skill.SpawnUnitInfernoJetpack) {
    for (const [vector, unit] of map.units) {
      if (unit.id === UnitID.Flamethrower && map.matchesPlayer(unit, player)) {
        list.push(vector);
      }
    }
    return list;
  }

  if (skill === Skill.UnlockZombie) {
    for (const [vector, unit] of map.units) {
      if (unit.id === UnitID.Pioneer && map.matchesPlayer(unit, player)) {
        list.push(vector);
      }
    }
    return list;
  }

  if (skill === Skill.BuyUnitCommander) {
    for (const [vector, unit] of map.units) {
      if (
        unit.isLeader() &&
        unit.info.hasAttack() &&
        map.matchesPlayer(unit, player)
      ) {
        list.push(vector);
      }
    }
    return list;
  }

  const units = attackUnitPowerStatusEffects.get(skill);
  if (units) {
    list.push(...units.keys());
  }

  const movementType = attackMovementTypePowerStatusEffects.get(skill);
  if (movementType) {
    list.push(...movementType.keys());
  }

  for (const [movementType, skills] of skillMovementTypeRadiusPowerEffects) {
    if (skills.has(skill)) {
      list.push(movementType);
    }
  }

  const attackTileMap = attackTilePowerStatusEffects.get(skill);
  if (attackTileMap) {
    list.push(
      ...map.units
        .filter(
          (unit, vector) =>
            map.matchesPlayer(player, unit) &&
            attackTileMap
              .get(map.getTileInfo(vector).group)
              ?.get(unit.info.movementType),
        )
        .keys(),
    );
  }

  return list;
};

export function getActiveUnitTypes(
  map: MapData,
  player: Player,
): ActiveUnitTypes {
  const skills = player.activeSkills;
  if (!skills.size) {
    return new Set();
  }

  if (skills.size === 1) {
    const value = getSkillActiveUnitTypes(
      map,
      player,
      skills.values().next().value!,
    );
    return value === 'all' ? value : new Set(value);
  }

  const activeUnitTypes = new Set<MovementType | ID | Vector>();
  for (const skill of skills) {
    const active = getSkillActiveUnitTypes(map, player, skill);
    if (active === 'all') {
      return active;
    }
    for (const value of active) {
      activeUnitTypes.add(value);
    }
  }

  return activeUnitTypes;
}

export function getHealUnitTypes(skill: Skill) {
  return healPower.get(skill);
}

export function hasCounterAttackSkill(skills: ReadonlySet<Skill>) {
  return skills.has(Skill.CounterAttackPower);
}

export function isRecoverySkill(skill: Skill) {
  return skill === Skill.RecoverAirUnits;
}

export const VampireSoldierMovementTypes = new Set([
  MovementTypes.Soldier,
  MovementTypes.AirInfantry,
]);

export const CostRecoverySkillModifier = 0.5;

const octopusPowerDamage = 20;
const dragonPowerDamage = 80;
const vampirePowerDamage = 25;
const dinosaurPowerDamage = 50;

export function getSkillPowerDamage(skill: Skill) {
  if (skill === Skill.BuyUnitOctopus) {
    return octopusPowerDamage;
  }
  if (skill === Skill.BuyUnitDragon) {
    return dragonPowerDamage;
  }
  if (skill === Skill.VampireHeal) {
    return vampirePowerDamage;
  }
  if (skill === Skill.BuyUnitDinosaur) {
    return dinosaurPowerDamage;
  }

  return 0;
}

export function shouldUpgradeUnit(unit: Unit, skill: Skill) {
  if (!unit.isCompleted()) {
    return true;
  }

  switch (skill) {
    case Skill.BuyUnitCannon:
    case Skill.DragonSaboteur:
    case Skill.Jeep:
    case Skill.RecoverAirUnits:
    case Skill.Shield:
    case Skill.SpawnUnitInfernoJetpack:
    case Skill.UnlockZombie:
      return true;

    case Skill.ArtilleryRangeIncrease:
    case Skill.AttackAndDefenseDecreaseEasy:
    case Skill.AttackAndDefenseIncreaseHard:
    case Skill.AttackIncreaseMajorDefenseDecreaseMajor:
    case Skill.AttackIncreaseMinor:
    case Skill.BuyUnitAcidBomber:
    case Skill.BuyUnitAIU:
    case Skill.BuyUnitAlien:
    case Skill.BuyUnitBazookaBear:
    case Skill.BuyUnitBear:
    case Skill.BuyUnitBrute:
    case Skill.BuyUnitCommander:
    case Skill.BuyUnitDinosaur:
    case Skill.BuyUnitDragon:
    case Skill.BuyUnitDroneBomber:
    case Skill.BuyUnitOctopus:
    case Skill.BuyUnitOgre:
    case Skill.BuyUnitSuperAPU:
    case Skill.BuyUnitSuperTank:
    case Skill.BuyUnitZombieDefenseDecreaseMajor:
    case Skill.Charge:
    case Skill.CostRecovery:
    case Skill.CounterAttackPower:
    case Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor:
    case Skill.DefenseIncreaseMinor:
    case Skill.HealInfantryMedicPower:
    case Skill.HealVehiclesAttackDecrease:
    case Skill.HighTide:
    case Skill.MovementIncreaseGroundUnitDefenseDecrease:
    case Skill.NoUnitRestrictions:
    case Skill.Sabotage:
    case Skill.ShipIncreaseAttackAndRange:
    case Skill.UnitAbilitySniperImmediateAction:
    case Skill.UnitBattleShipMoveAndAct:
    case Skill.UnitInfantryForestAttackAndDefenseIncrease:
    case Skill.UnitRailDefenseIncreasePowerAttackIncrease:
    case Skill.UnlockPowerStation:
    case Skill.UnlockScientist:
    case Skill.VampireHeal:
    case Skill.XFighterAttackIncrase:
    case Skill.BuyUnitHumveeAvenger:
      return false;
    default: {
      skill satisfies never;
      throw new UnknownTypeError('shouldUpgradeUnit', String(skill));
    }
  }

  return false;
}
