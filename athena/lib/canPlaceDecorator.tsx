import { getDecorator } from '../info/Decorator.tsx';
import { getDecoratorLimit } from '../map/Configuration.tsx';
import type Vector from '../map/Vector.tsx';
import type MapData from '../MapData.tsx';

export default function canPlaceDecorator(
  map: MapData,
  vector: Vector,
  decorator: number,
  _getDecoratorLimit = getDecoratorLimit,
): boolean {
  return !!(
    getDecorator(decorator)?.placeOn.has(map.getTileInfo(vector)) &&
    map.reduceEachDecorator((sum) => sum + 1, 0) < _getDecoratorLimit(map.size)
  );
}
