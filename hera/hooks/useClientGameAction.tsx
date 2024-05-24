import { Action, MutateActionResponseFn } from '@deities/apollo/Action.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import encodeGameActionResponse from '@deities/apollo/actions/encodeGameActionResponse.tsx';
import {
  decodeEffects,
  Effects,
  EncodedEffects,
  encodeEffects,
} from '@deities/apollo/Effects.tsx';
import {
  decodeActionResponse,
  EncodedActionResponse,
} from '@deities/apollo/EncodedActions.tsx';
import { computeVisibleEndTurnActionResponse } from '@deities/apollo/lib/computeVisibleActions.tsx';
import decodeGameActionResponse from '@deities/apollo/lib/decodeGameActionResponse.tsx';
import dropLabelsFromActionResponse from '@deities/apollo/lib/dropLabelsFromActionResponse.tsx';
import dropLabelsFromGameState from '@deities/apollo/lib/dropLabelsFromGameState.tsx';
import {
  decodeGameState,
  EncodedGameState,
  GameActionResponse,
  GameState,
} from '@deities/apollo/Types.tsx';
import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { getHiddenLabels } from '@deities/athena/WinConditions.tsx';
import onGameEnd from '@deities/hermes/game/onGameEnd.tsx';
import toClientGame, {
  ClientGame,
} from '@deities/hermes/game/toClientGame.tsx';
import { useCallback } from 'react';
import EvaluationWorker from '../editor/workers/evaluation?worker';

var worker = new EvaluationWorker();

const ActionError = (action: Action) =>
  new Error(`Map: Error executing remote '${action.type}' action.`);

export default function useClientGameAction(
  game: ClientGame | null,
  setGame: (game: ClientGame) => void,
  mutateAction?: MutateActionResponseFn,
) {
  return useCallback(
    async (action: Action): Promise<GameActionResponse> => {
      if (!game) {
        return Promise.reject(new Error('Client Game: Map state is missing.'));
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
        return Promise.reject(ActionError(action));
      }

      try {
        const [
          encodedActionResponse,
          plainMap,
          encodedGameState,
          encodedEffects,
        ] = await new Promise<
          [EncodedActionResponse, PlainMap, EncodedGameState, EncodedEffects]
        >((resolve) => {
          worker.postMessage([
            map.toJSON(),
            encodeEffects(game.effects),
            action,
            mutateAction,
          ]);
          worker.onmessage = (event) => resolve(event.data);
        });

        actionResponse = decodeActionResponse(encodedActionResponse);
        initialActiveMap = MapData.fromObject(plainMap);
        gameState = decodeGameState(encodedGameState);
        newEffects = decodeEffects(encodedEffects);
      } catch (error) {
        return Promise.reject(
          process.env.NODE_ENV === 'development' ? error : ActionError(action),
        );
      }

      if (actionResponse && initialActiveMap && gameState) {
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

        return Promise.resolve(
          decodeGameActionResponse(
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
          ),
        );
      }
      return Promise.reject(ActionError(action));
    },
    [game, mutateAction, setGame],
  );
}
