import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { useMemo } from 'react';
import { PlayerDetail } from '../../Types.tsx';

export default function useReplayPlayerDetails(
  map: MapData | null,
  users: ReadonlyMap<string, PlayerDetail>,
): ReadonlyMap<PlayerID, PlayerDetail> {
  return useMemo(() => {
    return new Map<PlayerID, PlayerDetail>(
      map?.getPlayers().flatMap((player) => {
        const user = player.isHumanPlayer() && users.get(player.userId);
        return user ? [[player.id, user]] : [];
      }),
    );
  }, [map, users]);
}
