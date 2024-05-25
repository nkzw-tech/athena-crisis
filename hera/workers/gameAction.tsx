import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import {
  decodeEffects,
  Effects,
  encodeEffects,
} from '@deities/apollo/Effects.tsx';
import { encodeActionResponse } from '@deities/apollo/EncodedActions.tsx';
import { encodeGameState, GameState } from '@deities/apollo/Types.tsx';
import MapData from '@deities/athena/MapData.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';

self.onmessage = function (event) {
  const [plainMap, encodedEffects, action, mutateAction] = event.data;

  const map = MapData.fromObject(plainMap);
  const currentViewer = map.getCurrentPlayer();
  const vision = map.createVisionObject(currentViewer);
  const effects = decodeEffects(encodedEffects);

  const [actionResponse, initialActiveMap, gameState, newEffects]: [
    ActionResponse | null,
    MapData | null,
    GameState | null,
    Effects | null,
  ] = executeGameAction(map, vision, effects, action, AIRegistry, mutateAction);

  self.postMessage([
    actionResponse ? encodeActionResponse(actionResponse) : null,
    initialActiveMap ? initialActiveMap?.toJSON() : null,
    gameState ? encodeGameState(gameState) : null,
    newEffects ? encodeEffects(newEffects) : null,
  ]);
};
