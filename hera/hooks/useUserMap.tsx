import { PlayerID } from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { useMemo } from 'react';
import { CharacterImage } from '../character/PortraitPicker.tsx';
import botToUser from '../lib/botToUser.tsx';

export type UserLike = Readonly<{
  character: CharacterImage;
  displayName: string;
  username: string;
}>;

export type UserLikeWithID = UserLike & Readonly<{ id: string }>;
export type UserWithSkills = UserLikeWithID &
  Readonly<{
    skillSlots: number;
    skills: ReadonlyArray<number>;
  }>;

type FactionName = Readonly<{
  factionName: string;
}>;
export type UserWithIDAndFactionName = UserLikeWithID & FactionName;
export type UserWithFactionNameAndSkills = UserWithSkills & FactionName;

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
