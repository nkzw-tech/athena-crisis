import { Route } from '@deities/apollo/Routes.tsx';
import { House, VerticalBarrier } from '@deities/athena/info/Building.tsx';
import { MovementType } from '@deities/athena/info/MovementType.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { getAllTiles, getTileInfo, Plain } from '@deities/athena/info/Tile.tsx';
import {
  Abilities,
  Ability,
  AttackType,
  getAllUnits,
  mapUnitsWithContentRestriction,
  UnitInfo,
  Weapon as WeaponT,
} from '@deities/athena/info/Unit.tsx';
import calculateLikelyDamage from '@deities/athena/lib/calculateLikelyDamage.tsx';
import getAttackStatusEffect from '@deities/athena/lib/getAttackStatusEffect.tsx';
import getAttributeRange, {
  AttributeRangeWithZero,
  getAttributeRangeValue,
} from '@deities/athena/lib/getAttributeRange.tsx';
import getBiomeBuildingRestrictions from '@deities/athena/lib/getBiomeBuildingRestrictions.tsx';
import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import getBiomeUnitRestrictions from '@deities/athena/lib/getBiomeUnitRestrictions.tsx';
import getDefenseStatusEffect from '@deities/athena/lib/getDefenseStatusEffect.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  MoraleStatusEffect,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import Entity, {
  EntityType,
  getEntityGroup,
} from '@deities/athena/map/Entity.tsx';
import Player, {
  numberToPlayerID,
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import minBy from '@deities/hephaestus/minBy.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { App } from '@deities/ui/App.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import useLocation from '@deities/ui/hooks/useLocation.tsx';
import Icon, { SVGIcon } from '@deities/ui/Icon.tsx';
import Ammo from '@deities/ui/icons/Ammo.tsx';
import DropUnit from '@deities/ui/icons/DropUnit.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import Label from '@deities/ui/icons/Label.tsx';
import Poison from '@deities/ui/icons/Poison.tsx';
import Rescue from '@deities/ui/icons/Rescue.tsx';
import Sabotage from '@deities/ui/icons/Sabotage.tsx';
import Supply from '@deities/ui/icons/Supply.tsx';
import Track from '@deities/ui/icons/Track.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import Buildings from '@iconify-icons/pixelarticons/buildings.js';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import Flag from '@iconify-icons/pixelarticons/flag.js';
import Unfold from '@iconify-icons/pixelarticons/flatten.js';
import Repeat from '@iconify-icons/pixelarticons/repeat.js';
import Reply from '@iconify-icons/pixelarticons/reply.js';
import Shield from '@iconify-icons/pixelarticons/shield.js';
import Visible from '@iconify-icons/pixelarticons/visible.js';
import Volume from '@iconify-icons/pixelarticons/volume-3.js';
import WarningBox from '@iconify-icons/pixelarticons/warning-box.js';
import { fbt } from 'fbtee';
import { memo, ReactNode, useMemo } from 'react';
import getHealthColor from '../behavior/attack/getHealthColor.tsx';
import useUnitState from '../hooks/useUnitState.tsx';
import getAnyBuildingTileField from '../lib/getAnyBuildingTileField.tsx';
import getAnyUnitTile from '../lib/getAnyUnitTile.tsx';
import getTranslatedEntityName, {
  getTranslatedEntityGroupName,
} from '../lib/getTranslatedEntityName.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import Medal from '../Medal.tsx';
import Tick from '../Tick.tsx';
import { PlayerDetails } from '../Types.tsx';
import MiniPlayerIcon from '../ui/MiniPlayerIcon.tsx';
import UILabel from '../ui/UILabel.tsx';
import UnitTile from '../Unit.tsx';
import { AttributeGridBox } from './AttributeGrid.tsx';
import CardTitle, { CardInfoHeading } from './CardTitle.tsx';
import InlineTileList from './InlineTileList.tsx';
import tileFieldHasDecorator from './lib/tileFieldHasDecorator.tsx';
import MovementBox from './MovementBox.tsx';
import Range from './Range.tsx';
import TileBox from './TileBox.tsx';
import TilePreview from './TilePreview.tsx';

const defaultVector = vec(1, 1);
const units = getAllUnits();
const extractCost = (info: UnitInfo) => info.getCostFor(null);
const extractFuel = ({ configuration: { fuel } }: UnitInfo) => fuel;
const costRange = getAttributeRange(
  units.filter((info) => info.getCostFor(null) < Number.POSITIVE_INFINITY),
  extractCost,
  minBy(units, extractCost)?.getCostFor(null) || 0,
);
const movementRange = getAttributeRange(
  units,
  (info) => info.getRadiusFor(null),
  1,
);
const visionRange = getAttributeRange(
  units,
  ({ configuration: { vision } }) => vision,
  1,
);
const defenseRange = getAttributeRange(units, ({ defense }) => defense, 0.01);
const supplyRange = getAttributeRange(
  units,
  extractFuel,
  minBy(units, extractFuel)?.configuration.fuel || 0,
);

export default memo(function UnitCard({
  gameId,
  map,
  playerDetails,
  unit,
  vector,
  viewer,
}: {
  gameId?: string;
  map: MapData;
  playerDetails: PlayerDetails;
  unit: Unit;
  vector: Vector;
  viewer?: PlayerID | null;
}) {
  const { pathname: backURL } = useLocation();
  const damageChartRoute: Route = gameId?.length
    ? `/damage-chart/${gameId}?back=${backURL}`
    : `/damage-chart?back=${backURL}`;

  const { biome } = map.config;
  const { info, player } = unit;
  const {
    configuration: { fuel, vision },
  } = info;

  const [entity, previewMap, props] = useUnitState(unit, map.config.biome);
  const currentPlayer = map.getPlayer(player);
  const cost = info.getCostFor(currentPlayer);
  const radius = info.getRadiusFor(currentPlayer);
  const range = info.getRangeFor(currentPlayer);
  const defense = Math.floor(
    info.defense * getDefenseStatusEffect(map, unit, map.getTileInfo(vector)),
  );
  const color = getColor(player);
  const isLeader = unit.isLeader();
  const name = unit.getName(viewer) || fbt('Unknown', 'Unknown unit name');
  const rescuer = unit.getRescuer();

  return (
    <>
      <Stack gap nowrap start>
        <TilePreview map={previewMap}>
          <UnitTile
            animationConfig={AnimationConfig}
            animationKey={defaultVector}
            biome={biome}
            customSprite={playerDetails
              .get(unit.player)
              ?.equippedUnitCustomizations.get(unit.id)}
            firstPlayerID={map.getFirstPlayerID()}
            getLayer={() => 100}
            highlightStyle={undefined}
            position={defaultVector}
            requestFrame={requestAnimationFrame}
            scheduleTimer={(fn, delay) =>
              Promise.resolve(setTimeout(fn, delay) as unknown as number)
            }
            size={TileSize}
            tile={previewMap.getTileInfo(defaultVector)}
            unit={entity}
            {...props}
          />
        </TilePreview>
        <Stack gap start vertical>
          <CardTitle player={player}>{info.name}</CardTitle>
          {getTranslatedEntityName(info.type)},{' '}
          {getTranslatedEntityGroupName(getEntityGroup(entity))}
          {player != 0 && (
            <div>
              <fbt desc="Unit character name">
                Name:{' '}
                <fbt:param name="name">
                  <Stack
                    center
                    gap
                    inline
                    start
                    style={isLeader ? { color } : undefined}
                  >
                    {name}
                    {isLeader && <Medal player={unit.player} />}
                  </Stack>
                </fbt:param>
              </fbt>
            </div>
          )}
        </Stack>
      </Stack>
      <Stack gap={16} vertical>
        <AttributeGridBox>
          <Stack nowrap start>
            <Icon icon={Heart} />
            <fbt desc="Label for health">Health</fbt>
          </Stack>
          <div
            style={{
              color: getHealthColor(unit.health),
            }}
          >
            {unit.health}%
          </div>
          <div />
          <Stack nowrap start>
            <Icon icon={Shield} />
            <fbt desc="Label for defense">Defense</fbt>
          </Stack>
          <div>{defense}</div>
          <Range end value={getAttributeRangeValue(defenseRange, defense)} />
          <Stack nowrap start>
            <Icon horizontalFlip icon={Reply} />
            <fbt desc="Label for movement radius">Movement</fbt>
          </Stack>
          <div>{radius}</div>
          <Range end value={getAttributeRangeValue(movementRange, radius)} />
          <Stack nowrap start>
            <Icon icon={Supply} />
            <fbt desc="Label for supplies">Supplies</fbt>
          </Stack>
          <div className={nowrapStyle}>
            {unit.fuel} / {fuel}
          </div>
          <Range end value={getAttributeRangeValue(supplyRange, fuel)} />
          <Stack nowrap start>
            <Icon icon={Visible} />
            <fbt desc="Label for vision radius">Vision</fbt>
          </Stack>
          <div>{vision}</div>
          <Range end value={getAttributeRangeValue(visionRange, vision)} />
          {range && (
            <>
              <Stack nowrap start>
                <Icon icon={DropUnit} />
                <fbt desc="Label for vision radius">Attack Range</fbt>{' '}
              </Stack>
              <div>
                {range[0]}–{range[1]}
              </div>
              <div />
            </>
          )}
          {cost < Number.POSITIVE_INFINITY && (
            <>
              <Stack nowrap start>
                <Icon icon={Coin} />
                <fbt desc="Label for build cost">Build Cost</fbt>
              </Stack>
              <div>{cost}</div>
              <Range
                end
                invert
                value={getAttributeRangeValue(costRange, cost)}
              />
            </>
          )}
          {unit.player === 0 && unit.isBeingRescued() && rescuer != null && (
            <>
              <Stack nowrap start>
                <Icon icon={Rescue} />
                <fbt desc="Label for  in progress rescue (text has to be short)">
                  Rescue…
                </fbt>
              </Stack>
              <Stack alignCenter className={wideColumnStyle} end gap>
                <MiniPlayerIcon id={rescuer} />
                {getTranslatedFactionName(playerDetails, rescuer)}
              </Stack>
            </>
          )}
          {unit.label != null && (
            <>
              <Stack nowrap start>
                <Icon className={iconStyle} icon={Label} />
                <fbt desc="Label for label">Label</fbt>
              </Stack>
              <div>
                <UILabel color={unit.label} />
              </div>
            </>
          )}
        </AttributeGridBox>
        {!unit.info.canAct(currentPlayer) && (
          <Stack alignCenter gap nowrap start>
            <Icon className={errorStyle} icon={WarningBox} />
            <p className={errorStyle}>
              <fbt desc="Label for a unit that can only move or attack">
                Can&apos;t move and attack in the same turn.
              </fbt>
            </p>
          </Stack>
        )}
        <Stack gap vertical>
          <CardInfoHeading player={player}>
            <fbt desc="About unit headline">About</fbt>
          </CardInfoHeading>
          <p>{info.description}</p>
        </Stack>
        <UnitAbilities player={currentPlayer} unit={unit} />
        <UnitTransports biome={biome} player={player} unit={unit} />
        <UnitAttack
          biome={biome}
          damageChartRoute={damageChartRoute}
          map={map}
          player={player}
          unit={unit}
          vector={vector}
        />
        <UnitVulnerability
          biome={biome}
          map={map}
          player={player}
          unit={unit}
          vector={vector}
        />
        {!process.env.IS_DEMO && (
          <p className={lightColorStyle}>
            <fbt desc="Explanation for damage information">
              Note: Cover, status effects and unit defense affect the inflicted
              damage. See the{' '}
              <fbt:param name="link">
                {App.canQuit ? (
                  <InlineLink to={damageChartRoute}>
                    <fbt desc="Damage chart link name">Damage Chart</fbt>
                  </InlineLink>
                ) : (
                  <InlineLink href={damageChartRoute} target="blank">
                    <fbt desc="Damage chart link name">Damage Chart</fbt>
                  </InlineLink>
                )}
              </fbt:param>{' '}
              for more information.
            </fbt>
          </p>
        )}
        <UnitMovement
          biome={biome}
          movementType={info.movementType}
          player={player}
        />
      </Stack>
    </>
  );
});

const damageRange = [20, 40, 60, 80, 100];

const getAllAvailableUnits = (
  map: MapData,
  biome: Biome,
  opponent: PlayerID,
  allSkills: Set<Skill>,
) => {
  const biomeUnitRestrictions = getBiomeUnitRestrictions(biome);
  const unitInfos = new Set(
    mapUnitsWithContentRestriction((unit) => unit, allSkills).filter(
      (unit) => !biomeUnitRestrictions?.has(unit.type),
    ),
  );

  for (const [, unit] of map.units) {
    if (!unitInfos.has(unit.info)) {
      unitInfos.add(unit.info);
    }
  }

  return [...unitInfos].map((unit) => unit.create(opponent));
};

const Weapon = memo(function WeaponAttack({
  biome,
  damageChartRoute,
  map,
  player,
  supply,
  unit,
  vector,
  weapon,
}: {
  biome: Biome;
  damageChartRoute: Route;
  map: MapData;
  player: PlayerID;
  supply?: number;
  unit: Unit;
  vector: Vector;
  weapon: WeaponT;
}) {
  const tile = map.getTileInfo(vector);
  const opponent = resolveDynamicPlayerID(map, 'opponent', player);
  const allSkills = useMemo(
    () => new Set(map.getPlayers().flatMap(({ skills }) => [...skills])),
    [map],
  );
  const biomeBuildingRestrictions = getBiomeBuildingRestrictions(biome);
  const availableUnits = getAllAvailableUnits(map, biome, opponent, allSkills);
  const isLeader = unit.isLeader();
  const attackStatusEffect = getAttackStatusEffect(map, unit, vector, tile);
  const damageGroups = sortBy(
    [
      ...groupBy(
        new Map(
          [...weapon.damage].map(([type, damage]) => [
            type,
            Math.floor(damage * attackStatusEffect),
          ]),
        ),
        ([, damage]) => getAttributeRangeValue(damageRange, damage),
      ),
    ],
    ([damage]) => -damage,
  );

  const getLikelyDamage = (entityB: Entity, index: number) => (
    <div key={index} style={isLeader ? { color: getColor(player) } : undefined}>
      {calculateLikelyDamage(
        unit,
        entityB,
        map,
        vector,
        vector,
        getAttackStatusEffect(map, unit, vector, tile),
        getDefenseStatusEffect(map, entityB, null),
        1,
        weapon,
      )}
    </div>
  );

  return (
    <Tick animationConfig={AnimationConfig}>
      <Stack gap vertical>
        <CardInfoHeading style={{ color: getColor(player) }}>
          {weapon.name}
        </CardInfoHeading>
        <Stack start>
          <fbt desc="Label for ammo supply">
            Supply:
            <fbt:param name="supply">
              {weapon.supply ? `${supply} / ${weapon.supply}` : '∞'}
            </fbt:param>
          </fbt>
          <Icon className={iconStyle} icon={Ammo} />
        </Stack>
        <Stack adaptive className={marginTopStyle} gap={16} start>
          {damageGroups.map(([strength, damageMapEntry]) => {
            const entities = new Set(damageMapEntry.map(([type]) => type));

            const unitGroups = [
              ...groupBy(
                availableUnits.filter((unit) => entities.has(unit.info.type)),
                (unit) => unit.info.type,
              ).values(),
            ];

            const damage = unitGroups.map((units) =>
              units.map(getLikelyDamage),
            );

            const buildings = [];
            if (
              entities.has(EntityType.Building) &&
              !biomeBuildingRestrictions.has(House)
            ) {
              const house = House.create(opponent);
              buildings.push(house);
              damage.push([getLikelyDamage(house, -1)]);
            }
            if (
              entities.has(EntityType.Structure) &&
              !biomeBuildingRestrictions.has(VerticalBarrier)
            ) {
              const structure = VerticalBarrier.create(0);
              buildings.push(structure);
              damage.push([getLikelyDamage(structure, -1)]);
            }

            const tiles = [
              ...unitGroups.map(([unit]) => getAnyUnitTile(unit.info) || Plain),
              ...buildings.map((building) =>
                getTileInfo(getAnyBuildingTileField(building.info)),
              ),
            ];

            return damage.length ? (
              <TileBox key={strength}>
                {strength <= 1 ? (
                  <fbt desc="Label for attack strength">Weak</fbt>
                ) : strength === 2 ? (
                  <fbt desc="Label for attack strength">Marginal</fbt>
                ) : strength === 3 ? (
                  <fbt desc="Label for attack strength">Moderate</fbt>
                ) : strength === 4 ? (
                  <fbt desc="Label for attack strength">Strong</fbt>
                ) : (
                  <fbt desc="Label for attack strength">Devastating</fbt>
                )}
                <InlineTileList
                  biome={biome}
                  buildings={[
                    ...Array(unitGroups.length).fill(undefined),
                    ...buildings,
                  ]}
                  extraInfos={damage}
                  tiles={tiles}
                  unitGroups={unitGroups}
                />
              </TileBox>
            ) : null;
          })}
        </Stack>
      </Stack>
    </Tick>
  );
});

const UnitAttack = ({
  biome,
  damageChartRoute,
  map,
  player,
  unit,
  vector,
}: {
  biome: Biome;
  damageChartRoute: Route;
  map: MapData;
  player: PlayerID;
  unit: Unit;
  vector: Vector;
}) => {
  const { attack } = unit.info;
  const { type: attackType, weapons } = attack;
  if (!weapons) {
    return null;
  }

  switch (attackType) {
    case AttackType.None:
      return null;
    case AttackType.LongRange:
    case AttackType.ShortRange:
      return (
        <Stack gap vertical>
          {[...weapons].map(([id, weapon]) => (
            <Weapon
              biome={biome}
              damageChartRoute={damageChartRoute}
              key={id}
              map={map}
              player={player}
              supply={unit.ammo?.get(weapon.id)}
              unit={unit}
              vector={vector}
              weapon={weapon}
            />
          ))}
        </Stack>
      );
    default: {
      attackType satisfies never;
      throw new UnknownTypeError('UnitAttack', attackType);
    }
  }
};

const UnitVulnerability = ({
  biome,
  map,
  player,
  unit,
  vector,
}: {
  biome: Biome;
  map: MapData;
  player: PlayerID;
  unit: Unit;
  vector: Vector;
}) => {
  const tile = map.getTileInfo(vector);
  const opponent = resolveDynamicPlayerID(map, 'opponent', player);
  const allSkills = useMemo(
    () => new Set(map.getPlayers().flatMap(({ skills }) => [...skills])),
    [map],
  );
  const availableUnits = getAllAvailableUnits(map, biome, opponent, allSkills);
  const damageGroups = sortBy(
    [
      ...groupBy(
        availableUnits
          .map((unitB) => {
            const damage = calculateLikelyDamage(
              unitB,
              unit,
              map,
              vector,
              vector,
              getAttackStatusEffect(map, unitB, vector, tile),
              getDefenseStatusEffect(map, unit, null),
              1,
            );
            return [
              unitB,
              damage,
              damage != null ? getAttributeRangeValue(damageRange, damage) : 0,
            ] as const;
          })
          .filter(
            (entry): entry is [Unit, number, AttributeRangeWithZero] =>
              entry[1] != null &&
              entry[2] != null &&
              entry[1] > 0 &&
              entry[2] > 0,
          ),
        ([, , attributeRangeValue]) => attributeRangeValue,
      ),
    ],
    ([attributeRangeValue]) => -attributeRangeValue,
  ).slice(0, 2);

  const getLikelyDamage = (damage: number, index: number) => (
    <div key={index}>{damage}</div>
  );

  return (
    <Tick animationConfig={AnimationConfig}>
      <Stack gap vertical>
        <CardInfoHeading style={{ color: getColor(player) }}>
          <fbt desc="Headline for who the unit is weak to">
            Vulnerable Against
          </fbt>
        </CardInfoHeading>
        <Stack adaptive className={marginTopStyle} gap={16} start>
          {damageGroups.map(([strength, damageMapEntry]) => {
            const unitGroups = [
              ...groupBy(damageMapEntry, ([unit]) => unit.info.type).values(),
            ];

            const damage = unitGroups.map((units) =>
              units.map(([, damage], index) => getLikelyDamage(damage, index)),
            );
            const tiles = unitGroups.map(
              ([[unit]]) => getAnyUnitTile(unit.info) || Plain,
            );
            return damage.length ? (
              <TileBox key={strength}>
                {strength <= 1 ? (
                  <fbt desc="Label for attack strength">Weak</fbt>
                ) : strength === 2 ? (
                  <fbt desc="Label for attack strength">Marginal</fbt>
                ) : strength === 3 ? (
                  <fbt desc="Label for attack strength">Moderate</fbt>
                ) : strength === 4 ? (
                  <fbt desc="Label for attack strength">Strong</fbt>
                ) : (
                  <fbt desc="Label for attack strength">Devastating</fbt>
                )}
                <InlineTileList
                  biome={biome}
                  extraInfos={damage}
                  tiles={tiles}
                  unitGroups={unitGroups.map((units) =>
                    units.map(([unit]) => unit),
                  )}
                />
              </TileBox>
            ) : null;
          })}
        </Stack>
      </Stack>
    </Tick>
  );
};

const UnitAbility = ({
  ability,
  children,
  icon,
}: {
  ability: Ability;
  children: ReactNode;
  icon: SVGIcon;
}) => {
  const color = numberToPlayerID(ability - 1);
  return (
    <Stack
      className={tagStyle}
      gap
      start
      style={{
        backgroundColor: getColor(color, 0.2),
        color: getColor(color),
      }}
    >
      <Icon icon={icon} />
      {children}
    </Stack>
  );
};

const UnitAbilities = ({ player, unit }: { player: Player; unit: Unit }) => {
  const abilities = Abilities.filter(
    (ability) =>
      ability !== Ability.MoveAndAct &&
      ability !== Ability.AccessBuildings &&
      (unit.info.hasAbility(ability) ||
        (ability === Ability.Capture && unit.canCapture(player))),
  );
  const heavyEquipmentColor = getColor(
    numberToPlayerID(Ability.HeavyEquipment - 1),
  );
  const moraleColor = getColor(numberToPlayerID(Ability.Morale - 1));
  return abilities?.length ? (
    <Stack gap vertical>
      <CardInfoHeading style={{ color: getColor(player.id) }}>
        <fbt desc="Headline for unit special abilities">Special Abilities</fbt>
      </CardInfoHeading>
      <Stack adaptive gap start>
        {abilities.map((ability) => {
          switch (ability) {
            case Ability.Capture:
              return (
                <UnitAbility ability={ability} icon={Flag} key={ability}>
                  <fbt desc="Unit capture ability">Capture</fbt>
                </UnitAbility>
              );
            case Ability.Convert:
              return (
                <UnitAbility ability={ability} icon={Repeat} key={ability}>
                  <fbt desc="Unit convert ability">Convert</fbt>
                </UnitAbility>
              );
            case Ability.CreateBuildings:
              return (
                <UnitAbility ability={ability} icon={Buildings} key={ability}>
                  <fbt desc="Unit create building ability">
                    Create Buildings
                  </fbt>
                </UnitAbility>
              );
            case Ability.CreateTracks:
              return (
                <UnitAbility ability={ability} icon={Track} key={ability}>
                  <fbt desc="Unit create rail tracks ability">
                    Create Rail Tracks
                  </fbt>
                </UnitAbility>
              );
            case Ability.Heal:
              return (
                <UnitAbility ability={ability} icon={Heart} key={ability}>
                  <fbt desc="Unit heal ability">Heal</fbt>
                </UnitAbility>
              );
            case Ability.HeavyEquipment:
              return (
                <UnitAbility ability={ability} icon={WarningBox} key={ability}>
                  <fbt desc="Unit heavy equipment ability">Heavy Equipment</fbt>
                </UnitAbility>
              );
            case Ability.Morale:
              return (
                <UnitAbility ability={ability} icon={Volume} key={ability}>
                  <fbt desc="Unit morale ability">Morale Boost</fbt>
                </UnitAbility>
              );
            case Ability.Poison:
              return (
                <UnitAbility ability={ability} icon={Poison} key={ability}>
                  <fbt desc="Unit poison ability">Poison</fbt>
                </UnitAbility>
              );
            case Ability.Rescue:
              return (
                <UnitAbility ability={ability} icon={Rescue} key={ability}>
                  <fbt desc="Unit rescue ability">Rescue</fbt>
                </UnitAbility>
              );
            case Ability.Sabotage:
              return (
                <UnitAbility ability={ability} icon={Sabotage} key={ability}>
                  <fbt desc="Unit sabotage ability">Sabotage</fbt>
                </UnitAbility>
              );
            case Ability.Supply:
              return (
                <UnitAbility ability={ability} icon={Supply} key={ability}>
                  <fbt desc="Unit supply ability">Supply</fbt>
                </UnitAbility>
              );
            case Ability.Unfold:
              return (
                <UnitAbility ability={ability} icon={Unfold} key={ability}>
                  <fbt desc="Unit unfold ability">Fold & Unfold</fbt>
                </UnitAbility>
              );
            case Ability.MoveAndAct:
            case Ability.AccessBuildings:
              return null;
            default: {
              ability satisfies never;
              throw new UnknownTypeError('UnitAbilities', ability);
            }
          }
        })}
      </Stack>
      {unit.info.hasAbility(Ability.HeavyEquipment) && (
        <Stack alignCenter gap nowrap start>
          <Icon
            className={extraIconStyle}
            icon={WarningBox}
            style={{ color: heavyEquipmentColor }}
          />
          <p style={{ color: heavyEquipmentColor }}>
            <fbt desc="Label for a unit that cannot act after being dropped.">
              Heavy Equipment: Can&apos;t act after being dropped by a
              transporter.
            </fbt>
          </p>
        </Stack>
      )}
      {unit.info.hasAbility(Ability.Morale) && (
        <Stack alignCenter gap nowrap start>
          <Icon
            className={extraIconStyle}
            icon={Volume}
            style={{ color: moraleColor }}
          />
          <p style={{ color: moraleColor }}>
            <fbt desc="Label for a unit that cannot act after being dropped.">
              Morale Boost: Increases attack of adjacent units by{' '}
              <fbt:param name="attack">{MoraleStatusEffect * 100}</fbt:param>%.
            </fbt>
          </p>
        </Stack>
      )}
    </Stack>
  ) : null;
};

const UnitTransports = ({
  biome,
  player,
  unit,
}: {
  biome: Biome;
  player: PlayerID;
  unit: Unit;
}) => {
  const { transports } = unit.info;
  if (!transports) {
    return null;
  }

  const { limit, types } = transports;
  const entities = [...types].map(getTranslatedEntityName);
  const units = unit.transports?.map((transportedUnit) =>
    transportedUnit.deploy(),
  );
  return (
    <>
      <Stack gap vertical>
        <CardInfoHeading style={{ color: getColor(player) }}>
          <fbt desc="Headline for transport information">Transport</fbt>
        </CardInfoHeading>
        <p>
          {limit === 1 ? (
            <fbt desc="Unit transport description">
              This unit can transport one unit of type{' '}
              <fbt:list conjunction="or" items={entities} name="entities" />.
            </fbt>
          ) : (
            <fbt desc="Unit transport description">
              This unit can transport up to{' '}
              <fbt:param name="limit">{limit}</fbt:param> units of type{' '}
              <fbt:list conjunction="or" items={entities} name="entities" />.
            </fbt>
          )}
        </p>
      </Stack>
      {units?.length ? (
        <Tick animationConfig={AnimationConfig}>
          <Stack gap vertical>
            <CardInfoHeading style={{ color: getColor(player) }}>
              <fbt desc="Headline for transported units">Transported Units</fbt>
            </CardInfoHeading>
            <TileBox>
              <InlineTileList
                biome={biome}
                tiles={units.map((unit) => getAnyUnitTile(unit.info) || Plain)}
                units={units}
              />
            </TileBox>
          </Stack>
        </Tick>
      ) : null}
    </>
  );
};

const UnitMovement = memo(function UnitMovement({
  biome,
  movementType,
  player,
}: {
  biome: Biome;
  movementType: MovementType;
  player: PlayerID;
}) {
  const { tileRestrictions } = getBiomeStyle(biome);
  const tileList = sortBy(
    [
      ...groupBy(
        getAllTiles().filter(
          (tile) => !tile.isInaccessible() && !tileRestrictions?.has(tile),
        ),
        (tile) => tile.getMovementCost({ movementType }),
      ),
    ],
    ([cost]) => (cost === -1 ? Number.POSITIVE_INFINITY : cost),
  );
  return (
    <Stack gap vertical>
      <CardInfoHeading style={{ color: getColor(player) }}>
        <fbt desc="Headline for movement costs">Movement Costs</fbt>
      </CardInfoHeading>
      <Stack gap={16} vertical>
        <fbt desc="Label for movement type">
          Type: <fbt:param name="movementType">{movementType.name}</fbt:param>
        </fbt>
        <Stack gap start>
          {tileList?.map(([cost, tiles]) => (
            <MovementBox
              biome={biome}
              cost={cost}
              key={cost}
              size={
                tiles.some((tile) => tileFieldHasDecorator(tile.id, biome))
                  ? 'medium'
                  : undefined
              }
              tiles={tiles}
            />
          )) || (
            <fbt desc="Text for no movement restriction">
              No movement restrictions.
            </fbt>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
});

const marginTopStyle = css`
  margin-top: 8px;
`;

const iconStyle = css`
  margin-bottom: -2px;
  margin-top: 2px;
`;

const extraIconStyle = css`
  flex-shrink: 0;
`;

const tagStyle = css`
  ${clipBorder(2)}

  padding: 3px 6px 4px;
  width: fit-content;
`;

const nowrapStyle = css`
  white-space: nowrap;
`;

const wideColumnStyle = css`
  grid-column: 2 / 4;
`;

const lightColorStyle = css`
  color: ${applyVar('text-color-light')};
`;

const errorStyle = css`
  color: ${applyVar('error-color')};
`;
