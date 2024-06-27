import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { UpAttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import { CapturedWeapon, CaptureWeapon } from '@deities/athena/info/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function captureAction(
  actions: Actions,
  remoteAction: Promise<GameActionResponse>,
  newMap: MapData,
  actionResponse: ActionResponse,
  position: Vector,
): Promise<State> {
  const { requestFrame, update } = actions;
  if (actionResponse.type === 'Capture') {
    return new Promise((resolve) =>
      update((state) => ({
        animations: state.animations.set(position, {
          direction: UpAttackDirection,
          onComplete: (state) => {
            requestFrame(async () =>
              resolve(await handleRemoteAction(actions, remoteAction)),
            );
            return {
              map: applyActionResponse(state.map, state.vision, actionResponse),
            };
          },
          type: 'capture',
          variant: 0,
          weapon: actionResponse.building ? CapturedWeapon : CaptureWeapon,
        }),
        ...resetBehavior(NullBehavior),
      })),
    );
  }
  return update(null);
}
