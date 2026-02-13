import { ActivatePowerActionResponse } from '@deities/apollo/ActionResponse.tsx';
import getActivatePowerMessage from '@deities/hermes/messages/getActivatePowerMessage.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';
import activatePowerAction from './activatePowerAction.tsx';

export default async function clientActivatePowerAction(
  actions: Actions,
  state: State,
  actionResponse: ActivatePowerActionResponse,
): Promise<State> {
  const { processGameActionResponse, update } = actions;
  const { vision } = state;

  const message = getActivatePowerMessage(state.map, state.map, vision, actionResponse.skill);

  if (message) {
    state = await update(resetBehavior(NullBehavior));
    const [actionResponse] = message;
    state = await processGameActionResponse({
      others: [{ actionResponse }],
      self: null,
    });
  }

  return activatePowerAction(actions, state, actionResponse);
}
