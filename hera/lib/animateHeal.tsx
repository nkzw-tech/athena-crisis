import { HealEntry } from '@deities/athena/lib/getUnitsToHeal.tsx';
import { HealAmount, MaxHealth } from '@deities/athena/map/Configuration.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { resetBehavior } from '../behavior/Behavior.tsx';
import { State, StateLike, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import getUnitDirection from './getUnitDirection.tsx';

const temporarilyHealUnit = (
  map: MapData,
  position: Vector,
  amount: number,
): MapData => {
  const unit = map.units
    .get(position)
    ?.modifyHealth(amount)
    .removeStatusEffect();
  return unit
    ? map.copy({
        units: map.units.set(
          position,
          amount >= HealAmount ? unit.refill() : unit,
        ),
      })
    : map;
};

export default function animateHeal(
  state: State,
  unitsToHeal: Iterable<[Vector, HealEntry]>,
  onComplete: StateToStateLike = (state) => state,
): StateLike {
  const { animations } = state;
  const [item, ...remainingItems] = unitsToHeal;
  const position = item?.[0];
  return (
    position
      ? {
          animations: animations.set(new AnimationKey(), {
            onComplete: (state) => ({
              animations: state.animations.set(position, {
                onComplete: (state: State) => {
                  const map = temporarilyHealUnit(
                    state.map,
                    position,
                    item[1][1],
                  );
                  return {
                    map,
                    ...animateHeal(
                      {
                        ...state,
                        animations: state.animations.set(new AnimationKey(), {
                          change:
                            (map.units.get(position)?.health || MaxHealth) -
                            item[1][0].health,
                          position,
                          previousHealth: item[1][0].health,
                          type: 'health',
                        }),
                        map,
                      },
                      remainingItems,
                      onComplete,
                    ),
                  };
                },
                type: 'heal',
                unitDirection: getUnitDirection(
                  state.map.getFirstPlayerID(),
                  item[1][0],
                ),
              }),
            }),
            positions: [position],
            type: 'scrollIntoView',
          }),
        }
      : onComplete({ ...state, ...resetBehavior() })
  )!;
}
