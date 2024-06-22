import './initializeWorker.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import ActionResponseMutator from '@deities/apollo/ActionResponseMutator.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import {
  decodeEffects,
  Effects,
  encodeEffects,
} from '@deities/apollo/Effects.tsx';
import {
  decodeAction,
  encodeActionResponse,
} from '@deities/apollo/EncodedActions.tsx';
import { encodeGameState } from '@deities/apollo/GameState.tsx';
import { GameState } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';
import { ClientGameActionRequest, ClientGameActionResponse } from './Types.tsx';

self.onmessage = function (event: MessageEvent<ClientGameActionRequest>) {
  const [plainMap, encodedEffects, action, mutateAction] = event.data;
  const map = MapData.fromObject(plainMap);
  const vision = map.createVisionObject(map.getCurrentPlayer());
  const effects = decodeEffects(encodedEffects);
  const [actionResponse, initialActiveMap, gameState, newEffects]: [
    ActionResponse | null,
    MapData | null,
    GameState | null,
    Effects | null,
  ] = executeGameAction(
    map,
    vision,
    effects,
    decodeAction(action),
    AIRegistry,
    mutateAction ? ActionResponseMutator[mutateAction] : undefined,
  );

  const message: ClientGameActionResponse | null =
    actionResponse && initialActiveMap && gameState
      ? [
          encodeActionResponse(actionResponse),
          initialActiveMap.toJSON(),
          encodeGameState(gameState),
          newEffects ? encodeEffects(newEffects) : null,
        ]
      : null;

  if (event.ports.length === 1) {
    event.ports[0].postMessage(message);
  } else {
    for (const port of event.ports) {
      port.postMessage(message);
    }
  }
};
