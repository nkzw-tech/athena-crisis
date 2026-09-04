import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import type { GameActionResponse } from '@deities/apollo/Types.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
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
    ? new Promise((resolve, reject) => {
        void update((state) => ({
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
                  units: state.map.units.set(position, state.map.units.get(position)![type]()),
                }),
              };
            },
            type,
          }),
          ...resetBehavior(NullBehavior),
          selectedPosition: state.selectedPosition,
          selectedUnit: state.selectedUnit,
        })).catch(reject);
      })
    : update(null);
};

export default async function unfoldAction(
  actions: Actions,
  remoteAction: Promise<GameActionResponse>,
  _newMap: MapData,
  actionResponse: ActionResponse,
  position: Vector,
  type: FoldType,
  state: State,
): Promise<State> {
  const { scheduleTimer, update } = actions;
  const { animationConfig } = state;
  const expectedType = type === 'fold' ? 'Fold' : 'Unfold';
  if (actionResponse.type !== expectedType) {
    return update(null);
  }

  const unit = state.map.units.get(position);
  if (!unit) {
    const newState = await update({
      map: applyActionResponse(state.map, state.vision, actionResponse),
      ...resetBehavior(),
    });
    void handleRemoteAction(actions, remoteAction, expectedType, {
      restoreBehavior: false,
    }).catch(actions.throwError);
    return newState;
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

  return new Promise((resolve, reject) =>
    scheduleTimer(() => {
      void update((state) => ({
        map: applyActionResponse(state.map, state.vision, actionResponse),
        ...resetBehavior(),
      }))
        .then((state) => {
          void handleRemoteAction(actions, remoteAction, expectedType, {
            restoreBehavior: false,
          }).catch(actions.throwError);
          return state;
        })
        .then(resolve, reject);
    }, animationConfig.AnimationDuration),
  );
}
