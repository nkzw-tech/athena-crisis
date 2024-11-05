import random from './random.tsx';

export default function randomEntry<T>(array: ReadonlyArray<T>): T | null {
  return array.at(random(0, array.length - 1)) || null;
}
