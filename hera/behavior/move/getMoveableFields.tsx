import { Fog } from '@deities/athena/map/PlainMap.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  moveable,
  MoveConfiguration,
  RadiusConfiguration,
  RadiusItem,
} from '@deities/athena/Radius.tsx';
import { Visibility, VisionT } from '@deities/athena/Vision.tsx';

export default function getMoveableFields(
  map: MapData,
  vision: VisionT,
  unit: Unit,
  vector: Vector,
): ReadonlyMap<Vector, RadiusItem> {
  const mapWithVision = vision.apply(map);
  if (map.config.fog !== Fog.Exploration) {
    return moveable(mapWithVision, unit, vector);
  }

  const isUnexplored = (vector: Vector) =>
    vision.getVisibility(map, vector) === Visibility.Unexplored;

  const configuration: RadiusConfiguration = {
    ...MoveConfiguration,
    getCost: (mapWithVision, unit, vector) =>
      isUnexplored(vector) ? 1 : MoveConfiguration.getCost(mapWithVision, unit, vector),
    getTransitionCost: (info, current, parent, currentVector, parentVector) =>
      isUnexplored(currentVector) || isUnexplored(parentVector)
        ? 0
        : MoveConfiguration.getTransitionCost(info, current, parent),
    isAccessible: (mapWithVision, unit, vector) =>
      isUnexplored(vector)
        ? map.contains(vector)
        : MoveConfiguration.isAccessible(mapWithVision, unit, vector),
  };

  return moveable(mapWithVision, unit, vector, undefined, configuration);
}
