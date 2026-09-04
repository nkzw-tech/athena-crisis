import { CompleteUnitAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import type { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';

export default async function completeUnitAction(
  actions: Actions,
  state: State,
  position: Vector,
): Promise<State> {
  const [remoteAction, newMap, actionResponse] = actions.action(
    state,
    CompleteUnitAction(position),
  );
  if (actionResponse.type !== 'CompleteUnit') {
    return actions.update(null);
  }

  const newState = await actions.update({
    map: newMap,
    ...resetBehavior(),
  });

  void handleRemoteAction(actions, remoteAction, 'CompleteUnit', {
    restoreBehavior: false,
  }).catch(actions.throwError);
  return newState;
}
