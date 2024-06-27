import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import getAttackDirection from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import { GameActionResponse } from '@deities/apollo/Types.tsx';
import Entity, { isBuilding } from '@deities/athena/map/Entity.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import attackActionAnimation from '../../animations/attackActionAnimation.tsx';
import explosionAnimation from '../../animations/explosionAnimation.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function clientAttackAction(
  actions: Actions,
  remoteAction: Promise<GameActionResponse>,
  newMap: MapData,
  actionResponse: ActionResponse,
  from: Vector,
  unitA: Unit,
  to: Vector,
  entityB: Entity,
  state: State,
): Promise<State> {
  const { scheduleTimer, update } = actions;
  const { map: previousMap } = state;
  const entityIsBuilding = isBuilding(entityB);

  // First, hide the attack/moveable radius.
  state = await update({
    ...resetBehavior(NullBehavior),
    selectedPosition: from,
    selectedUnit: unitA,
  });

  const directions = getAttackDirection(from, to);
  const hasCounterAttack =
    'hasCounterAttack' in actionResponse && actionResponse.hasCounterAttack;
  const previousUnitB = previousMap.units.get(to);

  const newUnitB = newMap.units.get(to);
  const newBuildingB = newMap.buildings.get(to);

  state = await attackActionAnimation(actions, state, {
    attackStance: unitA.info.sprite.attackStance,
    damage:
      entityB.health -
      ((entityIsBuilding ? newBuildingB : newUnitB)?.health || 0),
    directions,
    from,
    isBuilding: entityIsBuilding,
    style: unitA.isUnfolded() ? 'unfold' : null,
    to,
    variant: unitA.player,
    weapon: unitA.getAttackWeapon(entityB),
  });

  const complete = async (state: State) => {
    await update({ ...state, map: newMap });
    return handleRemoteAction(actions, remoteAction);
  };

  const unitB = state.map.units.get(to)!;
  if (hasCounterAttack && newUnitB) {
    state = await update({
      ...state,
      map: state.map.copy({
        units: state.map.units.set(
          to,
          (previousUnitB && newUnitB.player !== previousUnitB.player
            ? newUnitB.setPlayer(previousUnitB.player).recover()
            : newUnitB
          ).setAmmo(unitB.ammo),
        ),
      }),
    });

    return new Promise((resolve) =>
      scheduleTimer(async (state: State) => {
        const newUnitA = 'unitA' in actionResponse && actionResponse.unitA;
        const directions = getAttackDirection(to, from);
        state = await attackActionAnimation(actions, state, {
          attackStance: unitB.info.sprite.attackStance,
          damage: unitA.health - ((newUnitA && newUnitA?.health) || 0),
          directions,
          from: to,
          isBuilding: false,
          style: unitB.isUnfolded() ? 'unfold' : null,
          to: from,
          variant: unitB.player,
          // Use the old unit with old information (ammo, health, etc.).
          weapon: (previousUnitB || newUnitB).getAttackWeapon(unitA),
        });
        state = {
          ...state,
          map: state.map.copy({
            units: state.map.units.set(to, newUnitB),
          }),
        };
        resolve(
          await complete(
            newMap.units.get(from)
              ? state
              : await explosionAnimation(
                  actions,
                  state,
                  state.map.copy({
                    units: state.map.units.delete(from),
                  }),
                  unitA,
                  from,
                  directions[1],
                ),
          ),
        );
      }, state.animationConfig.AnimationDuration),
    );
  } else if (
    (entityIsBuilding && !newBuildingB) ||
    (!entityIsBuilding && !newUnitB)
  ) {
    return await complete(
      await explosionAnimation(
        actions,
        state,
        newMap,
        entityB,
        to,
        directions[1],
      ),
    );
  } else {
    return await complete(state);
  }
}
