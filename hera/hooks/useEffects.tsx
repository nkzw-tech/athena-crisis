import type { Effects } from '@deities/apollo/Effects.tsx';
import { decodeEffects } from '@deities/apollo/Effects.tsx';
import { useMemo } from 'react';

export default function useEffects(effects: string | undefined): Effects {
  return useMemo(
    () => (effects ? decodeEffects(JSON.parse(effects)) : new Map()),
    [effects],
  );
}
