import { ActivateCrystalActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import AnimationKey from '../../lib/AnimationKey.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function activateCrystalAction(
  actions: Actions,
  actionResponse: ActivateCrystalActionResponse,
): Promise<State> {
  const { requestFrame } = actions;
  const { update } = actions;

  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        crystal: actionResponse.crystal,
        onComplete: (state) => {
          requestFrame(() =>
            resolve({
              ...state,
              map: applyActionResponse(state.map, state.vision, actionResponse),
              ...resetBehavior(),
            }),
          );
          return null;
        },
        type: 'crystal',
      }),
      ...resetBehavior(NullBehavior),
    })),
  );
}
