import { HealActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import AnimationKey from '../../lib/AnimationKey.tsx';
import getUnitDirection from '../../lib/getUnitDirection.tsx';
import { State, StateLike, StateToStateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function healAction(
  actionResponse: HealActionResponse,
  state: State,
  onComplete: StateToStateLike = (state) => state,
): StateLike | null {
  const { from, to } = actionResponse;
  const { map } = state;
  const unitB = map.units.get(to);
  return unitB
    ? addHealAnimation(
        applyActionResponse(state.map, state.vision, actionResponse),
        from,
        to,
        state,
        onComplete,
      )
    : null;
}

export function addHealAnimation(
  newMap: MapData,
  from: Vector | undefined | null,
  position: Vector,
  state: State,
  onComplete: StateToStateLike = (state) => state,
) {
  const unitB = state.map.units.get(position);
  const newUnitB = newMap.units.get(position);
  const healSprite = from && state.map.units.get(from)?.info.sprite.healSprite;
  return unitB && newUnitB
    ? {
        animations: (healSprite
          ? state.animations.set(from, {
              ...healSprite,
              type: 'unitHeal',
            })
          : state.animations
        ).set(position, {
          onComplete: (state: State) =>
            onComplete({
              ...state,
              animations: state.animations.set(new AnimationKey(), {
                change: newUnitB.health - unitB.health,
                position,
                previousHealth: unitB.health,
                type: 'health',
              }),
              map: newMap,
              ...resetBehavior(),
            }),
          type: 'heal',
          unitDirection: getUnitDirection(newMap.getFirstPlayerID(), unitB),
        }),
        ...resetBehavior(NullBehavior),
      }
    : null;
}
