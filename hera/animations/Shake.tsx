import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { useEffect } from 'react';
import { ClearTimerFunction, TimerFunction } from '../Types.tsx';

export default function Shake({
  animationConfig,
  clearTimer,
  onComplete,
  scheduleTimer,
}: {
  animationConfig: AnimationConfig;
  clearTimer: ClearTimerFunction;
  onComplete: () => void;
  scheduleTimer: TimerFunction;
}) {
  useEffect(() => {
    const timer = scheduleTimer(onComplete, animationConfig.AnimationDuration * 1.8);
    return () => clearTimer(timer);
  }, [animationConfig, clearTimer, onComplete, scheduleTimer]);

  return null;
}
