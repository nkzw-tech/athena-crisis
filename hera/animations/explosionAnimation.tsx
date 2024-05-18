import type { AttackDirection } from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import { isBuilding, isUnit } from '@deities/athena/map/Entity.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { Actions, State } from '../Types.tsx';
import addExplosionAnimation from './addExplosionAnimation.tsx';

export default function explosionAnimation(
  actions: Actions,
  state: State,
  newMap: MapData,
  entity: Entity,
  position: Vector,
  direction: AttackDirection | undefined,
): Promise<State> {
  const { map } = state;
  return new Promise((resolve) => {
    const maybeUnit = isBuilding(entity) ? map.units.get(position) : null;
    actions.update({
      ...state,
      animations: addExplosionAnimation(
        state,
        entity,
        position,
        direction,
        (state: State) => {
          actions.requestFrame(() => resolve(state));
          return null;
        },
        () => ({ map: newMap }),
      ),
      map: map.copy({
        buildings: isBuilding(entity)
          ? map.buildings.set(position, entity.setHealth(0))
          : map.buildings,
        units: isUnit(entity)
          ? map.units.set(position, entity.setHealth(0))
          : maybeUnit
            ? map.units.set(position, maybeUnit.setHealth(0))
            : map.units,
      }),
    });
  });
}
