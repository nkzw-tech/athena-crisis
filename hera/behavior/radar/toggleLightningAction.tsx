import { ToggleLightningAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import explosionAnimation from '../../animations/explosionAnimation.tsx';
import type { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export async function toggleLightningAnimation(
  actions: Actions,
  to: Vector,
  state: State,
  newMap: MapData,
) {
  const { map, vision } = state;
  const unitB = map.units.get(to);
  return unitB && vision.isVisible(map, to)
    ? await explosionAnimation(
        actions,
        { ...state, map: newMap.copy({ units: map.units }) },
        newMap,
        unitB,
        to,
        undefined,
      )
    : state;
}

export default async function toggleLightningAction(
  actions: Actions,
  from: Vector,
  to: Vector,
  state: State,
): Promise<State> {
  const { action, processGameActionResponse, update } = actions;
  const { map } = state;
  const unitB = map.units.get(to);

  const [remoteAction, newMap, actionResponse] = action(
    state,
    ToggleLightningAction(from, to),
  );

  // First, hide the radius.
  state = await update({
    ...resetBehavior(),
    behavior: new NullBehavior(),
  });

  state = await toggleLightningAnimation(actions, to, state, newMap);
  const newState = await update({
    ...state,
    map: applyActionResponse(state.map, state.vision, actionResponse),
    ...resetBehavior(),
  });
  if (unitB) {
    return update(await processGameActionResponse(await remoteAction));
  }
  return newState;
}
