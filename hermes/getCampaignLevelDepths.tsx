import { Campaign, Level } from './Types.tsx';

function unrollLevel<T>(level: Level<T>, map: Map<T, number>, active = new Set<T>(), depth = 1) {
  if (active.has(level.mapId)) {
    return;
  }

  const currentDepth = map.get(level.mapId);
  if (currentDepth != null && currentDepth >= depth) {
    return;
  }

  map.set(level.mapId, depth);

  const { next } = level;
  if (next) {
    active.add(level.mapId);
    for (const entry of next) {
      unrollLevel(Array.isArray(entry) ? entry[1] : entry, map, active, depth + 1);
    }
    active.delete(level.mapId);
  }
}

export default function getCampaignLevelDepths<T>(campaign: Campaign<T>): Map<T, number> {
  const map = new Map<T, number>();
  unrollLevel(campaign.next, map);
  return map;
}
