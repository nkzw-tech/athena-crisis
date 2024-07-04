import isPositiveInteger from '@deities/hephaestus/isPositiveInteger.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import AIRegistry from '../../dionysus/AIRegistry.tsx';
import {
  Behavior,
  getBuildingInfo,
  House,
  mapBuildings,
  mapBuildingsWithContentRestriction,
  MaxSkills,
} from '../info/Building.tsx';
import { Skill, Skills } from '../info/Skill.tsx';
import { getTileInfo } from '../info/Tile.tsx';
import {
  getUnitInfo,
  mapUnits,
  mapUnitsWithContentRestriction,
  Pioneer,
} from '../info/Unit.tsx';
import { Biomes } from '../map/Biome.tsx';
import Building from '../map/Building.tsx';
import {
  DecoratorsPerSide,
  MaxHealth,
  MaxSize,
} from '../map/Configuration.tsx';
import Entity from '../map/Entity.tsx';
import Player, {
  PlaceholderPlayer,
  PlayerID,
  toPlayerID,
} from '../map/Player.tsx';
import { PerformanceStyleTypes } from '../map/PlayerPerformance.tsx';
import Team, { toTeamArray } from '../map/Team.tsx';
import Unit, { TransportedUnit } from '../map/Unit.tsx';
import vec from '../map/vec.tsx';
import MapData from '../MapData.tsx';
import { resetObjectives, validateObjectives } from '../Objectives.tsx';
import canBuild from './canBuild.tsx';
import canDeploy from './canDeploy.tsx';
import canPlaceDecorator from './canPlaceDecorator.tsx';
import canPlaceTile from './canPlaceTile.tsx';
import getActivePlayers from './getActivePlayers.tsx';
import indexToVector from './indexToVector.tsx';
import validateTeams, { TeamsList } from './validateTeams.tsx';
import withModifiers from './withModifiers.tsx';

export type ErrorReason =
  | 'inactive-players'
  | 'invalid-configuration'
  | 'invalid-decorators'
  | 'invalid-entities'
  | 'invalid-funds'
  | 'invalid-tiles'
  | 'invalid-size'
  | 'invalid-teams'
  | 'invalid-tiles'
  | 'invalid-objectives'
  | 'players';

const validateMapConfig = (map: MapData) => {
  const { config } = map;
  const {
    blocklistedBuildings,
    blocklistedUnits,
    fog,
    multiplier,
    performance,
    seedCapital,
  } = config;
  if (typeof fog !== 'boolean') {
    return false;
  }
  if (!isPositiveInteger(multiplier)) {
    return false;
  }
  if (!isPositiveInteger(seedCapital) && seedCapital !== 0) {
    return false;
  }

  if (!Biomes.includes(config.biome)) {
    return false;
  }

  for (const buildingId of blocklistedBuildings) {
    if (!getBuildingInfo(buildingId)) {
      return false;
    }
  }

  for (const unitId of blocklistedUnits) {
    if (!getUnitInfo(unitId)) {
      return false;
    }
  }

  const { pace, power, style } = performance;
  if (
    (pace != null && pace < 1) ||
    (power != null && power < 0) ||
    (style != null &&
      (!PerformanceStyleTypes.includes(style[0]) ||
        style[1] == null ||
        style[1] < 0))
  ) {
    return false;
  }

  return true;
};

const validFuel = (unit: Unit | TransportedUnit) =>
  unit.fuel >= 0 && unit.fuel <= unit.info.configuration.fuel;

const invalidSkills = (building: Building) =>
  !!(
    building.skills?.size &&
    (!building.info.hasBehavior(Behavior.SellSkills) ||
      building.skills.size > MaxSkills ||
      ![...building.skills].every((skill) => Skills.has(skill)))
  );

const validEntity = (entity: Entity | TransportedUnit): boolean => {
  toPlayerID(entity.player);

  if (entity.label) {
    toPlayerID(entity.label);
  }

  return entity.health >= 1 && entity.health <= MaxHealth;
};

const validateBuilding = (building: Building) => {
  const isNeutral = building.player === 0;
  if (
    (building.info.isStructure() && !isNeutral) ||
    (building.info.isHQ() && isNeutral)
  ) {
    return false;
  }

  return !!(
    getBuildingInfo(building.id) &&
    validEntity(building) &&
    building.hasValidBehaviors() &&
    !invalidSkills(building)
  );
};

const addLeader = (
  leaders: Map<PlayerID, Set<number>>,
  player: PlayerID,
  id: number,
) => {
  const set = leaders.get(player);
  if (set) {
    set.add(id);
  } else {
    leaders.set(player, new Set([id]));
  }
};

export const validateUnit = (
  unit: Unit | TransportedUnit,
  leaders: Map<PlayerID, Set<number>>,
  player?: PlayerID,
): boolean => {
  if (unit.ammo) {
    const seenWeapons = new Set();
    const supply = unit.info.getAmmunitionSupply();
    if (
      !supply ||
      unit.ammo.size !== supply.size ||
      ![...unit.ammo].every(([weapon, currentSupply]) => {
        if (seenWeapons.has(weapon)) {
          return false;
        }
        seenWeapons.add(weapon);

        const supplyAmount = supply?.get(weapon) || Number.POSITIVE_INFINITY;
        return currentSupply >= 0 && currentSupply <= supplyAmount;
      })
    ) {
      return false;
    }
  }

  if (player != null && unit.player !== player) {
    return false;
  }

  if (unit.isLeader()) {
    if (unit.player === 0 || leaders.get(unit.player)?.has(unit.id)) {
      return false;
    }
    addLeader(leaders, unit.player, unit.id);
  }

  return !!(
    getUnitInfo(unit.id) &&
    validEntity(unit) &&
    validFuel(unit) &&
    unit.hasValidBehavior() &&
    unit.hasValidName() &&
    (!unit.transports ||
      unit.transports.every((unit) => validateUnit(unit, leaders, unit.player)))
  );
};

export default function validateMap(
  map: MapData,
  newTeams?: TeamsList,
  hasContentRestrictions?: boolean,
  skills?: ReadonlySet<Skill>,
): [MapData, null] | [null, ErrorReason?] {
  if (!validateMapConfig(map)) {
    return [null, 'invalid-configuration'];
  }

  const {
    size: { height, width },
  } = map;

  try {
    const tiles = map.map.filter((id) => getTileInfo(id, 0));

    if (
      !isPositiveInteger(width) ||
      !isPositiveInteger(height) ||
      width > MaxSize ||
      height > MaxSize ||
      width * height !== tiles.length
    ) {
      return [null, 'invalid-size'];
    }

    let invalidReason: string | null = null;
    map.forEachField((_, index) => {
      const field = map.map[index];
      const modifierField = map.modifiers[index];
      if (typeof field === 'number' && typeof modifierField !== 'number') {
        invalidReason = 'invalid-tiles';
      }

      if (
        Array.isArray(field) &&
        Array.isArray(modifierField) &&
        (field.length !== modifierField.length ||
          field.length === 1 * 1 ||
          modifierField.length === 1 * 1)
      ) {
        invalidReason = 'invalid-tiles';
      }
    });

    map.forEachTile((_, tile, layer) => {
      if (tile.style.layer !== layer) {
        invalidReason = 'invalid-tiles';
      }
    });

    if (invalidReason) {
      return [null, invalidReason];
    }
  } catch {
    // If the above iterators throw it means that one of the tiles is invalid.
    return [null, 'invalid-tiles'];
  }

  map = withModifiers(
    map.copy({
      units: map.units.map((entity) => entity.ensureValidAttributes()),
    }),
  );

  if (
    map.map.some(
      (tile, index) =>
        !canPlaceTile(map, indexToVector(index, width), getTileInfo(tile)),
    )
  ) {
    return [null, 'invalid-tiles'];
  }

  if (
    map.reduceEachDecorator(
      (success, decorator, subVector) =>
        !canPlaceDecorator(
          map,
          vec(
            Math.floor((subVector.x - 1) / DecoratorsPerSide) + 1,
            Math.floor((subVector.y - 1) / DecoratorsPerSide) + 1,
          ),
          decorator.id,
        )
          ? true
          : success,
      false,
    )
  ) {
    return [null, 'invalid-decorators'];
  }

  const availableBuildings = new Set(
    (hasContentRestrictions
      ? mapBuildingsWithContentRestriction
      : mapBuildings)(({ id }) => id, skills || new Set()),
  );
  const availableUnits = new Set(
    (hasContentRestrictions ? mapUnitsWithContentRestriction : mapUnits)(
      ({ id }) => id,
      skills || new Set(),
    ),
  );

  map = map.copy({
    buildings: map.buildings.filter((building) =>
      availableBuildings.has(building.id),
    ),
    units: map.units.filter((unit) => availableUnits.has(unit.id)),
  });

  const config = map.config.copy({
    blocklistedBuildings: new Set(),
    blocklistedUnits: new Set(),
  });
  const leaders = new Map();
  if (
    map.buildings.some(
      (building, vector) =>
        !map.contains(vector) ||
        !validateBuilding(building) ||
        !canBuild(
          map.copy({
            buildings: map.buildings.delete(vector),
            config,
            currentPlayer:
              building.player === 0 ? map.currentPlayer : building.player,
          }),
          building.info,
          building.player,
          vector,
          true,
        ),
    ) ||
    map.units.some(
      (unit, vector) =>
        !map.contains(vector) ||
        !validateUnit(unit, leaders) ||
        !canDeploy(
          map.copy({ config, units: map.units.delete(vector) }),
          unit.info,
          vector,
          true,
        ),
    )
  ) {
    return [null, 'invalid-entities'];
  }

  if (
    !map.units.size &&
    !map.buildings.some(
      (building) =>
        building.player !== 0 && building.info.configuration.funds > 0,
    ) &&
    map.config.seedCapital < Pioneer.getCostFor(null) + House.configuration.cost
  ) {
    return [null, 'invalid-funds'];
  }

  const active = getActivePlayers(map);
  if (active.length <= 1) {
    return [null, 'players'];
  }

  const activePlayers = new Set(active);
  if (
    map.buildings.filter(
      (building) =>
        building.player !== 0 && !activePlayers.has(building.player),
    ).size ||
    map.units.filter(
      (unit) => unit.player !== 0 && !activePlayers.has(unit.player),
    ).size
  ) {
    return [null, 'inactive-players'];
  }

  const teams = ImmutableMap(
    active.map((id) => {
      const player = map.maybeGetPlayer(id);
      return [
        id,
        new Team(
          id,
          '',
          ImmutableMap<PlayerID, Player>().set(
            toPlayerID(id),
            new PlaceholderPlayer(
              toPlayerID(id),
              id,
              0,
              player?.ai != null && AIRegistry.has(player.ai)
                ? player.ai
                : undefined,
              player?.skills || new Set(),
            ),
          ),
        ),
      ] as const;
    }),
  );

  const newMap = map.copy({
    active,
    buildings: map.buildings.map((entity) => entity.recover()),
    config: map.config.copy({
      objectives: resetObjectives(map.config.objectives, new Set(active)),
    }),
    currentPlayer: active[0],
    round: 1,
    teams,
    units: map.units.map((entity) => entity.recover()),
  });

  if (!validateObjectives(newMap)) {
    return [null, 'invalid-objectives'];
  }

  return validateTeams(newMap, newTeams || toTeamArray(map.teams));
}
