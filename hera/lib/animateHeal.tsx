import { HealAmount, MaxHealth } from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { resetBehavior } from '../behavior/Behavior.tsx';
import { State, StateLike, StateToStateLike } from '../Types.tsx';
import AnimationKey from './AnimationKey.tsx';
import getUnitDirection from './getUnitDirection.tsx';

const temporarilyHealUnit = (map: MapData, position: Vector): MapData => {
  const unit = map.units.get(position);
  return unit
    ? map.copy({
        units: map.units.set(position, unit.refill().modifyHealth(HealAmount)),
      })
    : map;
};

export default function animateHeal(
  state: State,
  unitsToHeal: Iterable<[Vector, Unit]>,
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
                  const map = temporarilyHealUnit(state.map, position);
                  return {
                    map,
                    ...animateHeal(
                      {
                        ...state,
                        animations: state.animations.set(new AnimationKey(), {
                          change:
                            (map.units.get(position)?.health || MaxHealth) -
                            item[1].health,
                          position,
                          previousHealth: item[1].health,
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
                  item[1],
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
