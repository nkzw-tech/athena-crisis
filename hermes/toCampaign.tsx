import getOrThrow from '@deities/hephaestus/getOrThrow.tsx';
import { Campaign, Level, LevelID, PlainCampaign } from './Types.tsx';

type MutableLevel<T = LevelID> = Omit<Level<T>, 'next'> & {
  next?: Array<MutableLevel<T> | [number, MutableLevel<T>]>;
};

export default function toCampaign<T>({
  description,
  levels,
  name,
  next,
}: PlainCampaign<T>): Campaign<T> {
  const map = new Map<T, MutableLevel<T>>();

  // First, create a mutable map of levels.
  for (const [mapId] of levels) {
    map.set(mapId, { mapId });
  }

  // Then fill in the `next` value based on the new level objects.
  for (const [mapId, level] of map) {
    const next = levels.get(mapId)?.next;
    if (next) {
      const seen = new Set();
      level.next = next
        .filter((entry) => {
          const isArray = Array.isArray(entry);
          const mapId = isArray ? entry[1] : entry;
          if (seen.has(mapId)) {
            return false;
          }
          seen.add(mapId);
          return true;
        })
        .map((entry) =>
          Array.isArray(entry)
            ? [entry[0], getOrThrow(map, entry[1])]
            : getOrThrow(map, entry),
        );
    }
  }

  return {
    description,
    name,
    next: getOrThrow(map, next),
  };
}
