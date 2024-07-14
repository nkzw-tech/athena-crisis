import Vector from '@deities/athena/map/Vector.tsx';
import { Actions, State, StateLike, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';

export default function upgradeUnits(
  actions: Actions,
  state: State,
  unitsToUpgrade: ReadonlyArray<Vector>,
  onComplete: StateToStateLike,
  onUpgrade: (state: State, vector: Vector) => StateLike | null,
): StateLike | null {
  const { requestFrame, scrollIntoView, update } = actions;
  const { animations, map, vision } = state;
  const [position, ...remainingUnits] = unitsToUpgrade;
  const unit = position && map.units.get(position);
  return unit && vision.isVisible(map, position)
    ? {
        animations: animations.set(new AnimationKey(), {
          onComplete: (state) => ({
            animations: state.animations.set(position, {
              onComplete: (state: State) =>
                remainingUnits.length ? state : onComplete(state),
              onUpgrade: () => {
                requestFrame(async () => {
                  const newPosition = remainingUnits[0];
                  if (newPosition) {
                    await scrollIntoView([newPosition]);
                  }

                  const newState = await update(null);
                  update(
                    upgradeUnits(
                      actions,
                      { ...newState, ...onUpgrade(newState, position) },
                      remainingUnits,
                      remainingUnits.length ? onComplete : (state) => state,
                      onUpgrade,
                    ),
                  );
                });

                return null;
              },
              type: 'upgrade',
            }),
          }),
          positions: [position],
          type: 'scrollIntoView',
        }),
      }
    : onComplete(state);
}
