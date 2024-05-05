import { DecoratorInfo, getDecorator } from '../info/Decorator.tsx';
import { DecoratorsPerSide } from '../map/Configuration.tsx';
import vec from '../map/vec.tsx';
import Vector from '../map/Vector.tsx';
import MapData from '../MapData.tsx';
import getDecoratorIndex from './getDecoratorIndex.tsx';

export default function getDecoratorsAtField(
  map: MapData,
  vector: Vector,
): ReadonlyMap<Vector, DecoratorInfo> | null {
  const decoratorMap = new Map<Vector, DecoratorInfo>();
  const decoratorSize = map.size.toDecoratorSizeVector();
  for (let x = 1; x <= DecoratorsPerSide; x++) {
    for (let y = 1; y <= DecoratorsPerSide; y++) {
      const subVector = vec(
        (vector.x - 1) * DecoratorsPerSide + x,
        (vector.y - 1) * DecoratorsPerSide + y,
      );
      const index = getDecoratorIndex(subVector, decoratorSize);
      const decorator = getDecorator(map.decorators[index]);
      if (decorator) {
        decoratorMap.set(vec(x, y), decorator);
      }
    }
  }
  return decoratorMap.size ? decoratorMap : null;
}
