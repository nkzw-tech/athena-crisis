import type { DropUnitActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import addMoveAnimation from '../../lib/addMoveAnimation.tsx';
import type { State, StateLike, StateToStateLike } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function dropUnitAction(
  map: MapData,
  actionResponse: DropUnitActionResponse,
  state: State,
  onComplete: StateToStateLike,
): StateLike {
  const { from, to } = actionResponse;
  const { vision } = state;
  const originalUnitA = state.map.units.get(from)!;
  const unitB = originalUnitA.getTransportedUnit(actionResponse.index)!;
  return {
    animations: addMoveAnimation(state.animations, {
      from,
      onComplete: (state) => {
        const { map, vision } = state;
        const newMap = applyActionResponse(
          map.copy({
            units: map.units.set(from, originalUnitA).delete(to),
          }),
          vision,
          actionResponse,
        );
        return onComplete({
          ...state,
          map: vision.isVisible(map, to)
            ? newMap
            : newMap.copy({
                units: newMap.units.delete(to),
              }),
          ...resetBehavior(),
        });
      },
      path: [to],
      pathVisibility: [vision.isVisible(map, from), vision.isVisible(map, to)],
      realPosition: to,
      startSound: 'Unit/Drop',
      tiles: [map.getTileInfo(to)],
    }),
    map: map.copy({
      units: map.units
        .set(from, originalUnitA.drop(unitB).recover())
        .set(to, map.units.get(to)!.recover()),
    }),
    ...resetBehavior(),
    behavior: new NullBehavior(),
  };
}
