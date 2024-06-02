import { ToggleLightningAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import explosionAnimation from '../../animations/explosionAnimation.tsx';
import { Actions, State } from '../../Types.tsx';
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
    : { ...state, map: newMap };
}

export default async function toggleLightningAction(
  actions: Actions,
  from: Vector,
  to: Vector,
  state: State,
): Promise<State> {
  const { action, processGameActionResponse, update } = actions;
  const [remoteAction, newMap] = action(state, ToggleLightningAction(from, to));

  state = await update(
    await toggleLightningAnimation(
      actions,
      to,
      await update({
        ...resetBehavior(),
        behavior: new NullBehavior(),
      }),
      newMap,
    ),
  );

  state = await update(await processGameActionResponse(await remoteAction));
  return state.lastActionResponse?.type !== 'GameEnd'
    ? await update(resetBehavior())
    : state;
}
