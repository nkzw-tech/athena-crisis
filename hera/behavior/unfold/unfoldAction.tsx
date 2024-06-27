import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

type FoldType = 'fold' | 'unfold';

const unfoldAnimation = async (
  { requestFrame, update }: Actions,
  position: Vector,
  unit: Unit,
  type: FoldType,
): Promise<State> => {
  const sprite = unit.info.sprite.unfoldSprite;
  return sprite
    ? new Promise((resolve) => {
        update((state) => ({
          animations: state.animations.set(position, {
            ...sprite,
            onComplete: (state) => {
              requestFrame(() =>
                resolve({
                  ...state,
                  animations: state.animations.delete(position),
                }),
              );
              return {
                animations: state.animations.delete(position),
                map: state.map.copy({
                  units: state.map.units.set(
                    position,
                    state.map.units.get(position)![type](),
                  ),
                }),
              };
            },
            type,
          }),
          ...resetBehavior(NullBehavior),
          selectedPosition: state.selectedPosition,
          selectedUnit: state.selectedUnit,
        }));
      })
    : update(null);
};

export default async function unfoldAction(
  actions: Actions,
  actionResponse: ActionResponse,
  position: Vector,
  type: FoldType,
  state: State,
): Promise<State> {
  const { scheduleTimer, update } = actions;
  const { animationConfig } = state;
  const unit = state.map.units.get(position);
  if (!unit) {
    return state;
  }

  state = await unfoldAnimation(actions, position, unit, type);

  await update({
    map: state.map.copy({
      units: state.map.units.set(
        position,
        (type === 'fold' ? unit.fold().move() : unit.unfold()).recover(),
      ),
    }),
    ...resetBehavior(NullBehavior),
  });

  return new Promise((resolve) =>
    scheduleTimer(async () => {
      const state = await update(null);
      resolve(
        await update({
          map: applyActionResponse(state.map, state.vision, actionResponse),
          ...resetBehavior(),
        }),
      );
    }, animationConfig.AnimationDuration),
  );
}
