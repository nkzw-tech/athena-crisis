import {
  Bar,
  Barracks,
  BuildingInfo,
  HQ,
  PowerStation,
  Shelter,
} from '@deities/athena/info/Building.tsx';
import { MovementType } from '@deities/athena/info/MovementType.tsx';
import {
  ActiveUnitTypes,
  ChargeSkillChargeMultiplier,
  ChargeSkillCharges,
  getBlockedUnits,
  getHealUnitTypes,
  getSkillAttackLeaderUnitStatusEffect,
  getSkillAttackMovementTypeStatusEffect,
  getSkillAttackUnitStatusEffect,
  getSkillConfig,
  getSkillDefenseMovementTypeStatusEffect,
  getSkillDefenseUnitStatusEffect,
  getSkillEffect,
  getSkillPowerDamage,
  getSkillTileAttackStatusEffect,
  getSkillTileDefenseStatusEffect,
  getSkillUnitCosts,
  getSkillUnitMovement,
  getUnitRangeForSkill,
  LowHealthZombieSkillConversion,
  MovementMap,
  PoisonSkillPowerDamageMultiplier,
  PowerStationSkillMultiplier,
  Skill,
  TileMovementMap,
  VampireSkillHeal,
} from '@deities/athena/info/Skill.tsx';
import { Plain, TileType, TileTypes } from '@deities/athena/info/Tile.tsx';
import {
  AcidBomber,
  Alien,
  Battleship,
  BazookaBear,
  Bear,
  Dragon,
  Flamethrower,
  getUnitInfoOrThrow,
  InfernoJetpack,
  Pioneer,
  Saboteur,
  Sniper,
  SpecialUnits,
  SuperTank,
  UnitInfo,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  CounterAttack,
  HealAmount,
  RaisedCounterAttack,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Vector, { isVector } from '@deities/athena/map/Vector.tsx';
import { ID } from '@deities/athena/MapData.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor, { BaseColor } from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import UICrystalIcon from '@deities/ui/icons/UICrystalIcon.tsx';
import { css, cx } from '@emotion/css';
import Charge from '@iconify-icons/pixelarticons/ac.js';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import WarningBox from '@iconify-icons/pixelarticons/warning-box.js';
import { Fragment, memo } from 'react';
import BuildingTile from '../Building.tsx';
import intlList, { Conjunctions, Delimiters } from '../i18n/intlList.tsx';
import getTranslatedTileTypeName from '../lib/getTranslatedTileTypeName.tsx';
import UnitTile from '../Unit.tsx';

const canBuildBar = (unitCosts: ReadonlyMap<ID, number>) =>
  [...unitCosts.keys()].some((unit) =>
    SpecialUnits.has(getUnitInfoOrThrow(unit)),
  );

const RawUnitName = ({ color, unit }: { color: BaseColor; unit: UnitInfo }) => (
  <Fragment>
    <span className={inlineStyle}>
      <UnitTile
        animationConfig={AnimationConfig}
        biome={Biome.Grassland}
        firstPlayerID={1}
        size={TileSize}
        tile={Plain}
        unit={unit.create(1)}
      />
    </span>
    <span
      className={tagStyle}
      style={{
        backgroundColor: getColor(color, 0.2),
        color: getColor(color),
      }}
    >
      {unit.name}
    </span>
  </Fragment>
);

const UnitName = ({ color, unit }: { color: BaseColor; unit: UnitInfo }) => (
  <fbt desc="Unit names in a list of units">
    <fbt:param name="pluralUnitName">
      <RawUnitName color={color} unit={unit} />
    </fbt:param>{' '}
    units
  </fbt>
);

const UnitNames = ({
  color,
  units,
}: {
  color: BaseColor;
  units: ReadonlyArray<UnitInfo>;
}) => (
  <fbt desc="List of units">
    <fbt:param name="units">
      {intlList(
        units.map((unit, index) => (
          <RawUnitName color={color} key={index} unit={unit} />
        )),
        Conjunctions.AND,
        Delimiters.COMMA,
      )}
    </fbt:param>{' '}
    units
  </fbt>
);

const formatEffect = (effect: number) =>
  `${effect > 0 ? '+' : '-'}${Math.floor(Math.abs(effect * 100))}`;

export const AttackStatusEffect = ({ effect }: { effect: number }) => (
  <fbt desc="Attack status effect description">
    <fbt:param name="attack">{formatEffect(effect)}</fbt:param>% attack
  </fbt>
);

export const UnitAttackLeaderStatusEffect = ({
  effect,
}: {
  effect: number;
}) => (
  <fbt desc="Leader unit attack status effect description">
    <fbt:param name="attack">{formatEffect(effect)}</fbt:param>% attack for
    leader units
  </fbt>
);

export const DefenseStatusEffect = ({ effect }: { effect: number }) => (
  <fbt desc="Defense status effect description">
    <fbt:param name="defense">{formatEffect(effect)}</fbt:param>% defense
  </fbt>
);

const CostEffect = ({ effect }: { effect: number }) => (
  <fbt desc="Unit cost effect description">
    <fbt:param name="cost">{formatEffect(effect)}</fbt:param>% unit cost
  </fbt>
);

const groupMovementTypes = (
  effects: ReadonlyMap<MovementType, number>,
): ReadonlyArray<[number, ReadonlyArray<MovementType>]> =>
  [...groupBy(effects, ([, effect]) => effect)].map(
    ([effect, movementTypes]) => [
      effect,
      movementTypes.map(([movementType]) => movementType),
    ],
  );

const groupUnitTypes = (
  effects: ReadonlyMap<ID, number>,
): ReadonlyArray<[number, ReadonlyArray<ID>]> =>
  [...groupBy(effects, ([, effect]) => effect)].map(([effect, unitIDs]) => [
    effect,
    unitIDs.map(([unitID]) => unitID),
  ]);

const UnitsStatusEffect = ({
  color,
  effect,
  type,
  units,
}: {
  color: BaseColor;
  effect: number;
  type: 'attack' | 'defense';
  units: ReadonlyArray<UnitInfo>;
}) => {
  return (
    <fbt desc="List of units that have status effects through a skill">
      <fbt:param name="effect">
        {type === 'attack' ? (
          <AttackStatusEffect effect={effect} />
        ) : (
          <DefenseStatusEffect effect={effect} />
        )}
      </fbt:param>{' '}
      for{' '}
      <fbt:param name="units">
        <UnitNames color={color} units={units} />
      </fbt:param>
    </fbt>
  );
};

const UnitStatusEffects = ({
  color,
  effects,
  type,
}: {
  color: BaseColor;
  effects: ReadonlyMap<number, number>;
  type: 'attack' | 'defense';
}) =>
  effects.size
    ? intlList(
        groupUnitTypes(effects).map(([effect, units], index) => (
          <UnitsStatusEffect
            color={color}
            effect={effect}
            key={index}
            type={type}
            units={units.map(getUnitInfoOrThrow)}
          />
        )),
        Conjunctions.AND,
        Delimiters.COMMA,
      )
    : null;

const UnitRangeEffect = ({
  color,
  range,
  unit,
}: {
  color: BaseColor;
  range: [number, number];
  unit: UnitInfo;
}) => {
  return (
    <fbt desc="List item of units that have status effects through a skill">
      <fbt:param name="unit">
        <UnitName color={color} unit={unit} />
      </fbt:param>{' '}
      to <fbt:param name="effect">{`${range[0]}-${range[1]}`}</fbt:param>
    </fbt>
  );
};

const UnitRange = ({
  color,
  range,
}: {
  color: BaseColor;
  range: ReadonlyMap<number, [number, number]>;
}) =>
  range.size ? (
    <fbt desc="Description of unit range changes">
      Changes the range of{' '}
      <fbt:param name="list">
        {intlList(
          [...range].map(([unit, range], index) => (
            <UnitRangeEffect
              color={color}
              key={index}
              range={range}
              unit={getUnitInfoOrThrow(unit)}
            />
          )),
          Conjunctions.AND,
          Delimiters.COMMA,
        )}
      </fbt:param>.
    </fbt>
  ) : null;

const UnitMovementTypeStatusEffect = ({
  effect,
  movementTypes,
  type,
}: {
  effect: number;
  movementTypes: ReadonlyArray<MovementType>;
  type: 'attack' | 'defense';
}) => {
  return (
    <fbt desc="List item of movement types that have status effects through a skill">
      <fbt:param name="effect">
        {type === 'attack' ? (
          <AttackStatusEffect effect={effect} />
        ) : (
          <DefenseStatusEffect effect={effect} />
        )}
      </fbt:param>{' '}
      for{' '}
      <fbt:param name="movementTypes">
        <MovementTypeNames movementTypes={movementTypes} />
      </fbt:param>{' '}
      units
    </fbt>
  );
};

const MovementTypeStatusEffect = ({
  effects,
  type,
}: {
  effects: ReadonlyMap<MovementType, number>;
  type: 'attack' | 'defense';
}) =>
  effects.size
    ? intlList(
        groupMovementTypes(effects).map(([effect, movementTypes], index) => (
          <UnitMovementTypeStatusEffect
            effect={effect}
            key={index}
            movementTypes={movementTypes}
            type={type}
          />
        )),
        Conjunctions.AND,
        Delimiters.COMMA,
      )
    : null;

const TileTypeStatusEffect = ({
  effects: initialEffects,
  type,
}: {
  effects: TileMovementMap;
  type: 'attack' | 'defense';
}) => {
  const effects = [...initialEffects].filter(
    ([tileType]) =>
      tileType !== TileTypes.ForestVariant2 &&
      tileType !== TileTypes.ForestVariant3 &&
      tileType !== TileTypes.ForestVariant4,
  );

  const inverseEffects = new Map<MovementMap, ReadonlyArray<TileType>>();
  for (const [tileType, effect] of effects) {
    inverseEffects.set(effect, [
      ...(inverseEffects.get(effect) || []),
      tileType,
    ]);
  }

  return inverseEffects.size
    ? intlList(
        [...inverseEffects].map(([movementTypes, tileTypes], index) => (
          <Fragment key={index}>
            <fbt desc="List item of tiletypes with status effects for specific movement types">
              <fbt:param name="movementTypeEffect">
                <MovementTypeStatusEffect effects={movementTypes} type={type} />
              </fbt:param>{' '}
              on{' '}
              <fbt:param name="tileType">
                {intlList(
                  tileTypes.map((tileType, index) => (
                    <TileTypeName key={index} tileType={tileType} />
                  )),
                  Conjunctions.AND,
                  Delimiters.COMMA,
                )}
              </fbt:param>{' '}
              fields
            </fbt>
          </Fragment>
        )),
        Conjunctions.AND,
        Delimiters.COMMA,
      )
    : null;
};

const BuildingName = ({
  building,
  color,
}: {
  building: BuildingInfo;
  color: BaseColor;
}) => (
  <>
    <span className={cx(inlineStyle, buildingStyle)}>
      <BuildingTile
        animationConfig={AnimationConfig}
        biome={Biome.Grassland}
        building={building.create(1)}
        position={new SpriteVector(1, 1.25)}
        size={TileSize}
      />
    </span>
    <span
      className={tagStyle}
      style={{
        backgroundColor: getColor(color, 0.2),
        color: getColor(color),
      }}
    >
      {building.name}
    </span>
  </>
);

const UnitCost = ({
  color,
  cost,
  unit,
}: {
  color: BaseColor;
  cost: number;
  unit: UnitInfo;
}) =>
  SpecialUnits.has(unit) ? (
    <fbt desc="List item of units and their cost enabled through a skill">
      <fbt:param name="name">
        <UnitName color={color} unit={unit} />
      </fbt:param>
      at the{' '}
      <fbt:param name="buildingName">
        <BuildingName building={Bar} color={color} />
      </fbt:param>{' '}
      for
      <fbt:param name="cost">
        <Fragment>
          <Icon className={iconStyle} icon={Coin} /> {cost}
        </Fragment>
      </fbt:param>
    </fbt>
  ) : (
    <fbt desc="List item of units and their cost enabled through a skill">
      <fbt:param name="name">
        <UnitName color={color} unit={unit} />
      </fbt:param>
      for
      <fbt:param name="cost">
        <Fragment>
          <Icon className={iconStyle} icon={Coin} /> {cost}
        </Fragment>
      </fbt:param>
    </fbt>
  );

const UnitCosts = ({
  color,
  costs,
}: {
  color: BaseColor;
  costs: ReadonlyMap<ID, number>;
}) => (
  <Fragment>
    <fbt desc="List of one or more units that can be built using this skill">
      Build
      <fbt:param name="list">
        {intlList(
          [...costs].map(([unit, cost], index) => (
            <UnitCost
              color={color}
              cost={cost}
              key={index}
              unit={getUnitInfoOrThrow(unit)}
            />
          )),
          Conjunctions.AND,
          Delimiters.COMMA,
        )}
      </fbt:param>.
    </fbt>
    {canBuildBar(costs) ? (
      <Fragment>
        {' '}
        <fbt desc="List item explaining that the Bar can be built.">
          Enables constructing
          <fbt:param name="buildingName">
            <BuildingName building={Bar} color={color} />
          </fbt:param>{' '}
          buildings.
        </fbt>
      </Fragment>
    ) : null}
  </Fragment>
);

const UnitBlocks = ({
  blocked,
  color,
}: {
  blocked: ReadonlySet<number>;
  color: BaseColor;
}) => (
  <fbt desc="List of one or more units that can be built using this skill">
    Cannot build
    <fbt:param name="list">
      {intlList(
        [...blocked].map((unit, index) => (
          <UnitName color={color} key={index} unit={getUnitInfoOrThrow(unit)} />
        )),
        Conjunctions.AND,
        Delimiters.COMMA,
      )}
    </fbt:param>.
  </fbt>
);

const MovementTypeName = ({ movementType }: { movementType: MovementType }) => (
  <span
    className={tagStyle}
    style={{
      backgroundColor: getColor('team', 0.2),
      color: getColor('team'),
    }}
  >
    {movementType.name}
  </span>
);

const MovementTypeNames = ({
  movementTypes,
}: {
  movementTypes: ReadonlyArray<MovementType>;
}) =>
  intlList(
    movementTypes.map((movementType, index) => (
      <MovementTypeName key={index} movementType={movementType} />
    )),
    Conjunctions.AND,
    Delimiters.COMMA,
  );

const TileTypeName = ({ tileType }: { tileType: TileType }) => (
  <span
    className={tagStyle}
    style={{
      backgroundColor: getColor('team', 0.2),
      color: getColor('team'),
    }}
  >
    {getTranslatedTileTypeName(tileType)}
  </span>
);

const UnitMovement = ({
  movementTypes,
  radius,
}: {
  movementTypes: ReadonlyArray<MovementType>;
  radius: number;
}) => (
  <fbt desc="List item of movement types that increase their radius through a skill">
    <fbt:param name="radius">{`${radius > 0 ? '+' : '-'}${radius}`}</fbt:param>{' '}
    movement for{' '}
    <fbt:param name="movementTypes">
      <MovementTypeNames movementTypes={movementTypes} />
    </fbt:param>{' '}
    units
  </fbt>
);

const MovementTypeRadius = ({
  movement,
}: {
  movement: ReadonlyMap<MovementType, number>;
}) => (
  <fbt desc="List of one or more movement types that can incresae or decrease their radius using this skill">
    <fbt:param name="list">
      {intlList(
        groupMovementTypes(movement).map(([radius, movementTypes], index) => (
          <UnitMovement
            key={index}
            movementTypes={movementTypes}
            radius={radius}
          />
        )),
        Conjunctions.AND,
        Delimiters.COMMA,
      )}
    </fbt:param>.
  </fbt>
);

const ActiveUnitType = ({
  color,
  type,
}: {
  color: BaseColor;
  type: MovementType | ID | Vector;
}) => {
  return typeof type === 'number' ? (
    <UnitName color={color} unit={getUnitInfoOrThrow(type)} />
  ) : isVector(type) ? (
    <fbt desc="Position">
      Position <fbt:param name="position">{`(${type.x},${type.y})`}</fbt:param>
    </fbt>
  ) : (
    <MovementTypeName movementType={type} />
  );
};

const HealTypes = ({
  color,
  types,
}: {
  color: BaseColor;
  types: ActiveUnitTypes;
}) => (
  <fbt desc="Additional skill description">
    <fbt:param name="unitTypes">
      {types === 'all' ? (
        <fbt desc="All units">all units</fbt>
      ) : (
        intlList(
          [...types].map((type, index) => (
            <ActiveUnitType color={color} key={index} type={type} />
          )),
          Conjunctions.AND,
          Delimiters.COMMA,
        )
      )}
    </fbt:param>{' '}
    units are healed by <fbt:param name="effect">{`${HealAmount}%`}</fbt:param>
  </fbt>
);

const getExtraDescription = (skill: Skill, color: BaseColor) => {
  switch (skill) {
    case Skill.UnitAbilitySniperImmediateAction:
      return (
        <fbt desc="Additional skill description. The leader unit in this case is female.">
          The leader of the{' '}
          <fbt:param name="pluralUnitName">
            <UnitName color={color} unit={Sniper} />
          </fbt:param>{' '}
          can attack without positioning and they receive the ability to capture
          buildings.
        </fbt>
      );
    case Skill.NoUnitRestrictions:
      return (
        <fbt desc="Additional skill description">
          Build any unit regardless of map restrictions.
        </fbt>
      );
    case Skill.CounterAttackPower:
      return (
        <fbt desc="Additional skill description">
          Counter attacks are{' '}
          <fbt:param name="raisedCounterAttack">
            {RaisedCounterAttack * 100}
          </fbt:param>% as effective as initial attacks instead of
          <fbt:param name="counterAttack">{CounterAttack * 100}</fbt:param>%.
        </fbt>
      );
    case Skill.UnlockZombie:
      return (
        <fbt desc="Additional skill description">
          Units with less than{' '}
          <fbt:param name="hp">{LowHealthZombieSkillConversion}</fbt:param>{' '}
          health points convert opponents after attacking.
        </fbt>
      );
    case Skill.UnlockPowerStation:
      return (
        <fbt desc="Additional skill description">
          Each{' '}
          <fbt:param name="buildingName">
            <BuildingName building={PowerStation} color={color} />
          </fbt:param>{' '}
          building provides an extra{' '}
          <fbt:param name="value">
            {PowerStationSkillMultiplier * 100}
          </fbt:param>% funds increase.
        </fbt>
      );
    case Skill.VampireHeal:
      return (
        <fbt desc="Additional skill description">
          Each unit heals
          <fbt:param name="value">{VampireSkillHeal}</fbt:param> health points
          at the beginning of their turn.
        </fbt>
      );
    case Skill.Charge:
      return (
        <fbt desc="Additional skill description">
          Increases charge accumulation speed by
          <fbt:param name="value">
            {ChargeSkillChargeMultiplier * 100}
          </fbt:param>%.
        </fbt>
      );
    case Skill.DragonSaboteur:
      return (
        <fbt desc="Additional skill description.">
          <fbt:param name="pluralUnitName">
            <UnitName color={color} unit={Dragon} />
          </fbt:param>{' '}
          receive the ability to capture buildings.
        </fbt>
      );
  }
  return null;
};

const getExtraPowerDescription = (skill: Skill, color: BaseColor) => {
  switch (skill) {
    case Skill.BuyUnitCannon:
      return (
        <fbt desc="Additional skill description">
          All unfolded units recover and can act again.
        </fbt>
      );
    case Skill.UnitBattleShipMoveAndAct:
      return (
        <fbt desc="Additional skill description">
          <fbt:param name="pluralUnitName">
            <UnitName color={color} unit={Battleship} />
          </fbt:param>{' '}
          can move and attack in the same turn.
        </fbt>
      );
    case Skill.CounterAttackPower:
      return (
        <fbt desc="Additional skill description">
          Counter attacks are as effective as initial attacks.
        </fbt>
      );
    case Skill.UnitInfantryForestAttackAndDefenseIncrease:
      return (
        <fbt desc="Additional skill description">
          Hidden fields in regular vision range are uncovered in fog.
        </fbt>
      );
    case Skill.RecoverAirUnits:
      return (
        <fbt desc="Additional skill description">
          All air units recover and can act again.
        </fbt>
      );
    case Skill.BuyUnitBazookaBear:
      return (
        <fbt desc="Additional skill description">
          Spawns{' '}
          <fbt:param name="unitName">
            <UnitName color={color} unit={BazookaBear} />
          </fbt:param>{' '}
          at each
          <fbt:param name="buildingName">
            <BuildingName building={Bar} color={color} />
          </fbt:param>.
        </fbt>
      );
    case Skill.BuyUnitBear:
      return (
        <fbt desc="Additional skill description">
          Spawns{' '}
          <fbt:param name="unitName">
            <UnitName color={color} unit={Bear} />
          </fbt:param>{' '}
          at each
          <fbt:param name="buildingName">
            <BuildingName building={Shelter} color={color} />
          </fbt:param>{' '}
          and{' '}
          <fbt:param name="buildingNameB">
            <BuildingName building={HQ} color={color} />
          </fbt:param>.
        </fbt>
      );
    case Skill.BuyUnitAcidBomber:
      return (
        <fbt desc="Additional skill description">
          Increases damage to poisoned units by{' '}
          <fbt:param name="value">
            {PoisonSkillPowerDamageMultiplier * 100}
          </fbt:param>%.
        </fbt>
      );
    case Skill.BuyUnitAlien:
      return (
        <fbt desc="Additional skill description">
          Spawns{' '}
          <fbt:param name="unitName">
            <UnitName color={color} unit={Alien} />
          </fbt:param>{' '}
          at each
          <fbt:param name="buildingNameA">
            <BuildingName building={Barracks} color={color} />
          </fbt:param>{' '}
          and{' '}
          <fbt:param name="buildingNameB">
            <BuildingName building={HQ} color={color} />
          </fbt:param>.
        </fbt>
      );
    case Skill.BuyUnitOctopus:
      return (
        <fbt desc="Additional skill description">
          Reduces the health of all opposing units by{' '}
          <fbt:param name="amount">{getSkillPowerDamage(skill)}</fbt:param>{' '}
          health points.
        </fbt>
      );
    case Skill.Sabotage:
      return (
        <fbt desc="Additional skill description">
          <fbt:param name="unitName">
            <UnitName color={color} unit={Saboteur} />
          </fbt:param>{' '}
          convert opponents after attacking.
        </fbt>
      );
    case Skill.SpawnUnitInfernoJetpack:
      return (
        <fbt desc="Additional skill description">
          Converts all
          <fbt:param name="fromUnitName">
            <UnitName color={color} unit={Flamethrower} />
          </fbt:param>{' '}
          into{' '}
          <fbt:param name="toUnitName">
            <UnitName color={color} unit={InfernoJetpack} />
          </fbt:param>. Spawns 3{' '}
          <fbt:param name="unitNameB">
            <UnitName color={color} unit={InfernoJetpack} />
          </fbt:param>.
        </fbt>
      );
    case Skill.UnlockZombie:
      return (
        <fbt desc="Additional skill description">
          Converts all
          <fbt:param name="fromUnitName">
            <UnitName color={color} unit={Pioneer} />
          </fbt:param>{' '}
          into{' '}
          <fbt:param name="toUnitName">
            <UnitName color={color} unit={Zombie} />
          </fbt:param>.
        </fbt>
      );
    case Skill.UnlockPowerStation:
      return (
        <fbt desc="Additional skill description">
          Build{' '}
          <fbt:param name="buildingName">
            <BuildingName building={PowerStation} color={color} />
          </fbt:param>{' '}
          buildings at construction sites.
        </fbt>
      );
    case Skill.BuyUnitDragon:
      return (
        <fbt desc="Additional skill description">
          <fbt:param name="fromUnitName">
            <UnitName color={color} unit={Dragon} />
          </fbt:param>{' '}
          engulf adjacent opposing units in flames and cause{' '}
          <fbt:param name="amount">{getSkillPowerDamage(skill)}</fbt:param>{' '}
          health points of damage.
        </fbt>
      );
    case Skill.VampireHeal:
      return (
        <fbt desc="Additional skill description">
          Reduces the health of all your units by{' '}
          <fbt:param name="value">{getSkillPowerDamage(skill)}</fbt:param>{' '}
          health points.
        </fbt>
      );
    case Skill.Shield:
      return (
        <fbt desc="Additional skill description">
          Grants each unit a shield for one turn that absorbs nearly all damage
          from the next attack.
        </fbt>
      );
    case Skill.Charge:
      return (
        <fbt desc="Additional skill description">
          Increases the charge meter by
          <fbt:param name="value">{ChargeSkillCharges}</fbt:param> charges.
          Attacks are increased by{' '}
          <fbt:param name="percentage">
            {ChargeSkillChargeMultiplier * 100}
          </fbt:param>% for each available charge.
        </fbt>
      );
    case Skill.DragonSaboteur:
      return (
        <fbt desc="Additional skill description.">
          Spawns one{' '}
          <fbt:param name="unitName">
            <RawUnitName color={color} unit={Saboteur} />
          </fbt:param>{' '}
          unit and converts the{' '}
          <fbt:param name="saboteurName">{Saboteur.name}</fbt:param> leader unit
          into a
          <fbt:param name="convertedUnitName">
            <RawUnitName color={color} unit={Dragon} />
          </fbt:param>{' '}
          unit.
        </fbt>
      );
  }

  return null;
};

const hasSameEffect = <K, V>(modifierMap: ReadonlyMap<K, V>) => {
  let effect = null;
  for (const [, currentEffect] of modifierMap) {
    if (effect === null) {
      effect = currentEffect;
    } else if (effect !== currentEffect) {
      return false;
    }
  }
  return true;
};

const matchesUnitModifierMap = <K, V>(
  mapA: ReadonlyMap<K, V>,
  mapB: ReadonlyMap<K, V> | null,
) => {
  if (!hasSameEffect(mapA) || !mapB || !hasSameEffect(mapB)) {
    return false;
  }

  if (mapA.size !== mapB.size) {
    return false;
  }

  for (const [key] of mapA) {
    if (!mapB.has(key)) {
      return false;
    }
  }

  return true;
};

export default memo(function SkillDescription({
  color,
  skill,
  type,
}: {
  color: BaseColor;
  skill: Skill;
  type: 'regular' | 'power';
}) {
  const isRegular = type === 'regular';
  const isPower = !isRegular;
  const { activateOnInvasion, campaignOnly, charges, requiresCrystal } =
    getSkillConfig(skill);
  if ((charges == null || charges === 0) && isPower) {
    return null;
  }

  const attack = getSkillEffect(isRegular ? 'attack' : 'attack-power', skill);
  const cost = getSkillEffect(
    isRegular ? 'unit-cost' : 'unit-cost-power',
    skill,
  );
  const defense = getSkillEffect(
    isRegular ? 'defense' : 'defense-power',
    skill,
  );
  const unitAttack = getSkillAttackUnitStatusEffect(skill, type);
  const unitDefense = getSkillDefenseUnitStatusEffect(skill, type);
  const movementTypeAttack = getSkillAttackMovementTypeStatusEffect(
    skill,
    type,
  );
  const movementTypeDefense = getSkillDefenseMovementTypeStatusEffect(
    skill,
    type,
  );
  const tileAttack = getSkillTileAttackStatusEffect(skill, type);
  const tileDefense = getSkillTileDefenseStatusEffect(skill, type);
  const unitAttackLeader = getSkillAttackLeaderUnitStatusEffect(skill, type);

  const unitCosts = getSkillUnitCosts(skill, type);
  const blockedUnits = type === 'regular' ? getBlockedUnits(skill) : null;
  const unitMovement = getSkillUnitMovement(skill, type);
  const unitRange = getUnitRangeForSkill(skill, type);
  const healTypes = isPower ? getHealUnitTypes(skill) : null;
  const effects = [
    attack ? <AttackStatusEffect effect={attack} /> : null,
    unitAttackLeader ? (
      <UnitAttackLeaderStatusEffect effect={unitAttackLeader} />
    ) : null,
    unitAttack?.size ? (
      matchesUnitModifierMap(unitAttack, unitDefense) ? (
        <AttackStatusEffect effect={unitAttack.values().next().value!} />
      ) : (
        <UnitStatusEffects color={color} effects={unitAttack} type="attack" />
      )
    ) : null,
    unitDefense?.size ? (
      <UnitStatusEffects color={color} effects={unitDefense} type="defense" />
    ) : null,
    movementTypeAttack ? (
      <MovementTypeStatusEffect effects={movementTypeAttack} type="attack" />
    ) : null,
    defense ? <DefenseStatusEffect effect={defense} /> : null,
    movementTypeDefense ? (
      <MovementTypeStatusEffect effects={movementTypeDefense} type="defense" />
    ) : null,
    tileAttack?.size ? (
      matchesUnitModifierMap(tileAttack, tileDefense) ? (
        <AttackStatusEffect
          effect={tileAttack.values().next().value!.values().next().value!}
        />
      ) : (
        <TileTypeStatusEffect effects={tileAttack} type="attack" />
      )
    ) : null,
    tileDefense?.size ? (
      <TileTypeStatusEffect effects={tileDefense} type="defense" />
    ) : null,
    healTypes ? <HealTypes color={color} types={healTypes} /> : null,
    cost ? <CostEffect effect={cost} /> : null,
  ].filter(isPresent);

  const list = [
    !isPower && campaignOnly ? (
      <div
        className="paragraph"
        style={{
          color: getColor('red'),
        }}
      >
        <Icon className={chargeIconStyle} icon={WarningBox} />
        <fbt desc="Skill is only for campaigns">
          This skill can only be used in campaigns.
        </fbt>
      </div>
    ) : null,
    charges && isPower ? (
      <span className={typeStyle} style={{ color: getColor(color) }}>
        <fbt desc="Label for skill status effects when a power is activated">
          Power:
        </fbt>
      </span>
    ) : null,
    isRegular
      ? getExtraDescription(skill, color)
      : getExtraPowerDescription(skill, color),
    unitCosts?.size ? <UnitCosts color={color} costs={unitCosts} /> : null,
    blockedUnits?.size ? (
      <UnitBlocks blocked={blockedUnits} color={color} />
    ) : null,
    unitMovement.size ? <MovementTypeRadius movement={unitMovement} /> : null,
    unitRange.size ? <UnitRange color={color} range={unitRange} /> : null,
    effects.length ? (
      <>{intlList(effects, Conjunctions.AND, Delimiters.COMMA)}.</>
    ) : null,
    isPower && activateOnInvasion ? (
      <div className="paragraph">
        <span className={typeStyle} style={{ color: getColor(color) }}>
          <fbt desc="Label for skill status effects when a power is activated">
            Crystal:
          </fbt>
        </span>{' '}
        <fbt desc="Description for skill behavior">
          This power activates when you consume a crystal.
        </fbt>
      </div>
    ) : null,
    isPower && requiresCrystal ? (
      <div
        className="paragraph"
        style={{
          color: getColor('red'),
        }}
      >
        <Icon className={chargeIconStyle} icon={UICrystalIcon} />
        <fbt desc="Power charge cost">Requires an active crystal.</fbt>
      </div>
    ) : null,
    isPower && charges ? (
      <div className="paragraph">
        <Icon className={chargeIconStyle} icon={Charge} />
        <fbt desc="Power charge cost">
          Cost: <fbt:param name="charges">{charges}</fbt:param>{' '}
          <fbt:plural count={charges} many="charges" name="number of charges">
            charge
          </fbt:plural>
        </fbt>
      </div>
    ) : null,
  ]
    .filter(isPresent)
    .map((item, index) =>
      item ? <Fragment key={index}>{item} </Fragment> : null,
    );

  return list?.length ? <div className="paragraph">{list}</div> : null;
});

const mapEditorUnitUnlocks = new Map<Skill, UnitInfo>([
  [Skill.UnlockZombie, Zombie],
  [Skill.BuyUnitSuperTank, SuperTank],
  [Skill.BuyUnitAcidBomber, AcidBomber],
  [Skill.BuyUnitAlien, Alien],
]);

export const SkillUnlockDescription = ({
  color,
  skill,
}: {
  color: BaseColor;
  skill: Skill;
}) => {
  let unlockContent = null;
  const unitInfo = mapEditorUnitUnlocks.get(skill);
  if (unitInfo) {
    unlockContent = (
      <fbt desc="Description for unlocks">
        Unlocks{' '}
        <fbt:param name="unit">
          <UnitName color={color} unit={unitInfo} />
        </fbt:param>{' '}
        in the Map Editor.
      </fbt>
    );
  } else if (skill === Skill.UnlockPowerStation) {
    unlockContent = (
      <fbt desc="Description for unlocks">
        Unlocks the{' '}
        <fbt:param name="buildingName">
          <BuildingName building={PowerStation} color={color} />
        </fbt:param>{' '}
        building in the Map Editor.
      </fbt>
    );
  } else {
    const costs = getSkillUnitCosts(skill, 'regular');
    const specialUnits = new Set();
    for (const unit of costs.keys()) {
      if (SpecialUnits.has(getUnitInfoOrThrow(unit))) {
        specialUnits.add(unit);
      }
    }

    if (specialUnits.size) {
      unlockContent = (
        <fbt desc="Description for unlocks">
          Unlocks{' '}
          <fbt:param name="list">
            {intlList(
              [...costs].map(([unit], index) => (
                <UnitName
                  color={color}
                  key={index}
                  unit={getUnitInfoOrThrow(unit)}
                />
              )),
              Conjunctions.AND,
              Delimiters.COMMA,
            )}
          </fbt:param>{' '}
          and the{' '}
          <fbt:param name="buildingName">
            <BuildingName building={Bar} color={color} />
          </fbt:param>{' '}
          building in the Map Editor.
        </fbt>
      );
    }
  }

  return unlockContent ? (
    <div className="paragraph">
      <span className={typeStyle} style={{ color: getColor(color) }}>
        <fbt desc="Label for what a power unlocks">Unlock:</fbt>
      </span>{' '}
      {unlockContent}
    </div>
  ) : null;
};

const inlineStyle = css`
  display: inline-block;
  image-rendering: pixelated;
  padding-right: 8px;
  vertical-align: top;
`;

const buildingStyle = css`
  height: ${TileSize}px;
`;

const tagStyle = css`
  ${clipBorder(2)}

  background-color: ${applyVar('background-color-active')};
  color: ${applyVar('text-color')};
  display: inline-block;
  padding: 0 4px 1px;
  margin: 1px 0;
`;

const typeStyle = css`
  text-transform: uppercase;
`;

const iconStyle = css`
  vertical-align: text-bottom;
`;

const chargeIconStyle = css`
  margin: -4px 4px 0 0;
`;
