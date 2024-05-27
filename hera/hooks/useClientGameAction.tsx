import { Action } from '@deities/apollo/Action.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { MutateActionResponseFnName } from '@deities/apollo/ActionResponseMutator.tsx';
import encodeGameActionResponse from '@deities/apollo/actions/encodeGameActionResponse.tsx';
import {
  decodeEffects,
  Effects,
  EncodedEffects,
  encodeEffects,
} from '@deities/apollo/Effects.tsx';
import {
  decodeActionResponse,
  encodeAction,
  EncodedActionResponse,
} from '@deities/apollo/EncodedActions.tsx';
import { decodeGameState } from '@deities/apollo/GameState.tsx';
import { computeVisibleEndTurnActionResponse } from '@deities/apollo/lib/computeVisibleActions.tsx';
import decodeGameActionResponse from '@deities/apollo/lib/decodeGameActionResponse.tsx';
import dropLabelsFromActionResponse from '@deities/apollo/lib/dropLabelsFromActionResponse.tsx';
import dropLabelsFromGameState from '@deities/apollo/lib/dropLabelsFromGameState.tsx';
import {
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
import gameActionWorker from '../workers/gameAction.tsx?worker';

type ClientGameAction = [
  actionResponse: EncodedActionResponse,
  map: PlainMap,
  gameState: EncodedGameState,
  effects: EncodedEffects,
];

const ActionError = (action: Action) =>
  new Error(`Map: Error executing remote '${action.type}' action.`);

export default function useClientGameAction(
  game: ClientGame | null,
  setGame: (game: ClientGame) => void,
  mutateAction?: MutateActionResponseFnName | null,
) {
  return useCallback(
    async (action: Action): Promise<GameActionResponse> => {
      if (!game) {
        throw new Error('Client Game: Map state is missing.');
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
        throw ActionError(action);
      }

      try {
        const worker = new gameActionWorker();
        const [
          encodedActionResponse,
          plainMap,
          encodedGameState,
          encodedEffects,
        ] = await new Promise<ClientGameAction>((resolve) => {
          worker.postMessage([
            map.toJSON(),
            encodeEffects(game.effects),
            encodeAction(action),
            mutateAction,
          ]);
          worker.onmessage = (event: MessageEvent<ClientGameAction>) =>
            resolve(event.data);
        });

        actionResponse = decodeActionResponse(encodedActionResponse);
        initialActiveMap = MapData.fromObject(plainMap);
        gameState = decodeGameState(encodedGameState);
        newEffects = decodeEffects(encodedEffects);
      } catch (error) {
        throw process.env.NODE_ENV === 'development'
          ? error
          : ActionError(action);
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

        return decodeGameActionResponse(
          encodeGameActionResponse(
            map,
            initialActiveMap,
            vision,
            onGameEnd(gameState, newEffects || game.effects, currentViewer.id),
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
      throw ActionError(action);
    },
    [game, mutateAction, setGame],
  );
}
