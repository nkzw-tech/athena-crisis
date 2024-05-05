import { RescueActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import getUnitDirection from '../../lib/getUnitDirection.tsx';
import { State, StateLike, StateToStateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function rescueAction(
  actionResponse: RescueActionResponse,
  state: State,
  onComplete: StateToStateLike = (state) => state,
): StateLike | null {
  const { player, to } = actionResponse;
  const { map } = state;
  const unitB = map.units.get(to);
  return unitB
    ? addRescueAnimation(
        applyActionResponse(state.map, state.vision, actionResponse),
        to,
        player,
        state,
        onComplete,
      )
    : null;
}

export function addRescueAnimation(
  newMap: MapData,
  position: Vector,
  player: PlayerID,
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
          onRescue: unitB.isBeingRescuedBy(player)
            ? (state: State) => ({
                ...state,
                map: state.map.copy({
                  units: state.map.units.set(
                    position,
                    state.map.units.get(position)!.setPlayer(player),
                  ),
                }),
              })
            : undefined,
          type: 'rescue',
          unitDirection: getUnitDirection(newMap.getFirstPlayerID(), unitB),
          variant: player,
        }),
        ...resetBehavior(),
        behavior: new NullBehavior(),
      }
    : null;
}
