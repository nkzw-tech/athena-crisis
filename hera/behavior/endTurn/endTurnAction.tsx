import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { EndTurnActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import getActionResponseVectors from '@deities/apollo/lib/getActionResponseVectors.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import dateNow from '@deities/hephaestus/dateNow.tsx';
import addEndTurnAnimations from '../../lib/addEndTurnAnimations.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

const getEndTurnActionResponse = (
  gameActionResponse: GameActionResponse,
): EndTurnActionResponse | null => {
  const actionResponse = gameActionResponse.self?.actionResponse;
  return actionResponse?.type === 'EndTurn' ? actionResponse : null;
};

export default async function endTurnAction(actions: Actions, state: State) {
  const { action, processGameActionResponse, update } = actions;
  const { map } = state;
  const [remoteAction, newMap, actionResponse] = action(state, EndTurnAction());
  if (actionResponse.type === 'EndTurn') {
    const { current, next } = actionResponse;
    // Use this map as the base for `applyActionResponse` so that mutations during the
    // end turn animations don't affect the final result.
    const nextMap = map.recover(current.player).copy({
      currentPlayer: next.player,
    });
    await actions.scrollIntoView(getActionResponseVectors(map, actionResponse));
    // Update the current player immediately so that the funds will be animated.
    await update({
      map: nextMap,
    });
    await update({
      ...addEndTurnAnimations(
        actions,
        actionResponse,
        state,
        remoteAction.then(
          (gameActionResponse) =>
            getEndTurnActionResponse(gameActionResponse)?.supply || null,
        ),
        (state) => {
          remoteAction.then(async (gameActionResponse) => {
            const endTurnActionResponse =
              getEndTurnActionResponse(gameActionResponse) || actionResponse;
            await update({
              ...state,
              map: applyActionResponse(
                nextMap.copy({
                  currentPlayer: current.player,
                }),
                state.vision,
                endTurnActionResponse,
              ),
            });

            const newState =
              await processGameActionResponse(gameActionResponse);
            if (newState.lastActionResponse?.type !== 'GameEnd') {
              await update(resetBehavior());
            }
          });

          return state;
        },
      ),
      ...resetBehavior(NullBehavior),
      lastActionResponse: actionResponse,
      lastActionTime: dateNow(),
      map: newMap
        .copy({
          units: map.units,
        })
        .recover(current.player),
    });
  }
}
