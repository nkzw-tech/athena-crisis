import { UnitsWithPosition } from '@deities/athena/lib/getUnitsByPositions.tsx';
import { PoisonDamage } from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { fbt } from 'fbt';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import { State, StateLike, StateToStateLike } from '../Types.tsx';
import addFlashAnimation from './addFlashAnimation.tsx';
import AnimationKey from './AnimationKey.tsx';

export default function animatePoison(
  state: State,
  poisonedUnits: UnitsWithPosition | Iterable<[Vector, Unit]>,
  onComplete: StateToStateLike = (state) => state,
): StateLike {
  const { animations } = state;
  const [item, ...remainingItems] = poisonedUnits;
  const position = item?.[0];
  return (
    position
      ? {
          animations: animations.set(new AnimationKey(), {
            onComplete: (state) => ({
              animations: addFlashAnimation(state.animations, {
                children: String(fbt('Poison!', 'Text for poisoned units')),
                color: 'green',
                onComplete: (state) => ({
                  // This is order dependent as the `onComplete` callback in the last iteration
                  // might want to update the Map.
                  map: state.map.copy({
                    units: state.map.units.set(
                      position,
                      state.map.units
                        .get(position)!
                        .modifyHealth(-PoisonDamage),
                    ),
                  }),
                  ...animatePoison(state, remainingItems, onComplete),
                }),
                position,
                sound: 'Unit/Supply',
              }),
              behavior: new NullBehavior(),
            }),
            positions: [position],
            type: 'scrollIntoView',
          }),
        }
      : onComplete({ ...state, ...resetBehavior() })
  )!;
}
