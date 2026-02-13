import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import addMoveAnimation from '../../lib/addMoveAnimation.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function createUnitAction(
  actions: Actions,
  remoteAction: Promise<GameActionResponse>,
  newMap: MapData,
  actionResponse: ActionResponse,
): Promise<State> {
  const { requestFrame, update } = actions;
  if (actionResponse.type === 'CreateUnit') {
    const { from, to, unit } = actionResponse;
    return new Promise((resolve) =>
      update((state) => ({
        animations: addMoveAnimation(state.animations, {
          from: to.equals(from) ? new SpriteVector(from.x, from.y - 0.5) : from,
          onComplete: (state: State): StateLike => {
            requestFrame(async () => resolve(await handleRemoteAction(actions, remoteAction)));
            return {
              ...state,
              map: applyActionResponse(state.map, state.vision, actionResponse),
            };
          },
          path: [to],
          pathVisibility: [true, true],
          realPosition: to,
          tiles: [state.map.getTileInfo(to)],
        }),
        map: state.map.copy({
          units: state.map.units.set(to, unit.recover()),
        }),
        ...resetBehavior(NullBehavior),
      })),
    );
  }

  return update(null);
}
