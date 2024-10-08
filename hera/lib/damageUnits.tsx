import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { resetBehavior } from '../behavior/Behavior.tsx';
import { Actions, State, StateLike, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import explodeUnits from './explodeUnits.tsx';

export default function damageUnits(
  actions: Actions,
  state: State,
  animation: 'fire' | 'power',
  damage: number,
  unitsToDamage: Iterable<[Vector, Unit]>,
  onComplete: StateToStateLike = (state) => state,
  onDamage: (state: State, vector: Vector) => StateLike | null,
): StateLike {
  const { animations } = state;
  const [item, ...remainingItems] = unitsToDamage;
  const position = item?.[0];
  return (
    position
      ? {
          animations: animations.set(new AnimationKey(), {
            onComplete: (state) => ({
              animations: state.animations.set(position, {
                animation,
                onComplete: (state: State) => {
                  const healthAnimation = {
                    animations: state.animations.set(new AnimationKey(), {
                      change: -damage,
                      position,
                      previousHealth: item[1].health,
                      type: 'health',
                    }),
                  };

                  const damageState = onDamage(state, position);
                  const newState = {
                    ...state,
                    ...damageState,
                    ...healthAnimation,
                  };

                  const newUnit = newState.map.units.get(position);
                  if (!newUnit || newUnit.isDead()) {
                    return explodeUnits(
                      actions,
                      { ...state, ...healthAnimation },
                      [position],
                      (state) => ({
                        ...damageState,
                        ...damageUnits(
                          actions,
                          state,
                          animation,
                          damage,
                          remainingItems,
                          onComplete,
                          onDamage,
                        ),
                      }),
                    );
                  }

                  return {
                    ...newState,
                    ...damageUnits(
                      actions,
                      newState,
                      animation,
                      damage,
                      remainingItems,
                      onComplete,
                      onDamage,
                    ),
                  };
                },
                type: 'damage',
              }),
            }),
            positions: [position],
            type: 'scrollIntoView',
          }),
        }
      : onComplete({ ...state, ...resetBehavior() })
  )!;
}
