import type { LevelEntry, PlainLevel } from './Types.tsx';

export default function toLevelMap<T>(levels?: ReadonlyArray<LevelEntry<T>>) {
  if (!levels) {
    throw new Error('Campaign levels not found.');
  }

  return new Map<T, PlainLevel<T>>(Array.isArray(levels) ? levels : null);
}
