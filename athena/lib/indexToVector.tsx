import type Vector from '../map/Vector.tsx';
import vec from './../map/vec.tsx';

export default function indexToVector(index: number, width: number): Vector {
  return vec((index % width) + 1, Math.floor(index / width) + 1);
}
