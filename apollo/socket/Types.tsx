import { EncodedAction } from '../EncodedActions.tsx';
import { EncodedGameActionResponseWithError } from '../Types.tsx';

export type ClientToServerEvents = {
  '/campaign-state/reset': (campaignStateID: string) => void;
  '/campaign-state/spectate': (campaignStateID: string) => void;
  '/game/action': (
    currentGameID: string,
    action: EncodedAction,
    emit: (gameActionResponse: EncodedGameActionResponseWithError) => void,
  ) => void;
  '/game/spectate': (
    gameID: string,
    spectatorCodes: ReadonlyArray<string>,
  ) => void;
};

export type ServerToClientEvents = {
  '/campaign-state/update': (campaignStateID: string) => void;
  '/game/action': (
    gameID: string,
    response: EncodedGameActionResponseWithError,
  ) => void;
  '/pending-game/update': (pendingGameID: string) => void;
};

export type ServerEventName = keyof ServerToClientEvents;

export function isValidServerEvent(action: string): action is ServerEventName {
  const serverAction = action as ServerEventName;
  switch (serverAction) {
    case '/campaign-state/update':
    case '/game/action':
    case '/pending-game/update':
      return true;
    default:
      serverAction satisfies never;
  }
  return false;
}
