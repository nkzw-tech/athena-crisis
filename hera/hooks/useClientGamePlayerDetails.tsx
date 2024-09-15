import MapData from '@deities/athena/MapData.tsx';
import { useMemo } from 'react';
import { PlayerDetail } from '../Types.tsx';

export default function useClientGamePlayerDetails(
  map: MapData | null,
  user: PlayerDetail & { id: string },
) {
  return useMemo(() => {
    const player = map?.getPlayerByUserId(user.id);
    return new Map(player ? [[player.id, user]] : undefined);
  }, [map, user]);
}
