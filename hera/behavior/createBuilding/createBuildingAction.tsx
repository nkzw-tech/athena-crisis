import { CreateBuildingAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { CreateBuildingActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { BuildingInfo } from '@deities/athena/info/Building.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Actions, State, StateLike, StateToStateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function createBuildingAction(
  { optimisticAction }: Actions,
  position: Vector,
  building: BuildingInfo,
  state: State,
  onComplete: StateToStateLike = (state) => state,
): StateLike | null {
  const actionResponse = optimisticAction(
    state,
    CreateBuildingAction(position, building.id),
  );
  return actionResponse.type === 'CreateBuilding'
    ? addCreateBuildingAnimation(actionResponse, state, onComplete)
    : null;
}

export function addCreateBuildingAnimation(
  actionResponse: CreateBuildingActionResponse,
  state: State,
  onComplete: StateToStateLike = (state) => state,
) {
  const { building, from } = actionResponse;
  return {
    animations: state.animations.set(from, {
      onComplete: (state) => {
        return onComplete({
          ...state,
          ...resetBehavior(),
          map: state.map.copy({
            buildings: state.map.buildings.set(from, building),
          }),
          position: from,
        });
      },
      onCreate: (state) => {
        const map = applyActionResponse(
          state.map,
          state.vision,
          actionResponse,
        );
        return {
          map: map.copy({
            buildings: map.buildings.set(from, building.recover()),
          }),
        };
      },
      type: 'createBuilding',
      variant: building.player,
    }),
    ...resetBehavior(NullBehavior),
  };
}
