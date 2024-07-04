import { PlayerPerformance } from '@deities/athena/map/PlayerPerformance.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import { useMemo } from 'react';

export default function usePerformanceResult(
  performance: PlayerPerformance | null,
) {
  return useMemo(
    () =>
      performance
        ? [
            performance.pace != null
              ? (['pace', performance.pace] as const)
              : null,
            performance.power != null
              ? (['power', performance.power] as const)
              : null,
            performance.style != null
              ? (['style', performance.style] as const)
              : null,
            performance.bonus != null
              ? (['bonus', performance.bonus] as const)
              : null,
          ].filter(isPresent)
        : [],
    [performance],
  );
}
