import { Bar, BuildingInfo } from '@deities/athena/info/Building.tsx';
import { MovementType } from '@deities/athena/info/MovementType.tsx';
import {
  ActiveUnitTypes,
  getBlockedUnits,
  getHealUnitTypes,
  getSkillAttackMovementTypeStatusEffect,
  getSkillAttackUnitStatusEffect,
  getSkillDefenseMovementTypeStatusEffect,
  getSkillEffect,
  getSkillTileAttackStatusEffect,
  getSkillTileDefenseStatusEffect,
  getSkillUnitCosts,
  getSkillUnitMovement,
  getUnitRangeForSkill,
  Skill,
} from '@deities/athena/info/Skill.tsx';
import { Plain, TileType, TileTypes } from '@deities/athena/info/Tile.tsx';
import {
  Battleship,
  getUnitInfoOrThrow,
  Sniper,
  SpecialUnits,
  UnitInfo,
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
import { css, cx } from '@emotion/css';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import { Fragment, memo } from 'react';
import BuildingTile from '../Building.tsx';
import intlList, { Conjunctions, Delimiters } from '../i18n/intlList.tsx';
import getTranslatedTileTypeName from '../lib/getTranslatedTileTypeName.tsx';
import UnitTile from '../Unit.tsx';

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
  effects: ReadonlyMap<TileType, ReadonlyMap<MovementType, number>>;
  type: 'attack' | 'defense';
}) => {
  const effects = [...initialEffects].filter(
    ([tileType]) =>
      tileType !== TileTypes.ForestVariant2 &&
      tileType !== TileTypes.ForestVariant3 &&
      tileType !== TileTypes.ForestVariant4,
  );

  return effects.length
    ? intlList(
        effects.map(([tileType, movementTypes], index) => (
          <Fragment key={index}>
            <fbt desc="List item of tiletypes with status effects for specific movement types">
              <fbt:param name="movementTypeEffect">
                <MovementTypeStatusEffect effects={movementTypes} type={type} />
              </fbt:param>{' '}
              on{' '}
              <fbt:param name="tileType">
                <TileTypeName tileType={tileType} />
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
  costs: ReadonlyMap<number, number>;
}) => (
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
        <fbt desc="Additional skill description">
          <fbt:param name="pluralUnitName">
            <UnitName color={color} unit={Sniper} />
          </fbt:param>{' '}
          can attack without positioning.
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
  }
  return null;
};

const getExtraPowerDescription = (skill: Skill, color: BaseColor) => {
  switch (skill) {
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
    case Skill.UnitInfantryForestDefenseIncrease:
      return (
        <fbt desc="Additional skill description">
          Hidden fields in regular vision range are uncovered in fog.
        </fbt>
      );
  }

  return null;
};

export default memo(function SkillDescription({
  className,
  color,
  skill,
  type,
}: {
  className?: string;
  color: BaseColor;
  skill: Skill;
  type: 'regular' | 'power';
}) {
  const isRegular = type === 'regular';
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

  const unitCosts = getSkillUnitCosts(skill, type);
  const blockedUnits = type === 'regular' ? getBlockedUnits(skill) : null;
  const unitMovement = getSkillUnitMovement(skill, type);
  const unitRange = getUnitRangeForSkill(skill, type);
  const healTypes = type === 'power' ? getHealUnitTypes(skill) : null;
  const effects = [
    attack ? <AttackStatusEffect effect={attack} /> : null,
    unitAttack ? (
      <UnitStatusEffects color={color} effects={unitAttack} type="attack" />
    ) : null,
    movementTypeAttack ? (
      <MovementTypeStatusEffect effects={movementTypeAttack} type="attack" />
    ) : null,
    defense ? <DefenseStatusEffect effect={defense} /> : null,
    movementTypeDefense ? (
      <MovementTypeStatusEffect effects={movementTypeDefense} type="defense" />
    ) : null,
    tileAttack ? (
      <TileTypeStatusEffect effects={tileAttack} type="attack" />
    ) : null,
    tileDefense ? (
      <TileTypeStatusEffect effects={tileDefense} type="defense" />
    ) : null,
    healTypes ? <HealTypes color={color} types={healTypes} /> : null,
    cost ? <CostEffect effect={cost} /> : null,
  ].filter(isPresent);

  const list = [
    type === 'power' ? (
      <span className={typeStyle} style={{ color: getColor(color) }}>
        <fbt desc="Label for skill status effects when a power is activated">
          Power:
        </fbt>
      </span>
    ) : null,
    unitCosts?.size ? <UnitCosts color={color} costs={unitCosts} /> : null,
    blockedUnits?.size ? (
      <UnitBlocks blocked={blockedUnits} color={color} />
    ) : null,
    unitMovement.size ? <MovementTypeRadius movement={unitMovement} /> : null,
    unitRange.size ? <UnitRange color={color} range={unitRange} /> : null,
    isRegular
      ? getExtraDescription(skill, color)
      : getExtraPowerDescription(skill, color),
    effects.length ? (
      <>{intlList(effects, Conjunctions.AND, Delimiters.COMMA)}.</>
    ) : null,
  ]
    .filter(isPresent)
    .map((item, index) =>
      item ? <Fragment key={index}>{item} </Fragment> : null,
    );

  return list?.length ? <div className={className}>{list}</div> : null;
});

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
