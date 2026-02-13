import { Campaign, Level, LevelMap } from './Types.tsx';
import unrollCampaign from './unrollCampaign.tsx';

function detectCycle<T>(level: Level<T>, seen: Set<Level<T>>, stack: Set<Level<T>>) {
  if (!seen.has(level)) {
    seen.add(level);
    stack.add(level);
    if (level.next) {
      for (const entry of level.next) {
        const next = Array.isArray(entry) ? entry[1] : entry;
        if (!seen.has(next) && detectCycle(next, seen, stack)) {
          return true;
        } else if (stack.has(next)) {
          return true;
        }
      }
    }
  }
  stack.delete(level);
  return false;
}

function validateLevel<T>(levels: LevelMap<T>): boolean {
  const seen = new Set<Level<T>>();
  const stack = new Set<Level<T>>();
  for (const [, level] of levels) {
    if (detectCycle(level, seen, stack)) {
      return false;
    }
  }
  return true;
}

export default function validateCampaign<T>(campaign: Campaign<T>): boolean {
  return validateLevel(unrollCampaign(campaign));
}
