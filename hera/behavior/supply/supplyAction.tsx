import { SupplyAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import type { UnitsWithPosition } from '@deities/athena/lib/getUnitsByPositions.tsx';
import { sortByVectorKey } from '@deities/athena/map/Vector.tsx';
import animateSupply from '../../lib/animateSupply.tsx';
import type { Actions, State, StateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function supplyAction(
  actions: Actions,
  state: State,
  unitsToRefill: UnitsWithPosition,
): StateLike | null {
  const { selectedPosition } = state;
  if (!selectedPosition) {
    return null;
  }

  const [remoteAction, , actionResponse] = actions.action(state, SupplyAction(selectedPosition));
  if (actionResponse.type !== 'Supply') {
    return null;
  }

  const complete = (state: State): StateLike => {
    actions.requestFrame(
      () =>
        void handleRemoteAction(actions, remoteAction, 'Supply', {
          restoreBehavior: false,
        }).catch(actions.throwError),
    );
    return {
      ...state,
      map: applyActionResponse(state.map, state.vision, actionResponse),
      ...resetBehavior(),
    };
  };

  return {
    ...animateSupply(state, sortByVectorKey(unitsToRefill), complete),
    ...resetBehavior(NullBehavior),
    position: selectedPosition,
  };
}
