import { CrystalMap, Crystals } from '@deities/athena/invasions/Crystal.tsx';
import { useMemo } from 'react';

const parse = (crystals: string | undefined) => {
  try {
    const maybeArray = JSON.parse(crystals || '');
    return Array.isArray(maybeArray) ? maybeArray : null;
  } catch {
    return null;
  }
};

export default function useCrystals(crystals: string | undefined): CrystalMap {
  return useMemo(() => {
    const maybeCrystals = parse(crystals);
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
