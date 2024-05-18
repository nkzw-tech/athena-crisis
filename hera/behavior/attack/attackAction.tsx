import {
  AttackBuildingAction,
  AttackUnitAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import { isBuilding } from '@deities/athena/map/Entity.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type { Actions, State } from '../../Types.tsx';
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
