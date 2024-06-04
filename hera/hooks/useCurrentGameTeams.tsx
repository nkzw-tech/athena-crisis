import MapData from '@deities/athena/MapData.tsx';
import { useMemo } from 'react';
import botToUser from '../lib/botToUser.tsx';
import UnknownUser from '../ui/lib/UnknownUser.tsx';
import { UserLikeWithID } from './useUserMap.tsx';

export default function useCurrentGameTeams(
  map: MapData,
  users: Map<string, UserLikeWithID>,
) {
  return useMemo(
    () =>
      [...map.teams.sortBy(({ id }) => id).values()].map((team) => ({
        team,
        users: team.players.map(
          (player) =>
            (player.isHumanPlayer() && users.get(player.userId)) ||
            (player.isBot()
              ? botToUser(player)
              : { ...UnknownUser, id: `UnknownUser-${player.id}` }),
        ),
      })),
    [map.teams, users],
  );
}
