import type { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { useEffect } from 'react';
import type { TimerFunction } from '../../Types.tsx';

export default function useSkipAnimation({
  animationConfig,
  onComplete,
  scheduleTimer,
}: {
  animationConfig: AnimationConfig;
  onComplete: () => void;
  scheduleTimer: TimerFunction;
}): boolean {
  useEffect(() => {
    if (animationConfig.Instant) {
      scheduleTimer(onComplete, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return animationConfig.Instant;
}
