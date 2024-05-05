import { MoveAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { MoveActionResponse } from '@deities/apollo/ActionResponse.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import { Actions, State, StateLike } from '../../Types.tsx';
import clientMoveAction from './clientMoveAction.tsx';

export default function moveAction(
  actions: Actions,
  from: Vector,
  to: Vector,
  fields: ReadonlyMap<Vector, RadiusItem>,
  state: State,
  onComplete: (
    state: State,
    actionResponse: MoveActionResponse,
  ) => StateLike | null,
  path: ReadonlyArray<Vector> | null,
  realPosition: Vector = from,
  partial?: boolean,
  complete?: boolean,
): StateLike {
  const [remoteAction, newMap] = actions.action(
    state,
    MoveAction(realPosition, to, path, complete),
  );

  return clientMoveAction(
    actions,
    remoteAction,
    newMap,
    from,
    to,
    path,
    fields,
    state,
    onComplete,
    realPosition,
    partial,
  );
}
