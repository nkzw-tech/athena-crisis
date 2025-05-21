import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { decodeActionResponse } from '@deities/apollo/EncodedActions.tsx';
import { ReplayState } from '@deities/apollo/replay/Types.tsx';
import { GameState, MutableGameState } from '@deities/apollo/Types.tsx';
import getFirstHumanPlayer from '@deities/athena/lib/getFirstHumanPlayer.tsx';
import isPvP from '@deities/athena/lib/isPvP.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import parseInteger from '@nkzw/core/parseInteger.js';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { useMemo } from 'react';
import { UserLikeWithID } from '../../hooks/useUserMap.tsx';
import getPlayerEquippedUnitCustomizations from '../../lib/getPlayerEquippedUnitCustomizations.tsx';
import { PlayerDetail } from '../../Types.tsx';

export type ReplayStateWithViewer = Readonly<{
  state: ReplayState;
  viewer: string;
}>;

export default function useReplayGameState(
  replayState: ReplayStateWithViewer | null,
) {
  return useMemo((): [
    gameState: GameState,
    info: Readonly<{ mapName: string }> | null,
    users: ReadonlyMap<string, PlayerDetail & UserLikeWithID>,
  ] => {
    const users = new Map<string, PlayerDetail & UserLikeWithID>();
    if (!replayState) {
      return [[], null, users];
    }

    const gameState: MutableGameState = [];
    let info: { mapName: string } | null = null;
    let map: MapData | null = null;
    let vision: VisionT | null = null;

    for (const entry of replayState.state) {
      const entryType = entry.type;
      switch (entryType) {
        case 'info':
          info = entry;
          break;
        case 'users':
          for (const user of entry.users) {
            const [unitId, variant, color] = user.character
              .split('-')
              .map((id) => parseInteger(id));

            users.set(user.id, {
              ...user,
              character: {
                color: color ?? 1,
                unitId: unitId || 1,
                variant: variant || 0,
              },
              equippedUnitCustomizations: getPlayerEquippedUnitCustomizations(
                user.equippedUnitCustomizations,
              ),
            });
          }
          break;
        case 'map': {
          map = MapData.fromObject(entry.state);
          const player =
            map.getPlayerByUserId(replayState.viewer) ||
            (isPvP(map) ? 0 : getFirstHumanPlayer(map)) ||
            0;
          vision = map.createVisionObject(player);
          gameState.push([{ type: 'Start' }, map]);
          break;
        }
        case 'actions': {
          if (map && vision) {
            for (const encodedActionResponse of entry.actions) {
              const actionResponse = decodeActionResponse(
                encodedActionResponse,
              );
              map = applyActionResponse(map, vision, actionResponse);
              gameState.push([actionResponse, map]);
            }
          }
          break;
        }
        default: {
          entryType satisfies never;
          throw new UnknownTypeError('useReplayGameState', entryType);
        }
      }
    }

    return [gameState, info, users] as const;
  }, [replayState]);
}
