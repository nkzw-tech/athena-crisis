import { Campaign, Level, LevelMap } from './Types.tsx';

function unrollLevel<T>(level: Level<T>, list: Array<Level<T>>, seen = new Set<T>()) {
  if (!seen.has(level.mapId)) {
    seen.add(level.mapId);
    const { next } = level;
    if (next) {
      for (const entry of next) {
        unrollLevel(Array.isArray(entry) ? entry[1] : entry, list, seen);
      }
    }

    list.push(level);
  }
}

export default function unrollCampaign<T>(campaign: Campaign<T>): LevelMap<T> {
  const list: Array<Level<T>> = [];
  unrollLevel(campaign.next, list);
  return list.reverse().reduce((map, level) => {
    map.set(level.mapId, level);
    return map;
  }, new Map());
}
