import { MoveAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { MoveActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import addFlashAnimation from '../../lib/addFlashAnimation.tsx';
import addMoveAnimation from '../../lib/addMoveAnimation.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import NullBehavior from '../NullBehavior.tsx';
import clientMoveAction from './clientMoveAction.tsx';
import moveAction from './moveAction.tsx';

const completeUnit = (map: MapData, vision: VisionT, from: Vector) =>
  applyActionResponse(map, vision, {
    from,
    type: 'CompleteUnit',
  });

const addBlockedAnimation = (state: State, blockedBy: Vector) => ({
  animations: addFlashAnimation(state.animations, {
    children: `${state.map.units.get(blockedBy)?.info.name}!`,
    color: 'error',
    position: blockedBy,
  }),
});

export default function syncMoveAction(
  actions: Actions,
  from: Vector,
  to: Vector,
  fields: ReadonlyMap<Vector, RadiusItem>,
  state: State,
  onComplete: (
    state: State,
    actionResponse: MoveActionResponse,
  ) => StateLike | null,
  _path: ReadonlyArray<Vector> | null,
  // Here for compatibility with `moveAction`.
  _?: unknown,
  __?: unknown,
  complete?: boolean,
): StateLike {
  const { map, vision } = state;
  const path = _path || getMovementPath(map, to, fields, null).path;
  const initialPath: Array<Vector> = [];
  for (const vector of path) {
    if (!vision.isVisible(map, vector)) {
      break;
    }

    initialPath.push(vector);
  }

  // If every step is visible, fall back to the optimistic move.
  const partialPosition = initialPath.at(-1);
  if (!partialPosition) {
    return state;
  }

  if (partialPosition === path.at(-1)) {
    return moveAction(
      actions,
      from,
      to,
      fields,
      state,
      onComplete,
      path,
      undefined,
      undefined,
      complete,
    );
  }

  // Otherwise immediately initiate the move on the server and stop early
  // if the unit is running into an opponent.
  const { action, requestFrame, throwError, update } = actions;
  const [remoteAction] = action(state, MoveAction(from, to, path, complete));
  return {
    animations: addMoveAnimation(state.animations, {
      endSound:
        vision.isVisible(map, to) && map.units.get(to)
          ? 'Unit/Load'
          : undefined,
      from,
      onComplete: (state) => {
        // Only initiate the follow-up action after the partial move has completed.
        remoteAction
          .then(async (gameActionResponse) => {
            const actionResponse = gameActionResponse.self?.actionResponse;
            if (actionResponse?.type !== 'Move') {
              throw new Error(
                `Expected remote 'MoveActionResponse', received '${JSON.stringify(actionResponse)}'`,
              );
            }

            const remainingPath =
              actionResponse.path ||
              getMovementPath(map, actionResponse.to, fields, null).path;

            update(
              clientMoveAction(
                actions,
                remoteAction,
                applyActionResponse(state.map, state.vision, actionResponse),
                partialPosition,
                actionResponse.to,
                remainingPath.slice(remainingPath.indexOf(partialPosition) + 1),
                fields,
                state,
                (state) => {
                  const blockedBy = !actionResponse.to.equals(to)
                    ? path[path.indexOf(actionResponse.to) + 1]
                    : null;
                  const complete = actionResponse.completed || !!blockedBy;
                  requestFrame(() => {
                    update(
                      onComplete(
                        {
                          ...state,
                          ...(complete
                            ? {
                                map: completeUnit(
                                  state.map,
                                  state.vision,
                                  actionResponse.to,
                                ),
                              }
                            : null),
                          ...(blockedBy
                            ? addBlockedAnimation(state, blockedBy)
                            : null),
                        },
                        actionResponse,
                      ),
                    );
                  });
                  return state;
                },
                from,
                complete,
              ),
            );
          })
          .catch(throwError);
        return state;
      },
      partial: true,
      path: initialPath,
      tiles: initialPath.map((vector) => map.getTileInfo(vector)),
    }),
    behavior: new NullBehavior(),
    radius: null,
  };
}
