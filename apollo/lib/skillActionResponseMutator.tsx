import { Skill, SkipTurnGainFundsSkillMultiplier } from '@deities/athena/info/Skill.tsx';
import calculateFunds from '@deities/athena/lib/calculateFunds.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { MutateActionResponseFn } from '../Action.tsx';
import { ActionResponse } from '../ActionResponse.tsx';

const applySkipTurnGetFunds = (
  map: MapData,
  actionResponse: ActionResponse,
  lastAction: ActionResponse | null,
): ActionResponse => {
  if (
    (lastAction?.type !== 'EndTurn' && lastAction?.type !== 'Start') ||
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
          funds: actionResponse.current.funds + bonus,
        },
      }
    : actionResponse;
};

export default function createSkillActionResponseMutator(
  hasPlayerActed: boolean,
  mutateAction?: MutateActionResponseFn,
): MutateActionResponseFn {
  let lastAction: ActionResponse | null = hasPlayerActed ? null : { type: 'Start' };
  let lastPlayer: MapData['currentPlayer'] | null = null;
  let mutateNextAction = mutateAction;

  return (map, initialActionResponse) => {
    if (lastPlayer != null && lastPlayer !== map.currentPlayer) {
      lastAction = { type: 'Start' };
    }
    lastPlayer = map.currentPlayer;
    const actionResponse = mutateNextAction
      ? mutateNextAction(map, initialActionResponse)
      : initialActionResponse;
    mutateNextAction = undefined;

    const result = applySkipTurnGetFunds(map, actionResponse, lastAction);

    if (actionResponse.type !== 'Message') {
      lastAction = actionResponse;
    }

    return result;
  };
}
