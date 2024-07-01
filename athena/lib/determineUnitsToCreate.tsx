import ImmutableMap from '@nkzw/immutable-map';
import { PotentialUnitAbilities } from '../../dionysus/lib/getPossibleUnitAbilities.tsx';
import needsSupply from '../../dionysus/lib/needsSupply.tsx';
import { BuildableTiles, MinFunds } from '../info/Building.tsx';
import { Ability, UnitInfo } from '../info/Unit.tsx';
import Building from '../map/Building.tsx';
import { getEntityInfoGroup } from '../map/Entity.tsx';
import Player, { PlayerID } from '../map/Player.tsx';
import Unit from '../map/Unit.tsx';
import Vector from '../map/Vector.tsx';
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

  let _availableTiles: number | null = null;
  const getAvailableTiles = () =>
    _availableTiles === null
      ? (_availableTiles = map.reduceEachField(
          (sum, vector) =>
            sum +
            (BuildableTiles.has(map.getTileInfo(vector)) &&
            !map.buildings.has(vector)
              ? 1
              : 0),
          0,
        ))
      : _availableTiles;

  let _structures: ImmutableMap<Vector, Building> | null = null;
  const getStructures = () =>
    _structures === null
      ? (_structures = map.buildings.filter(
          (building) => map.isNeutral(building) && !building.info.isStructure(),
        ))
      : _structures;

  const totalFunds = calculateTotalPossibleFunds(map);
  const unitsWithCreateBuildingsAbility = playerUnits.filter((unit) =>
    unit.info.hasAbility(Ability.CreateBuildings),
  );
  const getShouldBuildCaptureUnits = () => {
    const minUnitsWithCaptureAbility =
      Math.max(getStructures().size, totalFunds / MinFunds) * 0.2;

    return (
      calculateFunds(map, currentPlayer) / totalFunds <
        0.4 / map.active.length &&
      playerUnits.filter((unit) => unit.info.hasAbility(Ability.Capture))
        .length < minUnitsWithCaptureAbility
    );
  };

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
    (getAvailableTiles() || getStructures().size) &&
    (map.round <= 2 ||
      (map.round > 4 && !(map.round % 4)) ||
      (!unitsWithCreateBuildingsAbility.length && getAvailableTiles() > 3)) &&
    (getShouldBuildCaptureUnits() ||
      buildableUnits.some(
        (info) =>
          info.hasAbility(Ability.Capture) ||
          info.hasAbility(Ability.CreateBuildings),
      ))
  ) {
    if (
      playerUnits.filter(({ info }) => info.hasAbility(Ability.Capture))
        .length <
        getStructures().size * 0.3 &&
      (map.round <= 2 ||
        buildableUnits.some((info) => info.hasAbility(Ability.Capture)))
    ) {
      return buildableUnits.filter((info) => info.hasAbility(Ability.Capture));
    }

    if (
      unitsWithCreateBuildingsAbility.length < getAvailableTiles() &&
      (map.round <= 2 ||
        buildableUnits.some((info) => info.hasAbility(Ability.CreateBuildings)))
    ) {
      return buildableUnits.filter((info) =>
        info.hasAbility(Ability.CreateBuildings),
      );
    }
  } else if (
    canCreateTransportUnits &&
    playerUnits.length < map.round * 2 &&
    (map.round === 3 ||
      map.round === 4 ||
      (map.round > 5 && !(map.round % 5))) &&
    (map.size.width * map.size.height >= 250 ||
      buildableUnits.some((info) => getEntityInfoGroup(info) === 'naval')) &&
    playerUnits.filter(({ info }) => info.canTransportUnits()).length <
      playerUnits.length * 0.15
  ) {
    return buildableUnits.filter((info) => info.canTransportUnits());
  }
  return buildableUnits;
}
