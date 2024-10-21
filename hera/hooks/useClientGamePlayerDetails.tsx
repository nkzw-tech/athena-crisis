import MapData from '@deities/athena/MapData.tsx';
import { useMemo } from 'react';
import getPlayerEquippedUnitCustomizations from '../lib/getPlayerEquippedUnitCustomizations.tsx';
import { PlayerDetails } from '../Types.tsx';
import { GameUser } from './useUserMap.tsx';

export default function useClientGamePlayerDetails(
  map: MapData | null | undefined,
  user: GameUser,
): PlayerDetails {
  return useMemo(() => {
    const player = map?.getPlayerByUserId(user.id);
    return new Map(
      player
        ? [
            [
              player.id,
              {
                ...user,
                equippedUnitCustomizations: getPlayerEquippedUnitCustomizations(
                  user.equippedUnitCustomizations,
                ),
              },
            ],
          ]
        : undefined,
    );
  }, [map, user]);
}
