import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Effects, EncodedEffects } from '@deities/apollo/Effects.tsx';
import { EncodedActionResponse } from '@deities/apollo/EncodedActions.tsx';
import hasPlayerChange from '@deities/athena/lib/hasPlayerChange.tsx';
import { PlainMap } from '@deities/athena/map/PlainMap.tsx';
import MapData from '@deities/athena/MapData.tsx';

type RecentActionState<TAction, Effects> = [ReadonlyArray<TAction>, Effects];

export type PreviousGameState<
  M,
  TAction = M extends MapData ? ActionResponse : EncodedActionResponse,
  E = M extends MapData ? Effects : EncodedEffects,
> = readonly [
  state: M,
  lastActionResponse: TAction | null,
  effects: E,
  recentActions?: ReadonlyArray<RecentActionState<TAction, E>> | null,
];

export default function getTurnState<
  M extends PlainMap | MapData,
  TAction extends M extends MapData ? ActionResponse : EncodedActionResponse,
  E extends M extends MapData ? Effects : EncodedEffects,
>(
  previousMap: MapData,
  activeMap: M,
  effects: E,
  turnState: PreviousGameState<M> | null,
  isStart: boolean,
  ended: boolean,
  lastAction: TAction | null,
  actionResponses: ReadonlyArray<TAction>,
): PreviousGameState<M> | null {
  if (ended) {
    return null;
  }

  if (isStart || hasPlayerChange(previousMap, activeMap)) {
    return [activeMap, lastAction, effects, []];
  }

  if (!turnState || !lastAction) {
    return turnState;
  }

  const [state, lastActionResponse, turnEffects, recentActions] = turnState;
  return [
    state,
    lastActionResponse,
    turnEffects,
    actionResponses.length ? [...(recentActions || []), [actionResponses, effects]] : recentActions,
  ];
}
