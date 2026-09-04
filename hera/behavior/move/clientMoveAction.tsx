import { MoveActionResponse } from '@deities/apollo/ActionResponse.tsx';
import expectSelfActionResponse from '@deities/apollo/lib/expectSelfActionResponse.tsx';
import gameHasEnded from '@deities/apollo/lib/gameHasEnded.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import addMoveAnimation from '../../lib/addMoveAnimation.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export type OnCompleteMoveAction = (
  state: State,
  actionResponse: MoveActionResponse,
  gameActionResponse: GameActionResponse,
) => StateLike | null;

export default function clientMoveAction(
  actions: Actions,
  remoteAction: Promise<GameActionResponse>,
  newMap: MapData,
  from: Vector,
  to: Vector,
  initialPath: ReadonlyArray<Vector> | null | undefined,
  fields: ReadonlyMap<Vector, RadiusItem>,
  state: State,
  onComplete: OnCompleteMoveAction,
  realPosition: Vector = from,
  partial?: boolean,
  complete?: boolean,
): StateLike {
  const { processGameActionResponse, requestFrame, throwError, update } = actions;
  const { animations, map, vision } = state;
  const path = initialPath || getMovementPath(map, to, fields, vision).path;
  return {
    animations: addMoveAnimation(animations, {
      endSound: map.units.get(to) ? 'Unit/Load' : undefined,
      from,
      onComplete: (state) => {
        if (complete) {
          requestFrame(
            () =>
              void handleRemoteAction(actions, remoteAction, 'Move', {
                restoreBehavior: false,
              }).catch(throwError),
          );
          return {
            ...state,
            map: newMap,
            ...resetBehavior(),
          };
        }

        remoteAction
          .then(async (gameActionResponse) => {
            const actionResponse = expectSelfActionResponse(gameActionResponse, 'Move');

            update({
              ...onComplete(
                await processGameActionResponse(gameActionResponse),
                actionResponse,
                gameActionResponse,
              ),
              ...(gameHasEnded(gameActionResponse.others)
                ? {
                    behavior: new NullBehavior(),
                  }
                : null),
            });
          })
          .catch(throwError);

        return {
          ...state,
          map: newMap,
        };
      },
      partial,
      path,
      realPosition,
      tiles: path.map((vector) => map.getTileInfo(vector)),
    }),
    behavior: new NullBehavior(),
    radius: null,
    selectedPosition: from,
    selectedUnit: map.units.get(from),
  };
}
