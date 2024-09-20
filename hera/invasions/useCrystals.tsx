import {
  Crystal,
  CrystalMap,
  Crystals,
} from '@deities/athena/invasions/Crystal.tsx';
import { useMemo } from 'react';
import safeParseArray from '../lib/safeParse.tsx';

export default function useCrystals(crystals: string | undefined): CrystalMap {
  return useMemo(() => {
    const maybeCrystals = safeParseArray<readonly [Crystal, number]>(crystals);
    const map = new Map(Crystals.map((crystal) => [crystal, 0]));
    if (maybeCrystals) {
      for (const crystal of maybeCrystals) {
        const [type, count] = crystal;
        if (count != null && count > 0) {
          map.set(type, count);
        }
      }
    }
    return map;
  }, [crystals]);
}
