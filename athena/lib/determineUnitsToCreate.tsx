import { PotentialUnitAbilities } from '../../dionysus/lib/getPossibleUnitAbilities.tsx';
import needsSupply from '../../dionysus/lib/needsSupply.tsx';
import { BuildableTiles, MinFunds } from '../info/Building.tsx';
import { Ability, UnitInfo } from '../info/Unit.tsx';
import { getEntityInfoGroup } from '../map/Entity.tsx';
import Player, { PlayerID } from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';
import MapData from '../MapData.tsx';
import calculateFunds, {
  calculateTotalPossibleFunds,
} from './calculateFunds.tsx';

export default function determineUnitsToCreate(
  map: MapData,
  currentPlayer: Player | PlayerID,
  playerUnits: ReadonlyArray<Unit>,
  buildableUnits: ReadonlyArray<UnitInfo>,
  {
    canCreateBuildUnits,
    canCreateCaptureUnits,
    canCreateSupplyUnits,
    canCreateTransportUnits,
  }: PotentialUnitAbilities = {
    canCreateBuildUnits: true,
    canCreateCaptureUnits: true,
    canCreateSupplyUnits: true,
    canCreateTransportUnits: true,
  },
): ReadonlyArray<UnitInfo> {
  if (!buildableUnits.length) {
    return [];
  }

  const availableTiles = map.reduceEachField(
    (sum, vector) =>
      sum +
      (BuildableTiles.has(map.getTileInfo(vector)) && !map.buildings.has(vector)
        ? 1
        : 0),
    0,
  );
  const structures = map.buildings.filter(
    (building) => map.isNeutral(building) && !building.info.isStructure(),
  );

  const totalFunds = calculateTotalPossibleFunds(map);
  const minUnitsWithCaptureAbility =
    Math.max(structures.size, totalFunds / MinFunds) * 0.2;
  const unitsWithCreateBuildingsAbility = playerUnits.filter((unit) =>
    unit.info.hasAbility(Ability.CreateBuildings),
  );
  const shouldBuildCaptureUnits =
    calculateFunds(map, currentPlayer) / totalFunds < 0.4 / map.active.length &&
    playerUnits.filter((unit) => unit.info.hasAbility(Ability.Capture)).length <
      minUnitsWithCaptureAbility;

  const unitsWithSupplyNeeds = playerUnits.filter(needsSupply);
  const entitiesWithSupplyNeeds = new Set(
    unitsWithSupplyNeeds.map(({ info }) => info.type),
  );
  const unitsWithSupplyAbility = playerUnits.filter((unit) =>
    unit.info.hasAbility(Ability.Supply),
  );

  if (
    canCreateSupplyUnits &&
    unitsWithSupplyNeeds.length &&
    unitsWithSupplyAbility.length <= playerUnits.length * 0.05 &&
    buildableUnits.some(
      (info) =>
        info.hasAbility(Ability.Supply) &&
        Array.from(info.configuration.supplyTypes || []).some((type) =>
          entitiesWithSupplyNeeds.has(type),
        ),
    )
  ) {
    return buildableUnits.filter((info) => info.hasAbility(Ability.Supply));
    // If there are many neutral buildings, prefer building units that can capture.
    // Otherwise, prefer units that can build buildings, if there is space.
  } else if (
    (canCreateBuildUnits || canCreateCaptureUnits) &&
    (availableTiles || structures.size) &&
    (map.round <= 2 ||
      (map.round > 4 && !(map.round % 4)) ||
      (!unitsWithCreateBuildingsAbility.length && availableTiles > 3)) &&
    (shouldBuildCaptureUnits ||
      buildableUnits.some(
        (info) =>
          info.hasAbility(Ability.Capture) ||
          info.hasAbility(Ability.CreateBuildings),
      ))
  ) {
    if (
      playerUnits.filter(({ info }) => info.hasAbility(Ability.Capture))
        .length <
        structures.size * 0.3 &&
      (map.round <= 2 ||
        buildableUnits.some((info) => info.hasAbility(Ability.Capture)))
    ) {
      return buildableUnits.filter((info) => info.hasAbility(Ability.Capture));
    }

    if (
      unitsWithCreateBuildingsAbility.length < availableTiles &&
      (map.round <= 2 ||
        buildableUnits.some((info) => info.hasAbility(Ability.CreateBuildings)))
    ) {
      return buildableUnits.filter((info) =>
        info.hasAbility(Ability.CreateBuildings),
      );
    }
  } else if (
    canCreateTransportUnits &&
    ((map.round >= 3 && map.round <= 4) ||
      (map.round > 5 && !(map.round % 5))) &&
    (map.size.width >= 15 ||
      map.size.height >= 15 ||
      buildableUnits.some((info) => getEntityInfoGroup(info) === 'naval')) &&
    playerUnits.filter(({ info }) => info.canTransportUnits()).length <
      playerUnits.length * 0.15
  ) {
    return buildableUnits.filter((info) => info.canTransportUnits());
  }
  return buildableUnits;
}
