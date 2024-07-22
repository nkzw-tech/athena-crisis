import ImmutableMap from '@nkzw/immutable-map';
import { Bar, Barracks, HQ } from '../info/Building.tsx';
import { Skill } from '../info/Skill.tsx';
import { Alien, BazookaBear, UnitInfo } from '../info/Unit.tsx';
import Building from '../map/Building.tsx';
import { PlayerID } from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import assignDeterministicUnitNames from './assignDeterministicUnitNames.tsx';
import canDeploy from './canDeploy.tsx';

const spawnConfiguration: Partial<
  Record<
    Skill,
    Readonly<{
      matchBuilding: (building: Building) => boolean;
      unitType: UnitInfo;
    }>
  >
> = {
  [Skill.BuyUnitBazookaBear]: {
    matchBuilding: (building) => building.id === Bar.id,
    unitType: BazookaBear,
  },

  [Skill.BuyUnitAlien]: {
    matchBuilding: (building) =>
      building.id === Barracks.id || building.id === HQ.id,
    unitType: Alien,
  },
};

export default function powerSpawnUnits(
  map: MapData,
  player: PlayerID,
  skill: Skill,
): ImmutableMap<Vector, Unit> | null {
  if (!spawnConfiguration[skill]) {
    return null;
  }

  const { matchBuilding, unitType } = spawnConfiguration[skill];
  let newUnits = ImmutableMap<Vector, Unit>();
  for (const [vector, building] of map.buildings) {
    const unit = map.units.get(vector);
    if (
      map.matchesPlayer(building, player) &&
      (!unit || map.matchesTeam(unit, building)) &&
      matchBuilding(building)
    ) {
      const deployVector = vector
        .expand()
        .find((vector) => canDeploy(map, unitType, vector, true));
      if (deployVector) {
        newUnits = newUnits.set(deployVector, unitType.create(player));
      }
    }
  }

  return newUnits.size ? assignDeterministicUnitNames(map, newUnits) : null;
}
