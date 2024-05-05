import { SabotageAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import getSabotageableVectors from '@deities/athena/lib/getSabotageableVectors.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import getFirst from '@deities/hephaestus/getFirst.tsx';
import { RadiusType } from '../Radius.tsx';
import { Actions, State, StateLike } from '../Types.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import sabotageAction from './sabotage/sabotageAction.tsx';

export default class Sabotage {
  public readonly type = 'sabotage' as const;

  select(vector: Vector, state: State, actions: Actions): StateLike | null {
    const { map, radius, selectedPosition } = state;
    const unitB = radius?.fields.has(vector) && map.units.get(vector);
    if (selectedPosition && unitB) {
      const actionResponse = actions.optimisticAction(
        state,
        SabotageAction(selectedPosition, vector),
      );
      if (actionResponse.type === 'Sabotage') {
        return sabotageAction(actionResponse, state);
      }
    }
    return selectFallback(vector, state, actions);
  }

  activate(state: State): StateLike | null {
    const { map, selectedPosition, selectedUnit } = state;
    if (selectedUnit && selectedPosition) {
      const fields = new Map(
        [...getSabotageableVectors(map, selectedPosition)].map((vector) => [
          vector,
          RadiusItem(vector),
        ]),
      );
      const first = getFirst(fields.keys());
      return {
        position: first,
        radius: {
          fields,
          path: first ? [first] : null,
          type: RadiusType.Sabotage,
        },
      };
    }
    return resetBehavior();
  }
}
