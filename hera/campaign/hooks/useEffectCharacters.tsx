import type { Effects, EffectTrigger } from '@deities/apollo/Effects.tsx';
import { useMemo } from 'react';
import getAllEffectCharacters from '../lib/getAllEffectCharacters.tsx';

export default function useEffectCharacters(
  effects: Effects | null,
  effect?: EffectTrigger,
) {
  return useMemo(
    () => getAllEffectCharacters(effects, effect),
    [effects, effect],
  );
}
