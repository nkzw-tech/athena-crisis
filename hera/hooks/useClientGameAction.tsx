import { Action, MutateActionResponseFn } from '@deities/apollo/Action.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import encodeGameActionResponse from '@deities/apollo/actions/encodeGameActionResponse.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import { computeVisibleEndTurnActionResponse } from '@deities/apollo/lib/computeVisibleActions.tsx';
import decodeGameActionResponse from '@deities/apollo/lib/decodeGameActionResponse.tsx';
import dropLabelsFromActionResponse from '@deities/apollo/lib/dropLabelsFromActionResponse.tsx';
import dropLabelsFromGameState from '@deities/apollo/lib/dropLabelsFromGameState.tsx';
import { GameActionResponse, GameState } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { getHiddenLabels } from '@deities/athena/WinConditions.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import onGameEnd from '@deities/hermes/game/onGameEnd.tsx';
import toClientGame, {
  ClientGame,
} from '@deities/hermes/game/toClientGame.tsx';
import { useCallback } from 'react';

const ActionError = (action: Action) =>
  new Error(`Map: Error executing remote '${action.type}' action.`);

export default function useClientGameAction(
  game: ClientGame | null,
  setGame: (game: ClientGame) => void,
  mutateAction?: MutateActionResponseFn,
) {
  return useCallback(
    (action: Action): Promise<GameActionResponse> => {
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
        [actionResponse, initialActiveMap, gameState, newEffects] =
          executeGameAction(
            map,
            vision,
            game.effects,
            action,
            AIRegistry,
            mutateAction,
          ) || [null, null, null];
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
