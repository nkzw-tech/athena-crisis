import { Actions, MutateActionResponseFn } from '@deities/apollo/Action.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import encodeGameActionResponse from '@deities/apollo/actions/encodeGameActionResponse.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import { formatAction } from '@deities/apollo/FormatActions.tsx';
import {
  EncodedGameActionResponse,
  GameState,
} from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import onGameEnd from '@deities/hermes/game/onGameEnd.tsx';

export default function executeGameActions(
  map: MapData,
  actions: Actions,
  effects?: Effects,
  mutateAction?: MutateActionResponseFn,
): [GameState, EncodedGameActionResponse, Effects | null] {
  let actionResponse: ActionResponse | null = null;
  let activeMap: MapData | null = null;
  let currentMap: MapData | null = map;
  let gameState: GameState = [];
  let newEffects: Effects | null = effects || new Map();

  if (!actions.length) {
    throw new Error(`executeGameActions: No actions were provided.`);
  }

  for (const action of actions) {
    if (!currentMap) {
      throw new Error(
        `executeGameActions: 'currentMap' is 'null' when trying to execute action \`${formatAction(
          action,
          {
            colors: process.stdout.isTTY,
          },
        )}\`.`,
      );
    }

    let currentGameState: GameState | null = null;
    [actionResponse, activeMap, currentGameState, newEffects] =
      executeGameAction(
        currentMap,
        currentMap.createVisionObject(currentMap.getCurrentPlayer()),
        newEffects || new Map(),
        action,
        AIRegistry,
        mutateAction,
      );
    if (!actionResponse || !activeMap || !currentGameState) {
      throw new Error(
        `executeGameActions: Failed to execute action \`${formatAction(action, {
          colors: process.stdout.isTTY,
        })}\`.`,
      );
    }
    gameState = gameState.concat(
      [[actionResponse, activeMap]],
      currentGameState,
    );
    if (currentGameState.at(-1)?.[0].type === 'GameEnd') {
      break;
    }

    currentMap = gameState.at(-1)![1];
  }

  gameState = onGameEnd(
    gameState,
    newEffects || effects || new Map(),
    map.currentPlayer,
  );

  return [
    gameState,
    encodeGameActionResponse(
      map,
      map,
      // Compute visible actions for the initial current player.
      map.createVisionObject(map.getCurrentPlayer()),
      gameState,
      null,
      null,
    ),
    newEffects,
  ];
}
