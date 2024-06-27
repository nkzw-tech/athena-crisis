import { CreateUnitActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import addMoveAnimation from '../../lib/addMoveAnimation.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function createUnitAction(
  { requestFrame, update }: Actions,
  actionResponse: CreateUnitActionResponse,
): Promise<State> {
  const { from, to, unit } = actionResponse;
  return new Promise((resolve) =>
    update((state) => ({
      animations: addMoveAnimation(state.animations, {
        from: to.equals(from) ? new SpriteVector(from.x, from.y - 0.5) : from,
        onComplete: (state: State): StateLike => {
          const newState = {
            ...state,
            map: applyActionResponse(state.map, state.vision, actionResponse),
          };
          requestFrame(() =>
            resolve({
              ...newState,
              ...resetBehavior(),
            }),
          );
          return newState;
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
