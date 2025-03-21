import { Level } from '@deities/hermes/Types.tsx';
import sortBy from '@nkzw/core/sortBy.js';

export default function sortByDepth<T>(
  next: Array<Level<T> | [number, Level<T>]>,
  depthMap: ReadonlyMap<T, number>,
) {
  return sortBy(
    next,
    (entry) =>
      depthMap.get((Array.isArray(entry) ? entry[1] : entry)?.mapId) ||
      Number.POSITIVE_INFINITY,
  );
}
