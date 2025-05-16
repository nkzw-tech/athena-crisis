import {
  AnimationConfig,
  FastAnimationConfig,
} from '@deities/athena/map/Configuration.tsx';
import { useMemo } from 'react';
import { AnimationSpeed } from '../lib/AnimationSpeed.tsx';

export type AnimationSpeed = 'FastAI' | 'FastAll' | 'Normal';

export default function useAnimationSpeed(
  animationSpeed: AnimationSpeed | null | undefined,
) {
  return useMemo(
    () =>
      animationSpeed === AnimationSpeed.FastAll
        ? ({
            human: FastAnimationConfig,
            regular: FastAnimationConfig,
          } as const)
        : animationSpeed === AnimationSpeed.FastAI
          ? ({ human: AnimationConfig, regular: FastAnimationConfig } as const)
          : undefined,
    [animationSpeed],
  );
}
