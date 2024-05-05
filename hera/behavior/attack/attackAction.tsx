import {
  AttackBuildingAction,
  AttackUnitAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import Entity, { isBuilding } from '@deities/athena/map/Entity.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Actions, State } from '../../Types.tsx';
import clientAttackAction from './clientAttackAction.tsx';

export default async function attackAction(
  actions: Actions,
  from: Vector,
  unitA: Unit,
  to: Vector,
  entityB: Entity,
  state: State,
): Promise<State> {
  return clientAttackAction(
    actions,
    ...actions.action(
      state,
      isBuilding(entityB)
        ? AttackBuildingAction(from, to)
        : AttackUnitAction(from, to),
    ),
    from,
    unitA,
    to,
    entityB,
    state,
  );
}
