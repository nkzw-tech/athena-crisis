import { Skill, SkipTurnGainFundsSkillMultiplier } from '@deities/athena/info/Skill.tsx';
import calculateFunds from '@deities/athena/lib/calculateFunds.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { MutateActionResponseFn } from '../Action.tsx';
import { ActionResponse } from '../ActionResponse.tsx';
import isPlayerAction from './isPlayerAction.tsx';

const applySkipTurnGetFunds = (
  map: MapData,
  actionResponse: ActionResponse,
  hasPlayerActed: boolean,
): ActionResponse => {
  if (
    hasPlayerActed ||
    actionResponse.type !== 'EndTurn' ||
    actionResponse.miss ||
    !map.getCurrentPlayer().skills.has(Skill.SkipTurnGainFunds)
  ) {
    return actionResponse;
  }

  const bonus = Math.floor(
    calculateFunds(map, map.getCurrentPlayer()) * SkipTurnGainFundsSkillMultiplier,
  );

  return bonus > 0
    ? {
        ...actionResponse,
        current: {
          ...actionResponse.current,
          funds: Math.min(Number.MAX_SAFE_INTEGER, actionResponse.current.funds + bonus),
        },
      }
    : actionResponse;
};

export default function createSkillActionResponseMutator(
  hasCurrentPlayerActed: boolean,
  mutateAction?: MutateActionResponseFn,
): MutateActionResponseFn {
  let hasPlayerActed = hasCurrentPlayerActed;
  let lastPlayer: MapData['currentPlayer'] | null = null;
  let mutateNextAction = mutateAction;

  return (map, initialActionResponse) => {
    if (lastPlayer != null && lastPlayer !== map.currentPlayer) {
      hasPlayerActed = false;
    }
    lastPlayer = map.currentPlayer;
    const actionResponse = mutateNextAction
      ? mutateNextAction(map, initialActionResponse)
      : initialActionResponse;
    mutateNextAction = undefined;

    const result = applySkipTurnGetFunds(map, actionResponse, hasPlayerActed);

    if (isPlayerAction(actionResponse)) {
      hasPlayerActed = true;
    }

    return result;
  };
}
