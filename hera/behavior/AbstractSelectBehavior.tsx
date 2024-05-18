import type Building from '@deities/athena/map/Building.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import type Unit from '@deities/athena/map/Unit.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import { useCallback } from 'react';
import type { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import SelectEntity from '../ui/SelectEntity.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';

export default abstract class AbstractSelectBehavior {
  protected abstract onSelect(
    vector: Vector,
    state: State,
    entity: Entity,
  ): StateLike | null;

  protected abstract canSelectCandidates(
    state: State,
    unit?: Unit | null,
    building?: Building | null,
  ): { building: Building | null; unit: Unit | null };

  select(vector: Vector, state: State, actions: Actions): StateLike | null {
    const { map, selectedBuilding, selectedPosition, selectedUnit, vision } =
      state;

    if (!vision.isVisible(map, vector)) {
      return resetBehavior(state.initialBehaviorClass);
    }

    if (
      selectedBuilding &&
      selectedUnit &&
      selectedPosition &&
      !selectedPosition.equals(vector)
    ) {
      return selectFallback(vector, state, actions);
    }

    const { building, unit } = this.canSelectCandidates(
      state,
      map.units.get(vector),
      map.buildings.get(vector),
    );

    return this.getState(vector, state, unit, building);
  }

  protected getState(
    vector: Vector,
    state: State,
    unit: Unit | null,
    building: Building | null,
  ): StateLike | null {
    const unitState = unit && this.onSelect(vector, state, unit);
    const buildingState = building && this.onSelect(vector, state, building);

    if (unitState && buildingState) {
      // Force a Flyout.
      return {
        namedPositions: null,
        position: vector,
        selectedBuilding: building,
        selectedPosition: vector,
        selectedUnit: unit,
      };
    }

    return (
      unitState ||
      buildingState || {
        namedPositions: null,
        selectedBuilding: null,
        selectedUnit: null,
      }
    );
  }

  component = ({ actions, state }: StateWithActions): JSX.Element | null => {
    return (
      <SelectEntity
        actions={actions}
        onSelectBuilding={useCallback(
          (position, building) =>
            actions.update(this.getState(position, state, null, building)),
          [actions, state],
        )}
        onSelectUnit={useCallback(
          (position, unit) =>
            actions.update(this.getState(position, state, unit, null)),
          [actions, state],
        )}
        state={state}
      />
    );
  };
}
