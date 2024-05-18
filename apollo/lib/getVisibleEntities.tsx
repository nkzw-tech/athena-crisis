import type Building from '@deities/athena/map/Building.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { VisionT } from '@deities/athena/Vision.tsx';
import type ImmutableMap from '@nkzw/immutable-map';

const equals = (a: Entity | undefined, b: Entity) => {
  return (
    a && b && a.player === b.player && a.id === b.id && a.health === b.health
  );
};

export default function getVisibleEntities(
  previousMap: MapData,
  currentMap: MapData,
  vision: VisionT,
): [ImmutableMap<Vector, Building>, ImmutableMap<Vector, Unit>] {
  const { buildings: previousBuildings, units: previousUnits } =
    vision.apply(previousMap);
  const { buildings, units } = vision.apply(currentMap);
  return [
    buildings.filter(
      (building, vector) => !equals(previousBuildings.get(vector), building),
    ),
    units.filter((unit, vector) => !equals(previousUnits.get(vector), unit)),
  ];
}
