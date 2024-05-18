import type { PlayerID } from '@deities/athena/map/Player.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import { useMemo } from 'react';
import type { CharacterImage } from '../character/PortraitPicker.tsx';
import botToUser from '../lib/botToUser.tsx';

export type UserLike = Readonly<{
  character: CharacterImage;
  displayName: string;
  username: string;
}>;

export type UserLikeWithID = UserLike & { id: string };
export type UserWithFactionNameAndSkills = UserLikeWithID & {
  factionName: string;
  skills: ReadonlyArray<number>;
};

export default function useUserMap(
  map?: MapData | null,
  nodes?: ReadonlyArray<
    | {
        node: UserLikeWithID;
      }
    | null
    | undefined
  > | null,
  extraUsers: ReadonlyArray<[PlayerID, UserLike | undefined]> | null = null,
): ReadonlyMap<PlayerID, UserLike | undefined> {
  return useMemo(
    () =>
      new Map([
        ...(map
          ?.getPlayers()
          .map(
            (player) =>
              [
                player.id,
                player.isHumanPlayer()
                  ? nodes?.find((edge) => edge?.node.id === player.userId)?.node
                  : player.isBot()
                    ? botToUser(player)
                    : undefined,
              ] as const,
          ) || []),
        ...(extraUsers || []),
      ]),
    [extraUsers, map, nodes],
  );
}
