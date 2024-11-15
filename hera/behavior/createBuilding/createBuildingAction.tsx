import { CreateBuildingAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import {
  ActionResponse,
  CreateBuildingActionResponse,
} from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import { BuildingInfo } from '@deities/athena/info/Building.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Actions, State, StateLike, StateToStateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function createBuildingAction(
  actions: Actions,
  position: Vector,
  building: BuildingInfo,
  state: State,
  onComplete: StateToStateLike = (state) => state,
): StateLike | null {
  return addCreateBuildingAnimation(
    actions,
    state,
    ...actions.action(state, CreateBuildingAction(position, building.id)),
    onComplete,
  );
}

export function addCreateBuildingAnimation(
  actions: Actions,
  state: State,
  remoteAction: Promise<GameActionResponse>,
  newMap: MapData,
  actionResponse: ActionResponse,
  onComplete: StateToStateLike = (state) => state,
) {
  if (actionResponse.type !== 'CreateBuilding') {
    return null;
  }

  const { building, from } = actionResponse;
  return {
    animations: state.animations.set(from, {
      onComplete: (state) => {
        actions.requestFrame(async () =>
          actions.update(
            onComplete(await handleRemoteAction(actions, remoteAction)),
          ),
        );

        return {
          ...state,
          map: state.map.copy({
            buildings: state.map.buildings.set(from, building),
          }),
          position: from,
        };
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

export function animateCreateBuilding(
  { requestFrame, update }: Actions,
  state: State,
  { building, from }: CreateBuildingActionResponse,
): Promise<State> {
  return new Promise((resolve) =>
    update({
      animations: state.animations.set(from, {
        onComplete: (state) => {
          requestFrame(async () => resolve(await update(null)));

          return {
            ...state,
            map: state.map.copy({
              buildings: state.map.buildings.set(from, building),
            }),
            position: from,
          };
        },
        onCreate: (state) => ({
          ...state,
          map: state.map.copy({
            buildings: state.map.buildings.set(from, building.recover()),
          }),
        }),
        type: 'createBuilding',
        variant: building.player,
      }),
      ...resetBehavior(NullBehavior),
    }),
  );
}
