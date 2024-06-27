import { SabotageActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import getUnitDirection from '../../lib/getUnitDirection.tsx';
import { State, StateLike, StateToStateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function sabotageAction(
  actionResponse: SabotageActionResponse,
  state: State,
  onComplete: StateToStateLike = (state) => state,
): StateLike | null {
  const { to } = actionResponse;
  const { map } = state;
  const unitB = map.units.get(to);
  return unitB
    ? addSabotageAnimation(
        applyActionResponse(state.map, state.vision, actionResponse),
        to,
        state,
        onComplete,
      )
    : null;
}

export function addSabotageAnimation(
  newMap: MapData,
  position: Vector,
  state: State,
  onComplete: StateToStateLike = (state) => state,
) {
  const unitB = state.map.units.get(position);
  return unitB
    ? {
        animations: state.animations.set(position, {
          onComplete: (state: State) =>
            onComplete({
              ...state,
              map: newMap,
              ...resetBehavior(),
            }),
          type: 'sabotage',
          unitDirection: getUnitDirection(newMap.getFirstPlayerID(), unitB),
        }),
        ...resetBehavior(NullBehavior),
      }
    : null;
}
