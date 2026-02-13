import Vector from '@deities/athena/map/Vector.tsx';
import addExplosionAnimation from '../animations/addExplosionAnimation.tsx';
import { Actions, State, StateLike, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';

export default function explodeUnits(
  actions: Actions,
  state: State,
  unitsToExplode: ReadonlyArray<Vector>,
  onComplete: StateToStateLike,
): StateLike | null {
  const { scheduleTimer, scrollIntoView, update } = actions;
  const { animationConfig, animations, map, vision } = state;
  const [position, ...remainingUnits] = unitsToExplode;
  const unit = position && map.units.get(position);
  const onExplode = (state: State) => ({
    map: state.map.copy({
      units: state.map.units.delete(position),
    }),
  });
  return unit
    ? vision.isVisible(map, position)
      ? {
          animations: animations.set(new AnimationKey(), {
            onComplete: (state) => ({
              animations: addExplosionAnimation(
                state,
                unit,
                position,
                undefined,
                (state: State) => {
                  if (!remainingUnits.length) {
                    return onComplete(state);
                  }

                  scheduleTimer(async () => {
                    const position = remainingUnits[0];
                    if (position) {
                      await scrollIntoView([position]);
                    }

                    update(explodeUnits(actions, await update(null), remainingUnits, onComplete));
                  }, animationConfig.AnimationDuration);

                  return state;
                },
                onExplode,
              ),
              map: state.map.copy({
                units: state.map.units.set(position, unit.setHealth(0)),
              }),
            }),
            positions: [position],
            type: 'scrollIntoView',
          }),
        }
      : onComplete({ ...state, ...onExplode(state) })
    : onComplete(state);
}
