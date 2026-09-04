import type { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import type { GameActionResponse } from '@deities/apollo/Types.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function createTracksAction(
  actions: Actions,
  remoteAction: Promise<GameActionResponse>,
  _newMap: MapData,
  actionResponse: ActionResponse,
): Promise<State> {
  const { requestFrame, update } = actions;
  if (actionResponse.type !== 'CreateTracks') {
    return update(null);
  }

  return new Promise((resolve, reject) => {
    void update((state) => ({
      animations: state.animations.set(actionResponse.from, {
        onComplete: (state) => {
          const newState = { ...state, ...resetBehavior() };
          requestFrame(() => {
            resolve(newState);
            void handleRemoteAction(actions, remoteAction, 'CreateTracks', {
              restoreBehavior: false,
            }).catch(actions.throwError);
          });
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
