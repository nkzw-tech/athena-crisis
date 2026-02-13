import { Level } from './Types.tsx';

export default function toPlainLevelList<T>(
  list?: ReadonlyArray<Level<T> | [number, Level<T>]>,
): ReadonlyArray<T | [number, T]> {
  return list
    ? list.map((entry) => (Array.isArray(entry) ? [entry[0], entry[1].mapId] : entry.mapId))
    : [];
}
