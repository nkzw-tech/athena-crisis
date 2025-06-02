import Vector from '@deities/athena/map/Vector.tsx';
import {
  Actions,
  MapBehavior,
  MapBehaviorConstructor,
  State,
  StateLike,
} from '../Types.tsx';

let _behaviorClass: MapBehaviorConstructor;

export function resetBehavior(
  defaultBehavior?: MapBehaviorConstructor | null,
): StateLike {
  return {
    additionalRadius: null,
    attackable: null,
    confirmAction: null,
    navigationDirection: null,
    radius: null,
    selectedAttackable: null,
    selectedBuilding: null,
    selectedMessagePosition: null,
    selectedPosition: null,
    selectedUnit: null,
    showCursor: true,
    ...(defaultBehavior !== null
      ? { behavior: new (defaultBehavior || _behaviorClass)() }
      : null),
  };
}

export const selectFallback: NonNullable<MapBehavior['select']> = (
  vector: Vector,
  state: State,
  actions: Actions,
): StateLike => {
  const { selectedPosition } = state;
  const reset = resetBehavior(state.initialBehaviorClass || _behaviorClass);
  if (selectedPosition?.equals(vector)) {
    return reset;
  }

  const newState = {
    ...state,
    ...reset,
    position: vector,
  };
  return {
    ...newState,
    ...newState.behavior?.select?.(vector, newState, actions),
  };
};

export function setBaseClass(behaviorClass: MapBehaviorConstructor) {
  _behaviorClass = behaviorClass;
}
