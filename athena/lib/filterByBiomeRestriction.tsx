import { mapBuildings, mapBuildingsWithContentRestriction } from '../info/Building.tsx';
import { Skill } from '../info/Skill.tsx';
import { mapUnits, mapUnitsWithContentRestriction } from '../info/Unit.tsx';
import MapData from '../MapData.tsx';
import getBiomeBuildingRestrictions from './getBiomeBuildingRestrictions.tsx';
import getBiomeUnitRestrictions from './getBiomeUnitRestrictions.tsx';

export default function filterByBiomeRestriction(
  map: MapData,
  hasContentRestrictions: boolean,
  skills: ReadonlySet<Skill> | undefined,
) {
  const { biome } = map.config;
  const biomeBuildingRestrictions = getBiomeBuildingRestrictions(biome);
  const biomeUnitRestrictions = getBiomeUnitRestrictions(biome);

  const availableBuildings = new Set(
    (hasContentRestrictions ? mapBuildingsWithContentRestriction : mapBuildings)(
      (building) => building,
      skills || new Set(),
    )
      .filter((building) => !biomeBuildingRestrictions?.has(building))
      .map(({ id }) => id),
  );
  const availableUnits = new Set(
    (hasContentRestrictions ? mapUnitsWithContentRestriction : mapUnits)(
      (unit) => unit,
      skills || new Set(),
    )
      .filter((unit) => !biomeUnitRestrictions?.has(unit.type))
      .map(({ id }) => id),
  );

  return map.copy({
    buildings: map.buildings.filter((building) => availableBuildings.has(building.id)),
    units: map.units.filter((unit) => availableUnits.has(unit.id)),
  });
}
