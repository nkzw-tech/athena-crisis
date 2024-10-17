import {
  maybeDecodePlayerPerformance,
  PerformanceType,
  PlayerPerformance,
} from '@deities/athena/map/PlayerPerformance.tsx';
import { useMemo } from 'react';

export default function usePlayerAchievement(
  achievementResult: string,
): [playerPerformance: PlayerPerformance | null, count: string] {
  return useMemo(() => {
    const result = maybeDecodePlayerPerformance(achievementResult);
    return [
      result,
      result
        ? String(
            Object.keys(result).filter(
              (type) => result[type as PerformanceType] != null,
            ).length || '?',
          )
        : '?',
    ] as const;
  }, [achievementResult]);
}
