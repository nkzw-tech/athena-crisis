import Building from '@deities/athena/map/Building.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import ImmutableMap from '@nkzw/immutable-map';

export default function updateVisibleEntities(
  currentMap: MapData,
  vision: VisionT,
  {
    buildings,
    units,
  }: {
    buildings?: ImmutableMap<Vector, Building>;
    units?: ImmutableMap<Vector, Unit>;
  },
): MapData {
  if (!currentMap.config.fog) {
    return currentMap;
  }

  const map = vision.apply(currentMap);
  return map.copy({
    buildings: buildings ? map.buildings.merge(buildings) : map.buildings,
    units: units ? map.units.merge(units) : map.units,
  });
}
