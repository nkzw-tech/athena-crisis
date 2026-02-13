import getAttackDirection, {
  AttackDirection,
} from '@deities/apollo/attack-direction/getAttackDirection.tsx';
import {
  applyHiddenActionResponse,
  HiddenDestroyedBuildingActionResponse,
  HiddenSourceAttackBuildingActionResponse,
  HiddenSourceAttackUnitActionResponse,
  HiddenTargetAttackBuildingActionResponse,
  HiddenTargetAttackUnitActionResponse,
} from '@deities/apollo/HiddenAction.tsx';
import attackActionAnimation from '../../animations/attackActionAnimation.tsx';
import attackFlashAnimation from '../../animations/attackFlashAnimation.tsx';
import explosionAnimation from '../../animations/explosionAnimation.tsx';
import AnimationKey from '../../lib/AnimationKey.tsx';
import { Actions, State } from '../../Types.tsx';

export async function hiddenSourceAttackAction(
  actions: Actions,
  state: State,
  actionResponse:
    | HiddenSourceAttackUnitActionResponse
    | HiddenSourceAttackBuildingActionResponse
    | HiddenDestroyedBuildingActionResponse,
): Promise<State> {
  const { scheduleTimer, update } = actions;
  const { to, type } = actionResponse;
  const isDestroyedBuilding = type === 'HiddenDestroyedBuilding';
  const isBuilding = isDestroyedBuilding || type === 'HiddenSourceAttackBuilding';
  const initialMap = state.map;
  const entityB = isBuilding ? initialMap.buildings.get(to) : initialMap.units.get(to);
  const newEntityB = isDestroyedBuilding
    ? null
    : isBuilding
      ? actionResponse.building
      : actionResponse.unitB;

  const applyHiddenState = (state: State) => ({
    ...state,
    map: applyHiddenActionResponse(initialMap, state.vision, actionResponse),
  });

  state = await attackFlashAnimation(actions, state, {
    direction: isDestroyedBuilding ? getAttackDirection(to, to)[0] : actionResponse.direction,
    hasAttackStance: false,
    position: to,
    type: isBuilding ? 'building' : 'unit',
  });

  if (!isDestroyedBuilding && entityB) {
    state = {
      ...state,
      animations: state.animations.set(new AnimationKey(), {
        change: (entityB.health - (newEntityB?.health || 0)) * -1,
        position: to,
        previousHealth: entityB.health,
        type: 'health',
      }),
    };
  }

  if (!newEntityB || isDestroyedBuilding) {
    if (!entityB) {
      return state;
    }
    return applyHiddenState(
      await explosionAnimation(
        actions,
        state,
        applyHiddenState(state).map,
        entityB,
        to,
        ('direction' in actionResponse && actionResponse.direction) || new AttackDirection('left'),
      ),
    );
  }

  const { direction, hasCounterAttack, weapon } = actionResponse;
  if (hasCounterAttack) {
    const previousMap = state.map;
    const unitB = previousMap.units.get(to)!;
    const newState = applyHiddenState(state);
    const newUnitB = newState.map.units.get(to)!;
    return new Promise((resolve) =>
      scheduleTimer(async () => {
        let state = await update({
          ...newState,
          map: newState.map.copy({
            units: newState.map.units.set(
              to,
              newUnitB
                .maybeSetPlayer(
                  actionResponse.type === 'HiddenSourceAttackUnit' ? actionResponse.playerB : null,
                  'recover',
                )
                .setAmmo(unitB.ammo),
            ),
          }),
        });

        state = await attackActionAnimation(actions, state, {
          attackStance: unitB.info.sprite.attackStance,
          damage: null,
          directions: [direction],
          from: to,
          isBuilding: false,
          style: unitB.isUnfolded() ? 'unfold' : null,
          to: null,
          variant: unitB.player,
          weapon: (weapon && previousMap.units.get(to)?.info.attack.weapons?.get(weapon)) || null,
        });

        resolve({
          ...state,
          map: state.map.copy({
            units: state.map.units.set(to, newUnitB),
          }),
        });
      }, state.animationConfig.AnimationDuration),
    );
  }

  return applyHiddenState(state);
}

export async function hiddenTargetAttackAction(
  actions: Actions,
  state: State,
  actionResponse: HiddenTargetAttackUnitActionResponse | HiddenTargetAttackBuildingActionResponse,
): Promise<State> {
  const initialMap = state.map;
  const { direction, from, hasCounterAttack, type, unitA: newUnitA, weapon } = actionResponse;
  const isBuilding = type === 'HiddenTargetAttackBuilding';
  const to = isBuilding ? actionResponse.to : null;
  const building = to && isBuilding && initialMap.buildings.get(to);
  const unitA = initialMap.units.get(from);

  const applyHiddenState = (state: State) => ({
    ...state,
    map: applyHiddenActionResponse(initialMap, state.vision, actionResponse),
  });

  state = await attackActionAnimation(actions, state, {
    attackStance: unitA?.info.sprite.attackStance,
    damage: null,
    directions: [direction],
    from,
    isBuilding,
    style: unitA?.isUnfolded() ? 'unfold' : null,
    to: null,
    variant: unitA?.player || 0,
    weapon: (weapon && unitA?.info.attack.weapons?.get(weapon)) || null,
  });

  if (hasCounterAttack && unitA) {
    state = await attackFlashAnimation(actions, state, {
      direction,
      hasAttackStance: false,
      position: from,
      type: 'unit',
    });
    state = {
      ...state,
      animations: state.animations.set(new AnimationKey(), {
        change: (unitA.health - (newUnitA?.health || 0)) * -1,
        position: from,
        previousHealth: unitA.health,
        type: 'health',
      }),
    };
    return applyHiddenState(
      newUnitA
        ? state
        : await explosionAnimation(
            actions,
            state,
            state.map.copy({
              units: state.map.units.delete(from),
            }),
            unitA,
            from,
            direction,
          ),
    );
  } else if (to && building) {
    state = await attackFlashAnimation(actions, state, {
      direction,
      hasAttackStance: false,
      position: to,
      type: 'building',
    });
    return await explosionAnimation(
      actions,
      state,
      applyHiddenActionResponse(
        state.map.copy({
          buildings: state.map.buildings.delete(to),
        }),
        state.vision,
        actionResponse,
      ),
      building,
      to,
      direction,
    );
  }

  return applyHiddenState(state);
}
