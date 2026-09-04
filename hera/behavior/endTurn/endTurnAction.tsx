import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import dateNow from '@deities/apollo/lib/dateNow.tsx';
import expectSelfActionResponse from '@deities/apollo/lib/expectSelfActionResponse.tsx';
import gameHasEnded from '@deities/apollo/lib/gameHasEnded.tsx';
import getActionResponseVectors from '@deities/apollo/lib/getActionResponseVectors.tsx';
import addEndTurnAnimations from '../../lib/addEndTurnAnimations.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function endTurnAction(actions: Actions, state: State) {
  const { action, processGameActionResponse, throwError, update } = actions;
  const { map } = state;
  const [remoteAction, newMap, actionResponse] = action(state, EndTurnAction());
  if (actionResponse.type === 'EndTurn') {
    const remoteEndTurnAction = remoteAction
      .then((gameActionResponse) => ({
        actionResponse: expectSelfActionResponse(gameActionResponse, 'EndTurn'),
        gameActionResponse,
      }))
      .catch((error) => {
        throwError(error as Error);
        return null;
      });
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
      timeout: null,
    });
    await update({
      ...addEndTurnAnimations(
        actions,
        actionResponse,
        state,
        remoteEndTurnAction.then((result) => result?.actionResponse.supply || null),
        (state) => {
          remoteEndTurnAction.then(async (result) => {
            if (!result) {
              return;
            }
            const { actionResponse: endTurnActionResponse, gameActionResponse } = result;
            const hasEnded = gameHasEnded(gameActionResponse.others);
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

            await processGameActionResponse(gameActionResponse);
            if (!hasEnded) {
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
