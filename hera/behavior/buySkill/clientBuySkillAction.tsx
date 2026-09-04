import { BuySkillAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import type { Skill } from '@deities/athena/info/Skill.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type { Actions, State } from '../../Types.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import buySkillAction from './buySkillAction.tsx';

export default async function clientBuySkillAction(
  actions: Actions,
  state: State,
  position: Vector,
  skill: Skill,
): Promise<State> {
  const [remoteAction, , actionResponse] = actions.action(state, BuySkillAction(position, skill));
  if (actionResponse.type !== 'BuySkill') {
    return actions.update(null);
  }

  try {
    const newState = await actions.update(await buySkillAction(actions, actionResponse));
    void handleRemoteAction(actions, remoteAction, 'BuySkill', {
      restoreBehavior: false,
    }).catch(actions.throwError);
    return newState;
  } catch (error) {
    actions.throwError(error as Error);
    return actions.update(null);
  }
}
