import getAttackableEntitiesInRange from '@deities/athena/lib/getAttackableEntitiesInRange.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import getParentToMoveTo from '@deities/athena/lib/getParentToMoveTo.tsx';
import getPathFields from '@deities/athena/lib/getPathFields.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import isPlayable from '@deities/athena/map/isPlayable.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { getPathCost, RadiusItem } from '@deities/athena/Radius.tsx';
import { useCallback } from 'react';
import addFlashAnimation from '../lib/addFlashAnimation.tsx';
import sleep from '../lib/sleep.tsx';
import { RadiusInfo } from '../Radius.tsx';
import { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import attackAction from './attack/attackAction.tsx';
import AttackSelector from './attack/AttackSelector.tsx';
import getAttackableEntities from './attack/getAttackableEntities.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import ConfirmAction from './confirm/ConfirmAction.tsx';
import MenuBehavior from './Menu.tsx';
import moveAction from './move/moveAction.tsx';
import syncMoveAction from './move/syncMoveAction.tsx';
import TransportBehavior from './Transport.tsx';

const getCurrentMovementPath = (
  map: MapData,
  unit: Unit,
  from: Vector,
  target: Vector,
  radius: RadiusInfo,
  attackable: ReadonlyMap<Vector, RadiusItem> | null,
) => {
  const { path } = radius;
  const last = path?.at(-1);
  if (path?.length && last?.distance(target) === 1) {
    const maybePath =
      attackable?.has(target) && !map.units.has(last)
        ? path
        : [...path, target];
    if (getPathCost(map, unit, from, maybePath) !== -1) {
      return maybePath;
    }
  }

  return getMovementPath(
    map,
    target,
    attackable ? new Map([...radius.fields, ...attackable]) : radius.fields,
    null,
  ).path;
};

const getMoveAction = (map: MapData) =>
  map.config.fog ? syncMoveAction : moveAction;

const moveAndAttack = (
  actions: Actions,
  from: Vector,
  maybeTarget: Vector,
  attackTarget: Vector,
  path: ReadonlyArray<Vector> | null,
  entityB: Entity,
  fields: ReadonlyMap<Vector, RadiusItem>,
  state: State,
) => {
  const { map } = state;
  const lastVector = path?.at(-1);
  const unitA = map.units.get(from)!;
  const shouldUseLastVector =
    lastVector &&
    unitA.canAttackAt(lastVector.distance(attackTarget), map.getPlayer(unitA));
  const target = shouldUseLastVector ? lastVector : maybeTarget;

  return from.equals(target)
    ? attackAction(actions, from, unitA, attackTarget, entityB, state)
    : actions.update(
        getMoveAction(map)(
          actions,
          from,
          target,
          fields,
          state,
          (state, actionResponse) => {
            // If the action was blocked by another unit, do not attempt an attack.
            if (actionResponse.completed || !actionResponse.to.equals(target)) {
              return {
                ...state,
                ...resetBehavior(),
              };
            }

            const newUnit = state.map.units.get(target);
            if (newUnit) {
              Promise.resolve().then(async () => {
                if (!unitA.info.sprite.attackStance) {
                  await sleep(
                    actions.scheduleTimer,
                    state.animationConfig,
                    'short',
                  );
                }
                attackAction(
                  actions,
                  target,
                  newUnit,
                  attackTarget,
                  entityB,
                  state,
                );
              });
            }
            return {
              ...state,
              selectedPosition: actionResponse.to,
              selectedUnit: state.map.units.get(actionResponse.to),
            };
          },
          (shouldUseLastVector && path) ||
            getMovementPath(map, target, fields, null).path,
          from,
          !!unitA.info.sprite.attackStance,
        ),
      );
};

export default class Move {
  public readonly type = 'move' as const;

  activate(state: State): StateLike | null {
    const { map, radius, selectedPosition, selectedUnit, vision } = state;
    const player = selectedUnit && map.getPlayer(selectedUnit);
    return selectedPosition && player && selectedUnit.canAttack(player)
      ? {
          attackable: new Map(
            [
              ...getAttackableEntitiesInRange(map, selectedPosition, vision),
              // Do not make any fields attackable that are part of the movement radius.
              // The player can select the attack menu to highlight nearby attackable entities.
            ].filter(([vector, field]) => {
              if (radius?.fields) {
                if (radius.fields.has(vector)) {
                  return false;
                }

                const { info } = selectedUnit;
                const range = info.isLongRange() && info.getRangeFor(player);
                if (
                  range &&
                  info.canAttackAt(1, range) &&
                  info.canAttackAt(2, range)
                ) {
                  const parent = getParentToMoveTo(
                    map,
                    selectedUnit,
                    selectedPosition,
                    field,
                    radius.fields,
                  );
                  return (
                    !parent ||
                    parent.equals(selectedPosition) ||
                    !map.units.has(parent)
                  );
                }
              }

              return true;
            }),
          ),
        }
      : null;
  }

  enter(vector: Vector, state: State): StateLike | null {
    const {
      attackable,
      currentViewer,
      map,
      radius,
      selectedPosition,
      selectedUnit,
      vision,
    } = state;
    if (
      radius &&
      !radius.locked &&
      selectedPosition &&
      selectedUnit &&
      currentViewer &&
      isPlayable(map, currentViewer, selectedUnit)
    ) {
      let path: ReadonlyArray<Vector> = getCurrentMovementPath(
        vision.apply(map),
        selectedUnit,
        selectedPosition,
        vector,
        radius,
        attackable,
      );

      // Do not add the building to the path if that's what we are attacking.
      const lastVector = path.length && path.at(-1);
      const skipLastVector =
        lastVector &&
        attackable?.has(lastVector) &&
        !!map.buildings.get(lastVector);

      // If it's a long range unit, only show the path to the field furthest away from the unit.
      const field = attackable?.get(vector);
      if (field && !skipLastVector && selectedUnit.info.isLongRange()) {
        const parent = getParentToMoveTo(
          map,
          selectedUnit,
          selectedPosition,
          field,
          radius.fields,
        );
        if (parent?.equals(selectedPosition)) {
          path = [];
        } else {
          let take = true;
          path = path.filter((item) => {
            if (take) {
              const equals = item.equals(parent);
              take = !equals;
              if (equals) {
                return true;
              }
            }
            return take;
          });
        }
      }

      return {
        radius: {
          ...radius,
          path:
            skipLastVector && !radius.fields.has(lastVector)
              ? path.slice(0, -1)
              : path,
        },
      };
    }
    return null;
  }

  select(
    vector: Vector,
    state: State,
    actions: Actions,
    editor?: unknown,
    subVector?: unknown,
    shouldConfirm?: boolean,
  ): StateLike | null {
    const {
      attackable,
      confirmAction,
      currentViewer,
      map,
      radius,
      selectedPosition,
      selectedUnit,
      vision,
    } = state;

    if (currentViewer && radius && selectedPosition && selectedUnit) {
      if (!isPlayable(map, currentViewer, selectedUnit)) {
        return selectFallback(vector, state, actions);
      }

      if (confirmAction) {
        return confirmAction.position.equals(vector)
          ? confirmAction.onAction(state)
          : selectFallback(vector, state, actions);
      }

      if (attackable?.has(vector)) {
        const field = attackable.get(vector);
        const parent = getParentToMoveTo(
          map,
          selectedUnit,
          selectedPosition,
          field,
          radius.fields,
        );
        const moveToField = field || (parent ? RadiusItem(parent) : null);
        const entities = getAttackableEntities(vector, state);

        if (moveToField && parent && entities) {
          const onAction = (state: State) => {
            const entity = entities.unit || entities.building;
            const path = radius.path?.length
              ? radius.path
              : getMovementPath(map, parent, radius.fields, null).path;
            if (entities.unit && entities.building) {
              return {
                attackable: new Map([[vector, moveToField]]),
                confirmAction: null,
                radius: {
                  ...radius,
                  fields: getPathFields(path, radius.fields),
                  locked: true,
                  path,
                },
                selectedAttackable: vector,
                showCursor: false,
              };
            } else if (entity && selectedUnit.getAttackWeapon(entity)) {
              requestAnimationFrame(() =>
                moveAndAttack(
                  actions,
                  selectedPosition,
                  parent,
                  vector,
                  path,
                  (entities.unit || entities.building)!,
                  radius.fields,
                  state,
                ),
              );
            }
            return { confirmAction: null };
          };

          return shouldConfirm
            ? {
                confirmAction: {
                  icon: 'attack',
                  onAction,
                  position: vector,
                },
                radius: {
                  ...radius,
                  locked: true,
                },
              }
            : onAction(state);
        }
      } else if (selectedPosition.equals(vector)) {
        return {
          ...resetBehavior(),
          ...(!selectedUnit.isCapturing()
            ? {
                behavior: new MenuBehavior(),
                selectedPosition,
                selectedUnit,
              }
            : null),
        };
      } else if (radius.fields.get(vector) && !radius.locked) {
        const unitB = map.units.get(vector);
        if (unitB && vision.isVisible(map, vector)) {
          const infoB = unitB.info;
          if (
            map.isCurrentPlayer(unitB) &&
            infoB.canTransport(selectedUnit.info, map.getTileInfo(vector))
          ) {
            return unitB.isFull()
              ? {
                  animations: addFlashAnimation(state.animations, {
                    children: 'Full!',
                    color: 'error',
                    position: vector,
                  }),
                }
              : {
                  ...resetBehavior(),
                  behavior: new TransportBehavior({
                    moveable: radius.fields,
                    path: radius.path,
                    position: vector,
                    unit: unitB,
                  }),
                  selectedPosition,
                  selectedUnit,
                };
          }
        } else {
          const onAction = (state: State, type?: 'confirm' | 'complete') =>
            getMoveAction(map)(
              actions,
              selectedPosition,
              vector,
              radius.fields,
              state,
              (state) => {
                const newUnit = state.map.units.get(vector);
                return newUnit &&
                  !newUnit.isCompleted() &&
                  // Only select the unit if it is owned by the player.
                  // If there is a unit on that tile not owned by the player,
                  // it means that fog-of-war blocked the unit movement.
                  state.map.matchesPlayer(selectedUnit, newUnit)
                  ? {
                      ...state,
                      ...resetBehavior(),
                      behavior: new MenuBehavior(),
                      selectedPosition: vector,
                      selectedUnit: newUnit,
                    }
                  : {
                      ...state,
                      ...resetBehavior(),
                    };
              },
              radius.path,
              undefined,
              undefined,
              type === 'complete' ? true : undefined,
            );

          return shouldConfirm
            ? {
                confirmAction: selectedUnit.info.canAct(
                  map.getPlayer(selectedUnit),
                )
                  ? {
                      onAction,
                      position: vector,
                      showComplete: true,
                    }
                  : {
                      icon: 'complete',
                      onAction,
                      position: vector,
                    },
                radius: {
                  ...radius,
                  locked: true,
                },
              }
            : onAction(state);
        }
      }
    }

    const newState = {
      ...state,
      ...resetBehavior(),
    };
    return {
      ...newState,
      ...newState.behavior?.select?.(vector, newState, actions),
    };
  }

  component = ({ actions, state }: StateWithActions) => {
    const {
      attackable,
      confirmAction,
      map,
      position,
      radius,
      selectedAttackable,
      selectedPosition,
      selectedUnit,
    } = state;

    const onSelect = useCallback(
      (entity: Entity) => {
        const to =
          selectedAttackable && attackable?.get(selectedAttackable)?.parent;
        if (
          to &&
          selectedUnit &&
          selectedPosition &&
          attackable.has(selectedAttackable) &&
          selectedUnit.getAttackWeapon(entity) &&
          radius
        ) {
          moveAndAttack(
            actions,
            selectedPosition,
            to,
            selectedAttackable,
            radius.path,
            entity,
            radius.fields,
            state,
          );
        }
      },
      [
        actions,
        attackable,
        radius,
        selectedAttackable,
        selectedPosition,
        selectedUnit,
        state,
      ],
    );

    const lastVector = radius?.path?.at(-1);
    const field =
      position && radius && selectedPosition && selectedUnit?.canMove()
        ? (lastVector?.equals(position) ? radius.path?.at(-2) : lastVector) ||
          getParentToMoveTo(
            map,
            selectedUnit,
            selectedPosition,
            attackable?.get(position),
            radius.fields,
          )
        : null;

    return (
      <>
        <AttackSelector
          actions={actions}
          key="a"
          onSelect={onSelect}
          origin={field || selectedPosition}
          state={state}
        />
        {confirmAction && (
          <ConfirmAction actions={actions} state={state} {...confirmAction} />
        )}
      </>
    );
  };
}
