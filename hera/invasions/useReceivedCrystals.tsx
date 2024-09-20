import { ClientLevelID } from '@deities/hermes/Types.tsx';
import { useMemo } from 'react';
import safeParseArray from '../lib/safeParse.tsx';

export default function useReceivedCrystals(
  receivedCrystals: string | undefined,
): ReadonlyMap<ClientLevelID, number> {
  return useMemo(
    () =>
      new Map(
        safeParseArray<readonly [ClientLevelID, number]>(receivedCrystals),
      ),
    [receivedCrystals],
  );
}
