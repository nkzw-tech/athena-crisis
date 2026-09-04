import { CreateTracksActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function createTracksAction(
  { requestFrame, update }: Actions,
  actionResponse: CreateTracksActionResponse,
): Promise<State> {
  return new Promise((resolve, reject) => {
    void update((state) => ({
      animations: state.animations.set(actionResponse.from, {
        onComplete: (state) => {
          const newState = { ...state, ...resetBehavior() };
          requestFrame(() => resolve(newState));
          return newState;
        },
        onCreate: (state) => ({
          map: applyActionResponse(state.map, state.vision, actionResponse),
        }),
        type: 'createBuilding',
        variant: 0,
      }),
      ...resetBehavior(NullBehavior),
    })).catch(reject);
  });
}
