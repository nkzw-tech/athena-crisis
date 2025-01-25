import Entity from '@deities/athena/map/Entity.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import getFirst from '@deities/hephaestus/getFirst.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { useCallback } from 'react';
import { RadiusType } from '../Radius.tsx';
import { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import attackAction from './attack/attackAction.tsx';
import AttackSelector from './attack/AttackSelector.tsx';
import getAttackableEntities from './attack/getAttackableEntities.tsx';
import { selectFallback } from './Behavior.tsx';
import ConfirmAction from './confirm/ConfirmAction.tsx';

export default class Attack {
  public readonly type = 'attack' as const;

  private attackAction(
    vector: Vector,
    state: State,
    actions: Actions,
    shouldConfirm?: boolean,
  ): StateLike | null {
    const entities = getAttackableEntities(vector, state);
    const { attackable, radius, selectedUnit } = state;
    if (attackable && radius && entities) {
      const entityB = entities.unit || entities.building;
      const onAction = (state: State) => {
        if (entities.unit && entities.building) {
          return {
            attackable: new Map([[vector, attackable.get(vector)!]]),
            confirmAction: null,
            radius: {
              ...radius,
              fields: new Map([[vector, radius.fields.get(vector)!]]),
            },
            selectedAttackable: vector,
            showCursor: false,
          };
        } else if (entityB && selectedUnit?.getAttackWeapon(entityB)) {
          const { selectedPosition, selectedUnit } = state;
          if (selectedPosition && selectedUnit) {
            requestAnimationFrame(() =>
              attackAction(
                actions,
                selectedPosition,
                selectedUnit,
                vector,
                entityB,
                state,
              ),
            );
          }
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
    const { confirmAction } = state;
    if (confirmAction) {
      return confirmAction.position.equals(vector)
        ? confirmAction.onAction(state)
        : selectFallback(vector, state, actions);
    }
    return (
      this.attackAction(vector, state, actions, shouldConfirm) ||
      selectFallback(vector, state, actions)
    );
  }

  activate(
    state: State,
    actions?: Actions,
    shouldConfirm?: boolean,
  ): StateLike | null {
    const { attackable } = state;
    if (attackable?.size) {
      const first = getFirst(attackable.keys());
      const confirm = !!(shouldConfirm && first && attackable.size === 1);
      const radius = {
        fields: attackable,
        locked: confirm,
        path: first ? [first] : null,
        type: RadiusType.Attackable,
      };
      return {
        confirmAction:
          confirm && actions
            ? this.attackAction(first, { ...state, radius }, actions, true)
                ?.confirmAction
            : null,
        position: first,
        radius,
      };
    }
    return null;
  }

  component = ({ actions, state }: StateWithActions) => {
    const { position } = state;

    const onSelect = useCallback(
      (entity: Entity) => {
        const { selectedAttackable, selectedPosition, selectedUnit } = state;
        if (selectedPosition && selectedUnit && selectedAttackable) {
          attackAction(
            actions,
            selectedPosition,
            selectedUnit,
            selectedAttackable,
            entity,
            state,
          );
        }
      },
      [actions, state],
    );

    const select = useCallback(() => {
      if (position) {
        actions.update(this.select(position, state, actions));
      }
    }, [actions, position, state]);

    useInput('tertiary', select, 'menu');
    useInput('gamepad:tertiary', select, 'menu');

    return (
      <>
        <AttackSelector
          actions={actions}
          onSelect={onSelect}
          origin={state.selectedPosition}
          state={state}
        />
        {state.confirmAction && (
          <ConfirmAction
            state={state}
            {...state.confirmAction}
            actions={actions}
          />
        )}
      </>
    );
  };
}
