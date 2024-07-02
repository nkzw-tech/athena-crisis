import { Action } from '@deities/apollo/Action.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { MutateActionResponseFnName } from '@deities/apollo/ActionResponseMutator.tsx';
import encodeGameActionResponse from '@deities/apollo/actions/encodeGameActionResponse.tsx';
import {
  decodeEffects,
  Effects,
  encodeEffects,
} from '@deities/apollo/Effects.tsx';
import {
  decodeActionResponse,
  encodeAction,
} from '@deities/apollo/EncodedActions.tsx';
import { decodeGameState } from '@deities/apollo/GameState.tsx';
import { computeVisibleEndTurnActionResponse } from '@deities/apollo/lib/computeVisibleActions.tsx';
import decodeGameActionResponse from '@deities/apollo/lib/decodeGameActionResponse.tsx';
import dropLabelsFromActionResponse from '@deities/apollo/lib/dropLabelsFromActionResponse.tsx';
import dropLabelsFromGameState from '@deities/apollo/lib/dropLabelsFromGameState.tsx';
import { GameActionResponse, GameState } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { getHiddenLabels } from '@deities/athena/Objectives.tsx';
import onGameEnd from '@deities/hermes/game/onGameEnd.tsx';
import toClientGame, {
  ClientGame,
} from '@deities/hermes/game/toClientGame.tsx';
import { useCallback, useRef } from 'react';
import gameActionWorker from '../workers/gameAction.tsx?worker';
import {
  ClientGameActionRequest,
  ClientGameActionResponse,
} from '../workers/Types.tsx';

const ActionError = (action: Action, map: MapData) =>
  new Error(
    `Map: Error executing remote '${action.type}' action.\nAction: '${JSON.stringify(action)}'\nMap: '${JSON.stringify(map)}'`,
  );

let worker: Worker | null = null;
const getWorker = () => {
  if (worker) {
    return worker;
  }
  worker = new gameActionWorker();
  worker.onerror = () => {
    worker?.terminate();
    worker = null;
  };
  return worker;
};

export default function useClientGameAction(
  getCurrentGame: (ClientGame | null) | (() => ClientGame | null),
  setGame: (game: ClientGame) => void,
  onGameAction?:
    | ((
        gameState: GameState | null,
        activeMap: MapData,
        actionResponse: ActionResponse,
      ) => Promise<void>)
    | null,
  mutateAction?: MutateActionResponseFnName | null,
) {
  const actionQueue = useRef<Promise<GameActionResponse>>();
  return useCallback(
    (action: Action): Promise<GameActionResponse> =>
      (actionQueue.current = (
        actionQueue.current || Promise.resolve(null)
      ).then(async () => {
        const game =
          typeof getCurrentGame === 'function'
            ? getCurrentGame()
            : getCurrentGame;

        if (!game) {
          throw new Error('Client Game: Map state is missing.');
        }

        if (game.ended) {
          throw new Error('Client Game: Game has ended.');
        }

        let actionResponse: ActionResponse | null;
        let initialActiveMap: MapData | null;
        let gameState: GameState | null;
        let newEffects: Effects | null;

        const map = game.state;
        const currentViewer = map.getCurrentPlayer();
        const vision = map.createVisionObject(currentViewer);
        const isStart = action.type === 'Start';

        if (isStart === !!game.lastAction) {
          throw ActionError(action, map);
        }

        try {
          const message: ClientGameActionRequest = [
            map.toJSON(),
            encodeEffects(game.effects),
            encodeAction(action),
            mutateAction,
          ];

          const [
            encodedActionResponse,
            plainMap,
            encodedGameState,
            encodedEffects,
          ] = await new Promise<ClientGameActionResponse>((resolve, reject) => {
            const { port1, port2 } = new MessageChannel();
            port1.onmessage = (
              event: MessageEvent<ClientGameActionResponse | null>,
            ) => {
              if (event.data) {
                resolve(event.data);
              } else {
                reject();
              }
            };
            port1.onmessageerror = reject;
            getWorker().postMessage(message, [port2]);
          });
          actionResponse = decodeActionResponse(encodedActionResponse);
          initialActiveMap = MapData.fromObject(plainMap);
          gameState = decodeGameState(encodedGameState);
          newEffects = encodedEffects ? decodeEffects(encodedEffects) : null;
        } catch (error) {
          throw process.env.NODE_ENV === 'development' && error
            ? error
            : ActionError(action, map);
        }

        if (actionResponse && initialActiveMap && gameState) {
          const lastEntry = gameState?.at(-1) || [
            actionResponse,
            initialActiveMap,
          ];

          await onGameAction?.(gameState, lastEntry[1], lastEntry[0]);

          setGame(
            toClientGame(
              game,
              initialActiveMap,
              gameState,
              newEffects,
              actionResponse,
            ),
          );

          const hiddenLabels = getHiddenLabels(map.config.winConditions);
          actionResponse = dropLabelsFromActionResponse(
            actionResponse,
            hiddenLabels,
          );
          gameState = dropLabelsFromGameState(gameState, hiddenLabels);

          return decodeGameActionResponse(
            encodeGameActionResponse(
              map,
              initialActiveMap,
              vision,
              onGameEnd(
                gameState,
                newEffects || game.effects,
                currentViewer.id,
              ),
              null,
              actionResponse?.type === 'EndTurn'
                ? computeVisibleEndTurnActionResponse(
                    actionResponse,
                    map,
                    initialActiveMap,
                    vision,
                  )
                : actionResponse,
            ),
          );
        }

        throw ActionError(action, map);
      })),
    [getCurrentGame, mutateAction, onGameAction, setGame],
  );
}
