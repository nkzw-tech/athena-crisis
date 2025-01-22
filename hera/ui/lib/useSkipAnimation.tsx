import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { useEffect } from 'react';
import { TimerFunction } from '../../Types.tsx';

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
  }, [animationConfig.Instant, onComplete, scheduleTimer]);

  return animationConfig.Instant;
}
