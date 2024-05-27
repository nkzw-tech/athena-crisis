import './initializeWorker.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import ActionResponseMutator, {
  MutateActionResponseFnName,
} from '@deities/apollo/ActionResponseMutator.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import {
  decodeEffects,
  Effects,
  EncodedEffects,
  encodeEffects,
} from '@deities/apollo/Effects.tsx';
import {
  decodeAction,
  encodeActionResponse,
  EncodedAction,
} from '@deities/apollo/EncodedActions.tsx';
import { encodeGameState } from '@deities/apollo/GameState.tsx';
import { GameState } from '@deities/apollo/Types.tsx';
import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import MapData from '@deities/athena/MapData.tsx';
import AIRegistry from '@deities/dionysus/AIRegistry.tsx';

self.onmessage = function (
  event: MessageEvent<
    [
      map: PlainMap,
      encodedEffects: EncodedEffects,
      action: EncodedAction,
      mutateAction: MutateActionResponseFnName | undefined | null,
    ]
  >,
) {
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

  self.postMessage([
    actionResponse ? encodeActionResponse(actionResponse) : null,
    initialActiveMap ? initialActiveMap?.toJSON() : null,
    gameState ? encodeGameState(gameState) : null,
    newEffects ? encodeEffects(newEffects) : null,
  ]);
};
