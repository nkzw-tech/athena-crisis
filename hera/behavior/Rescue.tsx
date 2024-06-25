import { RescueAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import getRescuableVectors from '@deities/athena/lib/getRescuableVectors.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import getFirst from '@deities/hephaestus/getFirst.tsx';
import { RadiusType } from '../Radius.tsx';
import { Actions, State, StateLike } from '../Types.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import rescueAction from './rescue/rescueAction.tsx';

export default class Rescue {
  public readonly type = 'rescue' as const;

  select(vector: Vector, state: State, actions: Actions): StateLike | null {
    const { action, requestFrame } = actions;
    const { map, radius, selectedPosition } = state;
    const unitB = radius?.fields.has(vector) && map.units.get(vector);
    if (selectedPosition && unitB) {
      requestFrame(() =>
        rescueAction(
          actions,
          ...action(state, RescueAction(selectedPosition, vector)),
        ),
      );
      return null;
    }
    return selectFallback(vector, state, actions);
  }

  activate(state: State): StateLike | null {
    const { map, selectedPosition, selectedUnit } = state;
    if (selectedUnit && selectedPosition) {
      const fields = new Map(
        [...getRescuableVectors(map, selectedPosition)].map((vector) => [
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
          type: RadiusType.Rescue,
        },
      };
    }
    return resetBehavior();
  }
}
