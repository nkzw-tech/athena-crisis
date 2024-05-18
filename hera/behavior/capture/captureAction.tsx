import type { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { UpAttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import type { GameActionResponse } from '@deities/apollo/Types.tsx';
import { CapturedWeapon, CaptureWeapon } from '@deities/athena/info/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function captureAction(
  { processGameActionResponse, requestFrame, update }: Actions,
  remoteAction: Promise<GameActionResponse>,
  newMap: MapData,
  actionResponse: ActionResponse,
  position: Vector,
): Promise<State> {
  if (actionResponse.type === 'Capture') {
    return new Promise((resolve) =>
      update((state) => ({
        ...resetBehavior(),
        animations: state.animations.set(position, {
          direction: UpAttackDirection,
          onComplete: (state) => {
            requestFrame(async () => {
              resolve(
                await update({
                  ...(await processGameActionResponse(await remoteAction)),
                  ...resetBehavior(),
                }),
              );
            });
            return {
              map: applyActionResponse(state.map, state.vision, actionResponse),
            };
          },
          type: 'capture',
          variant: 0,
          weapon: actionResponse.building ? CapturedWeapon : CaptureWeapon,
        }),
        behavior: new NullBehavior(),
      })),
    );
  }
  return update(null);
}
