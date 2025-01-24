import SpriteVector from '../map/SpriteVector.tsx';

export default function indexToSpriteVector(
  index: number,
  width: number,
): SpriteVector {
  return new SpriteVector((index % width) + 1, Math.floor(index / width) + 1);
}
