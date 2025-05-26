import ImmutableMap from '@nkzw/immutable-map';
import { Bar, Barracks, HQ, Shelter } from '../info/Building.tsx';
import { Skill } from '../info/Skill.tsx';
import {
  Alien,
  BazookaBear,
  Bear,
  InfernoJetpack,
  Pioneer,
  Saboteur,
  UnitInfo,
} from '../info/Unit.tsx';
import Building from '../map/Building.tsx';
import { PlayerID } from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import assignDeterministicUnitNames from './assignDeterministicUnitNames.tsx';
import canDeploy from './canDeploy.tsx';

type SpawnConfiguration = Readonly<{
  matchBuilding?: (building: Building) => boolean;
  matchUnit?: (unit: Unit) => boolean;
  max?: number;
  unitType: UnitInfo;
}>;

const spawnConfiguration: Partial<Record<Skill, SpawnConfiguration>> = {
  [Skill.BuyUnitAlien]: {
    matchBuilding: (building) =>
      building.id === Barracks.id || building.id === HQ.id,
    unitType: Alien,
  },
  [Skill.BuyUnitBazookaBear]: {
    matchBuilding: (building) => building.id === Bar.id,
    unitType: BazookaBear,
  },
  [Skill.BuyUnitBear]: {
    matchBuilding: (building) =>
      building.id === Shelter.id || building.id === HQ.id,
    unitType: Bear,
  },
  [Skill.DragonSaboteur]: {
    matchBuilding: (building) => building.id === HQ.id,
    matchUnit: () => true,
    max: 1,
    unitType: Saboteur,
  },
  [Skill.SpawnUnitInfernoJetpack]: {
    matchBuilding: () => true,
    matchUnit: () => true,
    max: 3,
    unitType: InfernoJetpack,
  },
  [Skill.UnlockZombie]: {
    matchBuilding: (building) => building.id === HQ.id,
    matchUnit: () => true,
    max: 1,
    unitType: Pioneer,
  },
};

const getDeployVector = (
  map: MapData,
  player: PlayerID,
  vector: Vector,
  { matchBuilding, matchUnit, unitType }: SpawnConfiguration,
) => {
  const unit = map.units.get(vector);
  const building = map.buildings.get(vector);
  if (
    (building &&
      matchBuilding?.(building) &&
      map.matchesPlayer(building, player) &&
      (!unit || map.matchesTeam(unit, building))) ||
    (unit && matchUnit?.(unit) && map.matchesPlayer(unit, player))
  ) {
    const deployVector = vector
      .expand()
      .find((vector) => canDeploy(map, unitType, vector, true));
    if (deployVector) {
      return deployVector;
    }
  }
  return null;
};

export default function powerSpawnUnits(
  map: MapData,
  player: PlayerID,
  skill: Skill,
): ImmutableMap<Vector, Unit> | null {
  if (!spawnConfiguration[skill]) {
    return null;
  }

  const configuration = spawnConfiguration[skill];
  const { max, unitType } = configuration;
  const vectors = new Set([
    ...map.buildings
      .map((building) => map.matchesPlayer(building, player))
      .keys(),
    ...map.units.map((unit) => map.matchesPlayer(unit, player)).keys(),
  ]);
  let newUnits = ImmutableMap<Vector, Unit>();
  for (const vector of vectors) {
    const deployVector = getDeployVector(map, player, vector, configuration);
    if (deployVector) {
      newUnits = newUnits.set(deployVector, unitType.create(player));
    }

    if (max && newUnits.size >= max) {
      break;
    }
  }

  return newUnits.size ? assignDeterministicUnitNames(map, newUnits) : null;
}
