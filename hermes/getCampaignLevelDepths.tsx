import { Campaign, Level } from './Types.tsx';

function unrollLevel<T>(level: Level<T>, map: Map<T, number>, seen = new Set<T>(), depth = 1) {
  map.set(level.mapId, depth);

  if (!seen.has(level.mapId)) {
    seen.add(level.mapId);
    const { next } = level;
    if (next) {
      for (const entry of next) {
        unrollLevel(Array.isArray(entry) ? entry[1] : entry, map, seen, depth + 1);
      }
    }

    const currentDepth = map.get(level.mapId);
    if (!currentDepth || currentDepth < depth) {
      map.set(level.mapId, depth);
    }
  }
}

export default function getCampaignLevelDepths<T>(campaign: Campaign<T>): Map<T, number> {
  const map = new Map<T, number>();
  unrollLevel(campaign.next, map);
  return map;
}
