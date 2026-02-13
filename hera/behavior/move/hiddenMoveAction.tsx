import {
  applyHiddenActionResponse,
  HiddenMoveActionResponse,
} from '@deities/apollo/HiddenAction.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import addMoveAnimation from '../../lib/addMoveAnimation.tsx';
import { Actions, State, StateLike, StateToStateLike } from '../../Types.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default function hiddenMoveAction(
  { requestFrame }: Actions,
  state: State,
  actionResponse: HiddenMoveActionResponse,
  vision: VisionT,
  onComplete: StateToStateLike,
): StateLike | null {
  const { animations, map } = state;
  const { path: initialPath, unit } = actionResponse;
  const from = initialPath[0];
  const path = initialPath.slice(1);
  const to = initialPath.at(-1);

  return from
    ? {
        ...(unit
          ? {
              map: map.copy({
                units: map.units.set(from, unit.recover()),
              }),
            }
          : null),
        animations: addMoveAnimation(animations, {
          endSound: to && map.units.get(to) && vision.isVisible(map, to) ? 'Unit/Load' : undefined,
          from,
          onComplete: (state) => {
            const newState = {
              ...state,
              map: applyHiddenActionResponse(state.map, state.vision, actionResponse),
            };
            requestFrame(() => onComplete(newState));
            return newState;
          },
          path,
          pathVisibility: initialPath.map((vector) => vision.isVisible(state.map, vector)),
          tiles: path.map((vector) => map.getTileInfo(vector)),
        }),
        behavior: new NullBehavior(),
        radius: null,
      }
    : null;
}
