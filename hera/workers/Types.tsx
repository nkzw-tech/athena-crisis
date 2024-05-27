import { MutateActionResponseFnName } from '@deities/apollo/ActionResponseMutator.tsx';
import { EncodedEffects } from '@deities/apollo/Effects.tsx';
import {
  EncodedAction,
  EncodedActionResponse,
} from '@deities/apollo/EncodedActions.tsx';
import { EncodedGameState } from '@deities/apollo/Types.tsx';
import { PlainMap } from '@deities/athena/map/PlainMap.tsx';

export type ClientGameActionResponse = [
  actionResponse: EncodedActionResponse,
  map: PlainMap,
  gameState: EncodedGameState,
  effects: EncodedEffects | null,
];

export type ClientGameActionRequest = [
  map: PlainMap,
  encodedEffects: EncodedEffects,
  action: EncodedAction,
  mutateAction: MutateActionResponseFnName | undefined | null,
];
