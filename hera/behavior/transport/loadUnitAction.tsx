import { MoveAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import gameHasEnded from '@deities/apollo/lib/gameHasEnded.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type { RadiusItem } from '@deities/athena/Radius.tsx';
import addMoveAnimation from '../../lib/addMoveAnimation.tsx';
import type { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import syncMoveAction from '../move/syncMoveAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export type TransportData = Readonly<{
  moveable: ReadonlyMap<Vector, RadiusItem>;
  path: ReadonlyArray<Vector> | null;
  position: Vector;
  unit: Unit;
}>;

export default function loadUnitAction(
  transport: TransportData,
  actions: Actions,
  state: State,
): Promise<State> {
  const { map, selectedPosition } = state;
  if (!selectedPosition) {
    return actions.update(null);
  }

  const { moveable, path: initialPath, position } = transport;
  const path = initialPath || getMovementPath(map, position, moveable, null).path;
  if (map.config.fog) {
    return actions.update(
      syncMoveAction(
        actions,
        selectedPosition,
        position,
        moveable,
        state,
        (state, _, gameActionResponse) => ({
          ...state,
          ...resetBehavior(gameHasEnded(gameActionResponse.others) ? NullBehavior : undefined),
        }),
        path,
      ),
    );
  }

  const [remoteAction, , actionResponse] = actions.action(
    state,
    MoveAction(selectedPosition, position, path),
  );
  if (actionResponse.type !== 'Move') {
    return actions.update(null);
  }

  return new Promise((resolve, reject) => {
    void actions
      .update({
        animations: addMoveAnimation(state.animations, {
          endSound: 'Unit/Load',
          from: selectedPosition,
          onComplete: (state) => {
            const newState = {
              ...state,
              map: applyActionResponse(state.map, state.vision, actionResponse),
              ...resetBehavior(),
            };
            actions.requestFrame(() => {
              resolve(newState);
              void handleRemoteAction(actions, remoteAction, 'Move', {
                restoreBehavior: false,
              }).catch(actions.throwError);
            });
            return newState;
          },
          partial: true,
          path,
          tiles: path.map((vector) => map.getTileInfo(vector)),
        }),
        ...resetBehavior(NullBehavior),
      })
      .catch(reject);
  });
}
