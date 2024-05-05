import {
  AnimationConfig,
  FastAnimationConfig,
} from '@deities/athena/map/Configuration.tsx';
import { useMemo } from 'react';
import { AnimationSpeed } from '../lib/AnimationSpeed.tsx';

export type AnimationSpeed =
  | 'FastAI'
  | 'FastAll'
  | 'Normal'
  | '%future added value';

export default function useAnimationSpeed(
  animationSpeed: AnimationSpeed | null | undefined,
) {
  return useMemo(
    () =>
      animationSpeed === AnimationSpeed.FastAll
        ? ([
            FastAnimationConfig,
            FastAnimationConfig,
            AnimationConfig,
            AnimationConfig,
          ] as const)
        : animationSpeed === AnimationSpeed.FastAI
          ? ([
              FastAnimationConfig,
              AnimationConfig,
              AnimationConfig,
              FastAnimationConfig,
            ] as const)
          : undefined,
    [animationSpeed],
  );
}
