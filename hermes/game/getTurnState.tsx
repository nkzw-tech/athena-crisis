import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Effects, EncodedEffects } from '@deities/apollo/Effects.tsx';
import { EncodedActionResponse } from '@deities/apollo/EncodedActions.tsx';
import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import MapData from '@deities/athena/MapData.tsx';

export type PreviousGameState<M> = readonly [
  state: M,
  lastActionResponse:
    | (M extends MapData ? ActionResponse : EncodedActionResponse)
    | null,
  effects: M extends MapData ? Effects : EncodedEffects,
];

export default function getTurnState<
  M extends PlainMap | MapData,
  T extends M extends MapData ? ActionResponse : EncodedActionResponse,
  S extends M extends MapData ? Effects : EncodedEffects,
>(
  map: MapData,
  activeMap: M,
  effects: S,
  turnState: PreviousGameState<M> | null,
  isStart: boolean,
  ended: boolean,
  lastAction: T | null,
): PreviousGameState<M> | null {
  return (
    (!ended &&
      (isStart ||
      map.currentPlayer !== activeMap.currentPlayer ||
      map.round !== activeMap.round
        ? [activeMap, lastAction, effects]
        : turnState)) ||
    null
  );
}
