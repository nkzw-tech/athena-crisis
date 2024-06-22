import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import matchesActiveType from '../lib/matchesActiveType.tsx';
import { HealAmount } from '../map/Configuration.tsx';
import { EntityType, isUnitInfo } from '../map/Entity.tsx';
import Player from '../map/Player.tsx';
import Vector from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';
import { BuildingInfo } from './Building.tsx';
import { BarID } from './BuildingIDs.tsx';
import { MovementType, MovementTypes } from './MovementType.tsx';
import { TileInfo, TileType, TileTypes } from './Tile.tsx';
import type { UnitInfo } from './Unit.tsx';
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
  UnitAPUAttackIncreaseMajorPower = 10,
  BuyUnitZombieDefenseDecreaseMajor = 11,
  BuyUnitBazookaBear = 12,
  AttackAndDefenseIncreaseHard = 13,
  HealVehiclesAttackDecrease = 14,
  ArtilleryRangeIncrease = 15,
  HealInfantryMedicPower = 16,
  NoUnitRestrictions = 17,
  CounterAttackPower = 18,
  AttackAndDefenseDecreaseEasy = 19,
  UnitInfantryForestDefenseIncrease = 20,
  UnitRailDefenseIncreasePowerAttackIncrease = 21,
  BuyUnitAIU = 22,
}

export const Skills = new Set<Skill>([
  Skill.AttackIncreaseMinor,
  Skill.DefenseIncreaseMinor,
  Skill.AttackIncreaseMajorDefenseDecreaseMajor,
  Skill.BuyUnitCannon,
  Skill.BuyUnitBrute,
  Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor,
  Skill.UnitAbilitySniperImmediateAction,
  Skill.MovementIncreaseGroundUnitDefenseDecrease,
  Skill.UnitBattleShipMoveAndAct,
  Skill.UnitAPUAttackIncreaseMajorPower,
  Skill.BuyUnitZombieDefenseDecreaseMajor,
  Skill.BuyUnitBazookaBear,
  Skill.AttackAndDefenseIncreaseHard,
  Skill.HealVehiclesAttackDecrease,
  Skill.ArtilleryRangeIncrease,
  Skill.HealInfantryMedicPower,
  Skill.NoUnitRestrictions,
  Skill.CounterAttackPower,
  Skill.AttackAndDefenseDecreaseEasy,
  Skill.UnitInfantryForestDefenseIncrease,
  Skill.UnitRailDefenseIncreasePowerAttackIncrease,
  Skill.BuyUnitAIU,
]);

const skillConfig: Record<
  Skill,
  Readonly<{ charges?: number; cost: number | null }>
> = {
  [Skill.AttackIncreaseMinor]: { charges: 3, cost: 300 },
  [Skill.DefenseIncreaseMinor]: { charges: 2, cost: 300 },
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor]: { charges: 6, cost: 800 },
  [Skill.BuyUnitCannon]: { cost: 1000 },
  [Skill.BuyUnitBrute]: { charges: 5, cost: 1000 },
  [Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor]: {
    charges: 5,
    cost: 600,
  },
  [Skill.UnitAbilitySniperImmediateAction]: { cost: 2000 },
  [Skill.MovementIncreaseGroundUnitDefenseDecrease]: { charges: 2, cost: 2500 },
  [Skill.UnitBattleShipMoveAndAct]: { charges: 5, cost: 2000 },
  [Skill.UnitAPUAttackIncreaseMajorPower]: { charges: 3, cost: 3000 },
  [Skill.BuyUnitZombieDefenseDecreaseMajor]: { cost: 1500 },
  [Skill.BuyUnitBazookaBear]: { charges: 3, cost: 2000 },
  [Skill.AttackAndDefenseIncreaseHard]: { cost: 1500 },
  [Skill.HealVehiclesAttackDecrease]: { charges: 3, cost: 1000 },
  [Skill.ArtilleryRangeIncrease]: { charges: 3, cost: 1500 },
  [Skill.HealInfantryMedicPower]: { charges: 4, cost: 1000 },
  [Skill.NoUnitRestrictions]: { cost: null },
  [Skill.CounterAttackPower]: { charges: 3, cost: 1500 },
  [Skill.AttackAndDefenseDecreaseEasy]: { cost: null },
  [Skill.UnitInfantryForestDefenseIncrease]: { charges: 3, cost: 2000 },
  [Skill.UnitRailDefenseIncreasePowerAttackIncrease]: {
    charges: 4,
    cost: 1500,
  },
  [Skill.BuyUnitAIU]: { cost: 1500 },
};

export const AIOnlySkills: ReadonlySet<Skill> = new Set(
  [...Skills].filter((skill) => skillConfig[skill].cost === null),
);

type ID = number;
type Modifier = number;

type SkillMap = ReadonlyMap<Skill, Modifier>;
type UnitSkillMap = ReadonlyMap<Skill, ReadonlyMap<ID, Modifier>>;
type MovementSkillMap = ReadonlyMap<Skill, ReadonlyMap<MovementType, Modifier>>;

type TileMovementSkillMap = ReadonlyMap<
  Skill,
  ReadonlyMap<TileType, ReadonlyMap<MovementType, Modifier>>
>;
type RangeSkillMap = ReadonlyMap<Skill, [number, number]>;
type RangeMap = ReadonlyMap<ID, RangeSkillMap>;

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

const attackUnitStatusEffects: UnitSkillMap = new Map([
  [
    Skill.ArtilleryRangeIncrease,
    new Map([
      [UnitID.Artillery, 0.1],
      [UnitID.HeavyArtillery, 0.1],
      [UnitID.Cannon, 0.1],
    ]),
  ],
]);

const attackPowerStatusEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMinor, 0.2],
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, 0.35],
  [Skill.HealVehiclesAttackDecrease, 0.3],
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
  [Skill.HealInfantryMedicPower, new Map([[UnitID.Medic, 2.5]])],
]);

const attackMovementTypePowerStatusEffects: MovementSkillMap = new Map([
  [Skill.UnitBattleShipMoveAndAct, new Map([[MovementTypes.Ship, 0.5]])],
  [Skill.BuyUnitBrute, new Map([[MovementTypes.Soldier, 0.5]])],
  [
    Skill.UnitAPUAttackIncreaseMajorPower,
    new Map([[MovementTypes.HeavySoldier, 3]]),
  ],
  [
    Skill.HealInfantryMedicPower,
    new Map([
      [MovementTypes.AirInfantry, 0.2],
      [MovementTypes.Soldier, 0.2],
    ]),
  ],
]);

const attackTilePowerStatusEffects: TileMovementSkillMap = new Map([
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
]);

const defenseStatusEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, -0.2],
  [Skill.DefenseIncreaseMinor, 0.05],
  [Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor, -0.07],
  [Skill.BuyUnitZombieDefenseDecreaseMajor, -0.5],
  [Skill.AttackAndDefenseIncreaseHard, 0.1],
  [Skill.AttackAndDefenseDecreaseEasy, -0.1],
]);

const defensePowerStatusEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, -0.5],
  [Skill.DefenseIncreaseMinor, 0.5],
]);

const unitCostEffects: SkillMap = new Map([
  [Skill.AttackIncreaseMajorDefenseDecreaseMajor, 0.15],
  [Skill.HealVehiclesAttackDecrease, -0.2],
  [Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor, -0.1],
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
    Skill.ArtilleryRangeIncrease,
    new Map([
      [MovementTypes.Tires, 0.2],
      [MovementTypes.Tread, 0.2],
    ]),
  ],
  [
    Skill.UnitRailDefenseIncreasePowerAttackIncrease,
    new Map([[MovementTypes.Rail, 0.2]]),
  ],
]);

const forestDefense = new Map([
  [MovementTypes.Soldier, 0.1],
  [MovementTypes.HeavySoldier, 0.1],
]);
const defenseTileStatusEffects: TileMovementSkillMap = new Map([
  [
    Skill.UnitInfantryForestDefenseIncrease,
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
  [UnitID.BazookaBear, new Map([[Skill.BuyUnitBazookaBear, [1, 3]]])],
  [UnitID.Cannon, new Map([[Skill.ArtilleryRangeIncrease, [2, 8]]])],
  [UnitID.HeavyArtillery, new Map([[Skill.ArtilleryRangeIncrease, [3, 7]]])],
  [UnitID.Artillery, new Map([[Skill.ArtilleryRangeIncrease, [2, 6]]])],
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
  [
    MovementTypes.HeavySoldier,
    new Map([[Skill.UnitAPUAttackIncreaseMajorPower, 1]]),
  ],
]);

const skillMovementTypeRadiusPowerEffects = new Map<
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
]);

const unitCosts = new Map<ID, Map<Skill, number>>([
  [UnitID.Cannon, new Map([[Skill.BuyUnitCannon, 450]])],
  [UnitID.BazookaBear, new Map([[Skill.BuyUnitBazookaBear, 800]])],
  [UnitID.Brute, new Map([[Skill.BuyUnitBrute, 600]])],
  [UnitID.Zombie, new Map([[Skill.BuyUnitZombieDefenseDecreaseMajor, 250]])],
  [UnitID.AIU, new Map([[Skill.BuyUnitAIU, 300]])],
]);

const buildingUnlocks = new Map<ID, Set<Skill>>([
  [BarID, new Set([Skill.BuyUnitBazookaBear])],
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
  skill: Skill,
  entity: Readonly<{ type: EntityType }> | UnitInfo,
) =>
  unitStatusEffects && isUnitInfo(entity)
    ? unitStatusEffects.get(skill)?.get(entity.id) ?? 0
    : 0;

const getMovementStatusEffect = (
  movementStatusEffects: MovementSkillMap | null,
  skill: Skill,
  entity: Readonly<{ type: EntityType }> | UnitInfo,
) =>
  movementStatusEffects && isUnitInfo(entity)
    ? movementStatusEffects.get(skill)?.get(entity.movementType) ?? 0
    : 0;

const getTileStatusEffect = (
  tileStatusEffects: TileMovementSkillMap | null,
  skill: Skill,
  entity: Readonly<{ type: EntityType }> | UnitInfo,
  tile: TileInfo | null,
) =>
  tile && tileStatusEffects && isUnitInfo(entity)
    ? tileStatusEffects.get(skill)?.get(tile.group)?.get(entity.movementType) ??
      0
    : 0;

const someOneSkill = (
  statusEffects: SkillMap,
  unitStatusEffects: UnitSkillMap | null,
  movementStatusEffects: MovementSkillMap | null,
  tileStatusEffects: TileMovementSkillMap | null,
  entity: Readonly<{ type: EntityType }> | UnitInfo,
  tile: TileInfo | null,
  skill: Skill | undefined,
) =>
  skill
    ? (statusEffects.get(skill) ?? 0) +
      getUnitStatusEffect(unitStatusEffects, skill, entity) +
      getMovementStatusEffect(movementStatusEffects, skill, entity) +
      getTileStatusEffect(tileStatusEffects, skill, entity, tile)
    : 0;

const sum = (
  statusEffects: SkillMap,
  unitStatusEffects: UnitSkillMap | null,
  movementStatusEffects: MovementSkillMap | null,
  tileStatusEffects: TileMovementSkillMap | null,
  entity: Readonly<{ type: EntityType }> | UnitInfo,
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
  entity: Readonly<{ type: EntityType }> | UnitInfo,
  tile: TileInfo | null,
  skills: ReadonlySet<Skill>,
  activeSkills: ReadonlySet<Skill>,
) =>
  sum(
    statusEffects,
    unitStatusEffects,
    movementStatusEffects,
    tileStatusEffects,
    entity,
    tile,
    skills,
  ) +
  sum(
    activeStatusEffects,
    activeUnitStatusEffects,
    activeMovementStatusEffects,
    activeTileStatusEffects,
    entity,
    tile,
    activeSkills,
  );

export const getSkillAttackStatusEffects = sumAll.bind(
  null,
  attackStatusEffects,
  attackUnitStatusEffects,
  null,
  attackPowerStatusEffects,
  attackUnitPowerStatusEffects,
  attackMovementTypePowerStatusEffects,
  null,
  attackTilePowerStatusEffects,
);

export const getSkillDefenseStatusEffects = sumAll.bind(
  null,
  defenseStatusEffects,
  null,
  defenseMovementTypeStatusEffects,
  defensePowerStatusEffects,
  null,
  null,
  defenseTileStatusEffects,
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
);

export function getBlockedUnits(skill: Skill) {
  return blockedUnits.get(skill);
}

const unitIsBlocked = (unit: UnitInfo, skill: Skill) =>
  blockedUnits.get(skill)?.has(unit.id);

export function getUnitCost(
  unit: UnitInfo,
  cost: number,
  skills: ReadonlySet<Skill>,
  activeSkills: ReadonlySet<Skill>,
) {
  if (skills.size === 0) {
    return cost;
  }

  const modifier =
    1 + getSkillUnitCostEffects(unit, null, skills, activeSkills);
  const costs = unitCosts.get(unit.id);
  let min = cost;
  if (skills.size === 1) {
    const skill: Skill = skills.values().next().value;
    return unitIsBlocked(unit, skill)
      ? Number.POSITIVE_INFINITY
      : Math.floor((costs?.get(skill) || min) * modifier);
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

  return Math.floor(min * modifier);
}

export function hasUnlockedBuilding(
  building: BuildingInfo,
  skills: ReadonlySet<Skill>,
) {
  if (!building.configuration.requiresUnlock) {
    return building.configuration.cost < Number.POSITIVE_INFINITY;
  }

  if (skills.size === 0) {
    return false;
  }

  const unlocks = buildingUnlocks.get(building.id);
  if (unlocks) {
    for (const skill of unlocks) {
      if (skills.has(skill)) {
        return true;
      }
    }
  }

  return false;
}

export function hasUnlockedUnit(unit: UnitInfo, skills: ReadonlySet<Skill>) {
  if (skills.size === 0) {
    return false;
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
      return radius + (movement.get(skills.values().next().value) || 0);
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
      return rangeMap.get(skills.values().next().value);
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

export function getSkillAttackMovementTypeStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return type === 'regular'
    ? null
    : attackMovementTypePowerStatusEffects.get(skill) || null;
}

export function getSkillTileAttackStatusEffect(
  skill: Skill,
  type: SkillActivationType,
) {
  return (
    (type === 'regular' ? null : attackTilePowerStatusEffects.get(skill)) ||
    null
  );
}

export function getSkillUnitCosts(skill: Skill, type: SkillActivationType) {
  const skillUnitCosts = new Map<number, number>();
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
  if (
    skill === Skill.CounterAttackPower ||
    attackPowerStatusEffects.has(skill) ||
    defensePowerStatusEffects.has(skill)
  ) {
    return 'all';
  }

  const list = [];

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
      skills.values().next().value,
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

export function applyPower(skill: Skill, map: MapData) {
  const healTypes = healPower.get(skill);

  if (healTypes) {
    const player = map.getCurrentPlayer();
    return map.copy({
      units: map.units.map((unit) =>
        map.matchesPlayer(player, unit) &&
        matchesActiveType(healTypes, unit, null)
          ? unit.modifyHealth(HealAmount)
          : unit,
      ),
    });
  }

  return map;
}

export function hasCounterAttackSkill(skills: ReadonlySet<Skill>) {
  return skills.has(Skill.CounterAttackPower);
}
